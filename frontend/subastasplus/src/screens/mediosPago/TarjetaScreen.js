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
import { agregarTarjeta } from '../../api/mediosPago';

function formatNumero(text) {
  const digits = text.replace(/\D/g, '').slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
}

function formatVencimiento(text) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
}

function validar({ numero, titular, codigoSeguridad, vencimiento }) {
  const errs = {};
  const digits = numero.replace(/\D/g, '');
  if (digits.length !== 16) errs.numero = 'Debe tener 16 dígitos';
  if (!titular.trim()) errs.titular = 'El titular es obligatorio';
  if (!/^\d{3,4}$/.test(codigoSeguridad)) errs.codigoSeguridad = 'Debe tener 3 o 4 dígitos';
  const m = vencimiento.match(/^(\d{2})\/(\d{2})$/);
  if (!m) {
    errs.vencimiento = 'Formato inválido (MM/AA)';
  } else if (Number(m[1]) < 1 || Number(m[1]) > 12) {
    errs.vencimiento = 'Mes inválido';
  }
  return errs;
}

export default function TarjetaScreen({ navigation, route }) {
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    const errs = validar({ numero, titular, codigoSeguridad, vencimiento });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await agregarTarjeta({
        numero: numero.replace(/\D/g, ''),
        titular,
        vencimiento,
        codigoSeguridad,
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
          <Text style={styles.backTexto}>{'<'} Tarjeta de Crédito</Text>
        </TouchableOpacity>
        <Text style={styles.headerSubtitulo}>Datos de Tarjeta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Input
          label="Número"
          value={numero}
          onChangeText={t => setNumero(formatNumero(t))}
          placeholder="5544 5256 6233 5212"
          keyboardType="numeric"
          error={errors.numero}
        />
        <Input
          label="Titular"
          value={titular}
          onChangeText={setTitular}
          placeholder="John Doe"
          error={errors.titular}
        />
        <Input
          label="Código de seguridad"
          value={codigoSeguridad}
          onChangeText={t => setCodigoSeguridad(t.replace(/\D/g, '').slice(0, 4))}
          placeholder="CVV"
          keyboardType="numeric"
          secureTextEntry
          error={errors.codigoSeguridad}
        />
        <Input
          label="Vencimiento"
          value={vencimiento}
          onChangeText={t => setVencimiento(formatVencimiento(t))}
          placeholder="MM/AA"
          keyboardType="numeric"
          error={errors.vencimiento}
        />

        <View style={styles.botonWrapper}>
          {loading
            ? <ActivityIndicator color={colors.primary} />
            : <Button title="Registrar" onPress={handleRegistrar} />
          }
        </View>

        <Text style={styles.nota}>El medio sera verificado por la empresa.</Text>
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
  nota: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
