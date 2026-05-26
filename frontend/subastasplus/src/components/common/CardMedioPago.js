import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

const TIPO_CONFIG = {
  cuenta_nacional: { label: 'Banco nacional', icono: '🏦' },
  cuenta_exterior: { label: 'Banco ext.', icono: '🌐' },
  tarjeta: { label: 'Tarjeta', icono: '💳' },
  cheque: { label: 'Cheque', icono: '📄' },
};

function tituloPorTipo(item) {
  switch (item.tipo) {
    case 'cuenta_nacional':
      return `Cta. ${item.banco || ''} ***${String(item.cbu || '').slice(-3)}`.trim();
    case 'cuenta_exterior':
      return `Cta. ${item.banco || ''} ***${String(item.iban || '').replace(/\s/g, '').slice(-3)}`.trim();
    case 'tarjeta':
      return `Tarjeta ***${String(item.numero || item.ultimos4 || '').slice(-4)}`.trim();
    case 'cheque':
      return `Cheque #${item.numeroCheque || ''}`;
    default:
      return 'Medio de pago';
  }
}

function subtituloPorTipo(item) {
  if (item.tipo === 'cheque' && item.monto) {
    return `$${Number(item.monto).toLocaleString('es-AR')} ${item.moneda || ''}`.trim();
  }
  return TIPO_CONFIG[item.tipo]?.label ?? item.tipo;
}

function BadgeVerificacion({ estado }) {
  const verificado = estado === 'si' || estado === true || estado === 'verificado';
  return (
    <View style={[styles.badge, verificado ? styles.badgeVerificado : styles.badgePendiente]}>
      <Text style={[styles.badgeTexto, verificado ? styles.badgeTextoVerificado : styles.badgeTextoPendiente]}>
        {verificado ? 'Verificado' : 'Pendiente'}
      </Text>
    </View>
  );
}

export default function CardMedioPago({ item }) {
  const config = TIPO_CONFIG[item.tipo] || {};
  return (
    <View style={styles.card}>
      <View style={styles.icono}>
        <Text style={styles.iconoTexto}>{config.icono || '💰'}</Text>
      </View>
      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={1}>{tituloPorTipo(item)}</Text>
        <Text style={styles.subtitulo}>{subtituloPorTipo(item)}</Text>
        <BadgeVerificacion estado={item.verificado} />
      </View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconoTexto: {
    fontSize: 20,
  },
  cuerpo: {
    flex: 1,
    gap: 3,
  },
  titulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  subtitulo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 4,
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
  chevron: {
    ...typography.h2,
    color: colors.textDisabled,
    marginLeft: 8,
  },
});
