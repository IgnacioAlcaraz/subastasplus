import client from "./client";

export async function getCompras(page = 1) {
  const response = await client.get(`/compras?page=${page}`);
  return response.data;
}

export async function getCompra(id) {
  const response = await client.get(`/compras/${id}`);
  return response.data;
}

export async function pagarCompra(id, { metodoEntrega, direccionEnvio }) {
  const body = { metodoEntrega };
  if (direccionEnvio) body.direccionEnvio = direccionEnvio;
  const response = await client.post(`/compras/${id}/pagar`, body);
  return response.data;
}
