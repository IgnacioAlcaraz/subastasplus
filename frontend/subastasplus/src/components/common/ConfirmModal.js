import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';
import Button from './Button';

export default function ConfirmModal({
  visible,
  onConfirm,
  onCancel,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.titulo}>{title}</Text>
          <Text style={styles.mensaje}>{message}</Text>
          <View style={styles.botones}>
            <View style={styles.boton}>
              <Button title={confirmText} onPress={onConfirm} />
            </View>
            <View style={styles.boton}>
              <Button title={cancelText} variant="outline" onPress={onCancel} />
            </View>
          </View>
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
  },
  titulo: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  mensaje: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  botones: {
    flexDirection: 'row',
    gap: 12,
  },
  boton: {
    flex: 1,
  },
});
