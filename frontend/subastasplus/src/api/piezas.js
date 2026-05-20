import client from "./client";

export async function getPiezaById(id) {
  const response = await client.get(`/piezas/${id}`);
  return response.data;
}
