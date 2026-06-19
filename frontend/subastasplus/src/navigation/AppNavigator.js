import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeNavigator from './HomeNavigator';
import AuctionsNavigator from './AuctionsNavigator';
import VentasNavigator from './VentasNavigator';
import ProfileNavigator from './ProfileNavigator';
import GuestModal from '../components/common/GuestModal';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { status, isGuest, exitGuest } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  // intercepta el tap del tab y muestra el modal en vez de navegar si es invitado
  function guestListener() {
    return {
      tabPress: (e) => {
        if (isGuest) {
          e.preventDefault();
          setModalVisible(true);
        }
      },
    };
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            title: 'Inicio',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Auctions"
          component={AuctionsNavigator}
          options={{
            title: 'Subastas',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={size} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Auctions', { screen: 'AuctionsList' });
            },
          })}
        />
        <Tab.Screen
          name="Ventas"
          component={VentasNavigator}
          options={{
            title: 'Vender',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={size} color={color} />
            ),
          }}
          listeners={guestListener()}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            title: 'Perfil',
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
          }}
          listeners={guestListener()}
        />
      </Tab.Navigator>
      <GuestModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        variant={status}
        onLogin={() => { setModalVisible(false); exitGuest('Login'); }}
        onRegister={() => { setModalVisible(false); exitGuest('Register'); }}
      />
    </>
  );
}
