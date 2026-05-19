import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';

export default function PendingApprovalScreen({ route }) {
  const { tokenSeguimiento } = route.params;
  const { savePendingRegistration } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.illustration}>
          <Text style={styles.dots}>···</Text>
        </View>
        <Text style={styles.title}>Tu solicitud está{'\n'}siendo verificada</Text>
        <Text style={styles.subtitle}>Te enviaremos un email cuando{'\n'}tu cuenta sea aprobada.</Text>
        <Button title="Entendido" onPress={() => savePendingRegistration(tokenSeguimiento)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  illustration: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dots: { fontSize: 24, color: colors.textSecondary, letterSpacing: 4 },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: 12 },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 40 },
});
