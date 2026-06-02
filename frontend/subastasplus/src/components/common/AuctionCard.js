import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

function formatFechaHora(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const fechaParte = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  const horaParte = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs';
  return `${fechaParte} · ${horaParte}`;
}

export default function AuctionCard({ subasta, onPress, variant = 'list' }) {
  const { titulo, estado, categoria, cantidadPiezas, moneda, fecha } = subasta;
  const enVivo = estado === 'en_vivo';
  const finalizada = estado === 'finalizada';

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compact} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.compactImagen} />
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeTexto}>Programada</Text>
        </View>
        <Text style={styles.compactTitulo} numberOfLines={2}>{titulo}</Text>
        <Text style={styles.compactFecha}>{formatFechaHora(fecha)}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={styles.featured} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.cardTitulo} numberOfLines={1}>{titulo}</Text>
        <Text style={styles.cardSub}>{cantidadPiezas} piezas · {categoria}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.badgeMoneda}>
            <Text style={styles.badgeMonedaTexto}>{moneda}</Text>
          </View>
          <View style={styles.botonEntrar}>
            <Text style={styles.botonEntrarTexto}>Entrar</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, finalizada && styles.cardFinalizada]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        {enVivo ? (
          <>
            <Text style={styles.badgeEnVivoTexto}>● EN VIVO</Text>
            <Text style={styles.cardFecha}>{formatFechaHora(fecha)}</Text>
          </>
        ) : (
          <Text style={styles.cardFecha}>{formatFechaHora(fecha)}</Text>
        )}
      </View>
      <Text style={[styles.cardTitulo, finalizada && styles.tituloFinalizado]} numberOfLines={1}>
        {titulo}
      </Text>
      <Text style={styles.cardSub}>{cantidadPiezas} pzs · {categoria}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.badgeMoneda}>
          <Text style={styles.badgeMonedaTexto}>{moneda}</Text>
        </View>
        {!finalizada && (
          <View style={styles.botonEntrar}>
            <Text style={styles.botonEntrarTexto}>Entrar</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFinalizada: {
    opacity: 0.6,
  },
  cardHeader: {
    marginBottom: 8,
  },
  badgeEnVivoTexto: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  cardFecha: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  tituloFinalizado: {
    color: colors.textSecondary,
  },
  cardSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeMoneda: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeMonedaTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  botonEntrar: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botonEntrarTexto: {
    ...typography.button,
    color: colors.surface,
  },

  featured: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: 280,
    marginRight: 12,
  },

  compact: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    width: 160,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactImagen: {
    backgroundColor: colors.border,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  statusBadgeTexto: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  compactTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactFecha: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
