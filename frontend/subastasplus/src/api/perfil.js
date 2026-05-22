import client from "./client";

export async function getPerfil() {
  const response = await client.get("/perfil");
  return response.data;
}

export async function subirFotoPerfil(base64) {
  await client.put("/perfil/foto", { foto: base64 });
}
