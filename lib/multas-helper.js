const supabase = require("../supabase-client");

// Devuelve true si el cliente tiene al menos una multa con estado 'pendiente'.
// Requiere JOIN via registro_de_subasta porque multas no tiene FK directa a clientes.
async function tieneMultaActiva(clienteId) {
  const { data: registros } = await supabase
    .from("registro_de_subasta")
    .select("identificador")
    .eq("cliente", clienteId);
  const regIds = (registros || []).map((r) => r.identificador);
  if (!regIds.length) return false;
  const { count } = await supabase
    .from("multas")
    .select("*", { count: "exact", head: true })
    .in("registro", regIds)
    .eq("estado", "pendiente");
  return (count || 0) > 0;
}

module.exports = { tieneMultaActiva };
