import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';
import Button from '../../components/common/Button';

export default function MultaPagadaScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconoContainer}>
        <Text style={styles.iconoTexto}>OK</Text>
      </View>
      <Text style={styles.titulo}>Multa pagada</Text>
      <Text style={styles.mensaje}>
        Aún debés presentar fondos para la compra original dentro del plazo de 72hs
      </Text>
      <View style={styles.boton}>
        <Button
          title="Historial de Compras"
          onPress={() => navigation.navigate('HistorialCompras')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconoTexto: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  mensaje: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  boton: {
    width: '100%',
  },
});
