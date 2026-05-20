import client from "./client";

export async function getMediosPago() {
  const response = await client.get("/medios-pago");
  return response.data;
}
