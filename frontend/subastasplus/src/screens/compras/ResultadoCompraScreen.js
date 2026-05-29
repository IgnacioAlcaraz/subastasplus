import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

const CONTENT = {
  exitosa: {
    icono: 'OK',
    titulo: '¡Compra realizada!',
    subtitulo: null,
    boton: 'Salir',
    botonOscuro: false,
  },
  fondos_insuficientes: {
    icono: '!',
    titulo: 'No se pudo procesar\nel pago',
    subtitulo:
      'Se genera multa del 10% del valor ofertado, 72 hs para presentarlo. No podrás participar en otras subastas hasta regularizar.',
    boton: 'Volver al Menu',
    botonOscuro: true,
  },
};

export default function ResultadoCompraScreen({ navigation, route }) {
  const { tipo = 'exitosa' } = route.params ?? {};
  const c = CONTENT[tipo] ?? CONTENT.exitosa;

  function handleSalir() {
    navigation.getParent()?.navigate('Home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.contenido}>
        <View style={styles.circulo}>
          <Text style={styles.icono}>{c.icono}</Text>
        </View>

        <Text style={styles.titulo}>{c.titulo}</Text>

        {c.subtitulo ? (
          <Text style={styles.subtitulo}>{c.subtitulo}</Text>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.boton, c.botonOscuro && styles.botonOscuro]}
          onPress={handleSalir}
          activeOpacity={0.85}
        >
          <Text style={[styles.botonTexto, c.botonOscuro && styles.botonTextoOscuro]}>
            {c.boton}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  circulo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icono: { ...typography.h2, color: colors.textSecondary },
  titulo: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitulo: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonOscuro: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  botonTexto: { ...typography.button, color: colors.textSecondary },
  botonTextoOscuro: { color: colors.surface },
});
