import React from 'react';
import { Tabs } from 'expo-router';
import { palette, typography } from '../../src/theme';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { Home, Pill, Clock, User, BookOpen } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { t } = useSettingsStore();

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
          title: t.tabHome,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          title: t.tabMedicines,
          tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="guide"
        options={{
          title: t.tabGuide,
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabHistory,
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
