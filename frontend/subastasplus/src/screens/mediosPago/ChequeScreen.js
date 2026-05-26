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
import { colors, typography, BANCOS_ARGENTINA } from '../../constants';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import PickerField from '../../components/common/PickerField';
import { agregarCheque } from '../../api/mediosPago';

const MONEDAS = [
  { label: 'ARS', value: 'ARS' },
  { label: 'USD', value: 'USD' },
];

export default function ChequeScreen({ navigation, route }) {
  const [numeroCheque, setNumeroCheque] = useState('');
  const [banco, setBanco] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    if (!numeroCheque || !banco || !monto || !moneda || !fechaEmision) {
      Alert.alert('Campos incompletos', 'Completá todos los campos');
      return;
    }

    setLoading(true);
    try {
      await agregarCheque({
        banco,
        numeroCheque,
        monto: Number(monto),
        moneda,
        fechaEmision,
      });
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
          <Text style={styles.backTexto}>{'<'} Cheque certificado</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitulo}>Cheque certificado</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Input
          label="Nro de cheque"
          value={numeroCheque}
          onChangeText={setNumeroCheque}
          placeholder="00012345"
          keyboardType="numeric"
        />
        <PickerField label="Banco emisor" value={banco} onSelect={setBanco} opciones={BANCOS_ARGENTINA} />
        <Input
          label="Monto certificado"
          value={monto}
          onChangeText={setMonto}
          placeholder="80.000"
          keyboardType="numeric"
        />
        <PickerField label="Moneda" value={moneda} onSelect={setMoneda} opciones={MONEDAS} />
        <Input
          label="Fecha de emision"
          value={fechaEmision}
          onChangeText={setFechaEmision}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        <Text style={styles.aviso}>
          Cheque verificado ANTES de subasta.{'\n'}Compras no pueden superar este monto.
        </Text>

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
  aviso: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  botonWrapper: {
    marginTop: 8,
    marginBottom: 16,
  },
});
