import React from 'react';
import { View, Text } from 'react-native';
import { colors, typography } from '../../constants';

export default function RegisterStep2Screen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ ...typography.h2, color: colors.textPrimary }}>Paso 2</Text>
    </View>
  );
}
