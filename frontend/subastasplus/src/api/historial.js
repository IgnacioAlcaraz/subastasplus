import client from './client';

export async function getHistorialVentas(page = 1) {
  const res = await client.get('/historial/ventas', { params: { page } });
  return res.data;
}
