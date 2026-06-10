import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "../screens/home/HomeScreen";
import NotificacionesScreen from "../screens/notificaciones/NotificacionesScreen";
import ChatNotificacionScreen from "../screens/notificaciones/ChatNotificacionScreen";

const Stack = createStackNavigator();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
      <Stack.Screen name="ChatNotificacion" component={ChatNotificacionScreen} />
    </Stack.Navigator>
  );
}
