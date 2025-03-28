// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/HapticTab';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '@/constants/theme';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          height: 72,
          paddingBottom: 30,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500' as const,
        },
      }}>
      <Tabs.Screen
        name="buy"
        options={{
          title: 'Buy',
          tabBarIcon: ({ color }) => <Icon size={24} name="shopping" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color }) => <Icon size={24} name="currency-usd" color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Icon size={24} name="account" color={color} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
