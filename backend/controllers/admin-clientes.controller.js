const supabase = require("../supabase-client");
const Clientes = require("../models/clientes");
const ClientesAcceso = require("../models/clientes_acceso");
const Personas = require("../models/personas");
const HttpError = require("../lib/http-error");
const { crearNotificacion } = require("../lib/notificaciones-helper");
const { enviarAprobacionCliente } = require("../lib/mailer");

const CATEGORIAS_VALIDAS = ["comun", "especial", "plata", "oro", "platino"];

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// POST /admin/clientes/:id/aprobar
exports.aprobar = asyncHandler(async (req, res) => {
  const clienteId = Number(req.params.id);
  const { categoria } = req.body || {};

  if (!CATEGORIAS_VALIDAS.includes(categoria)) {
    throw new HttpError(400, "ADMIN_CATEGORIA_INVALIDA", "Categoría inválida.", {
      valoresValidos: CATEGORIAS_VALIDAS,
    });
  }

  const cliente = await Clientes.findById(clienteId);
  if (!cliente) {
    throw new HttpError(404, "CLIENTE_NO_ENCONTRADO", "El cliente no existe.");
  }
  if (cliente.admitido === "si") {
    throw new HttpError(409, "CLIENTE_YA_APROBADO", "El cliente ya fue aprobado.");
  }

  await Clientes.update(clienteId, { admitido: "si", categoria });

  const acceso = await ClientesAcceso.findOne({ cliente: clienteId });
  const persona = await Personas.findById(clienteId);
  const nombreCliente = persona?.nombre?.split(" ")[0] || "Cliente";
  if (acceso?.email) {
    await enviarAprobacionCliente(acceso.email, nombreCliente, categoria);
  }

  await crearNotificacion(clienteId, {
    tipo: "aprobacion_registro",
    titulo: "Tu cuenta fue aprobada",
    mensaje: `Tu solicitud de registro fue aprobada. Tu categoría asignada es: ${categoria}. Ya podés ingresar a la app y completar tu registro.`,
    accionUrl: null,
  });

  res.json({ clienteId: String(clienteId), admitido: "si", categoria });
});

// POST /admin/clientes/:id/rechazar
exports.rechazar = asyncHandler(async (req, res) => {
  const clienteId = Number(req.params.id);

  const cliente = await Clientes.findById(clienteId);
  if (!cliente) {
    throw new HttpError(404, "CLIENTE_NO_ENCONTRADO", "El cliente no existe.");
  }
  if (cliente.admitido === "si") {
    throw new HttpError(409, "CLIENTE_YA_APROBADO", "No se puede rechazar un cliente ya aprobado.");
  }

  // Limpiar el registro en orden para respetar FK
  await supabase.from("fotos_documento").delete().eq("cliente", clienteId);
  await supabase.from("clientes_acceso").delete().eq("cliente", clienteId);
  await supabase.from("clientes").delete().eq("identificador", clienteId);
  await supabase.from("personas").delete().eq("identificador", clienteId);

  res.status(204).end();
});
