import React, { useState } from 'react';
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

const PAISES = [
  'Alemania', 'Australia', 'Brasil', 'Canadá', 'Chile', 'China',
  'España', 'Estados Unidos', 'Francia', 'Italia', 'Japón',
  'México', 'Paraguay', 'Reino Unido', 'Suiza', 'Uruguay', 'Otro',
];

const MONEDAS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
  { label: 'GBP', value: 'GBP' },
];

export default function CuentaExteriorScreen({ navigation }) {
  const [iban, setIban] = useState('');
  const [swift, setSwift] = useState('');
  const [banco, setBanco] = useState('');
  const [pais, setPais] = useState('');
  const [moneda, setMoneda] = useState('');
  const [titular, setTitular] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    if (!iban || !swift || !banco || !pais || !moneda || !titular) {
      Alert.alert('Campos incompletos', 'Completá todos los campos');
      return;
    }

    setLoading(true);
    try {
      await agregarCuentaExterior({ banco, swift, iban, pais, titular, moneda });
      navigation.navigate('RegistroCompleto');
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
          onChangeText={setIban}
          placeholder="GB29 NWBK 6016 1331 9268 19"
        />
        <Input
          label="SWIFT/BIC"
          value={swift}
          onChangeText={setSwift}
          placeholder="NWBKGB2L"
        />
        <Input
          label="Banco"
          value={banco}
          onChangeText={setBanco}
          placeholder="HSBC London"
        />
        <PickerField label="País del banco" value={pais} onSelect={setPais} opciones={PAISES} />
        <PickerField label="Moneda" value={moneda} onSelect={setMoneda} opciones={MONEDAS} />
        <Input
          label="Titular"
          value={titular}
          onChangeText={setTitular}
          placeholder="Juan Perez"
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
