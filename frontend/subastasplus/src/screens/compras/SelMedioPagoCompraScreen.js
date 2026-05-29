import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { getMediosPago } from '../../api/mediosPago';

function subtituloMedio(tipo) {
  if (tipo === 'tarjeta_credito') return 'Tarjeta int.';
  if (tipo === 'cuenta_nacional') return 'Banco nac.';
  if (tipo === 'cuenta_exterior') return 'Banco ext.';
  if (tipo === 'cheque_certificado') return 'Cheque cert.';
  return tipo;
}

export default function SelMedioPagoCompraScreen({ navigation, route }) {
  const { compraId, moneda, numeroItem } = route.params;
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        const todos = await getMediosPago();
        let filtrados = todos.filter((m) => m.verificado === true);
        if (moneda !== 'ARS') {
          filtrados = filtrados.filter(
            (m) => m.tipo === 'tarjeta_credito' || m.tipo === 'cuenta_exterior'
          );
        }
        const mapeados = filtrados.map((m) => ({
          id: m.id,
          alias: m.alias,
          subtitulo: subtituloMedio(m.tipo) + ' · Verificada',
        }));
        setMedios(mapeados);
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los medios de pago.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  function seleccionar(medioPago) {
    navigation.navigate('FacturaCompra', { compraId, moneda, numeroItem, medioPago });
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerRow}>
        <Text style={styles.back}>‹</Text>
        <Text style={styles.headerTitle}>Medio de pago</Text>
      </TouchableOpacity>

      {moneda !== 'ARS' && (
        <Text style={styles.aviso}>Subasta en {moneda}: solo internac.</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : medios.length === 0 ? (
        <Text style={styles.vacio}>No tenés medios de pago compatibles con esta subasta.</Text>
      ) : (
        <FlatList
          data={medios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => seleccionar(item)} activeOpacity={0.75}>
              <Text style={styles.alias}>{item.alias}</Text>
              <Text style={styles.subtitulo}>{item.subtitulo}</Text>
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
  aviso: { ...typography.bodySmall, color: colors.textSecondary, paddingHorizontal: 20, marginBottom: 8 },
  loader: { flex: 1, justifyContent: 'center' },
  vacio: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginTop: 60, paddingHorizontal: 32,
  },
  lista: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  alias: { ...typography.body, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subtitulo: { ...typography.bodySmall, color: colors.textSecondary },
});
