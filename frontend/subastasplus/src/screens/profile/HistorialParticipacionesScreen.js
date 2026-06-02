import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getParticipaciones } from '../../api/historial';
import { esErrorServidor } from '../../api/client';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

function formatFecha(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function ParticipacionItem({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardBody}>
        <Text style={styles.titulo} numberOfLines={2}>{item.tituloSubasta || 'Subasta'}</Text>
        <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
        {item.piezasGanadas > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Ganó {item.piezasGanadas} {item.piezasGanadas === 1 ? 'pieza' : 'piezas'}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function HistorialParticipacionesScreen({ navigation }) {
  const [participaciones, setParticipaciones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const res = await getParticipaciones();
      setParticipaciones(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
      setParticipaciones([]);
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

  if (errorServidor) return <ServerErrorScreen onRetry={reintentar} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Métricas</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Participaciones</Text>
          <Text style={styles.total}>Total: {total}</Text>
        </View>
      </View>

      <FlatList
        data={participaciones}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <ParticipacionItem
            item={item}
            onPress={() => navigation.navigate('DetalleParticipacion', { participacion: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aún no participaste en ninguna subasta</Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { ...typography.h2, color: colors.textPrimary },
  total: { ...typography.body, color: colors.textSecondary },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBody: { flex: 1 },
  titulo: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  fecha: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}20`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  chevron: { fontSize: 20, color: colors.textDisabled, marginLeft: 8 },
});
