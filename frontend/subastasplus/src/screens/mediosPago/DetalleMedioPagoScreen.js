import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { eliminarMedioPago } from '../../api/mediosPago';
import ConfirmModal from '../../components/common/ConfirmModal';

const TIPO_LABEL = {
  cuenta_nacional: 'Banco nacional',
  cuenta_exterior: 'Banco exterior',
  tarjeta_credito: 'Tarjeta internacional',
  cheque_certificado: 'Cheque certificado',
};

function monedasPorTipo(tipo, moneda) {
  if (tipo === 'tarjeta_credito') return 'ARS, USD';
  if (moneda) return moneda;
  return 'ARS';
}

function aceptaUsd(tipo, moneda) {
  if (tipo === 'tarjeta_credito') return true;
  if (tipo === 'cuenta_exterior') return moneda === 'USD';
  if (tipo === 'cheque_certificado') return moneda === 'USD';
  return false;
}

function formatearFecha(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d)) return null;
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

export default function DetalleMedioPagoScreen({ route, navigation }) {
  const { item } = route.params;
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function confirmarEliminar() {
    setConfirmVisible(false);
    setEliminando(true);
    try {
      await eliminarMedioPago(item.id);
      navigation.goBack();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'No se pudo eliminar el medio de pago. Intentá de nuevo.';
      Alert.alert('Error', msg);
    } finally {
      setEliminando(false);
    }
  }

  const tipoLabel = TIPO_LABEL[item.tipo] || item.tipo;
  const monedas = monedasPorTipo(item.tipo, item.moneda);
  const usd = aceptaUsd(item.tipo, item.moneda);
  const fecha = formatearFecha(item.creadoEn);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerNav}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>{'<'} Detalle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contenido}>
        <Text style={styles.titulo}>{item.alias}</Text>
        <Text style={styles.subtitulo}>{tipoLabel}</Text>

        <View style={[styles.badge, item.verificado ? styles.badgeVerificado : styles.badgePendiente]}>
          <Text style={[styles.badgeTexto, item.verificado ? styles.badgeTextoVerificado : styles.badgeTextoPendiente]}>
            {item.verificado ? 'Verificada' : 'Pendiente'}
          </Text>
        </View>

        <View style={styles.infoBloque}>
          {fecha && (
            <Text style={styles.infoLinea}>Registrada: {fecha}</Text>
          )}
          <Text style={styles.infoLinea}>Monedas: {monedas}</Text>
          {usd && (
            <Text style={styles.infoLinea}>Compatible con subastas en dolares</Text>
          )}
          {item.tipo === 'tarjeta_credito' && item.vencimiento && (
            <Text style={styles.infoLinea}>Vencimiento: {item.vencimiento}</Text>
          )}
          {item.tipo === 'cheque_certificado' && item.montoCheque != null && (
            <Text style={styles.infoLinea}>
              Monto: ${Number(item.montoCheque).toLocaleString('es-AR')} {item.moneda}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.botonEliminar}
          onPress={() => setConfirmVisible(true)}
          activeOpacity={0.75}
          disabled={eliminando}
        >
          {eliminando ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={styles.botonEliminarTexto}>Eliminar medio</Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Eliminar medio de pago"
        message="¿Querés eliminar este medio de pago? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerNav: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backTexto: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  contenido: {
    padding: 24,
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 24,
  },
  badgeVerificado: {
    backgroundColor: `${colors.primary}20`,
  },
  badgePendiente: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeTexto: {
    ...typography.caption,
    fontWeight: '600',
  },
  badgeTextoVerificado: {
    color: colors.primary,
  },
  badgeTextoPendiente: {
    color: colors.textSecondary,
  },
  infoBloque: {
    gap: 6,
    marginBottom: 40,
  },
  infoLinea: {
    ...typography.body,
    color: colors.textSecondary,
  },
  botonEliminar: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  botonEliminarTexto: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '500',
  },
});
