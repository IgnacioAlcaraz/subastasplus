import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { notifyTokensRefreshed, notifySessionExpired } from '../navigation/sessionEvents';

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

let isRefreshing = false;
let refreshWaiters = [];

function waitForNewToken() {
  return new Promise((resolve, reject) => {
    refreshWaiters.push({ resolve, reject });
  });
}

function settleWaiters(error, token) {
  refreshWaiters.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  refreshWaiters = [];
}

async function refreshSession() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('Sin refresh token');

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  await AsyncStorage.setItem('token', data.token);
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  notifyTokensRefreshed(data.token, data.refreshToken);
  return data.token;
}

// estandarizamos el error para que todas las pantallas reciban siempre un mensaje legible
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExpiredToken =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.headers?.Authorization;

    if (isExpiredToken) {
      originalRequest._retry = true;
      try {
        let newToken;
        if (isRefreshing) {
          newToken = await waitForNewToken();
        } else {
          isRefreshing = true;
          try {
            newToken = await refreshSession();
            settleWaiters(null, newToken);
          } catch (refreshError) {
            settleWaiters(refreshError, null);
            throw refreshError;
          } finally {
            isRefreshing = false;
          }
        }

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (_) {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user', 'auth_status']);
        notifySessionExpired();
        const err = new Error('Tu sesión expiró. Por favor, iniciá sesión nuevamente.');
        err.status = 401;
        return Promise.reject(err);
      }
    }

    const message = error.response?.data?.message || error.message || 'Error de red';
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

export function esErrorServidor(error) {
  return error?.status >= 500;
}

export default client;
