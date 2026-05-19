const supabase = require("../supabase-client");

async function _registroIdDelCliente(clienteId) {
  const { data } = await supabase
    .from("registro_de_subasta")
    .select("identificador")
    .eq("cliente", clienteId)
    .limit(1)
    .maybeSingle();
  return data?.identificador ?? null;
}

// Devuelve true si el cliente tiene multa con estado 'pendiente'.
async function tieneMultaActiva(clienteId) {
  const regId = await _registroIdDelCliente(clienteId);
  if (!regId) return false;
  const { count } = await supabase
    .from("multas")
    .select("*", { count: "exact", head: true })
    .eq("registro", regId)
    .eq("estado", "pendiente");
  return (count || 0) > 0;
}

// Devuelve la multa pendiente del cliente (o null). El cliente tiene como máximo una.
async function multaPendienteData(clienteId) {
  const regId = await _registroIdDelCliente(clienteId);
  if (!regId) return null;
  const { data } = await supabase
    .from("multas")
    .select("*")
    .eq("registro", regId)
    .eq("estado", "pendiente")
    .maybeSingle();
  return data || null;
}

// Devuelve true si el cliente tiene multa derivada a justicia.
async function tieneMultaJudicial(clienteId) {
  const regId = await _registroIdDelCliente(clienteId);
  if (!regId) return false;
  const { count } = await supabase
    .from("multas")
    .select("*", { count: "exact", head: true })
    .eq("registro", regId)
    .eq("estado", "derivada_justicia");
  return (count || 0) > 0;
}

module.exports = { tieneMultaActiva, multaPendienteData, tieneMultaJudicial };
