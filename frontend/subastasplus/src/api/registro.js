import client from './client';

export async function registroEtapa1(datos) {
  const response = await client.post('/registro/etapa1', datos);
  return response.data;
}

export async function verificarToken(tokenSeguimiento) {
  const response = await client.post('/registro/verificar-token', { tokenSeguimiento });
  return response.data;
}

export async function registroEtapa2(tokenSeguimiento, email, clave) {
  const response = await client.post('/registro/etapa2', { tokenSeguimiento, email, clave });
  return response.data;
}
