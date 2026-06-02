import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getPujasParticipacion } from '../../api/historial';
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

function buildPiezasFromPujas(pujas) {
  const map = {};
  for (const p of pujas) {
    const key = p.itemId;
    if (!map[key]) {
      map[key] = {
        itemId: p.itemId,
        piezaNumero: p.piezaNumero,
        descripcion: p.piezaDescripcion,
        ganada: false,
        pujas: [],
      };
    }
    if (p.fueGanadora) map[key].ganada = true;
    map[key].pujas.push(p);
  }
  return Object.values(map);
}

function PiezaItem({ pieza, onVerPujas }) {
  const numero = pieza.piezaNumero
    ? `#${String(pieza.piezaNumero).padStart(3, '0')}`
    : '';
  return (
    <View style={styles.piezaCard}>
      <View style={styles.piezaBody}>
        <Text style={styles.piezaTitulo} numberOfLines={2}>
          {numero} {pieza.descripcion}
        </Text>
        <View style={[styles.badge, pieza.ganada ? styles.badgeGanada : styles.badgePerdida]}>
          <Text style={[styles.badgeText, pieza.ganada ? styles.badgeTextGanada : styles.badgeTextPerdida]}>
            {pieza.ganada ? 'GANADA' : 'PERDIDA'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={onVerPujas} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.verPujas}>Ver pujas ›</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DetalleParticipacionScreen({ route, navigation }) {
  const { participacion } = route.params;
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const pujas = await getPujasParticipacion(participacion.id);
      setPiezas(buildPiezasFromPujas(pujas));
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
    }
  }, [participacion.id]);

  useEffect(() => {
    cargar().finally(() => setLoading(false));
  }, [cargar]);

  function reintentar() {
    setLoading(true);
    cargar().finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorServidor) return <ServerErrorScreen onRetry={reintentar} />;

  const subtitulo = [
    formatFecha(participacion.fecha),
    participacion.ubicacion,
  ].filter(Boolean).join(' - ');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Participaciones</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{participacion.tituloSubasta || 'Subasta'}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Piezas en las que pujaste</Text>

      <FlatList
        data={piezas}
        keyExtractor={(p) => String(p.itemId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <PiezaItem
            pieza={item}
            onVerPujas={() =>
              navigation.navigate('HistorialPujas', {
                piezaNumero: item.piezaNumero,
                piezaDescripcion: item.descripcion,
                pujas: item.pujas,
                moneda: participacion.moneda,
              })
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron piezas</Text>
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
  subtitulo: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  piezaCard: {
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
  piezaBody: { flex: 1 },
  piezaTitulo: { ...typography.label, color: colors.textPrimary, fontWeight: '600', marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGanada: { backgroundColor: `${colors.primary}20` },
  badgePerdida: { backgroundColor: colors.border },
  badgeText: { ...typography.caption, fontWeight: '700', fontSize: 11 },
  badgeTextGanada: { color: colors.primary },
  badgeTextPerdida: { color: colors.textSecondary },
  verPujas: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
