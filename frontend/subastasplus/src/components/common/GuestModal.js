import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

// dos variantes del modal: guest = invitado anónimo, pending = registro enviado esperando aprobación
const CONTENT = {
  guest: {
    titulo: 'Acción no disponible',
    descripcion: 'Esta acción está disponible solo para usuarios registrados. Ingresa para continuar.',
  },
  pending: {
    titulo: 'Cuenta en revisión',
    descripcion: 'Tu solicitud de registro está siendo procesada. Podrás acceder a esta función una vez que tu cuenta sea aprobada.',
  },
};

export default function GuestModal({ visible, onClose, variant = 'pending', onLogin, onRegister }) {
  // si llega una variante desconocida caemos a pending como default más conservador
  const { titulo, descripcion } = CONTENT[variant] ?? CONTENT.pending;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.descripcion}>{descripcion}</Text>
          {variant === 'guest' ? (
            <View style={styles.botonesRow}>
              <TouchableOpacity style={[styles.botonOutline, styles.botonFlex]} onPress={onLogin}>
                <Text style={styles.botonOutlineTexto}>Iniciar Sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botonPrimario, styles.botonFlex]} onPress={onRegister}>
                <Text style={styles.botonPrimarioTexto}>Registrarse</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.botonPrimario} onPress={onClose}>
              <Text style={styles.botonPrimarioTexto}>Entendido</Text>
            </TouchableOpacity>
          )}
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
  botonesRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  botonFlex: {
    flex: 1,
  },
  botonPrimario: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  botonPrimarioTexto: {
    ...typography.button,
    color: colors.surface,
  },
  botonOutline: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  botonOutlineTexto: {
    ...typography.button,
    color: colors.primary,
  },
});
