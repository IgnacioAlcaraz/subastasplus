import client from "./client";

export async function getCompra(id) {
  const response = await client.get(`/compras/${id}`);
  return response.data;
}

export async function pagarCompra(id, { medioPagoId, metodoEntrega, direccionEnvio }) {
  const body = { medioPagoId, metodoEntrega };
  if (direccionEnvio) body.direccionEnvio = direccionEnvio;
  const response = await client.post(`/compras/${id}/pagar`, body);
  return response.data;
}
