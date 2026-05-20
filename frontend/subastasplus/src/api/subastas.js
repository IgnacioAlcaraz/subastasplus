import client from "./client";

export async function getSubastas(estado, page = 1) {
  const response = await client.get("/subastas", { params: { estado, page } });
  return response.data;
}

export async function getSubastaById(id) {
  const response = await client.get(`/subastas/${id}`);
  return response.data;
}

export async function getCatalogo(subastaId, page = 1) {
  const response = await client.get(`/subastas/${subastaId}/catalogo`, { params: { page } });
  return response.data;
}
