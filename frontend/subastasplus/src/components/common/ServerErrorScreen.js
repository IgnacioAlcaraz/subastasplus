import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';
import Button from './Button';

export default function ServerErrorScreen({ onRetry }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.subtitle}>
        Hubo un error en el servidor. Intentá de nuevo más tarde.
      </Text>
      <View style={styles.boton}>
        <Button title="Reintentar" onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  boton: {
    alignSelf: 'stretch',
  },
});
