import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { getCompra, cambiarMedioPago } from '../../api/compras';
import { getMediosPago } from '../../api/mediosPago';
import Button from '../../components/common/Button';

const SUBTITULO_TIPO = {
  cuenta_nacional: 'Cuenta nacional',
  cuenta_exterior: 'Cuenta exterior',
  tarjeta_credito: 'Tarjeta de crédito',
  cheque_certificado: 'Cheque certificado',
};

function formatMonto(monto, moneda) {
  return `${moneda} ${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function FilaTabla({ label, valor, bold }) {
  return (
    <View style={styles.fila}>
      <Text style={[styles.filaLabel, bold && styles.filaBold]}>{label}</Text>
      <Text style={[styles.filaValor, bold && styles.filaBold]}>{valor}</Text>
    </View>
  );
}

export default function FacturaCompraScreen({ navigation, route }) {
  const { compraId, moneda, numeroItem } = route.params;
  const [compra, setCompra] = useState(null);
  const [medios, setMedios] = useState([]);
  const [selectedMedioId, setSelectedMedioId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(false);
    try {
      const [compraData, mediosData] = await Promise.all([getCompra(compraId), getMediosPago()]);
      setCompra(compraData);
      const verificados = (Array.isArray(mediosData) ? mediosData : mediosData.mediosPago ?? [])
        .filter(m => m.verificado === true);
      setMedios(verificados);
      setSelectedMedioId(compraData.medioPagoId ? Number(compraData.medioPagoId) : (verificados[0]?.id ?? null));
    } catch {
      setErrorCarga(true);
    } finally {
      setLoading(false);
    }
  }, [compraId]);

  useEffect(() => { cargar(); }, [cargar]);

  const porcentajeComision = compra && compra.montoPujado > 0
    ? Math.round((compra.comisiones / compra.montoPujado) * 100)
    : 0;
  const costoEnvioEstimado = compra ? Math.round((compra.montoPujado + compra.comisiones) * 0.02) : 0;
  const totalEstimado = compra ? compra.montoPujado + compra.comisiones + costoEnvioEstimado : 0;

  const tituloNumero = numeroItem ? `#${String(numeroItem).padStart(3, '0')} ` : '';

  async function handleContinuar() {
    if (!compra || !selectedMedioId) return;

    const medioActualId = compra.medioPagoId ? Number(compra.medioPagoId) : null;
    if (selectedMedioId !== medioActualId) {
      setGuardando(true);
      try {
        const compraActualizada = await cambiarMedioPago(compraId, selectedMedioId);
        navigation.navigate('EntregaCompra', { compraId, compra: compraActualizada, numeroItem });
      } catch {
        Alert.alert('Error', 'No se pudo cambiar el medio de pago. Intentá de nuevo.');
      } finally {
        setGuardando(false);
      }
    } else {
      navigation.navigate('EntregaCompra', { compraId, compra, numeroItem });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRow}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.headerTitle}>Factura de compra</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : errorCarga ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTexto}>No se pudo cargar la factura.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={cargar}>
            <Text style={styles.retryTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : compra ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.tituloPieza}>
              {tituloNumero}{compra.descripcionPieza}
            </Text>

            <View style={styles.separador} />

            <FilaTabla label="Importe pujado" valor={formatMonto(compra.montoPujado, moneda)} />
            <FilaTabla label={`Comisión (${porcentajeComision}%)`} valor={formatMonto(compra.comisiones, moneda)} />
            <FilaTabla label="Costo de envío (est.)" valor={formatMonto(costoEnvioEstimado, moneda)} />

            <View style={styles.separador} />

            <FilaTabla label="TOTAL" valor={formatMonto(totalEstimado, moneda)} bold />

            <View style={styles.separador} />

            <Text style={styles.sectionLabel}>Medio de pago</Text>
            {medios.length === 0 ? (
              <Text style={styles.sinMedios}>No tenés medios de pago verificados</Text>
            ) : (
              medios.map(item => {
                const seleccionado = selectedMedioId === item.id;
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[styles.medioItem, seleccionado && styles.medioItemSeleccionado]}
                    onPress={() => setSelectedMedioId(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.radio, seleccionado && styles.radioSeleccionado]}>
                      {seleccionado && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.medioTexto}>
                      <Text style={styles.medioTitulo}>{item.alias || 'Medio de pago'}</Text>
                      <Text style={styles.medioSubtitulo}>{SUBTITULO_TIPO[item.tipo] || item.tipo}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            {guardando
              ? <ActivityIndicator size="large" color={colors.primaryDark} />
              : <Button title="Continuar" onPress={handleContinuar} disabled={!selectedMedioId} />
            }
          </View>
        </>
      ) : null}
    </SafeAreaView>
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
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorTexto: { ...typography.body, color: colors.textSecondary },
  retryBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryTexto: { ...typography.button, color: colors.textPrimary },
  content: { padding: 20, paddingBottom: 32 },
  tituloPieza: { ...typography.h3, color: colors.textPrimary, marginBottom: 16 },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  filaLabel: { ...typography.body, color: colors.textSecondary },
  filaValor: { ...typography.body, color: colors.textPrimary },
  filaBold: { fontWeight: '700', color: colors.textPrimary },
  sectionLabel: { ...typography.label, color: colors.textPrimary, marginBottom: 12 },
  sinMedios: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginVertical: 16 },
  medioItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 10,
  },
  medioItemSeleccionado: { borderColor: colors.primary, borderWidth: 2 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  radioSeleccionado: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  medioTexto: { flex: 1 },
  medioTitulo: { ...typography.label, color: colors.textPrimary, fontWeight: '600' },
  medioSubtitulo: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    padding: 16,
  },
});
