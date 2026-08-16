import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Field, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { isSupabaseConfigured } from '@/lib/supabase';

// Two-step onboarding: sign in (mocked until Supabase auth is wired),
// then create or join a couple space. Swap `signIn` for
// supabase.auth.signInWithOtp when credentials exist.

type Step = 'auth' | 'couple';

export default function Auth() {
  const [step, setStep] = useState<Step>('auth');
  const [email, setEmail] = useState('');
  const [coupleName, setCoupleName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const signIn = useBridgeStore((s) => s.signIn);
  const createCouple = useBridgeStore((s) => s.createCouple);
  const joinCouple = useBridgeStore((s) => s.joinCouple);

  const handleContinue = () => {
    if (!email.includes('@')) {
      setError('Enter the email you want to sign in with.');
      return;
    }
    setError(null);
    signIn(email);
    setStep('couple');
  };

  const handleCreate = () => {
    createCouple(coupleName);
    router.replace('/(tabs)');
  };

  const handleJoin = () => {
    if (!joinCouple(inviteCode)) {
      setError('Enter the invite code your partner shared.');
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          <View style={styles.brand}>
            <Text style={styles.wordmark}>Bridge</Text>
            <Text style={typography.bodySoft}>Turn shared ideas into actual dates.</Text>
          </View>

          {step === 'auth' ? (
            <View>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                error={error ?? undefined}
              />
              <Button label="Continue" onPress={handleContinue} />
              {!isSupabaseConfigured && (
                <Text style={styles.devNote}>
                  Running on local demo data — sign-in is simulated until Supabase is configured.
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Text style={[typography.title, { marginBottom: spacing.lg }]}>
                Your shared space
              </Text>
              <Field
                label="Start a couple space"
                value={coupleName}
                onChangeText={setCoupleName}
                placeholder="Name it (optional) — e.g. J + S"
              />
              <Button label="Create our space" onPress={handleCreate} />

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={typography.small}>or join theirs</Text>
                <View style={styles.line} />
              </View>

              <Field
                label="Invite code"
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="BRIDGE-XXXX"
                autoCapitalize="characters"
                error={error ?? undefined}
              />
              <Button label="Join with code" onPress={handleJoin} variant="secondary" />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: 44,
    color: colors.ink,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  devNote: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.inkFaint,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
});
