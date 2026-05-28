import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image,
} from 'react-native';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getSolicitudes } from '../../api/solicitudesVenta';
import { SERVER_URL, esErrorServidor } from '../../api/client';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

const ESTADO_COLOR = {
  enviada: colors.textSecondary,
  en_revision_virtual: colors.textSecondary,
  propuesta_pendiente: colors.primary,
  esperando_entrega: colors.primary,
  en_revision_fisica: colors.textSecondary,
  rechazada_admin: colors.error,
  rechazada_cliente: colors.error,
  rechazada_deposito: colors.error,
  en_subasta: colors.primaryDark,
  vendida: colors.textDisabled,
  no_vendida: colors.textDisabled,
};

const ESTADO_LABEL = {
  enviada: 'Enviada',
  en_revision_virtual: 'En revisión',
  propuesta_pendiente: 'Propuesta recibida',
  esperando_entrega: 'Esperando entrega',
  en_revision_fisica: 'En revisión física',
  rechazada_admin: 'Rechazada',
  rechazada_cliente: 'Rechazada',
  rechazada_deposito: 'Rechazada',
  en_subasta: 'En subasta',
  vendida: 'Vendida',
  no_vendida: 'No vendida',
};

export default function VentasScreen({ navigation }) {
  const { token } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const res = await getSolicitudes();
      setSolicitudes(res.data ?? []);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
      setSolicitudes([]);
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

  function renderItem({ item }) {
    const label = ESTADO_LABEL[item.estado] ?? item.estado ?? '';
    const badgeColor = ESTADO_COLOR[item.estado] ?? colors.textSecondary;
    const imageUri = item.imagenes?.length > 0
      ? `${SERVER_URL}${item.imagenes[0]}`
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('VentaDetalle', { id: item.id })}
      >
        <View style={styles.thumb}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri, headers: { Authorization: `Bearer ${token}` } }}
              style={styles.thumbImage}
            />
          ) : (
            <View style={[styles.thumbImage, styles.thumbPlaceholder]} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.descripcion} numberOfLines={1}>{item.descripcion}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{label}</Text>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
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
      <Text style={styles.title}>Vender</Text>
      <FlatList
        data={solicitudes}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListEmptyComponent={
          <Text style={styles.empty}>No tenés solicitudes todavía.</Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('NuevaSolicitudStep1')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumb: {
    marginRight: 12,
  },
  thumbImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
  },
  thumbPlaceholder: {
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  descripcion: {
    ...typography.body,
    color: colors.textPrimary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  chevron: {
    ...typography.h2,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 48,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.surface,
    lineHeight: 32,
  },
});
