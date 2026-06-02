import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography } from '../../constants';
import { getMetricas } from '../../api/historial';
import { esErrorServidor } from '../../api/client';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const BAR_MAX_HEIGHT = 100;

function BarChart({ totalPujas, totalGanadas }) {
  const maxVal = Math.max(totalPujas, 1);
  const bars = [
    { label: 'Total pujas', value: totalPujas, color: colors.secondary },
    { label: 'Ganadas', value: totalGanadas, color: colors.primary },
  ];

  return (
    <View style={styles.chart}>
      <View style={styles.chartBars}>
        {bars.map((bar) => (
          <View key={bar.label} style={styles.barWrapper}>
            <Text style={styles.barValue}>{bar.value}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: Math.round((bar.value / maxVal) * BAR_MAX_HEIGHT),
                    backgroundColor: bar.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MetricasScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const res = await getMetricas();
      setData(res);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
    }
  }, []);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Perfil</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Métricas</Text>
      </View>

      <Text style={styles.sectionTitle}>Tus estadísticas</Text>

      <View style={styles.statsRow}>
        <StatBox value={data?.totalSubastasAsistidas ?? 0} label="Participadas" />
        <StatBox value={data?.totalGanadas ?? 0} label="Ganadas" />
        <StatBox value={`${data?.porcentajeVictorias ?? 0}%`} label="Tasa éxito" />
      </View>

      <BarChart totalPujas={data?.totalPujas ?? 0} totalGanadas={data?.totalGanadas ?? 0} />

      <Text style={styles.sectionTitle}>Detalle</Text>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => navigation.navigate('HistorialParticipaciones')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuLabel}>Participaciones</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  backText: { ...typography.body, color: colors.primary, marginBottom: 8 },
  title: { ...typography.h2, color: colors.textPrimary },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { ...typography.h2, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  chart: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    height: BAR_MAX_HEIGHT + 48,
  },
  barWrapper: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barValue: { ...typography.label, color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  barTrack: {
    width: 48,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuLabel: { ...typography.body, color: colors.textPrimary },
  chevron: { fontSize: 20, color: colors.textDisabled },
});
