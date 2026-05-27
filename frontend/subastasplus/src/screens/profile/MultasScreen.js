import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert, ScrollView,
} from 'react-native';
import { colors, typography } from '../../constants';
import { getMultas, pagarMulta } from '../../api/multas';
import { getMediosPago } from '../../api/mediosPago';
import { esErrorServidor } from '../../api/client';
import Button from '../../components/common/Button';
import ServerErrorScreen from '../../components/common/ServerErrorScreen';

function formatFecha(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatPlazo(fechaLimite) {
  if (!fechaLimite) return null;
  const diff = new Date(fechaLimite) - new Date();
  if (diff <= 0) return 'Plazo vencido';
  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${horas}hs ${minutos}min restantes`;
}

function formatMonto(monto, moneda) {
  const simbolo = moneda === 'USD' ? 'US$' : '$';
  return `${simbolo} ${Number(monto).toLocaleString('es-AR')}`;
}

const SUBTITULO_TIPO = {
  cuenta_nacional: 'Cuenta nacional',
  cuenta_exterior: 'Cuenta exterior',
  tarjeta_credito: 'Tarjeta de crédito',
  cheque_certificado: 'Cheque certificado',
};

function labelMedio(item) {
  return {
    titulo: item.alias || 'Medio de pago',
    subtitulo: SUBTITULO_TIPO[item.tipo] || item.tipo,
  };
}

export default function MultasScreen({ navigation }) {
  const [multa, setMulta] = useState(null);
  const [medios, setMedios] = useState([]);
  const [selectedMedio, setSelectedMedio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(false);

  const cargar = useCallback(async () => {
    setErrorServidor(false);
    try {
      const [multas, mediosData] = await Promise.all([getMultas(), getMediosPago()]);
      const activa = multas.find((m) => m.estado === 'pendiente') || null;
      setMulta(activa);
      const verificados = (Array.isArray(mediosData) ? mediosData : mediosData.mediosPago ?? [])
        .filter((m) => m.verificado === true);
      setMedios(verificados);
      setSelectedMedio(verificados[0]?.id ?? null);
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

  async function handlePagar() {
    if (!multa || !selectedMedio) return;
    setPagando(true);
    try {
      await pagarMulta(multa.id, selectedMedio);
      navigation.replace('MultaPagada');
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === 'MULTA_PAGO_FALLIDO') {
        Alert.alert('Pago rechazado', 'No se pudo procesar el pago. Probá con otro medio de pago.');
      } else if (code === 'MULTA_PLAZO_VENCIDO') {
        Alert.alert(
          'Plazo vencido',
          'El plazo de 72 horas venció. Tu caso fue derivado a la justicia.',
          [{ text: 'Aceptar', onPress: reintentar }],
        );
      } else {
        Alert.alert('Error', 'Ocurrió un error al procesar el pago. Intentá de nuevo.');
      }
    } finally {
      setPagando(false);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Volver'}</Text>
        </TouchableOpacity>
      </View>

      {!multa ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No tenés multa activa</Text>
          <Text style={styles.emptySubtitle}>Podés participar en subastas</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Multa por incumplimiento</Text>
            <Text style={styles.monto}>{formatMonto(multa.montoMulta, multa.moneda)}</Text>
            {multa.montoOriginal > 0 && (
              <Text style={styles.porcentaje}>
                {Math.round((multa.montoMulta / multa.montoOriginal) * 100)}% del valor ofertado
              </Text>
            )}
            {(multa.piezaId || multa.subastaId) && (
              <Text style={styles.detalleLine}>
                {multa.piezaId ? `Pieza #${multa.piezaId}` : ''}
                {multa.piezaId && multa.subastaId ? ' - ' : ''}
                {multa.subastaId ? `Subasta #${multa.subastaId}` : ''}
              </Text>
            )}
            {multa.fechaCreacion && (
              <Text style={styles.detalleLine}>Generada: {formatFecha(multa.fechaCreacion)}</Text>
            )}
            {multa.fechaLimite && (
              <Text style={[styles.detalleLine, styles.plazo]}>
                Plazo: {formatPlazo(multa.fechaLimite)}
              </Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Seleccioná medio de pago</Text>

          {medios.length === 0 ? (
            <Text style={styles.sinMedios}>No tenés medios de pago verificados</Text>
          ) : (
            medios.map((item) => {
              const itemId = item.id;
              const seleccionado = selectedMedio === itemId;
              const { titulo, subtitulo } = labelMedio(item);
              return (
                <TouchableOpacity
                  key={String(itemId)}
                  style={[styles.medioItem, seleccionado && styles.medioItemSeleccionado]}
                  onPress={() => setSelectedMedio(itemId)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, seleccionado && styles.radioSeleccionado]}>
                    {seleccionado && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.medioTexto}>
                    <Text style={styles.medioTitulo}>{titulo}</Text>
                    <Text style={styles.medioSubtitulo}>{subtitulo}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.botonContainer}>
            <Button
              title={pagando ? 'Procesando...' : 'Pagar multa'}
              onPress={handlePagar}
              disabled={!selectedMedio || pagando}
            />
          </View>
        </ScrollView>
      )}
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
    backgroundColor: colors.primaryDark,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.body,
    color: colors.surface,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitulo: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  monto: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  porcentaje: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  detalleLine: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  plazo: {
    color: colors.warning,
    fontWeight: '600',
    marginTop: 8,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  sinMedios: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 16,
  },
  medioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  medioItemSeleccionado: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSeleccionado: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  medioTexto: {
    flex: 1,
  },
  medioTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  medioSubtitulo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  botonContainer: {
    marginTop: 24,
  },
});
