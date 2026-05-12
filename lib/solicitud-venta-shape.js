// Shape DB ↔ API para solicitudes_venta + helpers.

function base64ToBytea(b64) {
  if (!b64) return null;
  const stripped = String(b64).replace(/^data:[^;]+;base64,/, "");
  const buf = Buffer.from(stripped, "base64");
  return "\\x" + buf.toString("hex");
}

function solicitudShape({ row, subastaAsignada = null, poliza = null }) {
  return {
    id: String(row.identificador),
    tipo: row.tipo,
    descripcion: row.descripcion,
    imagenes: [], // TODO: serve via GET /v1/solicitudes-venta/:id/fotos/:n
    historia: row.historia || null,
    declaracionPropiedad: row.declaracion_propiedad === "si",
    estado: row.estado,
    motivoRechazo: row.motivo_rechazo || null,
    valorBase: row.valor_base != null ? Number(row.valor_base) : null,
    comisiones: row.comisiones != null ? Number(row.comisiones) : null,
    subastaAsignada,
    direccionEnvio: row.direccion_envio || null,
    ubicacionDeposito: row.ubicacion_deposito || null,
    polizaSeguro: poliza,
    cuentaCobro: cuentaCobroResumen(row),
    fechaCreacion: row.fecha_creacion || null,
  };
}

function cuentaCobroResumen(row) {
  if (!row.cuenta_cobro_tipo) return null;
  if (row.cuenta_cobro_tipo === "nacional") {
    return row.cuenta_cobro_cbu ? `CBU ${row.cuenta_cobro_cbu}` : "Cuenta nacional";
  }
  return [row.cuenta_cobro_iban, row.cuenta_cobro_moneda]
    .filter(Boolean)
    .join(" ") || "Cuenta exterior";
}

function polizaShape(seguro) {
  if (!seguro) return null;
  return {
    id: String(seguro.nro_poliza),
    aseguradora: seguro.compania,
    numeroPoliza: seguro.nro_poliza,
    valorAsegurado: seguro.importe != null ? Number(seguro.importe) : null,
    contactoAseguradora: null, // se completa cuando hay seguros_extension
  };
}

function contactoAseguradoraShape(seguro, ext) {
  return {
    nombre: seguro?.compania || null,
    telefono: ext?.telefono || null,
    email: ext?.email || null,
    web: ext?.web || null,
    numeroPoliza: seguro?.nro_poliza || null,
  };
}

const TIPOS_VALIDOS = ["arte", "antiguedad", "joya", "vehiculo", "mueble", "otro"];
const ESTADOS_VALIDOS = [
  "borrador",
  "enviada",
  "en_revision",
  "aceptada",
  "rechazada",
  "en_subasta",
  "vendida",
  "no_vendida",
];

module.exports = {
  base64ToBytea,
  solicitudShape,
  polizaShape,
  contactoAseguradoraShape,
  cuentaCobroResumen,
  TIPOS_VALIDOS,
  ESTADOS_VALIDOS,
};
