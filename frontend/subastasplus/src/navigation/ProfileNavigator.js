import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MediosPagoScreen from '../screens/mediosPago/MediosPagoScreen';
import CuentaNacionalScreen from '../screens/mediosPago/CuentaNacionalScreen';
import CuentaExteriorScreen from '../screens/mediosPago/CuentaExteriorScreen';
import TarjetaScreen from '../screens/mediosPago/TarjetaScreen';
import ChequeScreen from '../screens/mediosPago/ChequeScreen';
import DetalleMedioPagoScreen from '../screens/mediosPago/DetalleMedioPagoScreen';
import HistorialVentasScreen from '../screens/profile/HistorialVentasScreen';
import VentaDetalleScreen from '../screens/ventas/VentaDetalleScreen';
import MultasScreen from '../screens/profile/MultasScreen';
import MultaPagadaScreen from '../screens/profile/MultaPagadaScreen';
import HistorialComprasScreen from '../screens/profile/HistorialComprasScreen';
import CompraDetalleScreen from '../screens/profile/CompraDetalleScreen';
import MetricasScreen from '../screens/profile/MetricasScreen';
import HistorialParticipacionesScreen from '../screens/profile/HistorialParticipacionesScreen';
import DetalleParticipacionScreen from '../screens/profile/DetalleParticipacionScreen';
import HistorialPujasScreen from '../screens/profile/HistorialPujasScreen';
import FacturaCompraScreen from '../screens/compras/FacturaCompraScreen';
import EntregaCompraScreen from '../screens/compras/EntregaCompraScreen';
import ResultadoCompraScreen from '../screens/compras/ResultadoCompraScreen';

const Stack = createStackNavigator();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="MediosPago" component={MediosPagoScreen} />
      <Stack.Screen name="DetalleMedioPago" component={DetalleMedioPagoScreen} />
      <Stack.Screen name="cuenta-nacional" component={CuentaNacionalScreen} />
      <Stack.Screen name="cuenta-exterior" component={CuentaExteriorScreen} />
      <Stack.Screen name="tarjeta" component={TarjetaScreen} />
      <Stack.Screen name="cheque" component={ChequeScreen} />
      <Stack.Screen name="HistorialVentas" component={HistorialVentasScreen} />
      <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
      <Stack.Screen name="Multas" component={MultasScreen} />
      <Stack.Screen name="MultaPagada" component={MultaPagadaScreen} />
      <Stack.Screen name="HistorialCompras" component={HistorialComprasScreen} />
      <Stack.Screen name="CompraDetalle" component={CompraDetalleScreen} />
      <Stack.Screen name="FacturaCompra" component={FacturaCompraScreen} />
      <Stack.Screen name="EntregaCompra" component={EntregaCompraScreen} />
      <Stack.Screen name="ResultadoCompra" component={ResultadoCompraScreen} />
      <Stack.Screen name="Metricas" component={MetricasScreen} />
      <Stack.Screen name="HistorialParticipaciones" component={HistorialParticipacionesScreen} />
      <Stack.Screen name="DetalleParticipacion" component={DetalleParticipacionScreen} />
      <Stack.Screen name="HistorialPujas" component={HistorialPujasScreen} />
    </Stack.Navigator>
  );
}
