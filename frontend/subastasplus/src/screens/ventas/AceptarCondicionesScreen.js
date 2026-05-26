import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { colors, typography } from '../../constants';
import Input from '../../components/common/Input';
import { aceptarCondiciones } from '../../api/solicitudesVenta';

export default function AceptarCondicionesScreen({ navigation, route }) {
  const { solicitud } = route.params;
  const [tipoCuenta, setTipoCuenta] = useState('nacional');
  const [cbu, setCbu] = useState('');
  const [banco, setBanco] = useState('');
  const [titular, setTitular] = useState('');
  const [swift, setSwift] = useState('');
  const [iban, setIban] = useState('');
  const [pais, setPais] = useState('');
  const [moneda, setMoneda] = useState('');
  const [loading, setLoading] = useState(false);

  const neto = solicitud.valorBase * (1 - solicitud.comisiones / 100);

  function fmt(n) {
    return n?.toLocaleString('es-AR', { minimumFractionDigits: 0 }) ?? '—';
  }

  async function confirmar() {
    if (tipoCuenta === 'nacional' && !cbu.trim()) {
      Alert.alert('Campo requerido', 'Ingresá el CBU.');
      return;
    }
    if (tipoCuenta === 'exterior') {
      if (!swift.trim() || !iban.trim() || !pais.trim() || !moneda.trim()) {
        Alert.alert('Campos requeridos', 'Completá SWIFT, IBAN, País y Moneda.');
        return;
      }
    }

    setLoading(true);
    try {
      const cuentaCobro = tipoCuenta === 'nacional'
        ? { tipo: 'nacional', cbu: cbu.trim(), banco: banco.trim() || null, titular: titular.trim() || null }
        : { tipo: 'exterior', swift: swift.trim(), iban: iban.trim(), pais: pais.trim(), moneda: moneda.trim(), banco: banco.trim() || null, titular: titular.trim() || null };

      await aceptarCondiciones(solicitud.id, {
        aceptaValorBase: true,
        aceptaComisiones: true,
        cuentaCobro,
      });
      navigation.navigate('VentasList');
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo confirmar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Aceptar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Confirmar y declarar cuenta</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoRow}>Base: US$ {fmt(solicitud.valorBase)} | Com: {solicitud.comisiones}%</Text>
        <Text style={styles.infoNeto}>Neto: US$ {fmt(neto)}</Text>
      </View>

      <Text style={styles.sectionLabel}>Cuenta de cobro</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tipoCuenta === 'nacional' && styles.tabActive]}
          onPress={() => setTipoCuenta('nacional')}
        >
          <Text style={[styles.tabText, tipoCuenta === 'nacional' && styles.tabTextActive]}>Cta. nacional</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tipoCuenta === 'exterior' && styles.tabActive]}
          onPress={() => setTipoCuenta('exterior')}
        >
          <Text style={[styles.tabText, tipoCuenta === 'exterior' && styles.tabTextActive]}>Cta. exterior</Text>
        </TouchableOpacity>
      </View>

      {tipoCuenta === 'nacional' ? (
        <>
          <Input label="CBU" value={cbu} onChangeText={setCbu} placeholder="0000003100010000000012" keyboardType="numeric" />
          <Input label="Banco" value={banco} onChangeText={setBanco} placeholder="Banco Nación" />
          <Input label="Titular" value={titular} onChangeText={setTitular} placeholder="Juan Pérez" />
        </>
      ) : (
        <>
          <Input label="SWIFT" value={swift} onChangeText={setSwift} placeholder="BNDAARBA" />
          <Input label="IBAN" value={iban} onChangeText={setIban} placeholder="AR000000000000000000000" />
          <Input label="País" value={pais} onChangeText={setPais} placeholder="Argentina" />
          <Input label="Moneda" value={moneda} onChangeText={setMoneda} placeholder="USD" />
          <Input label="Banco" value={banco} onChangeText={setBanco} placeholder="Banco Nación" />
          <Input label="Titular" value={titular} onChangeText={setTitular} placeholder="Juan Pérez" />
        </>
      )}

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={confirmar} disabled={loading} activeOpacity={0.85}>
        {loading ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.btnText}>Confirmar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 52, paddingBottom: 48 },
  backBtn: { marginBottom: 20 },
  back: { ...typography.body, color: colors.textPrimary },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 20 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    marginBottom: 24, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  infoRow: { ...typography.bodySmall, color: colors.textSecondary },
  infoNeto: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  sectionLabel: { ...typography.label, color: colors.textSecondary, marginBottom: 10 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    backgroundColor: colors.surface,
  },
  tabActive: { borderColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  btn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { ...typography.button, color: colors.surface },
});
