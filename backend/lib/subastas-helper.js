const supabase = require("../supabase-client");

async function cantidadPiezasDeSubasta(subastaId) {
  const { data: cats } = await supabase
    .from("catalogos")
    .select("identificador")
    .eq("subasta", subastaId);
  const ids = (cats || []).map((c) => c.identificador);
  if (!ids.length) return 0;
  const { count } = await supabase
    .from("items_catalogo")
    .select("*", { count: "exact", head: true })
    .in("catalogo", ids);
  return count || 0;
}

module.exports = { cantidadPiezasDeSubasta };
