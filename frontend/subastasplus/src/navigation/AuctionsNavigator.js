import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import AuctionsScreen from "../screens/auctions/AuctionsScreen";
import AuctionDetailScreen from "../screens/auctions/AuctionDetailScreen";
import CatalogScreen from "../screens/auctions/CatalogScreen";
import PieceDetailScreen from "../screens/auctions/PieceDetailScreen";

const Stack = createStackNavigator();

export default function AuctionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuctionsList" component={AuctionsScreen} />
      <Stack.Screen name="AuctionDetail" component={AuctionDetailScreen} />
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen name="PieceDetail" component={PieceDetailScreen} />
    </Stack.Navigator>
  );
}
