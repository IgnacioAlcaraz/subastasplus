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

export default function TarjetaScreen({ navigation, route }) {
  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState('');
  const [codigoSeguridad, setCodigoSeguridad] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegistrar() {
    if (!numero || !titular || !codigoSeguridad || !vencimiento) {
      Alert.alert('Campos incompletos', 'Completá todos los campos');
      return;
    }

    setLoading(true);
    try {
      await agregarTarjeta({ numero, titular, vencimiento, codigoSeguridad });
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
          label="Numero"
          value={numero}
          onChangeText={setNumero}
          placeholder="5544 5256 6233 5212"
          keyboardType="numeric"
        />
        <Input
          label="Titular"
          value={titular}
          onChangeText={setTitular}
          placeholder="John Doe"
        />
        <Input
          label="Código de seguridad"
          value={codigoSeguridad}
          onChangeText={setCodigoSeguridad}
          placeholder="CVV"
          keyboardType="numeric"
          secureTextEntry
        />
        <Input
          label="Vencimiento"
          value={vencimiento}
          onChangeText={setVencimiento}
          placeholder="MM/AA"
          keyboardType="numeric"
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
