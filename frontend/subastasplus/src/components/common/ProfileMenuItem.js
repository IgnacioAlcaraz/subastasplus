import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

export default function ProfileMenuItem({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
