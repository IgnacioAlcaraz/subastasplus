import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

export default function GuestModal({ visible, onClose }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.titulo}>Cuenta en revisión</Text>
          <Text style={styles.descripcion}>
            Tu solicitud de registro está siendo procesada. Podrás acceder a esta función una vez que tu cuenta sea aprobada.
          </Text>
          <TouchableOpacity style={styles.boton} onPress={onClose}>
            <Text style={styles.botonTexto}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  titulo: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  descripcion: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  botonTexto: {
    ...typography.button,
    color: colors.surface,
  },
});
