import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { getCompra } from '../../api/compras';
import Button from '../../components/common/Button';

function formatMonto(monto, moneda) {
  return `${moneda} ${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function FacturaCompraScreen({ navigation, route }) {
  const { compraId, moneda, numeroItem } = route.params;
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const data = await getCompra(compraId);
        setCompra(data);
      } catch {
        Alert.alert('Error', 'No se pudo cargar la factura.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const porcentajeComision = compra && compra.montoPujado > 0
    ? Math.round((compra.comisiones / compra.montoPujado) * 100)
    : 0;
  const costoEnvioEstimado = compra ? Math.round(compra.montoPujado * 0.02) : 0;
  const totalEstimado = compra ? compra.montoPujado + compra.comisiones + costoEnvioEstimado : 0;

  const tituloNumero = numeroItem
    ? `#${String(numeroItem).padStart(3, '0')} `
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRow}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.headerTitle}>Factura de compra</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : compra ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.tituloPieza}>
              {tituloNumero}{compra.descripcionPieza}
            </Text>

            <View style={styles.separador} />

            <FilaTabla label="Importe pujado" valor={formatMonto(compra.montoPujado, moneda)} />
            <FilaTabla label={`Comisión (${porcentajeComision}%)`} valor={formatMonto(compra.comisiones, moneda)} />
            <FilaTabla label="Costo de envío" valor={formatMonto(costoEnvioEstimado, moneda)} />

            <View style={styles.separador} />

            <FilaTabla label="TOTAL" valor={formatMonto(totalEstimado, moneda)} bold />

            <View style={styles.separador} />

            <Text style={styles.metaText}>Medio: {compra.medioPagoAlias || '—'}</Text>
            <Text style={styles.metaText}>Moneda: {moneda}</Text>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Continuar"
              onPress={() => navigation.navigate('EntregaCompra', { compraId, compra, numeroItem })}
            />
          </View>
        </>
      ) : null}
    </SafeAreaView>
  );
}

function FilaTabla({ label, valor, bold }) {
  return (
    <View style={styles.fila}>
      <Text style={[styles.filaLabel, bold && styles.filaBold]}>{label}</Text>
      <Text style={[styles.filaValor, bold && styles.filaBold]}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  back: { fontSize: 28, color: colors.textPrimary, lineHeight: 32, marginRight: 8 },
  headerTitle: { ...typography.h3, color: colors.textPrimary },
  loader: { flex: 1, justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 32 },
  tituloPieza: { ...typography.h3, color: colors.textPrimary, marginBottom: 16 },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filaLabel: { ...typography.body, color: colors.textSecondary },
  filaValor: { ...typography.body, color: colors.textPrimary },
  filaBold: { fontWeight: '700', color: colors.textPrimary },
  metaText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 4 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
});
