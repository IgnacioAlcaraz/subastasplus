import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getHistorialVentas } from '../../api/historial';
import { esErrorServidor } from '../../api/client';
import CardHistorialVenta from '../../components/common/CardHistorialVenta';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

export default function HistorialVentasScreen({ navigation }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const res = await getHistorialVentas();
      setVentas(res.data ?? []);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
      setVentas([]);
    }
  }, []);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  function reintentar() {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }

  async function onRefresh() {
    setRefreshing(true);
    await cargar();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorServidor) {
    return <ServerErrorScreen onRetry={reintentar} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Perfil</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis ventas</Text>
      </View>

      <FlatList
        data={ventas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <CardHistorialVenta
            item={item}
            onPress={() => navigation.navigate('VentaDetalle', { id: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no tenés ventas registradas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
    marginBottom: 8,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
