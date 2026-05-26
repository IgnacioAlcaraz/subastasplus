import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants';

const OPCIONES = [
  { id: 'cuenta-nacional', titulo: 'Cuenta bancaria', subtitulo: 'Nacional' },
  { id: 'cuenta-exterior', titulo: 'Cuenta Bancaria', subtitulo: 'Extranjera' },
  { id: 'cheque', titulo: 'Cheque Certificado', subtitulo: 'Monto fijo verificado' },
  { id: 'tarjeta', titulo: 'Tarjeta de Crédito', subtitulo: 'Nacional o extranjera' },
];

export default function RegistrarMedioPagoScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>Medio de pago</Text>
        <Text style={styles.subtitulo}>Registrá al menos uno para pujar</Text>

        <View style={styles.lista}>
          {OPCIONES.map((opcion) => (
            <TouchableOpacity
              key={opcion.id}
              style={styles.card}
              onPress={() => navigation?.navigate(opcion.id)}
            >
              <View style={styles.cardTexto}>
                <Text style={styles.cardTitulo}>{opcion.titulo}</Text>
                <Text style={styles.cardSubtitulo}>{opcion.subtitulo}</Text>
              </View>
              <Text style={styles.flecha}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.nota}>El medio será verificado por la empresa</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 24,
    paddingTop: 40,
  },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    alignSelf: 'flex-start',
    paddingBottom: 4,
    marginBottom: 8,
  },
  subtitulo: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 32,
  },
  lista: {
    gap: 12,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTexto: {
    flex: 1,
  },
  cardTitulo: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitulo: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  flecha: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  nota: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
