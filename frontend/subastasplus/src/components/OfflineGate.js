import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import OfflineScreen from './common/OfflineScreen';

function estaOffline(state) {
  if (!state) return false;
  // chequeamos ambas propiedades porque en algunos dispositivos isInternetReachable puede ser null y no false
  return state.isConnected === false || state.isInternetReachable === false;
}

export default function OfflineGate({ children }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(estaOffline(state));
    });
    return unsubscribe;
  }, []);

  function reintentar() {
    NetInfo.refresh().then((state) => setOffline(estaOffline(state)));
  }

  return (
    <View style={styles.root}>
      {children}
      {/* superponemos la pantalla offline encima del contenido sin desmontarlo */}
      {offline && (
        <View style={styles.overlay}>
          <OfflineScreen onRetry={reintentar} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
