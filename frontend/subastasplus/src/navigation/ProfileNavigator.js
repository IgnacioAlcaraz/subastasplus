import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MediosPagoScreen from '../screens/mediosPago/MediosPagoScreen';
import CuentaNacionalScreen from '../screens/mediosPago/CuentaNacionalScreen';
import CuentaExteriorScreen from '../screens/mediosPago/CuentaExteriorScreen';
import TarjetaScreen from '../screens/mediosPago/TarjetaScreen';
import ChequeScreen from '../screens/mediosPago/ChequeScreen';
import HistorialVentasScreen from '../screens/profile/HistorialVentasScreen';
import VentaDetalleScreen from '../screens/ventas/VentaDetalleScreen';

const Stack = createStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="MediosPago" component={MediosPagoScreen} />
      <Stack.Screen name="cuenta-nacional" component={CuentaNacionalScreen} />
      <Stack.Screen name="cuenta-exterior" component={CuentaExteriorScreen} />
      <Stack.Screen name="tarjeta" component={TarjetaScreen} />
      <Stack.Screen name="cheque" component={ChequeScreen} />
      <Stack.Screen name="HistorialVentas" component={HistorialVentasScreen} />
      <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
    </Stack.Navigator>
  );
}
