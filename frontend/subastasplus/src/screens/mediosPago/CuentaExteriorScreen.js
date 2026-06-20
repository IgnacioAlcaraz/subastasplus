import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PickerField from '../../components/common/PickerField';
import { agregarCuentaExterior } from '../../api/mediosPago';
import { getPaises } from '../../api/paises';

const MONEDAS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
];

function validar({ iban, swift, banco, pais, moneda, titular, saldo }) {
  const errs = {};
  if (!iban.trim()) errs.iban = 'El IBAN es obligatorio';
  const swiftLen = swift.replace(/\s/g, '').length;
  if (swiftLen < 8 || swiftLen > 11) errs.swift = 'El SWIFT/BIC debe tener entre 8 y 11 caracteres';
  if (!banco.trim()) errs.banco = 'El banco es obligatorio';
  if (!pais) errs.pais = 'Seleccioná un país';
  if (!moneda) errs.moneda = 'Seleccioná una moneda';
  if (!titular.trim()) errs.titular = 'El titular es obligatorio';
  if (!saldo || !(Number(saldo) > 0)) errs.saldo = 'Ingresá el saldo disponible';
  return errs;
}

export default function CuentaExteriorScreen({ navigation, route }) {
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [banco, setBanco] = useState('');
  const [pais, setPais] = useState('');
  const [moneda, setMoneda] = useState('');
  const [titular, setTitular] = useState('');
  const [saldo, setSaldo] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [paises, setPaises] = useState([]);

  useEffect(() => {
    getPaises()
      .then(data => setPaises(data.filter(p => p.nombre !== 'Argentina').map(p => p.nombre)))
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los países'));
  }, []);

  async function handleRegistrar() {
    const errs = validar({ iban, swift, banco, pais, moneda, titular, saldo });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await agregarCuentaExterior({ banco, swift: swift.toUpperCase(), iban, pais, titular, moneda, saldo: Number(saldo) });
      navigation.navigate(route.params?.successRoute ?? 'RegistroCompleto');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backTexto}>{'<'} Cuenta bancaria</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitulo}>Cuenta extranjera</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Input
          label="IBAN"
          value={iban}
          onChangeText={t => setIban(t.replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().slice(0, 34))}
          placeholder="GB29 NWBK 6016 1331 9268 19"
          autoCapitalize="characters"
          maxLength={34}
          error={errors.iban}
        />
        <Input
          label="SWIFT/BIC"
          value={swift}
          onChangeText={t => setSwift(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11))}
          placeholder="NWBKGB2L"
          autoCapitalize="characters"
          maxLength={11}
          error={errors.swift}
        />
        <Input
          label="Banco"
          value={banco}
          onChangeText={setBanco}
          placeholder="HSBC London"
          error={errors.banco}
        />
        <PickerField label="País del banco" value={pais} onSelect={setPais} opciones={paises} error={errors.pais} />
        <PickerField label="Moneda" value={moneda} onSelect={setMoneda} opciones={MONEDAS} error={errors.moneda} />
        <Input
          label="Titular"
          value={titular}
          onChangeText={setTitular}
          placeholder="Juan Perez"
          error={errors.titular}
        />
        <Input
          label="Saldo disponible"
          value={saldo}
          onChangeText={t => setSaldo(t.replace(/[^0-9.]/g, ''))}
          placeholder="10000"
          keyboardType="numeric"
          error={errors.saldo}
        />

        <View style={styles.botonWrapper}>
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <Button title="Registrar" onPress={handleRegistrar} />
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backTexto: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitulo: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  contenido: {
    padding: 20,
    gap: 4,
  },
  botonWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
});
