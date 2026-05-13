const supabase = require("../supabase-client");
const Subastas = require("../models/subastas");
const SubastasExtension = require("../models/subastas_extension");
const Catalogos = require("../models/catalogos");
const ItemsCatalogo = require("../models/items_catalogo");
const ItemsCatalogoEstado = require("../models/items_catalogo_estado");
const Productos = require("../models/productos");
const ProductosExtension = require("../models/productos_extension");
const Personas = require("../models/personas");
const Duenios = require("../models/duenios");
const ArtistasPiezas = require("../models/artistas_piezas");
const HttpError = require("../lib/http-error");
// (notImplemented ya no se usa: todos los handlers están implementados)
const {
  subastaResumen,
  subastaDetalle,
  piezaResumen,
  piezaDetalle,
  tituloSubasta,
  fechaTimestamp,
  estadoApiToDb,
  paginate,
} = require("../lib/subasta-shape");
const { cantidadPiezasDeSubasta } = require("../lib/subastas-helper");
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function rematadorNombrePorSubasta(subastadorId) {
  if (!subastadorId) return null;
  // subastadores.identificador es FK a personas
  const persona = await Personas.findById(subastadorId);
  return persona?.nombre || null;
}

// GET /subastas
exports.listar = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase.from("subastas").select("*", { count: "exact" });
  if (req.query.estado) {
    const dbEstado = estadoApiToDb(req.query.estado);
    if (dbEstado) q = q.eq("estado", dbEstado);
  }
  if (req.query.categoria) q = q.eq("categoria", req.query.categoria);
  q = q.range(from, to).order("identificador", { ascending: false });

  const { data: subs, count, error } = await q;
  if (error) throw error;

  const data = [];
  for (const s of subs || []) {
    const ext = await SubastasExtension.findOne({ subasta: s.identificador });
    const rematador = await rematadorNombrePorSubasta(s.subastador);
    const cant = await cantidadPiezasDeSubasta(s.identificador);
    data.push(subastaResumen({ subasta: s, ext, rematadorNombre: rematador, cantidadPiezas: cant }));
  }

  res.json({ data, meta: paginate({ page, limit, total: count || 0 }) });
});

// GET /subastas/:id
exports.detalle = asyncHandler(async (req, res) => {
  const subasta = await Subastas.findById(req.params.id);
  if (!subasta) {
    throw new HttpError(404, "SUBASTA_NO_ENCONTRADA", "La subasta solicitada no existe o fue eliminada.");
  }
  const ext = await SubastasExtension.findOne({ subasta: subasta.identificador });
  const rematador = await rematadorNombrePorSubasta(subasta.subastador);
  const cant = await cantidadPiezasDeSubasta(subasta.identificador);

  // puedeEntrar: si está logueado y cumple criterios (simplificado por ahora)
  let puedeEntrar = false;
  let razonNoEntrar = null;
  if (req.user) {
    // El chequeo completo se hace en /sala. Acá un preview básico.
    const { puedeEntrarPorCategoria } = require("../lib/categoria");
    const Clientes = require("../models/clientes");
    const MediosPago = require("../models/medios_pago");
    const cli = await Clientes.findById(req.user.sub);
    if (!cli) razonNoEntrar = "Usuario no encontrado";
    else if (!puedeEntrarPorCategoria(cli.categoria, subasta.categoria)) {
      razonNoEntrar = "Categoría insuficiente";
    } else {
      const verificados = await supabase
        .from("medios_pago")
        .select("*", { count: "exact", head: true })
        .eq("cliente", cli.identificador)
        .eq("verificado", "si");
      if (!verificados.count) razonNoEntrar = "Sin medio de pago verificado";
      else puedeEntrar = true;
    }
  } else {
    razonNoEntrar = "No autenticado";
  }

  res.json(
    subastaDetalle({
      subasta,
      ext,
      rematadorNombre: rematador,
      cantidadPiezas: cant,
      puedeEntrar,
      razonNoEntrar,
    }),
  );
});

// GET /subastas/:id/catalogo
exports.catalogo = asyncHandler(async (req, res) => {
  const subastaId = Number(req.params.id);
  const subasta = await Subastas.findById(subastaId);
  if (!subasta) {
    throw new HttpError(
      404,
      "SUBASTA_NO_ENCONTRADA",
      "La subasta no existe. Verificá el listado de subastas disponibles.",
    );
  }

  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: cats } = await supabase
    .from("catalogos")
    .select("identificador")
    .eq("subasta", subastaId);
  const catIds = (cats || []).map((c) => c.identificador);

  if (!catIds.length) {
    return res.json({ data: [], meta: paginate({ page, limit, total: 0 }) });
  }

  const { data: items, count, error } = await supabase
    .from("items_catalogo")
    .select("*", { count: "exact" })
    .in("catalogo", catIds)
    .range(from, to)
    .order("identificador");
  if (error) throw error;

  const precioVisible = !!req.user;
  const data = [];
  for (const item of items || []) {
    const [producto, prodExt, estadoItem] = await Promise.all([
      Productos.findById(item.producto),
      ProductosExtension.findOne({ producto: item.producto }),
      ItemsCatalogoEstado.findOne({ item: item.identificador }),
    ]);
    data.push(piezaResumen({ item, producto, prodExt, estadoItem, precioVisible }));
  }

  res.json({ data, meta: paginate({ page, limit, total: count || 0 }) });
});

// GET /piezas/:id
exports.detallePieza = asyncHandler(async (req, res) => {
  const item = await ItemsCatalogo.findById(req.params.id);
  if (!item) {
    throw new HttpError(404, "PIEZA_NO_ENCONTRADA", "La pieza solicitada no existe en el catálogo.");
  }
  const [producto, prodExt, estadoItem, artista, catalogo, fotosResult] = await Promise.all([
    Productos.findById(item.producto),
    ProductosExtension.findOne({ producto: item.producto }),
    ItemsCatalogoEstado.findOne({ item: item.identificador }),
    ArtistasPiezas.findOne({ producto: item.producto }),
    Catalogos.findById(item.catalogo),
    supabase.from("fotos").select("*", { count: "exact", head: true }).eq("producto", item.producto),
  ]);
  const fotosCount = fotosResult.count || 0;

  let duenioNombre = null;
  if (producto?.duenio) {
    const duenio = await Duenios.findById(producto.duenio);
    if (duenio) {
      const persona = await Personas.findById(duenio.identificador);
      duenioNombre = persona?.nombre || null;
    }
  }

  let subastaAsignada = null;
  if (catalogo?.subasta) {
    const sub = await Subastas.findById(catalogo.subasta);
    if (sub) {
      const ext = await SubastasExtension.findOne({ subasta: sub.identificador });
      subastaAsignada = {
        subastaId: String(sub.identificador),
        titulo: tituloSubasta(sub, ext),
        fecha: fechaTimestamp(sub),
        rematador: await rematadorNombrePorSubasta(sub.subastador),
        ubicacion: sub.ubicacion || null,
      };
    }
  }

  res.json(
    piezaDetalle({
      item,
      producto,
      prodExt,
      estadoItem,
      precioVisible: !!req.user,
      duenioNombre,
      artista,
      subastaAsignada,
      fotosCount,
    }),
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Sala en Vivo
// ─────────────────────────────────────────────────────────────────────────────
const Clientes = require("../models/clientes");
const Asistentes = require("../models/asistentes");
const AsistentesExtension = require("../models/asistentes_extension");
const Pujos = require("../models/pujos");
const PujosExtension = require("../models/pujos_extension");
const { puedeEntrarPorCategoria, pujaSinMaximo } = require("../lib/categoria");
const realtime = require("../lib/realtime");
const { crearNotificacion } = require("../lib/notificaciones-helper");

async function piezaEnSubasta(subastaId) {
  const { data: cats } = await supabase
    .from("catalogos")
    .select("identificador")
    .eq("subasta", subastaId);
  const catIds = (cats || []).map((c) => c.identificador);
  if (!catIds.length) return null;
  const { data: items } = await supabase
    .from("items_catalogo")
    .select("*")
    .in("catalogo", catIds);
  for (const item of items || []) {
    const estado = await ItemsCatalogoEstado.findOne({ item: item.identificador });
    if (estado?.estado === "en_subasta") {
      return { item, estado };
    }
  }
  return null;
}

async function ultimasPujasDeItem(itemId, usuarioClienteId, limit = 10) {
  const { data: pujos } = await supabase
    .from("pujos")
    .select("*")
    .eq("item", itemId)
    .order("identificador", { ascending: false })
    .limit(limit);
  const result = [];
  for (const p of pujos || []) {
    const ext = await PujosExtension.findOne({ pujo: p.identificador });
    const asistente = await Asistentes.findById(p.asistente);
    result.push({
      id: String(p.identificador),
      postorId: `Postor #${asistente?.numero_postor || "?"}`,
      monto: Number(p.importe),
      timestamp: ext?.timestamp || null,
      esPropia: !!(usuarioClienteId && asistente?.cliente === usuarioClienteId),
    });
  }
  return result;
}

// GET /subastas/:id/sala
exports.ingresarSala = asyncHandler(async (req, res) => {
  const subastaId = Number(req.params.id);
  const subasta = await Subastas.findById(subastaId);
  if (!subasta || subasta.estado !== "abierta") {
    throw new HttpError(404, "SALA_NO_DISPONIBLE", "La subasta no existe o no está en vivo en este momento.");
  }

  const cliente = await Clientes.findById(req.user.sub);
  if (!cliente) throw new HttpError(403, "USUARIO_NO_ENCONTRADO", "Usuario no encontrado.");

  // 1) Categoría
  if (!puedeEntrarPorCategoria(cliente.categoria, subasta.categoria)) {
    throw new HttpError(
      403,
      "SALA_CATEGORIA_INSUFICIENTE",
      `Tu categoría actual (${cliente.categoria}) no te permite acceder a esta subasta. Mejorá tu categoría para participar.`,
      { categoriaUsuario: cliente.categoria, categoriaRequerida: subasta.categoria },
    );
  }

  // 2) Medio de pago verificado
  const { count: verificados } = await supabase
    .from("medios_pago")
    .select("*", { count: "exact", head: true })
    .eq("cliente", cliente.identificador)
    .eq("verificado", "si");
  if (!verificados) {
    throw new HttpError(
      403,
      "SALA_SIN_MEDIO_PAGO",
      "Necesitás tener al menos un medio de pago verificado para entrar a la subasta.",
      { mediosPagoVerificados: 0 },
    );
  }

  // 3) No estar conectado a otra subasta
  const { data: misAsistencias } = await supabase
    .from("asistentes")
    .select("*")
    .eq("cliente", cliente.identificador);
  for (const a of misAsistencias || []) {
    if (a.subasta === subastaId) continue;
    const ext = await AsistentesExtension.findOne({ asistente: a.identificador });
    if (ext?.estado_conexion === "conectado") {
      const otra = await Subastas.findById(a.subasta);
      const otraExt = otra
        ? await SubastasExtension.findOne({ subasta: otra.identificador })
        : null;
      throw new HttpError(
        403,
        "SALA_YA_CONECTADO",
        "Ya estás conectado a otra subasta en vivo. Salí de la actual antes de entrar a otra.",
        { subastaActualTitulo: otra ? tituloSubasta(otra, otraExt) : null },
      );
    }
  }

  // 4) Buscar o crear asistente para esta subasta
  let asistente = (misAsistencias || []).find((a) => a.subasta === subastaId);
  if (!asistente) {
    // Computar próximo numero_postor de la subasta
    const { data: maxRow } = await supabase
      .from("asistentes")
      .select("numero_postor")
      .eq("subasta", subastaId)
      .order("numero_postor", { ascending: false })
      .limit(1)
      .maybeSingle();
    const numeroPostor = (maxRow?.numero_postor || 0) + 1;
    asistente = await Asistentes.create({
      numero_postor: numeroPostor,
      cliente: cliente.identificador,
      subasta: subastaId,
    });
  }

  // 5) Marcar conectado en la extensión (upsert manual)
  const ext = await AsistentesExtension.findOne({ asistente: asistente.identificador });
  if (ext) {
    await AsistentesExtension.update(asistente.identificador, { estado_conexion: "conectado" });
  } else {
    await AsistentesExtension.create({
      asistente: asistente.identificador,
      estado_conexion: "conectado",
    });
  }

  // 6) Armar payload SalaEnVivo
  const piezaCur = await piezaEnSubasta(subastaId);
  const subastaExt = await SubastasExtension.findOne({ subasta: subastaId });
  let piezaActual = null;
  if (piezaCur) {
    const producto = await Productos.findById(piezaCur.item.producto);
    const valorBase = Number(piezaCur.item.precio_base);
    const mejor = Number(piezaCur.estado.mejor_oferta || piezaCur.item.precio_base);
    const pujaMinima = Number((mejor + valorBase * 0.01).toFixed(2));
    const pujaMaxima = pujaSinMaximo(cliente.categoria)
      ? null
      : Number((mejor + valorBase * 0.2).toFixed(2));
    piezaActual = {
      id: String(piezaCur.item.identificador),
      numeroItem: piezaCur.item.identificador,
      descripcion: producto?.descripcion_catalogo || producto?.descripcion_completa || "",
      imagenPrincipal: null,
      precioBase: valorBase,
      mejorOferta: mejor,
      pujaMinima,
      pujaMaxima,
      ultimasPujas: await ultimasPujasDeItem(piezaCur.item.identificador, cliente.identificador),
    };
  }

  res.json({
    subastaId: String(subastaId),
    piezaActual,
    streamingUrl: `https://streaming.subastasplus.local/subastas/${subastaId}.m3u8`,
    conectados: realtime.roomSize(subastaId),
  });
});

// POST /subastas/:id/pujas
exports.realizarPuja = asyncHandler(async (req, res) => {
  const subastaId = Number(req.params.id);
  const { monto } = req.body || {};
  if (!monto || isNaN(monto) || monto <= 0) {
    throw new HttpError(400, "PUJA_MONTO_INVALIDO", "El monto de la puja no es válido.");
  }

  const subasta = await Subastas.findById(subastaId);
  if (!subasta || subasta.estado !== "abierta") {
    throw new HttpError(404, "SALA_NO_DISPONIBLE", "La subasta no existe o no está en vivo.");
  }

  const cliente = await Clientes.findById(req.user.sub);
  const asistente = await Asistentes.findOne({ cliente: cliente.identificador, subasta: subastaId });
  if (!asistente) {
    throw new HttpError(403, "SALA_NO_INSCRIPTO", "No estás inscripto en esta sala. Ingresá primero.");
  }

  const piezaCur = await piezaEnSubasta(subastaId);
  if (!piezaCur) {
    throw new HttpError(409, "SUBASTA_SIN_PIEZA_ACTIVA", "No hay pieza activa en este momento.");
  }

  const valorBase = Number(piezaCur.item.precio_base);
  const mejorOferta = Number(piezaCur.estado.mejor_oferta || piezaCur.item.precio_base);
  const pujaMinima = Number((mejorOferta + valorBase * 0.01).toFixed(2));
  const pujaMaxima = pujaSinMaximo(cliente.categoria)
    ? null
    : Number((mejorOferta + valorBase * 0.2).toFixed(2));

  if (monto < pujaMinima) {
    throw new HttpError(
      400,
      "PUJA_MONTO_INSUFICIENTE",
      `El monto de tu puja es menor al mínimo. Debés ofertar al menos ${pujaMinima}.`,
      { montoOfertado: monto, montoMinimo: pujaMinima, mejorOfertaActual: mejorOferta, valorBase },
    );
  }
  if (pujaMaxima !== null && monto > pujaMaxima) {
    throw new HttpError(
      400,
      "PUJA_MONTO_EXCEDIDO",
      `El monto supera el máximo permitido de ${pujaMaxima}.`,
      { montoOfertado: monto, montoMaximo: pujaMaxima },
    );
  }

  // Notificar al postor cuya puja va a ser superada
  const { data: pujoAnterior } = await supabase
    .from("pujos")
    .select("*")
    .eq("item", piezaCur.item.identificador)
    .eq("ganador", "si")
    .maybeSingle();
  if (pujoAnterior && pujoAnterior.asistente !== asistente.identificador) {
    const asistenteAnterior = await Asistentes.findById(pujoAnterior.asistente);
    if (asistenteAnterior) {
      await crearNotificacion(asistenteAnterior.cliente, {
        tipo: "puja_superada",
        titulo: "Tu puja fue superada",
        mensaje: `Alguien ofertó $${monto} por la pieza. Podés volver a pujar para ganar.`,
        accionUrl: `/subastas/${subastaId}/sala`,
      });
    }
  }

  // Marcar las pujas anteriores ganadoras como 'no'
  await supabase
    .from("pujos")
    .update({ ganador: "no" })
    .eq("item", piezaCur.item.identificador)
    .eq("ganador", "si");

  // Insertar la nueva
  const pujo = await Pujos.create({
    asistente: asistente.identificador,
    item: piezaCur.item.identificador,
    importe: monto,
    ganador: "si",
  });

  const timestamp = new Date().toISOString();
  await PujosExtension.create({ pujo: pujo.identificador, timestamp });

  // Actualizar mejor_oferta en la pieza
  await ItemsCatalogoEstado.update(piezaCur.item.identificador, { mejor_oferta: monto });

  // Broadcast a la sala
  realtime.broadcast(subastaId, {
    event: "puja_nueva",
    pujo: {
      id: String(pujo.identificador),
      postorId: `Postor #${asistente.numero_postor}`,
      monto: Number(monto),
      timestamp,
    },
    mejorOferta: Number(monto),
  });

  res.status(201).json({
    id: String(pujo.identificador),
    monto: Number(monto),
    estado: "ganadora",
    timestamp,
  });
});

// POST /subastas/:id/sala/salir
exports.salirSala = asyncHandler(async (req, res) => {
  const subastaId = Number(req.params.id);
  const cliente = await Clientes.findById(req.user.sub);
  const asistente = await Asistentes.findOne({ cliente: cliente.identificador, subasta: subastaId });
  if (asistente) {
    const ext = await AsistentesExtension.findOne({ asistente: asistente.identificador });
    if (ext) {
      await AsistentesExtension.update(asistente.identificador, { estado_conexion: "desconectado" });
    }
  }
  res.status(204).end();
});
