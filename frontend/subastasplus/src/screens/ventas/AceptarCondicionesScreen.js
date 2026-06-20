import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { colors, typography, BANCOS_ARGENTINA } from '../../constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PickerField from '../../components/common/PickerField';
import { aceptarCondiciones } from '../../api/solicitudesVenta';
import { getPaises } from '../../api/paises';

const MONEDAS = [
  { label: 'USD — Dólar estadounidense', value: 'USD' },
  { label: 'EUR — Euro', value: 'EUR' },
  { label: 'GBP — Libra esterlina', value: 'GBP' },
];

function fmt(n) {
  return n?.toLocaleString('es-AR', { minimumFractionDigits: 0 }) ?? '—';
}

// validamos localmente antes de mandar al backend para dar feedback inmediato al usuario
function validarNacional({ cbu, banco, titular }) {
  const errs = {};
  if (cbu.replace(/\D/g, '').length !== 22) errs.cbu = 'El CBU debe tener 22 dígitos';
  if (!banco) errs.banco = 'Seleccioná un banco';
  if (!titular.trim()) errs.titular = 'El titular es obligatorio';
  return errs;
}

// misma lógica para cuenta exterior; el SWIFT puede tener 8 u 11 caracteres según el banco
function validarExterior({ swift, iban, banco, pais, moneda, titular }) {
  const errs = {};
  const swiftClean = swift.replace(/\s/g, '');
  if (swiftClean.length < 8 || swiftClean.length > 11) errs.swift = 'El SWIFT/BIC debe tener entre 8 y 11 caracteres';
  if (!iban.trim()) errs.iban = 'El IBAN es obligatorio';
  if (!banco.trim()) errs.banco = 'El banco es obligatorio';
  if (!pais) errs.pais = 'Seleccioná un país';
  if (!moneda) errs.moneda = 'Seleccioná una moneda';
  if (!titular.trim()) errs.titular = 'El titular es obligatorio';
  return errs;
}


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
  const [bancoExt, setBancoExt] = useState('');
  const [titularExt, setTitularExt] = useState('');

  const [paises, setPaises] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const neto = solicitud.valorBase * (1 - solicitud.comisiones / 100);
  const sym = solicitud.moneda === 'ARS' ? '$' : 'US$';

  useEffect(() => {
    getPaises()
      .then(data => setPaises(data.filter(p => p.nombre !== 'Argentina').map(p => p.nombre)))
      .catch(() => {});
  }, []);

  async function confirmar() {
    let errs = {};
    let cuentaCobro;

    if (tipoCuenta === 'nacional') {
      errs = validarNacional({ cbu, banco, titular });
      if (!Object.keys(errs).length) {
        cuentaCobro = {
          tipo: 'nacional',
          cbu: cbu.replace(/\D/g, ''),
          banco: banco || null,
          titular: titular.trim(),
        };
      }
    } else {
      errs = validarExterior({ swift, iban, banco: bancoExt, pais, moneda, titular: titularExt });
      if (!Object.keys(errs).length) {
        cuentaCobro = {
          tipo: 'exterior',
          swift: swift.replace(/\s/g, '').toUpperCase(),
          iban: iban.trim(),
          pais,
          moneda,
          banco: bancoExt.trim() || null,
          titular: titularExt.trim(),
        };
      }
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await aceptarCondiciones(solicitud.id, {
        aceptaValorBase: true,
        aceptaComisiones: true,
        cuentaCobro,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo confirmar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.back}>‹ Condiciones</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Confirmar condiciones</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoRow}>Base: {sym} {fmt(solicitud.valorBase)} · Com: {solicitud.comisiones}%</Text>
        <Text style={styles.infoNeto}>Neto: {sym} {fmt(neto)}</Text>
        <Text style={styles.infoRow}>Costo de envío al depósito: {sym} {fmt(solicitud.costoEnvio)}</Text>
      </View>

      <Text style={styles.sectionLabel}>Cuenta de cobro</Text>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tipoCuenta === 'nacional' && styles.tabActive]}
          onPress={() => { setTipoCuenta('nacional'); setErrors({}); }}
        >
          <Text style={[styles.tabText, tipoCuenta === 'nacional' && styles.tabTextActive]}>Cta. nacional</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tipoCuenta === 'exterior' && styles.tabActive]}
          onPress={() => { setTipoCuenta('exterior'); setErrors({}); }}
        >
          <Text style={[styles.tabText, tipoCuenta === 'exterior' && styles.tabTextActive]}>Cta. exterior</Text>
        </TouchableOpacity>
      </View>

      {tipoCuenta === 'nacional' ? (
        <>
          <Input
            label="CBU (22 dígitos)"
            value={cbu}
            onChangeText={t => setCbu(t.replace(/\D/g, '').slice(0, 22))}
            placeholder="0000003100010000000012"
            keyboardType="numeric"
            error={errors.cbu}
          />
          <PickerField
            label="Banco"
            value={banco}
            onSelect={setBanco}
            opciones={BANCOS_ARGENTINA}
            error={errors.banco}
          />
          <Input
            label="Titular"
            value={titular}
            onChangeText={setTitular}
            placeholder="Juan Pérez"
            error={errors.titular}
          />
        </>
      ) : (
        <>
          <Input
            label="SWIFT / BIC"
            value={swift}
            onChangeText={t => setSwift(t.toUpperCase())}
            placeholder="NWBKGB2L"
            error={errors.swift}
          />
          <Input
            label="IBAN"
            value={iban}
            onChangeText={setIban}
            placeholder="GB29 NWBK 6016 1331 9268 19"
            error={errors.iban}
          />
          <PickerField
            label="País del banco"
            value={pais}
            onSelect={setPais}
            opciones={paises}
            error={errors.pais}
          />
          <PickerField
            label="Moneda"
            value={moneda}
            onSelect={setMoneda}
            opciones={MONEDAS}
            error={errors.moneda}
          />
          <Input
            label="Banco"
            value={bancoExt}
            onChangeText={setBancoExt}
            placeholder="HSBC London"
            error={errors.banco}
          />
          <Input
            label="Titular"
            value={titularExt}
            onChangeText={setTitularExt}
            placeholder="Juan Pérez"
            error={errors.titular}
          />
        </>
      )}

      <Button title={loading ? 'Confirmando...' : 'Confirmar condiciones'} onPress={confirmar} disabled={loading} />
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
    marginBottom: 24, gap: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  infoRow: { ...typography.bodySmall, color: colors.textSecondary },
  infoNeto: { ...typography.body, color: colors.primary, fontWeight: '700' },
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
  nota: { marginVertical: 20 },
  notaText: { ...typography.bodySmall, color: colors.textSecondary },
});
