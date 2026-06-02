import client from './client';

export async function getHistorialVentas(page = 1) {
  const res = await client.get('/historial/ventas', { params: { page } });
  return res.data;
}

export async function getMetricas() {
  const res = await client.get('/historial/metricas');
  return res.data;
}

export async function getParticipaciones(page = 1) {
  const res = await client.get('/historial/participaciones', { params: { page } });
  return res.data;
}

export async function getDetalleParticipacion(id) {
  const res = await client.get(`/historial/participaciones/${id}`);
  return res.data;
}

export async function getPujasParticipacion(id) {
  const res = await client.get(`/historial/participaciones/${id}/pujas`);
  return res.data;
}
