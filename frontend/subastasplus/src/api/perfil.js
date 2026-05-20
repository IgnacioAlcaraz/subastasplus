import client from "./client";

export async function getPerfil() {
  const response = await client.get("/perfil");
  return response.data;
}
