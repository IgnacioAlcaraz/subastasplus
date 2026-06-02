import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Image,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getCompra } from '../../api/compras';
import { esErrorServidor, SERVER_URL } from '../../api/client';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

function formatMonto(monto, moneda) {
  if (monto == null) return '-';
  const simbolo = moneda === 'USD' ? 'US$' : moneda === 'EUR' ? '€' : moneda === 'GBP' ? '£' : '$';
  return `${simbolo} ${Number(monto).toLocaleString('es-AR')}`;
}

function estadoEntrega(compra) {
  if (compra.estado === 'pagada') {
    return compra.metodoEntrega === 'retiro_personal' ? 'Entregado' : 'Enviado';
  }
  if (compra.estado === 'fondos_insuficientes') return 'Fondos insuficientes';
  return 'Pendiente de pago';
}

export default function CompraDetalleScreen({ route, navigation }) {
  const { compraId } = route.params;
  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const data = await getCompra(compraId);
      setCompra(data);
    } catch (error) {
      if (esErrorServidor(error)) setErrorServidor(true);
    }
  }, [compraId]);

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

  if (errorServidor || !compra) {
    return <ServerErrorScreen onRetry={reintentar} />;
  }

  const pct = compra.montoPujado > 0
    ? Math.round((compra.comisiones / compra.montoPujado) * 100)
    : 0;
  const titulo = compra.numeroItem
    ? `#${String(compra.numeroItem).padStart(3, '0')} ${compra.descripcionPieza}`
    : compra.descripcionPieza;
  const imgUri = compra.numeroItem
    ? `${SERVER_URL}/v1/piezas/${compra.numeroItem}/fotos/0`
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backText}>‹ Compras</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.piezaCard}>
          <View style={styles.thumbnail}>
            {imgUri ? (
              <Image source={{ uri: imgUri }} style={styles.img} resizeMode="cover" />
            ) : (
              <View style={styles.imgPlaceholder} />
            )}
          </View>
          <View style={styles.piezaInfo}>
            <Text style={styles.piezaTitulo} numberOfLines={2}>{titulo}</Text>
            {compra.tituloSubasta ? (
              <Text style={styles.piezaSubtitulo}>{compra.tituloSubasta}</Text>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Factura</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Importe pujado</Text>
            <Text style={styles.rowValue}>{formatMonto(compra.montoPujado, compra.moneda)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Comisión ({pct}%)</Text>
            <Text style={styles.rowValue}>{formatMonto(compra.comisiones, compra.moneda)}</Text>
          </View>
          {compra.costoEnvio != null && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Costo envío</Text>
              <Text style={styles.rowValue}>{formatMonto(compra.costoEnvio, compra.moneda)}</Text>
            </View>
          )}
          <View style={[styles.row, styles.rowTotal]}>
            <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
            <Text style={styles.totalValue}>{formatMonto(compra.total, compra.moneda)}</Text>
          </View>
          {compra.medioPagoAlias ? (
            <Text style={styles.medio}>Medio: {compra.medioPagoAlias}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Entrega</Text>
        <View style={styles.card}>
          {compra.metodoEntrega === 'envio' && compra.direccionEnvio ? (
            <Text style={styles.entregaLinea}>Envío a {compra.direccionEnvio}</Text>
          ) : compra.metodoEntrega === 'retiro_personal' ? (
            <Text style={styles.entregaLinea}>Retiro en depósito</Text>
          ) : null}
          <Text style={styles.entregaLinea}>
            Estado: <Text style={styles.estadoBold}>{estadoEntrega(compra)}</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
  },
  backText: { ...typography.body, color: colors.primary },
  content: { padding: 20, paddingBottom: 40 },
  piezaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
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
  piezaInfo: { flex: 1 },
  piezaTitulo: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  piezaSubtitulo: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.body, color: colors.textPrimary },
  rowTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  totalLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  totalValue: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  medio: { ...typography.bodySmall, color: colors.textSecondary },
  entregaLinea: { ...typography.body, color: colors.textSecondary, marginBottom: 4 },
  estadoBold: { color: colors.textPrimary, fontWeight: '700' },
});
