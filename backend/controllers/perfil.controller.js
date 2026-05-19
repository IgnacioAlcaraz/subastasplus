const Clientes = require("../models/clientes");
const Personas = require("../models/personas");
const ClientesAcceso = require("../models/clientes_acceso");
const Paises = require("../models/paises");
const HttpError = require("../lib/http-error");
const { usuarioDetalle } = require("../lib/usuario-shape");
const { tieneMultaActiva } = require("../lib/multas-helper");

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// GET /perfil
exports.obtener = asyncHandler(async (req, res) => {
  const clienteId = req.user.sub;

  const cliente = await Clientes.findById(clienteId);
  if (!cliente) {
    throw new HttpError(404, "USUARIO_NO_ENCONTRADO", "Usuario no encontrado.");
  }

  const [persona, acceso, pais, tieneMulta] = await Promise.all([
    Personas.findById(cliente.identificador),
    ClientesAcceso.findOne({ cliente: cliente.identificador }),
    cliente.numero_pais ? Paises.findById(cliente.numero_pais) : null,
    tieneMultaActiva(clienteId),
  ]);

  res.json(usuarioDetalle({ persona, cliente, acceso, pais, tieneMultaActiva: tieneMulta }));
});
