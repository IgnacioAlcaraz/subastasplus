import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verificarToken } from '../api/registro';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [tokenSeguimiento, setTokenSeguimiento] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const savedToken = await AsyncStorage.getItem('token');
      const savedUser = await AsyncStorage.getItem('user');

      if (savedToken) {
        const savedStatus = await AsyncStorage.getItem('auth_status');
        setToken(savedToken);
        setUser(savedUser ? JSON.parse(savedUser) : null);
        setStatus(savedStatus === 'requires_medio_pago' ? 'requires_medio_pago' : 'authenticated');
        return;
      }

      const savedTokenSeg = await AsyncStorage.getItem('tokenSeguimiento');
      if (savedTokenSeg) {
        try {
          const result = await verificarToken(savedTokenSeg);
          if (result.estado === 'pendiente_aprobacion') {
            setTokenSeguimiento(savedTokenSeg);
            setStatus('pending');
          } else if (result.estado === 'requiere_clave') {
            setTokenSeguimiento(savedTokenSeg);
            setPendingData({ email: result.email, nombre: result.nombre, categoria: result.categoria });
            setStatus('requires_clave');
          } else if (result.estado === 'ya_activo') {
            await AsyncStorage.removeItem('tokenSeguimiento');
            setStatus('unauthenticated');
          }
        } catch (_) {
          // Error de red: mantener pending para no perder el token
          setTokenSeguimiento(savedTokenSeg);
          setStatus('pending');
        }
        return;
      }

      setStatus('unauthenticated');
    } catch (_) {
      setStatus('unauthenticated');
    }
  }

  async function login(tokenValue, userData) {
    await AsyncStorage.setItem('token', tokenValue);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.removeItem('tokenSeguimiento');
    setToken(tokenValue);
    setUser(userData);
    setTokenSeguimiento(null);
    setPendingData(null);
    setStatus('authenticated');
  }

  async function startMedioPagoOnboarding(tokenValue, userData) {
    await AsyncStorage.setItem('token', tokenValue);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('auth_status', 'requires_medio_pago');
    await AsyncStorage.removeItem('tokenSeguimiento');
    setToken(tokenValue);
    setUser(userData);
    setTokenSeguimiento(null);
    setPendingData(null);
    setStatus('requires_medio_pago');
  }

  async function completeOnboarding() {
    await AsyncStorage.removeItem('auth_status');
    setStatus('authenticated');
  }

  async function savePendingRegistration(tokenSeg) {
    await AsyncStorage.setItem('tokenSeguimiento', tokenSeg);
    setTokenSeguimiento(tokenSeg);
    setStatus('pending');
  }

  async function logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('auth_status');
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{
      status,
      token,
      user,
      tokenSeguimiento,
      pendingData,
      login,
      logout,
      savePendingRegistration,
      startMedioPagoOnboarding,
      completeOnboarding,
      isAuthenticated: status === 'authenticated',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
