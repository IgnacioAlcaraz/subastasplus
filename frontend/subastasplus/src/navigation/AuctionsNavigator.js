import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AuctionsScreen from "../screens/auctions/AuctionsScreen";
import AuctionDetailScreen from "../screens/auctions/AuctionDetailScreen";
import CatalogScreen from "../screens/auctions/CatalogScreen";
import PieceDetailScreen from "../screens/auctions/PieceDetailScreen";
import PreIngresoScreen from "../screens/auctions/PreIngresoScreen";
import PreIngresoMedioPagoScreen from "../screens/auctions/PreIngresoMedioPagoScreen";
import SalaScreen from "../screens/auctions/SalaScreen";
import FacturaCompraScreen from "../screens/compras/FacturaCompraScreen";
import EntregaCompraScreen from "../screens/compras/EntregaCompraScreen";
import ResultadoCompraScreen from "../screens/compras/ResultadoCompraScreen";

const Stack = createStackNavigator();

export default function AuctionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuctionsList" component={AuctionsScreen} />
      <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="PieceDetail" component={PieceDetailScreen} />
      <Stack.Screen name="PreIngreso" component={PreIngresoScreen} />
      <Stack.Screen name="PreIngresoMedioPago" component={PreIngresoMedioPagoScreen} />
      <Stack.Screen name="Sala" component={SalaScreen} />
      <Stack.Screen name="FacturaCompra" component={FacturaCompraScreen} />
      <Stack.Screen name="EntregaCompra" component={EntregaCompraScreen} />
      <Stack.Screen name="ResultadoCompra" component={ResultadoCompraScreen} />
    </Stack.Navigator>
  );
}
