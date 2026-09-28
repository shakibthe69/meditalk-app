import React from 'react';
import { Tabs } from 'expo-router';
import { palette, typography } from '../../src/theme';
import { Home, MessageCircle, Megaphone } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function DoctorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.teal600,
        tabBarInactiveTintColor: palette.slate400,
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.slate200,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Portal',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Updates',
          tabBarIcon: ({ color, size }) => <Megaphone size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
