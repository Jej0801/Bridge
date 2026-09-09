import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { safePadding } from '@/theme/responsive';
import { useBridgeStore } from '@/store/useBridgeStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { testSupabaseConnection } from '@/lib/testConnection';

export default function Settings() {
  const couple = useBridgeStore((s) => s.couple);
  const profiles = useBridgeStore((s) => s.profiles);
  const currentUserId = useBridgeStore((s) => s.currentUserId);
  const signOut = useBridgeStore((s) => s.signOut);

  const me = profiles.find((p) => p.id === currentUserId);
  const partner = profiles.find((p) => p.id !== currentUserId);

  const [testingConnection, setTestingConnection] = useState(false);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testSupabaseConnection();
      Alert.alert(
        result.success ? '✓ Connection Active' : '✗ Connection Failed',
        result.message,
      );
    } catch (error: any) {
      Alert.alert('Test Error', error.message);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ],
    );
  };

  const showInviteCode = () => {
    Alert.alert(
      'Invite Code',
      `Share this code with your partner:\n\n${couple?.invite_code ?? 'BRIDGE-XXXX'}`,
      [{ text: 'Done' }],
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsRow
            label={me?.display_name ?? 'Your profile'}
            value="Edit"
            onPress={() => router.push('/profile/edit')}
          />
          <SettingsRow
            label="Couple space"
            value={couple?.name ?? 'Us'}
            onPress={() => router.push('/couple/edit')}
          />
          <SettingsRow
            label="Invite partner"
            value={couple?.invite_code ?? ''}
            onPress={showInviteCode}
            last
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsRow
            label="Notifications"
            value="Off"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings coming soon.')}
          />
          <SettingsRow
            label="Theme"
            value="System"
            onPress={() => Alert.alert('Coming Soon', 'Theme selection coming soon.')}
            last
          />
        </SettingsSection>

        {/* Connected Services */}
        <SettingsSection title="Connected Services">
          <SettingsRow
            label="TikTok"
            value="Via share/paste"
            disabled
          />
          <SettingsRow
            label="Instagram"
            value="Via share/paste"
            disabled
          />
          <SettingsRow
            label="Google Maps"
            value="Via share/paste"
            disabled
          />
          <SettingsRow
            label="Spotify / Apple Music"
            value="Not connected"
            onPress={() => Alert.alert('Coming Soon', 'Music integration coming soon.')}
            last
          />
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection title="Data & Privacy">
          <SettingsRow
            label="Storage"
            value={isSupabaseConfigured ? 'Cloud' : 'Local'}
            onPress={isSupabaseConfigured ? testConnection : undefined}
            disabled={!isSupabaseConfigured}
          />
          <SettingsRow
            label="Export data"
            onPress={() => Alert.alert('Coming Soon', 'Data export coming soon.')}
          />
          <SettingsRow
            label="Privacy policy"
            onPress={() => Alert.alert('Privacy', 'Your data is private to you and your partner only.')}
            last
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsRow
            label="Version"
            value="0.1.0"
            disabled
          />
          <SettingsRow
            label="Help & Support"
            onPress={() => Alert.alert('Support', 'For help, contact support@bridge.app')}
            last
          />
        </SettingsSection>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {couple?.name ?? 'Bridge'} · {partner ? `You and ${partner.display_name}` : 'Waiting for partner'}
          </Text>
          {isSupabaseConfigured && (
            <Text style={[styles.footerText, { marginTop: spacing.xs }]}>
              ✓ Synced to cloud
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  last?: boolean;
}

function SettingsRow({ label, value, onPress, disabled, last }: SettingsRowProps) {
  const content = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={[styles.rowLabel, disabled && styles.rowDisabled]}>{label}</Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, disabled && styles.rowDisabled]}>
            {value}
          </Text>
        )}
        {onPress && !disabled && (
          <Text style={styles.rowChevron}>›</Text>
        )}
      </View>
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.rowPressable,
          pressed && styles.rowPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    paddingHorizontal: safePadding.horizontal,
  },
  sectionContent: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  rowPressable: {
    width: '100%',
  },
  rowPressed: {
    backgroundColor: colors.bgSunken,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: safePadding.horizontal,
    minHeight: 44,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.ink,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowValue: {
    fontSize: 16,
    color: colors.inkSoft,
  },
  rowChevron: {
    fontSize: 24,
    color: colors.inkFaint,
    marginLeft: spacing.xs,
  },
  rowDisabled: {
    color: colors.inkFaint,
  },
  signOutContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: safePadding.horizontal,
  },
  signOutButton: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  footer: {
    marginTop: spacing.xl,
    paddingHorizontal: safePadding.horizontal,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.inkFaint,
    textAlign: 'center',
  },
});
