const supabase = require("../supabase-client");
const SolicitudesVenta = require("../models/solicitudes_venta");
const Productos = require("../models/productos");
const ProductosExtension = require("../models/productos_extension");
const ArtistasPiezas = require("../models/artistas_piezas");
const Fotos = require("../models/fotos");
const Duenios = require("../models/duenios");
const Clientes = require("../models/clientes");
const Catalogos = require("../models/catalogos");
const ItemsCatalogo = require("../models/items_catalogo");
const ItemsCatalogoEstado = require("../models/items_catalogo_estado");
const Seguros = require("../models/seguros");
const SegurosExtension = require("../models/seguros_extension");
const Subastas = require("../models/subastas");
const HttpError = require("../lib/http-error");
const { solicitudShape, polizaShape } = require("../lib/solicitud-venta-shape");
const { crearNotificacion } = require("../lib/notificaciones-helper");

const ADMIN_EMPLEADO_ID = Number(process.env.ADMIN_EMPLEADO_ID);

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function findSolicitud(id) {
  const row = await SolicitudesVenta.findById(id);
  if (!row) {
    throw new HttpError(404, "SOLICITUD_NO_ENCONTRADA", "La solicitud de venta no existe.");
  }
  return row;
}

async function findOrCreateDuenio(clienteId) {
  const existing = await Duenios.findById(clienteId);
  if (existing) return existing;
  const cliente = await Clientes.findById(clienteId);
  const { data, error } = await supabase
    .from("duenios")
    .insert({
      identificador: clienteId,
      numero_pais: cliente?.numero_pais ?? null,
      verificacion_financiera: "si",
      verificacion_judicial: "si",
      calificacion_riesgo: 1,
      verificador: ADMIN_EMPLEADO_ID,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findOrCreateCatalogo(subastaId) {
  const existing = await Catalogos.findOne({ subasta: subastaId });
  if (existing) return existing;
  return Catalogos.create({
    subasta: subastaId,
    descripcion: `Catálogo subasta #${subastaId}`,
    responsable: ADMIN_EMPLEADO_ID,
  });
}

// POST /admin/solicitudes-venta/:id/revisar
exports.revisar = asyncHandler(async (req, res) => {
  const row = await findSolicitud(Number(req.params.id));
  if (row.estado !== "enviada") {
    throw new HttpError(409, "SOLICITUD_ESTADO_INVALIDO", "Solo se puede poner en revisión una solicitud en estado 'enviada'.", {
      estadoActual: row.estado,
    });
  }
  const updated = await SolicitudesVenta.update(row.identificador, { estado: "en_revision" });
  res.json(solicitudShape({ row: updated }));
});

// POST /admin/solicitudes-venta/:id/aceptar
// Body: { valorBase, comisiones, ubicacionDeposito, direccionEnvio }
exports.aceptar = asyncHandler(async (req, res) => {
  const row = await findSolicitud(Number(req.params.id));
  if (row.estado !== "en_revision") {
    throw new HttpError(409, "SOLICITUD_ESTADO_INVALIDO", "Solo se puede aceptar una solicitud en estado 'en_revision'.", {
      estadoActual: row.estado,
    });
  }

  const { valorBase, comisiones, ubicacionDeposito, direccionEnvio } = req.body || {};
  if (!valorBase || Number(valorBase) <= 0) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "valorBase es requerido y debe ser mayor a 0.", {
      campo: "valorBase",
    });
  }
  if (!comisiones || Number(comisiones) < 0) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "comisiones es requerido.", { campo: "comisiones" });
  }
  if (!ubicacionDeposito || !String(ubicacionDeposito).trim()) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "ubicacionDeposito es requerido.", { campo: "ubicacionDeposito" });
  }

  const duenio = await findOrCreateDuenio(row.cliente);

  // Crear producto
  const producto = await Productos.create({
    descripcion_completa: row.descripcion,
    descripcion_catalogo: row.descripcion,
    duenio: duenio.identificador,
    revisor: ADMIN_EMPLEADO_ID,
  });

  // Extensión del producto
  await ProductosExtension.create({
    producto: producto.identificador,
    es_obra_de_arte: row.tipo === "arte" ? "si" : "no",
    cantidad_elementos: 1,
  });

  // Artista (solo si es arte y tiene datos)
  if (row.tipo === "arte" && row.nombre_artista) {
    await ArtistasPiezas.create({
      producto: producto.identificador,
      nombre_artista: row.nombre_artista,
      fecha_obra: row.fecha_obra || null,
      historia: row.historia || null,
    });
  }

  // Copiar fotos de fotos_solicitud_venta → fotos (vinculadas al producto)
  const { data: fotosOrigen } = await supabase
    .from("fotos_solicitud_venta")
    .select("foto")
    .eq("solicitud", row.identificador)
    .order("identificador", { ascending: true });

  for (const f of fotosOrigen || []) {
    await Fotos.create({ producto: producto.identificador, foto: f.foto });
  }

  // Actualizar solicitud
  const updated = await SolicitudesVenta.update(row.identificador, {
    estado: "aceptada",
    valor_base: Number(valorBase),
    comisiones: Number(comisiones),
    costo_envio: Number((Number(valorBase) * 0.02).toFixed(2)),
    ubicacion_deposito: ubicacionDeposito || null,
    direccion_envio: direccionEnvio || null,
    producto: producto.identificador,
  });

  await crearNotificacion(row.cliente, {
    tipo: "solicitud_venta",
    titulo: "Tu bien fue aceptado",
    mensaje: `Tu solicitud fue aceptada. El valor base asignado es $${valorBase}. Revisá las condiciones en la app.`,
    accionUrl: `/solicitudes-venta/${row.identificador}`,
  });

  res.json(solicitudShape({ row: updated }));
});

// POST /admin/solicitudes-venta/:id/rechazar
// Body: { motivoRechazo }
exports.rechazar = asyncHandler(async (req, res) => {
  const row = await findSolicitud(Number(req.params.id));
  if (!["enviada", "en_revision", "aceptada"].includes(row.estado)) {
    throw new HttpError(409, "SOLICITUD_ESTADO_INVALIDO", "Solo se puede rechazar una solicitud en estado 'enviada', 'en_revision' o 'aceptada'.", {
      estadoActual: row.estado,
    });
  }

  const { motivoRechazo, costoDevolucion, direccionDevolucion } = req.body || {};
  if (!motivoRechazo || !String(motivoRechazo).trim()) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "motivoRechazo es requerido.", { campo: "motivoRechazo" });
  }

  const updated = await SolicitudesVenta.update(row.identificador, {
    estado: "rechazada",
    motivo_rechazo: String(motivoRechazo).slice(0, 2000),
    costo_envio: costoDevolucion ? Number(costoDevolucion) : null,
    direccion_envio: direccionDevolucion ? String(direccionDevolucion) : null,
  });

  await crearNotificacion(row.cliente, {
    tipo: "solicitud_venta",
    titulo: "Tu solicitud fue rechazada",
    mensaje: `Tu solicitud de venta fue rechazada. Motivo: ${motivoRechazo}. El bien será devuelto con cargo.`,
    accionUrl: `/solicitudes-venta/${row.identificador}`,
  });

  res.json(solicitudShape({ row: updated }));
});

// POST /admin/solicitudes-venta/:id/asignar-subasta
// Body: { subastaId }
exports.asignarSubasta = asyncHandler(async (req, res) => {
  const row = await findSolicitud(Number(req.params.id));
  if (row.estado !== "aceptada") {
    throw new HttpError(409, "SOLICITUD_ESTADO_INVALIDO", "Solo se puede asignar a subasta una solicitud en estado 'aceptada'.", {
      estadoActual: row.estado,
    });
  }
  if (!row.producto) {
    throw new HttpError(409, "SOLICITUD_SIN_PRODUCTO", "La solicitud no tiene producto generado. Primero aceptá la solicitud.");
  }

  const { subastaId } = req.body || {};
  if (!subastaId) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "subastaId es requerido.", { campo: "subastaId" });
  }

  const subasta = await Subastas.findById(Number(subastaId));
  if (!subasta) {
    throw new HttpError(404, "SUBASTA_NO_ENCONTRADA", "La subasta indicada no existe.");
  }

  const catalogo = await findOrCreateCatalogo(Number(subastaId));

  const item = await ItemsCatalogo.create({
    catalogo: catalogo.identificador,
    producto: row.producto,
    precio_base: row.valor_base,
    comision: row.comisiones,
  });

  await ItemsCatalogoEstado.create({
    item: item.identificador,
    estado: "pendiente",
    mejor_oferta: null,
  });

  const updated = await SolicitudesVenta.update(row.identificador, {
    estado: "en_subasta",
    subasta_asignada: Number(subastaId),
  });

  await crearNotificacion(row.cliente, {
    tipo: "solicitud_venta",
    titulo: "Tu bien fue asignado a una subasta",
    mensaje: `Tu bien fue asignado a la subasta #${subastaId}. Podés ver los detalles en la app.`,
    accionUrl: `/solicitudes-venta/${row.identificador}`,
  });

  res.json(solicitudShape({ row: updated }));
});

// POST /admin/solicitudes-venta/:id/seguro
// Body: { nroPoliza, compania, valorAsegurado, telefono, email, web }
exports.crearSeguro = asyncHandler(async (req, res) => {
  const row = await findSolicitud(Number(req.params.id));
  if (!["aceptada", "en_subasta"].includes(row.estado)) {
    throw new HttpError(409, "SOLICITUD_ESTADO_INVALIDO", "Solo se puede crear un seguro para solicitudes aceptadas o en subasta.", {
      estadoActual: row.estado,
    });
  }

  const { nroPoliza, compania, valorAsegurado, telefono, email, web } = req.body || {};
  const missingFields = ["nroPoliza", "compania", "valorAsegurado"].filter((f) => !req.body?.[f]);
  if (missingFields.length) {
    throw new HttpError(400, "ADMIN_DATOS_INVALIDOS", "Faltan campos obligatorios.", {
      camposFaltantes: missingFields,
    });
  }

  const seguro = await Seguros.create({
    nro_poliza: nroPoliza,
    compania,
    importe: Number(valorAsegurado),
    cliente: row.cliente,
  });

  await SegurosExtension.create({
    nro_poliza: seguro.nro_poliza,
    telefono: telefono || null,
    email: email || null,
    web: web || null,
  });

  await SolicitudesVenta.update(row.identificador, { seguro: seguro.nro_poliza });

  res.status(201).json(polizaShape(seguro));
});
