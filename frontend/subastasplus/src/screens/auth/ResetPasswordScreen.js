import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors, typography } from '../../constants';
import { nuevaClave } from '../../api/auth';

export default function ResetPasswordScreen({ navigation, route }) {
  const { email, resetToken } = route.params;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCambiar() {
    if (!password || !confirm) {
      Alert.alert('Campos incompletos', 'Completá ambos campos');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await nuevaClave(email, password, resetToken);
      Alert.alert('Listo', 'Tu contraseña fue actualizada', [
        { text: 'Iniciar sesión', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>Nueva contraseña</Text>

        <Input
          label="Nueva contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        <Input
          label="Confirmar"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
        />

        <Button title="Cambiar contraseña" onPress={handleCambiar} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  back: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  container: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 24,
  },
});