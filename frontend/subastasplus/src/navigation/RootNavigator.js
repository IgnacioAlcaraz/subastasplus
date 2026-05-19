import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';
import { colors } from '../constants';

export default function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'authenticated') return <AppNavigator />;
  if (status === 'pending') return <AppNavigator />;
  if (status === 'requires_clave') return <CreatePasswordScreen />;
  return <AuthNavigator />;
}
