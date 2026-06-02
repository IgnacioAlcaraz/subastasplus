import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getCompras } from '../../api/compras';
import { esErrorServidor, SERVER_URL } from '../../api/client';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

function badgeInfo(item) {
  if (item.estado === 'fondos_insuficientes') {
    return { label: 'Pendiente de multa', color: colors.error };
  }
  if (item.estado === 'pendiente_pago') {
    return { label: 'Pendiente de pago', color: colors.warning };
  }
  if (item.estado === 'pagada' && item.metodoEntrega === 'retiro_personal') {
    return { label: 'Entregado', color: colors.primary };
  }
  if (item.estado === 'pagada') {
    return { label: 'Enviado', color: colors.textSecondary };
  }
  return null;
}

function formatFecha(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatMonto(monto, moneda) {
  const simbolo = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : moneda === 'GBP' ? '£' : '$';
  return `${simbolo} ${Number(monto).toLocaleString('es-AR')}`;
}

function CompraItem({ item, onPress }) {
  const badge = badgeInfo(item);
  const imgUri = item.numeroItem
    ? `${SERVER_URL}/v1/piezas/${item.numeroItem}/fotos/0`
    : null;
  const titulo = item.numeroItem
    ? `#${String(item.numeroItem).padStart(3, '0')} ${item.descripcionPieza}`
    : item.descripcionPieza;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.thumbnail}>
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
        ) : (
          <View style={styles.imgPlaceholder} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
        <Text style={styles.monto}>{formatMonto(item.total, item.moneda)}</Text>
        <Text style={styles.fecha}>{formatFecha(item.fechaSubasta)}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: `${badge.color}20` }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HistorialComprasScreen({ navigation }) {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const res = await getCompras();
      setCompras(res.data ?? []);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
      setCompras([]);
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

  function handlePress(item) {
    if (item.estado === 'fondos_insuficientes') {
      navigation.navigate('Multas');
      return;
    }
    if (item.estado === 'pendiente_pago') {
      navigation.navigate('SelMedioPago', {
        compraId: item.id,
        moneda: item.moneda,
        numeroItem: item.numeroItem,
      });
      return;
    }
    if (item.estado === 'pagada') {
      navigation.navigate('CompraDetalle', { compraId: item.id });
    }
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
        <Text style={styles.title}>Mis compras</Text>
      </View>

      <FlatList
        data={compras}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <CompraItem item={item} onPress={() => handlePress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no tenés compras registradas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  backText: { ...typography.body, color: colors.primary, marginBottom: 8 },
  title: { ...typography.h2, color: colors.textPrimary },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: colors.border,
  },
  img: { width: 56, height: 56 },
  imgPlaceholder: { flex: 1, backgroundColor: colors.border },
  info: { flex: 1 },
  titulo: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  monto: { ...typography.body, color: colors.textPrimary, fontWeight: '700', marginBottom: 1 },
  fecha: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption, fontWeight: '600' },
  chevron: { fontSize: 20, color: colors.textDisabled, marginLeft: 8 },
});
