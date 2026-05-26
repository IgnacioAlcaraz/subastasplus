import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';
import Button from '../../components/common/Button';

export default function ConfirmacionSolicitudScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.ok}>OK</Text>
      </View>
      <Text style={styles.title}>Solicitud enviada</Text>
      <Text style={styles.subtitle}>La empresa evaluará tu bien{'\n'}y te notificará.</Text>
      <View style={styles.btnContainer}>
        <Button
          title="Ver mis solicitudes"
          onPress={() => navigation.navigate('VentasList')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  circle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  ok: { ...typography.h2, color: colors.textSecondary },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 48 },
  btnContainer: { width: '100%' },
});
