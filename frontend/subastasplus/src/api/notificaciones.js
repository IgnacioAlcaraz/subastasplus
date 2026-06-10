import client from "./client";

export async function getNotificaciones(page = 1) {
  const response = await client.get("/notificaciones", { params: { page } });
  return response.data;
}

export async function getNotificacion(id) {
  const response = await client.get(`/notificaciones/${id}`);
  return response.data;
}

export async function getMensajes(id, page = 1) {
  const response = await client.get(`/notificaciones/${id}/mensajes`, { params: { page } });
  return response.data;
}

export async function enviarMensaje(id, contenido) {
  const response = await client.post(`/notificaciones/${id}/mensajes`, { contenido });
  return response.data;
}
