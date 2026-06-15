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

export async function getSala(subastaId) {
  const response = await client.get(`/subastas/${subastaId}/sala`);
  return response.data;
}

export async function realizarPuja(subastaId, monto) {
  const response = await client.post(`/subastas/${subastaId}/pujas`, { monto });
  return response.data;
}

export async function salirSala(subastaId) {
  await client.post(`/subastas/${subastaId}/sala/salir`);
}

export async function fijarMedioPagoSubasta(subastaId, medioPagoId) {
  await client.post(`/subastas/${subastaId}/medio-pago`, { medioPagoId });
}
