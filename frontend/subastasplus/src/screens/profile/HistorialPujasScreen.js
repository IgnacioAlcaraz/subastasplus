import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography } from '../../constants';

function formatMonto(monto, moneda) {
  const simbolo = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : moneda === 'GBP' ? '£' : '$';
  return `${simbolo} ${Number(monto).toLocaleString('es-AR')}`;
}

function formatHora(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function PujaItem({ puja, moneda }) {
  return (
    <View style={[styles.pujaRow, puja.fueGanadora && styles.pujaRowGanadora]}>
      <View style={styles.pujaLeft}>
        <Text style={styles.monto}>{formatMonto(puja.monto, moneda)}</Text>
        <Text style={styles.hora}>{formatHora(puja.timestamp)}</Text>
      </View>
      {puja.fueGanadora ? (
        <Text style={styles.tagGanadora}>GANADORA</Text>
      ) : (
        <View style={styles.badgeSuperada}>
          <Text style={styles.badgeSuperadaText}>Superada</Text>
        </View>
      )}
    </View>
  );
}

export default function HistorialPujasScreen({ route, navigation }) {
  const { piezaNumero, piezaDescripcion, pujas, moneda } = route.params;

  const pujasOrdenadas = [...(pujas || [])].sort((a, b) => b.monto - a.monto);
  const numeroPieza = piezaNumero ? `Pieza #${String(piezaNumero).padStart(3, '0')}` : 'Pieza';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Pujas</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{numeroPieza}</Text>
        <Text style={styles.subtitulo}>{piezaDescripcion}</Text>
      </View>

      <Text style={styles.sectionTitle}>Tus pujas</Text>

      <FlatList
        data={pujasOrdenadas}
        keyExtractor={(p) => String(p.numero)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PujaItem puja={item} moneda={moneda} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay pujas registradas</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    marginBottom: 8,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { ...typography.body, color: colors.textSecondary },
  pujaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pujaRowGanadora: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pujaLeft: {},
  monto: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  hora: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  tagGanadora: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  badgeSuperada: {
    backgroundColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSuperadaText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600', fontSize: 11 },
});
