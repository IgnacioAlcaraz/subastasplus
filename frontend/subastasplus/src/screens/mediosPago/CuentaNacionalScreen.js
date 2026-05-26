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
import { agregarCuentaNacional } from '../../api/mediosPago';

const TIPOS_CUENTA = [
  { label: 'Caja de Ahorro', value: 'caja_ahorro' },
  { label: 'Cuenta Corriente', value: 'cuenta_corriente' },
];

export default function CuentaNacionalScreen({ navigation }) {
  const [cbu, setCbu] = useState('');
  const [banco, setBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [cuitCuil, setCuitCuil] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    if (!cbu || !banco || !tipoCuenta || !titular || !cuitCuil) {
      Alert.alert('Campos incompletos', 'Completá todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await agregarCuentaNacional({ banco, cbu, cuitCuil, tipoCuenta, titular, alias });
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
        <Text style={styles.headerSubtitulo}>Cuenta nacional</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Input
          label="CBU (22 dígitos)"
          value={cbu}
          onChangeText={setCbu}
          placeholder="0000003100010000000012"
          keyboardType="numeric"
        />
        <PickerField label="Banco" value={banco} onSelect={setBanco} opciones={BANCOS_ARGENTINA} />
        <PickerField label="Tipo de cuenta" value={tipoCuenta} onSelect={setTipoCuenta} opciones={TIPOS_CUENTA} />
        <Input
          label="Titular"
          value={titular}
          onChangeText={setTitular}
          placeholder="Juan Perez"
        />
        <Input
          label="CUIT/CUIL"
          value={cuitCuil}
          onChangeText={setCuitCuil}
          placeholder="20-12345678-9"
          keyboardType="numeric"
        />
        <Input
          label="Alias (opcional)"
          value={alias}
          onChangeText={setAlias}
          placeholder="tucan.avion"
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
