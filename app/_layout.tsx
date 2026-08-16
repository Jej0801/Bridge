import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';
import { useBridgeStore } from '@/store/useBridgeStore';

export default function RootLayout() {
  const hydrate = useBridgeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: 'Georgia', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="ideas/new" options={{ title: 'Save an idea', presentation: 'modal' }} />
        <Stack.Screen name="plans/new" options={{ title: 'Plan a date' }} />
        <Stack.Screen name="plans/[id]" options={{ title: 'Date plan' }} />
        <Stack.Screen name="memories/new" options={{ title: 'Log a memory', presentation: 'modal' }} />
        <Stack.Screen name="memories/[id]" options={{ title: 'Memory' }} />
      </Stack>
    </>
  );
}
