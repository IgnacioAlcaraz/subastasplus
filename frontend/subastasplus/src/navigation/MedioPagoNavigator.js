import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RegistrarMedioPagoScreen from '../screens/mediosPago/RegistrarMedioPagoScreen';
import CuentaNacionalScreen from '../screens/mediosPago/CuentaNacionalScreen';
import CuentaExteriorScreen from '../screens/mediosPago/CuentaExteriorScreen';
import TarjetaScreen from '../screens/mediosPago/TarjetaScreen';
import ChequeScreen from '../screens/mediosPago/ChequeScreen';
import RegistroCompletoScreen from '../screens/mediosPago/RegistroCompletoScreen';

const Stack = createStackNavigator();

// este navigator se usa solo durante el onboarding obligatorio de medios de pago
// después del onboarding el acceso es desde el perfil (ProfileNavigator)
export default function MedioPagoNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RegistrarMedioPago" component={RegistrarMedioPagoScreen} />
      <Stack.Screen name="cuenta-nacional" component={CuentaNacionalScreen} />
      <Stack.Screen name="cuenta-exterior" component={CuentaExteriorScreen} />
      <Stack.Screen name="tarjeta" component={TarjetaScreen} />
      <Stack.Screen name="cheque" component={ChequeScreen} />
      <Stack.Screen name="RegistroCompleto" component={RegistroCompletoScreen} />
    </Stack.Navigator>
  );
}
