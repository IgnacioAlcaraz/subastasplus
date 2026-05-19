import client from './client';

export async function getPaises() {
  const response = await client.get('/paises');
  return response.data;
}
