import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { colors, typography } from '../../constants';

export default function PickerField({ label, value, onSelect, opciones, error }) {
  const [visible, setVisible] = useState(false);

  const labelMostrado = typeof opciones[0] === 'string'
    ? value
    : opciones.find((o) => o.value === value)?.label;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={[styles.field, error && styles.fieldError]} onPress={() => setVisible(true)}>
        <Text style={labelMostrado ? styles.valor : styles.placeholder}>
          {labelMostrado || `Seleccionar ${label.toLowerCase()}`}
        </Text>
        <Text style={styles.chevron}>v</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal transparent animationType="slide" visible={visible} onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.card}>
            <FlatList
              data={opciones}
              keyExtractor={(item) => typeof item === 'string' ? item : item.value}
              renderItem={({ item }) => {
                const texto = typeof item === 'string' ? item : item.label;
                const val = typeof item === 'string' ? item : item.value;
                return (
                  <TouchableOpacity
                    style={styles.opcion}
                    onPress={() => { onSelect(val); setVisible(false); }}
                  >
                    <Text style={styles.opcionTexto}>{texto}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  fieldError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: 4,
  },
  valor: {
    ...typography.body,
    color: colors.textPrimary,
  },
  placeholder: {
    ...typography.body,
    color: colors.textDisabled,
  },
  chevron: {
    ...typography.body,
    color: colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 320,
    paddingVertical: 8,
  },
  opcion: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  opcionTexto: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
