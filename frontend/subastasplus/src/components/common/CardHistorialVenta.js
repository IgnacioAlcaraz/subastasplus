import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';
import client from '../../api/client';

const MONEDA_SIMBOLO = { USD: 'US$', EUR: '€', GBP: '£' };

function formatMiles(num) {
  return Math.round(num).toLocaleString('es-AR');
}

function formatFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function CardHistorialVenta({ item, onPress }) {
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function cargarImagen() {
      try {
        const response = await client.get(
          `/solicitudes-venta/${item.id}/fotos/0`,
          { responseType: 'arraybuffer' }
        );
        const bytes = new Uint8Array(response.data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        if (!cancelled) setImageUri(`data:image/jpeg;base64,${btoa(binary)}`);
      } catch {
        // muestra fallback gris
      }
    }
    cargarImagen();
    return () => { cancelled = true; };
  }, [item.id]);

  const simbolo = MONEDA_SIMBOLO[item.moneda] ?? (item.moneda || '');
  const neto =
    item.precioVenta != null && item.comisiones != null
      ? item.precioVenta * (1 - item.comisiones / 100)
      : null;
  const precioTexto = neto != null ? `${simbolo} ${formatMiles(neto)} neto` : '—';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.thumbnailWrapper}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailFallback]} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {item.nombreBien || '—'}
        </Text>
        <Text style={styles.precio}>{precioTexto}</Text>
        <Text style={styles.fecha}>{formatFecha(item.fechaCreacion)}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailWrapper: {
    marginRight: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbnailFallback: {
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
  },
  nombre: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  precio: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  fecha: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textDisabled,
    marginLeft: 8,
  },
});
