import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VentasScreen from '../screens/ventas/VentasScreen';
import NuevaSolicitudStep1Screen from '../screens/ventas/NuevaSolicitudStep1Screen';
import NuevaSolicitudStep2Screen from '../screens/ventas/NuevaSolicitudStep2Screen';
import ConfirmacionSolicitudScreen from '../screens/ventas/ConfirmacionSolicitudScreen';
import VentaDetalleScreen from '../screens/ventas/VentaDetalleScreen';

const Stack = createStackNavigator();

export default function VentasNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VentasList" component={VentasScreen} />
      <Stack.Screen name="NuevaSolicitudStep1" component={NuevaSolicitudStep1Screen} />
      <Stack.Screen name="NuevaSolicitudStep2" component={NuevaSolicitudStep2Screen} />
      <Stack.Screen name="ConfirmacionSolicitud" component={ConfirmacionSolicitudScreen} />
      <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
    </Stack.Navigator>
  );
}
