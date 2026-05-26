import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import VentasScreen from '../screens/ventas/VentasScreen';
import NuevaSolicitudStep1Screen from '../screens/ventas/NuevaSolicitudStep1Screen';
import NuevaSolicitudStep2Screen from '../screens/ventas/NuevaSolicitudStep2Screen';
import ConfirmacionSolicitudScreen from '../screens/ventas/ConfirmacionSolicitudScreen';
import VentaDetalleScreen from '../screens/ventas/VentaDetalleScreen';
import AceptarCondicionesScreen from '../screens/ventas/AceptarCondicionesScreen';
import PolizaSeguroScreen from '../screens/ventas/PolizaSeguroScreen';
import ContactarAseguradoraScreen from '../screens/ventas/ContactarAseguradoraScreen';

const Stack = createStackNavigator();

export default function VentasNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VentasList" component={VentasScreen} />
      <Stack.Screen name="NuevaSolicitudStep1" component={NuevaSolicitudStep1Screen} />
      <Stack.Screen name="NuevaSolicitudStep2" component={NuevaSolicitudStep2Screen} />
      <Stack.Screen name="ConfirmacionSolicitud" component={ConfirmacionSolicitudScreen} />
      <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
      <Stack.Screen name="AceptarCondiciones" component={AceptarCondicionesScreen} />
      <Stack.Screen name="PolizaSeguro" component={PolizaSeguroScreen} />
      <Stack.Screen name="ContactarAseguradora" component={ContactarAseguradoraScreen} />
    </Stack.Navigator>
  );
}
