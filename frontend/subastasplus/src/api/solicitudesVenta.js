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

export function aceptarCondiciones(id, data) {
  return client.post(`/solicitudes-venta/${id}/aceptar-condiciones`, data).then((r) => r.data);
}

export function cancelarSolicitud(id) {
  return client.post(`/solicitudes-venta/${id}/cancelar`).then((r) => r.data);
}

export function contactarAseguradora(id) {
  return client.get(`/solicitudes-venta/${id}/contactar-aseguradora`).then((r) => r.data);
}
