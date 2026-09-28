import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { palette } from '../src/theme';
import { RealtimeCallHost } from '../src/components';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {/* Owns the realtime socket and renders call overlays app-wide */}
      <RealtimeCallHost />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.slate50 },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin-patient/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="admin-audit" options={{ headerShown: false }} />
        <Stack.Screen name="admin-messages" options={{ headerShown: false }} />
        <Stack.Screen name="doctors" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
