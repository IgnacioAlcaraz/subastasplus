import client from "./client";

export async function login(email, password) {
  const response = await client.post("/auth/login", { email, password });
  return response.data;
}

export async function recuperarClave(email) {
  const response = await client.post("/auth/recuperar-clave", { email });
  return response.data;
}

export async function verificarCodigo(email, codigo) {
  const response = await client.post("/auth/verificar-codigo", {
    email,
    codigo,
  });
  return response.data;
}

export async function nuevaClave(email, nuevaClave, resetToken) {
  const response = await client.post("/auth/nueva-clave", {
    email,
    nuevaClave,
    resetToken,
  });
  return response.data;
}
