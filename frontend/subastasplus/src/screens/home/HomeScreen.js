import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: colors.textPrimary },
});
