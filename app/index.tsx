import React from 'react';
import { Redirect } from 'expo-router';
import { useBridgeStore } from '@/store/useBridgeStore';

// Entry gate: unauthenticated users see onboarding; everyone else lands
// straight on the dashboard (no marketing page in between).
export default function Index() {
  const signedIn = useBridgeStore((s) => s.signedIn);
  const couple = useBridgeStore((s) => s.couple);

  if (!signedIn || !couple) {
    return <Redirect href="/auth" />;
  }
  return <Redirect href="/(tabs)" />;
}
