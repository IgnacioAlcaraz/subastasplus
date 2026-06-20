const supabase = require("../supabase-client");
const ItemsCatalogoEstado = require("../models/items_catalogo_estado");

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

async function quedanItemsPorSubastar(subastaId) {
  const { data: cats } = await supabase
    .from("catalogos")
    .select("identificador")
    .eq("subasta", subastaId);
  const catIds = (cats || []).map((c) => c.identificador);
  if (!catIds.length) return false;
  const { data: items } = await supabase
    .from("items_catalogo")
    .select("identificador")
    .in("catalogo", catIds);
  for (const item of items || []) {
    const estado = await ItemsCatalogoEstado.findOne({ item: item.identificador });
    if (estado?.estado === "pendiente" || estado?.estado === "en_subasta") return true;
  }
  return false;
}

module.exports = { cantidadPiezasDeSubasta, piezaEnSubasta, quedanItemsPorSubastar };
