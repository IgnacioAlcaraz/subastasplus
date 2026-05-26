import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

function fmt(n) {
  return n?.toLocaleString('es-AR', { minimumFractionDigits: 0 }) ?? '—';
}

export default function PolizaSeguroScreen({ navigation, route }) {
  const { solicitudId, poliza } = route.params;
  const { user } = useAuth();

  const beneficiario = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Póliza</Text>
      </TouchableOpacity>

      <Text style={styles.nroPoliza}>#{poliza.numeroPoliza}</Text>
      <Text style={styles.aseguradora}>{poliza.aseguradora ?? '—'}</Text>

      <View style={styles.datos}>
        <View style={styles.fila}>
          <Text style={styles.label}>Tipo</Text>
          <Text style={styles.valor}>{poliza.tipo ?? '—'}</Text>
        </View>
        <View style={styles.fila}>
          <Text style={styles.label}>Importe</Text>
          <Text style={styles.valorBold}>
            {poliza.valorAsegurado != null ? `US$ ${fmt(poliza.valorAsegurado)}` : '—'}
          </Text>
        </View>
        <View style={styles.fila}>
          <Text style={styles.label}>Beneficiario</Text>
          <Text style={styles.valor}>{beneficiario}</Text>
        </View>
        <Text style={styles.vigente}>Vigente</Text>
      </View>

      <View style={styles.btnWrap}>
        <Button
          title="Contactar aseguradora"
          onPress={() => navigation.navigate('ContactarAseguradora', { solicitudId })}
        />
      </View>

      <Text style={styles.nota}>
        Podés aumentar cobertura pagando diferencia de prima.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  backBtn: { paddingTop: 52, paddingBottom: 16 },
  back: { ...typography.body, color: colors.textPrimary },
  nroPoliza: { ...typography.h1, color: colors.textPrimary, marginBottom: 4 },
  aseguradora: { ...typography.body, color: colors.textSecondary, marginBottom: 24 },
  datos: { gap: 12, marginBottom: 32 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.bodySmall, color: colors.textSecondary },
  valor: { ...typography.bodySmall, color: colors.textPrimary },
  valorBold: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  vigente: { ...typography.bodySmall, color: colors.textPrimary, marginTop: 4 },
  btnWrap: { marginBottom: 16 },
  nota: { ...typography.bodySmall, color: colors.textSecondary },
});
