import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen, SectionHeader } from '@/components/ui';
import { IdeaCard } from '@/components/IdeaCard';
import { CouplePolaroid } from '@/components/CouplePolaroid';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { responsive, screen, safePadding } from '@/theme/responsive';
import { useBridgeStore } from '@/store/useBridgeStore';
import { CATEGORY_LABELS } from '@/types/bridge';

function formatPlanDate(iso: string | null): string {
  if (!iso) return 'Unscheduled';
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function Home() {
  const couple = useBridgeStore((s) => s.couple);
  const ideas = useBridgeStore((s) => s.ideas);
  const plans = useBridgeStore((s) => s.plans);
  const stats = useBridgeStore((s) => s.stats)();

  const upcoming = plans
    .filter((p) => p.status === 'planned' && p.scheduled_at)
    .sort((a, b) => (a.scheduled_at! < b.scheduled_at! ? -1 : 1))[0];

  const recentIdeas = ideas
    .filter((i) => i.status === 'new' || i.status === 'shortlisted')
    .slice(0, 3);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.greeting}>{couple?.name ?? 'Us'}</Text>
          <Text style={typography.bodySoft}>What are we doing next?</Text>

          {/* Couple polaroid photo */}
          <CouplePolaroid
            imageUri={couple?.photo_url}
            coupleName={couple?.name ?? 'Us'}
            onAddPhoto={() => router.push('/settings')}
          />

          {/* Quick actions */}
          <View style={styles.actions}>
            <QuickAction
              icon="add-circle"
              label="Save idea"
              onPress={() => router.push('/ideas/new')}
            />
            <QuickAction
              icon="calendar"
              label="Plan date"
              onPress={() => router.push('/plans/new')}
            />
            <QuickAction
              icon="camera"
              label="Log memory"
              onPress={() => router.push('/memories/new')}
            />
          </View>

          <SectionHeader title="Next date" />
          {upcoming ? (
            <Pressable onPress={() => router.push(`/plans/${upcoming.id}`)}>
              <Card style={styles.upcomingCard}>
                <Text style={[typography.label, { color: colors.coral }]}>
                  {formatPlanDate(upcoming.scheduled_at)}
                </Text>
                <Text style={[typography.title, { marginTop: spacing.xs }]}>
                  {upcoming.title}
                </Text>
                <Text style={[typography.small, { marginTop: spacing.xs }]}>
                  {upcoming.location_name ?? 'Location TBD'} ·{' '}
                  {upcoming.idea_ids.length} stop{upcoming.idea_ids.length === 1 ? '' : 's'}
                </Text>
              </Card>
            </Pressable>
          ) : (
            <Card>
              <Text style={typography.bodySoft}>
                Nothing on the calendar. Shortlist a few ideas and plan the next one.
              </Text>
            </Card>
          )}

          <SectionHeader
            title="Recently saved"
            action={
              <Pressable onPress={() => router.push('/ideas')}>
                <Text style={styles.link}>See all</Text>
              </Pressable>
            }
          />
          {recentIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} compact onPress={() => router.push('/ideas')} />
          ))}

          <SectionHeader title="Our numbers" />
          <View style={styles.statsRow}>
            <Stat value={String(stats.dates_logged)} label="dates logged" />
            <Stat value={String(stats.ideas_saved)} label="ideas saved" />
            <Stat
              value={stats.favorite_category ? CATEGORY_LABELS[stats.favorite_category] : '—'}
              label="favorite kind"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={22} color={colors.coral} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={typography.small}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: safePadding.horizontal,
    paddingBottom: 48,
  },
  greeting: {
    fontFamily: 'Georgia',
    fontSize: responsive({
      smallPhone: 28,
      phone: 32,
      tablet: 36,
      default: 32,
    }),
    color: colors.ink,
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: screen.isSmallPhone ? 'column' : 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  action: {
    flex: 1,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    minWidth: screen.isSmallPhone ? '100%' : undefined,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  upcomingCard: {
    borderColor: colors.coral,
    borderWidth: 1.5,
  },
  link: {
    ...typography.small,
    color: colors.blue,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: screen.isSmallPhone ? spacing.sm : spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.bgSunken,
    borderRadius: radius.md,
    padding: screen.isSmallPhone ? spacing.sm : spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Georgia',
    fontSize: responsive({
      smallPhone: 18,
      phone: 22,
      tablet: 24,
      default: 22,
    }),
    color: colors.ink,
    marginBottom: 2,
  },
});
