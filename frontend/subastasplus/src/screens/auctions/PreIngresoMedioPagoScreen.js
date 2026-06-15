import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { fijarMedioPagoSubasta, getSala } from '../../api/subastas';

function tipoLegible(tipo) {
  if (tipo === 'tarjeta_credito') return 'Tarjeta int.';
  if (tipo === 'cuenta_nacional') return 'Banco nac.';
  if (tipo === 'cuenta_exterior') return 'Banco ext.';
  if (tipo === 'cheque_certificado') return 'Cheque cert.';
  return tipo;
}

export default function PreIngresoMedioPagoScreen({ navigation, route }) {
  const { subastaId, titulo, moneda, medios } = route.params;
  const [loadingId, setLoadingId] = useState(null);

  async function handleSeleccionar(medio) {
    setLoadingId(medio.id);
    try {
      await fijarMedioPagoSubasta(subastaId, medio.id);
      const sala = await getSala(subastaId);
      navigation.navigate('Sala', { sala, subastaId, titulo, moneda });
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo registrar el medio de pago.');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRow}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.headerTitle}>Medio de pago</Text>
      </TouchableOpacity>

      <Text style={styles.aviso}>
        Subasta en {moneda} — este medio queda fijo para toda la subasta.
      </Text>

      {medios.length === 0 ? (
        <View style={styles.vacioCont}>
          <Text style={styles.vacio}>
            No tenés medios de pago verificados en {moneda}.{'\n'}
            Registrá y verificá un medio compatible para poder ingresar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={medios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSeleccionar(item)}
              disabled={!!loadingId}
              activeOpacity={0.75}
            >
              <View style={styles.cardContent}>
                <Text style={styles.alias}>{item.alias}</Text>
                <Text style={styles.subtitulo}>{tipoLegible(item.tipo)} · Verificada</Text>
              </View>
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}
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
  aviso: {
    ...typography.bodySmall, color: colors.textSecondary,
    paddingHorizontal: 20, marginBottom: 8,
  },
  vacioCont: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  vacio: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  lista: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardContent: { flex: 1 },
  alias: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subtitulo: { ...typography.bodySmall, color: colors.textSecondary },
});
