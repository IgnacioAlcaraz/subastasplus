import client from "./client";

export async function getMultas() {
  const response = await client.get("/multas");
  return response.data;
}

export async function pagarMulta(id, medioPagoId) {
  const response = await client.post(`/multas/${id}/pagar`, { medioPagoId });
  return response.data;
}
