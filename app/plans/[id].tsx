import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { IdeaCard } from '@/components/IdeaCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { VIBE_LABELS } from '@/types/bridge';

export default function PlanDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plan = useBridgeStore((s) => s.plans.find((p) => p.id === id));
  const ideas = useBridgeStore((s) => s.ideas);
  const updatePlan = useBridgeStore((s) => s.updatePlan);

  if (!plan) {
    return (
      <Screen>
        <EmptyState title="Plan not found" body="It may have been removed." />
      </Screen>
    );
  }

  const planIdeas = ideas.filter((i) => plan.idea_ids.includes(i.id));
  const itinerary = plan.itinerary_json;

  const markCompleted = async () => {
    await updatePlan(plan.id, { status: 'completed' });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.display}>{plan.title}</Text>
        <Text style={[typography.bodySoft, { marginTop: spacing.xs }]}>
          {plan.scheduled_at
            ? new Date(plan.scheduled_at).toLocaleString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'Not scheduled yet'}
          {plan.location_name ? ` · ${plan.location_name}` : ''}
        </Text>
        <Text style={[typography.small, { marginTop: spacing.xs }]}>
          {VIBE_LABELS[plan.vibe]} ·{' '}
          {plan.estimated_cost === 'free' ? 'Free' : plan.estimated_cost} · {plan.status}
        </Text>

        {itinerary && itinerary.stops.length > 0 && (
          <>
            <SectionHeader title="Itinerary" />
            <Card>
              {itinerary.stops.map((stop) => (
                <View key={stop.order} style={styles.stop}>
                  <Text style={styles.stopTime}>{stop.start_time}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={typography.body}>{stop.title}</Text>
                    <Text style={typography.small}>
                      ~{stop.duration_minutes} min · {stop.note}
                    </Text>
                  </View>
                </View>
              ))}
              <Text style={[typography.small, { marginTop: spacing.md }]}>
                {itinerary.budget_estimate}
              </Text>
              {itinerary.backup && (
                <Text
                  style={[typography.small, { marginTop: spacing.xs, color: colors.sage }]}
                >
                  Backup: {itinerary.backup.title}
                </Text>
              )}
            </Card>
          </>
        )}

        <SectionHeader title="Built from" />
        {planIdeas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} compact />
        ))}

        {plan.notes ? (
          <>
            <SectionHeader title="Notes" />
            <Card>
              <Text style={typography.body}>{plan.notes}</Text>
            </Card>
          </>
        ) : null}

        <View style={{ height: spacing.xl }} />
        {plan.status !== 'completed' ? (
          <Button label="Mark completed" onPress={markCompleted} />
        ) : (
          <Button
            label="Log this as a memory"
            onPress={() =>
              router.push({ pathname: '/memories/new', params: { planId: plan.id } })
            }
          />
        )}
        <View style={{ height: spacing.sm }} />
        {plan.status === 'completed' ? (
          <Text style={[typography.small, { textAlign: 'center' }]}>
            Completed — nice. Log it while it’s fresh.
          </Text>
        ) : (
          <Button
            label="Log memory"
            variant="secondary"
            onPress={() =>
              router.push({ pathname: '/memories/new', params: { planId: plan.id } })
            }
          />
        )}
        <View style={{ height: spacing.sm }} />
        {plan.status !== 'canceled' && plan.status !== 'completed' && (
          <Button
            label="Cancel this plan"
            variant="ghost"
            onPress={() => updatePlan(plan.id, { status: 'canceled' })}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 64,
  },
  stop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  stopTime: {
    ...typography.small,
    color: colors.coral,
    fontWeight: '600',
    width: 64,
  },
});
