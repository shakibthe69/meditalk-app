import React from 'react';
import { Tabs } from 'expo-router';
import { palette, typography } from '../../src/theme';
import { LayoutDashboard, Users, UserX, TrendingUp, ClipboardList, ShieldCheck } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function AdminTabsLayout() {
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inactive"
        options={{
          title: 'Inactive',
          tabBarIcon: ({ color, size }) => <UserX size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="adherence"
        options={{
          title: 'Adherence',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="followups"
        options={{
          title: 'Follow-ups',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <ShieldCheck size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
