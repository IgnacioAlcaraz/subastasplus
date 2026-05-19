import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { registroEtapa2 } from '../../api/registro';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function CreatePasswordScreen() {
  const { tokenSeguimiento, pendingData, login: saveSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerar() {
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
      const { token, usuario } = await registroEtapa2(tokenSeguimiento, pendingData.email, password);
      await saveSession(token, usuario);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>¡Cuenta aprobada!</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Cat: {capitalize(pendingData?.categoria)}</Text>
        </View>
        <Text style={styles.subtitle}>Genera tu clave de Ingreso</Text>

        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />
        <Input
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          secureTextEntry
        />
        <Text style={styles.hint}>Min 8 chars, 1 mayúsc, 1 número</Text>

        <Button title="Generar Clave" onPress={handleGenerar} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { ...typography.h2, color: colors.textPrimary, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  badgeText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  subtitle: { ...typography.h3, color: colors.textPrimary, marginBottom: 24 },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: -8, marginBottom: 24 },
});
