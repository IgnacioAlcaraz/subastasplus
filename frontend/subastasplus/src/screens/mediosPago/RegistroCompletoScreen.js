import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function RegistroCompletoScreen() {
  const { user, completeOnboarding } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.contenido}>
        <View style={styles.circulo}>
          <Text style={styles.circuloTexto}>OK</Text>
        </View>

        <Text style={styles.titulo}>¡Bienvenido a{'\n'}SubastaPlus!</Text>
        <Text style={styles.subtitulo}>Tu cuenta está lista.{'\n'}Explorá las subastas.</Text>

        <Text style={styles.info}>
          Categoría: {capitalize(user?.categoria)} {'|'} 1 medio
        </Text>

        <TouchableOpacity style={styles.boton} onPress={completeOnboarding}>
          <Text style={styles.botonTexto}>Comenzar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  circulo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  circuloTexto: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  info: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  boton: {
    backgroundColor: colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 80,
    alignItems: 'center',
  },
  botonTexto: {
    ...typography.button,
    color: colors.surface,
  },
});
