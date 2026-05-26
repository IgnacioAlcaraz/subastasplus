import client from './client';

export function getSolicitudes(page = 1) {
  return client.get('/solicitudes-venta', { params: { page, limit: 20 } }).then((r) => r.data);
}

export function crearSolicitud(data) {
  return client.post('/solicitudes-venta', data).then((r) => r.data);
}

export function getSolicitudById(id) {
  return client.get(`/solicitudes-venta/${id}`).then((r) => r.data);
}
