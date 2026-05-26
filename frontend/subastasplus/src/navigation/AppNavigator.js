import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen';
import AuctionsNavigator from './AuctionsNavigator';
import VentasNavigator from './VentasNavigator';
import ProfileNavigator from './ProfileNavigator';
import GuestModal from '../components/common/GuestModal';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const { status } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  function guestListener() {
    return {
      tabPress: (e) => {
        if (status === 'pending') {
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
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Tab.Screen
          name="Auctions"
          component={AuctionsNavigator}
          options={{ title: 'Subastas' }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Auctions', { screen: 'AuctionsList' });
            },
          })}
        />
        <Tab.Screen name="Ventas" component={VentasNavigator} options={{ title: 'Vender' }} listeners={guestListener()} />
        <Tab.Screen name="Profile" component={ProfileNavigator} options={{ title: 'Perfil' }} listeners={guestListener()} />
      </Tab.Navigator>
      <GuestModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}
