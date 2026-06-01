const supabase = require("../supabase-client");
const RegistroDeSubasta = require("../models/registro_de_subasta");
const RegistroSubastaExtension = require("../models/registro_subasta_extension");
const Productos = require("../models/productos");
const Subastas = require("../models/subastas");
const SubastasExtension = require("../models/subastas_extension");
const MediosPago = require("../models/medios_pago");
const Multas = require("../models/multas");
const HttpError = require("../lib/http-error");
const { paginate } = require("../lib/subasta-shape");
const { crearNotificacion } = require("../lib/notificaciones-helper");

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function compraShape(row) {
  const [producto, ext, subasta] = await Promise.all([
    Productos.findById(row.producto),
    RegistroSubastaExtension.findOne({ registro: row.identificador }),
    Subastas.findById(row.subasta),
  ]);
  const subExt = subasta
    ? await SubastasExtension.findOne({ subasta: subasta.identificador })
    : null;
  const importe = Number(row.importe || 0);
  const comision = Number(row.comision || 0);
  const costoEnvio = ext?.costo_envio ? Number(ext.costo_envio) : null;
  const total = importe + comision + (costoEnvio || 0);

  // mapeamos el estado interno a los valores que espera el frontend
  let estadoApi = "pendiente_pago";
  if (ext?.estado_pago === "pagada") estadoApi = "pagada";
  else if (ext?.estado_pago === "fondos_insuficientes") estadoApi = "fondos_insuficientes";

  return {
    id: String(row.identificador),
    piezaId: String(row.producto),
    descripcionPieza: producto?.descripcion_catalogo || producto?.descripcion_completa || "",
    montoPujado: importe,
    comisiones: comision,
    costoEnvio,
    total,
    moneda: subExt?.moneda || "ARS",
    medioPagoId: ext?.medio_pago ? String(ext.medio_pago) : null,
    metodoEntrega: ext?.metodo_entrega || null,
    direccionEnvio: ext?.direccion_envio || null,
    estado: estadoApi,
    // el aviso de seguro solo aplica cuando el usuario elige retirar en persona
    avisoSeguro:
      ext?.metodo_entrega === "retiro_personal"
        ? "Al retirar personalmente perdés la cobertura de seguro durante el traslado."
        : null,
  };
}

async function findOwnCompra(id, clienteId) {
  const row = await RegistroDeSubasta.findById(id);
  if (!row || row.cliente !== clienteId) {
    throw new HttpError(404, "COMPRA_NO_ENCONTRADA", "La compra solicitada no existe o no pertenece a tu cuenta.");
  }
  return row;
}

// GET /compras
exports.listar = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("registro_de_subasta")
    .select("*", { count: "exact" })
    .eq("cliente", req.user.sub)
    .range(from, to)
    .order("identificador", { ascending: false });
  if (error) throw error;

  const result = [];
  for (const row of data || []) result.push(await compraShape(row));
  res.json({ data: result, meta: paginate({ page, limit, total: count || 0 }) });
});

// GET /compras/:id
exports.detalle = asyncHandler(async (req, res) => {
  const row = await findOwnCompra(Number(req.params.id), req.user.sub);
  res.json(await compraShape(row));
});

// POST /compras/:id/pagar
exports.pagar = asyncHandler(async (req, res) => {
  const row = await findOwnCompra(Number(req.params.id), req.user.sub);
  const { medioPagoId, metodoEntrega, direccionEnvio } = req.body || {};

  if (!medioPagoId) {
    throw new HttpError(400, "COMPRA_DATOS_INVALIDOS", "medioPagoId es requerido.", {
      campo: "medioPagoId",
    });
  }
  if (!["envio", "retiro_personal"].includes(metodoEntrega)) {
    throw new HttpError(400, "COMPRA_DATOS_INVALIDOS", "metodoEntrega inválido.", {
      campo: "metodoEntrega",
      valoresValidos: ["envio", "retiro_personal"],
    });
  }
  if (metodoEntrega === "envio" && !direccionEnvio) {
    throw new HttpError(400, "COMPRA_DATOS_INVALIDOS", "direccionEnvio es requerido para envío.", {
      campo: "direccionEnvio",
    });
  }

  const medio = await MediosPago.findById(Number(medioPagoId));
  if (!medio || medio.cliente !== req.user.sub) {
    throw new HttpError(404, "PAGO_NO_ENCONTRADO", "Medio de pago no encontrado.");
  }
  if (medio.verificado !== "si") {
    throw new HttpError(400, "PAGO_NO_VERIFICADO", "Tu medio de pago aún no fue verificado.");
  }

  // Fondos insuficientes: simulamos solo si es cheque y monto_cheque < importe total.
  const importe = Number(row.importe || 0) + Number(row.comision || 0);
  if (medio.tipo === "cheque_certificado" && Number(medio.monto_cheque || 0) < importe) {
    const montoMulta = Math.round(importe * 0.1);
    const fechaLimite = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const subastaExt = await SubastasExtension.findOne({ subasta: row.subasta });
    // chk_moneda_multa solo acepta 'ARS' o 'USD'; EUR/GBP de subastas internacionales no aplican.
    const monedaRaw = subastaExt?.moneda || "ARS";
    const moneda = ["ARS", "USD"].includes(monedaRaw) ? monedaRaw : "ARS";
    const multa = await Multas.create({
      registro: row.identificador,
      monto_original: importe,
      monto_multa: montoMulta,
      moneda,
      estado: "pendiente",
      fecha_limite: fechaLimite,
      fecha_creacion: new Date().toISOString(),
    });
    // Marcar el registro como fondos_insuficientes
    const ext = await RegistroSubastaExtension.findOne({ registro: row.identificador });
    if (ext) {
      await RegistroSubastaExtension.update(row.identificador, {
        estado_pago: "fondos_insuficientes",
        medio_pago: medio.identificador,
      });
    } else {
      await RegistroSubastaExtension.create({
        registro: row.identificador,
        estado_pago: "fondos_insuficientes",
        metodo_entrega: metodoEntrega,
        direccion_envio: direccionEnvio || null,
        medio_pago: medio.identificador,
      });
    }
    await crearNotificacion(req.user.sub, {
      tipo: "multa",
      titulo: "Fondos insuficientes — multa generada",
      mensaje: `Se generó una multa de $${montoMulta} por fondos insuficientes. Tenés 72 horas para pagarla antes de que sea derivada a la justicia.`,
      accionUrl: `/multas/${multa.identificador}`,
    });
    throw new HttpError(
      402,
      "COMPRA_FONDOS_INSUFICIENTES",
      `Fondos insuficientes. Se generó una multa del 10%. Tenés 72hs para presentar los fondos.`,
      {
        montoOfertado: importe,
        montoMulta,
        fechaLimite,
        multa: {
          id: String(multa.identificador),
          compraId: String(row.identificador),
          montoOriginal: importe,
          montoMulta,
          moneda,
          estado: "pendiente",
          fechaLimite,
          fechaCreacion: multa.fecha_creacion,
        },
      },
    );
  }

  // Pago OK
  const costoEnvio = metodoEntrega === "envio" ? Math.round(importe * 0.02) : 0;
  const existing = await RegistroSubastaExtension.findOne({ registro: row.identificador });
  if (existing) {
    await RegistroSubastaExtension.update(row.identificador, {
      metodo_entrega: metodoEntrega,
      direccion_envio: direccionEnvio || null,
      costo_envio: costoEnvio,
      estado_pago: "pagada",
      medio_pago: medio.identificador,
    });
  } else {
    await RegistroSubastaExtension.create({
      registro: row.identificador,
      metodo_entrega: metodoEntrega,
      direccion_envio: direccionEnvio || null,
      costo_envio: costoEnvio,
      estado_pago: "pagada",
      medio_pago: medio.identificador,
    });
  }

  await crearNotificacion(req.user.sub, {
    tipo: "pago",
    titulo: "Pago confirmado",
    mensaje: "Tu pago fue procesado exitosamente. Podés ver los detalles de tu compra.",
    accionUrl: `/compras/${row.identificador}`,
  });

  res.json(await compraShape(row));
});
