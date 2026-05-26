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

function formatFecha(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + '-' + digits.slice(4);
  return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6);
}

function validar({ numeroCheque, banco, monto, moneda, fechaEmision }) {
  const errs = {};
  if (!numeroCheque.trim()) errs.numeroCheque = 'El número de cheque es obligatorio';
  if (!banco) errs.banco = 'Seleccioná un banco';
  if (!monto || Number(monto) <= 0) errs.monto = 'El monto debe ser mayor a 0';
  if (!moneda) errs.moneda = 'Seleccioná una moneda';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEmision) || isNaN(Date.parse(fechaEmision))) {
    errs.fechaEmision = 'Formato inválido (AAAA-MM-DD)';
  }
  return errs;
}

function formatFecha(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return digits.slice(0, 4) + '-' + digits.slice(4);
  return digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6);
}

function validar({ numeroCheque, banco, monto, moneda, fechaEmision }) {
  const errs = {};
  if (!numeroCheque.trim()) errs.numeroCheque = 'El número de cheque es obligatorio';
  if (!banco) errs.banco = 'Seleccioná un banco';
  if (!monto || Number(monto) <= 0) errs.monto = 'El monto debe ser mayor a 0';
  if (!moneda) errs.moneda = 'Seleccioná una moneda';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEmision) || isNaN(Date.parse(fechaEmision))) {
    errs.fechaEmision = 'Formato inválido (AAAA-MM-DD)';
  }
  return errs;
}

export default function ChequeScreen({ navigation, route }) {
  const [numeroCheque, setNumeroCheque] = useState('');
  const [banco, setBanco] = useState('');
  const [monto, setMonto] = useState('');
  const [moneda, setMoneda] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    const errs = validar({ numeroCheque, banco, monto, moneda, fechaEmision });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
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
          onChangeText={t => setNumeroCheque(t.replace(/\D/g, ''))}
          placeholder="00012345"
          keyboardType="numeric"
          error={errors.numeroCheque}
        />
        <PickerField label="Banco emisor" value={banco} onSelect={setBanco} opciones={BANCOS_ARGENTINA} error={errors.banco} />
        <Input
          label="Monto certificado"
          value={monto}
          onChangeText={t => setMonto(t.replace(/[^0-9.]/g, ''))}
          placeholder="80000"
          keyboardType="numeric"
          error={errors.monto}
        />
        <PickerField label="Moneda" value={moneda} onSelect={setMoneda} opciones={MONEDAS} error={errors.moneda} />
        <Input
          label="Fecha de emisión"
          value={fechaEmision}
          onChangeText={t => setFechaEmision(formatFecha(t))}
          placeholder="AAAA-MM-DD"
          keyboardType="numeric"
          error={errors.fechaEmision}
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
