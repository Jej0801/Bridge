import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Screen, SectionHeader } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Settings() {
  const couple = useBridgeStore((s) => s.couple);
  const profiles = useBridgeStore((s) => s.profiles);
  const currentUserId = useBridgeStore((s) => s.currentUserId);
  const signOut = useBridgeStore((s) => s.signOut);

  const me = profiles.find((p) => p.id === currentUserId);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Profile" />
        <Card>
          <Text style={typography.title}>{me?.display_name ?? 'You'}</Text>
          <Text style={typography.small}>Display name and photo editing coming soon.</Text>
        </Card>

        <SectionHeader title="Couple space" />
        <Card>
          <Text style={typography.title}>{couple?.name ?? 'Us'}</Text>
          <Text style={[typography.small, { marginTop: spacing.xs }]}>
            Share this code so your partner can join:
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{couple?.invite_code ?? 'BRIDGE-XXXX'}</Text>
          </View>
        </Card>

        <SectionHeader title="Notifications" />
        <Card>
          <Text style={typography.bodySoft}>
            Reminders for planned dates and gentle "plan something" nudges — coming soon.
          </Text>
        </Card>

        <SectionHeader title="Connected services" />
        <Card>
          <ServiceRow name="TikTok share links" status="Works via share/paste" />
          <ServiceRow name="Instagram share links" status="Works via share/paste" />
          <ServiceRow name="Google Maps links" status="Works via share/paste" />
          <ServiceRow name="Spotify / Apple Music" status="Later" last />
        </Card>

        <SectionHeader title="Data & privacy" />
        <Card>
          <Text style={typography.bodySoft}>
            Bridge is designed as a private space for couples. Your ideas, plans, and
            memories are only visible to the two of you.
          </Text>
          <Text style={[typography.small, { marginTop: spacing.sm, color: colors.inkFaint }]}>
            Backend: {isSupabaseConfigured ? 'Supabase connected' : 'local demo data'}
          </Text>
        </Card>

        <View style={{ height: spacing.xl }} />
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => {
            signOut();
            router.replace('/auth');
          }}
        />
      </ScrollView>
    </Screen>
  );
}

function ServiceRow({ name, status, last }: { name: string; status: string; last?: boolean }) {
  return (
    <View style={[styles.serviceRow, !last && styles.serviceBorder]}>
      <Text style={typography.body}>{name}</Text>
      <Text style={typography.small}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  codeBox: {
    backgroundColor: colors.bgSunken,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  code: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
    color: colors.ink,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  serviceBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
