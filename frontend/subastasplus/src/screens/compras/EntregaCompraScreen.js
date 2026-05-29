import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { pagarCompra } from '../../api/compras';

export default function EntregaCompraScreen({ navigation, route }) {
  const { compraId, compra, medioPago, numeroItem } = route.params;
  const [metodoEntrega, setMetodoEntrega] = useState('envio');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePagar() {
    if (metodoEntrega === 'envio' && !direccion.trim()) {
      // TODO: reemplazar por pantalla de error inline cuando esté disponible
      return;
    }
    setLoading(true);
    try {
      await pagarCompra(compraId, {
        medioPagoId: medioPago.id,
        metodoEntrega,
        direccionEnvio: metodoEntrega === 'envio' ? direccion.trim() : undefined,
      });
      navigation.navigate('ResultadoCompra', { tipo: 'exitosa' });
    } catch (error) {
      // TODO: descomentar cuando fondos_insuficientes esté activo
      // const tipo = error.status === 402 ? 'fondos_insuficientes' : 'exitosa';
      navigation.navigate('ResultadoCompra', { tipo: 'exitosa' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRow}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.headerTitle}>Entrega</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>¿Cómo recibir tu pieza?</Text>

        <TouchableOpacity
          style={[styles.card, metodoEntrega === 'envio' && styles.cardActivo]}
          onPress={() => setMetodoEntrega('envio')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitulo}>Envío a domicilio</Text>
          <Text style={styles.cardSubtitulo}>Costo en factura</Text>
          <Text style={styles.cardSubtitulo}>Cubierto por seguro</Text>

          {metodoEntrega === 'envio' && (
            <TextInput
              style={styles.inputDireccion}
              placeholder="Ingresá tu dirección completa"
              placeholderTextColor={colors.textDisabled}
              value={direccion}
              onChangeText={setDireccion}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, metodoEntrega === 'retiro_personal' && styles.cardActivo]}
          onPress={() => setMetodoEntrega('retiro_personal')}
          activeOpacity={0.8}
        >
          <Text style={styles.cardTitulo}>Retiro personal</Text>
          <Text style={styles.cardSubtitulo}>Sin costo de envío</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>PIERDE cobertura de seguro</Text>
          </View>

          {compra.avisoSeguro ? (
            <Text style={styles.avisoSeguro}>{compra.avisoSeguro}</Text>
          ) : null}

          <Text style={styles.cardSubtitulo}>Depósito: Av. Libertador 1902</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryDark} />
        ) : (
          <TouchableOpacity style={styles.btnPagar} onPress={handlePagar} activeOpacity={0.85}>
            <Text style={styles.btnPagarText}>Pagar</Text>
          </TouchableOpacity>
        )}
      </View>
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
  content: { padding: 20, paddingBottom: 32 },
  titulo: { ...typography.h3, color: colors.textPrimary, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardActivo: { borderColor: colors.primary },
  cardTitulo: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  cardSubtitulo: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 4 },
  inputDireccion: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    color: colors.textPrimary,
    ...typography.body,
    marginTop: 12,
    paddingVertical: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  badgeText: { ...typography.caption, color: colors.textSecondary },
  avisoSeguro: { ...typography.caption, color: colors.textSecondary, marginBottom: 6 },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  btnPagar: {
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPagarText: { ...typography.button, color: colors.surface },
});
