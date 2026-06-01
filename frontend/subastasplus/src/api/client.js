import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// sacamos la IP del host de Expo para conectar al backend en la misma red local
const devHost = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
const BASE_URL = `http://${devHost}:3000/v1`;
export const SERVER_URL = `http://${devHost}:3000`;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// agrega el JWT a cada request automáticamente si hay sesión activa
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// estandarizamos el error para que todas las pantallas reciban siempre un mensaje legible
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error de red';
    const err = new Error(message);
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

export function esErrorServidor(error) {
  return error?.status >= 500;
}

export default client;
