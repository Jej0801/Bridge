import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, ChoiceRow, Field, Screen, SectionHeader } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { generateItinerary } from '@/lib/datePlanner';
import { CostLevel, Itinerary, Vibe, VIBE_LABELS } from '@/types/bridge';

const VIBE_OPTIONS: Vibe[] = [
  'cozy',
  'romantic',
  'adventurous',
  'casual',
  'fancy',
  'spontaneous',
];
const COST_OPTIONS: CostLevel[] = ['free', '$', '$$', '$$$'];

export default function NewPlan() {
  const ideas = useBridgeStore((s) => s.ideas);
  const addPlan = useBridgeStore((s) => s.addPlan);

  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [vibe, setVibe] = useState<Vibe>('casual');
  const [cost, setCost] = useState<CostLevel>('$$');
  const [selected, setSelected] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Shortlisted first — that's the whole point of shortlisting.
  const pickable = useMemo(() => {
    const active = ideas.filter((i) => i.status !== 'archived' && i.status !== 'done');
    return [
      ...active.filter((i) => i.status === 'shortlisted'),
      ...active.filter((i) => i.status !== 'shortlisted'),
    ];
  }, [ideas]);

  const toggle = (id: string) => {
    setItinerary(null);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    const chosen = ideas.filter((i) => selected.includes(i.id));
    if (chosen.length === 0) {
      setError('Pick at least one idea to build from.');
      return;
    }
    setError(null);
    // Mock generation today; swap in the AI planner behind the same call.
    setItinerary(generateItinerary({ ideas: chosen, vibe }));
  };

  const handleSave = async (status: 'draft' | 'planned') => {
    if (selected.length === 0) {
      setError('Pick at least one idea to build from.');
      return;
    }
    const chosen = ideas.filter((i) => selected.includes(i.id));
    const plan = await addPlan({
      title: title.trim() || 'Untitled date',
      scheduled_at: parseWhen(when),
      location_name: location.trim() || null,
      vibe,
      estimated_cost: cost,
      notes: notes.trim() || null,
      itinerary_json: itinerary ?? generateItinerary({ ideas: chosen, vibe }),
      status,
      idea_ids: selected,
    });
    router.replace(`/plans/${plan.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Date title"
          value={title}
          onChangeText={setTitle}
          placeholder="Friday night, no phones"
        />
        <Field
          label="When"
          value={when}
          onChangeText={setWhen}
          placeholder="2026-08-21 19:00"
        />
        <Field
          label="Neighborhood"
          value={location}
          onChangeText={setLocation}
          placeholder="Echo Park"
        />
        <ChoiceRow
          label="Vibe"
          options={VIBE_OPTIONS}
          value={vibe}
          onChange={(v) => {
            setVibe(v);
            setItinerary(null);
          }}
          format={(v) => VIBE_LABELS[v]}
        />
        <ChoiceRow
          label="Estimated cost"
          options={COST_OPTIONS}
          value={cost}
          onChange={setCost}
          format={(c) => (c === 'free' ? 'Free' : c)}
        />
        <Field
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything to remember"
          multiline
        />

        <SectionHeader title="Build from these ideas" />
        {pickable.map((idea) => {
          const isSelected = selected.includes(idea.id);
          return (
            <Pressable
              key={idea.id}
              onPress={() => toggle(idea.id)}
              style={[styles.pickRow, isSelected && styles.pickRowSelected]}
            >
              <View style={{ flex: 1 }}>
                <Text style={typography.body} numberOfLines={1}>
                  {idea.title}
                </Text>
                <Text style={typography.small}>
                  {idea.location_name ?? '—'} ·{' '}
                  {idea.cost_level === 'free' ? 'Free' : idea.cost_level}
                  {idea.status === 'shortlisted' ? ' · Shortlisted' : ''}
                </Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxOn]} />
            </Pressable>
          );
        })}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: spacing.lg }} />
        <Button label="Generate plan" onPress={handleGenerate} variant="secondary" />

        {itinerary && (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={typography.label}>Suggested run of the night</Text>
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
              About {Math.round(itinerary.total_minutes / 30) / 2} hours ·{' '}
              {itinerary.budget_estimate}
            </Text>
            {itinerary.backup && (
              <Text style={[typography.small, { marginTop: spacing.xs, color: colors.sage }]}>
                Backup: {itinerary.backup.title} — {itinerary.backup.reason}
              </Text>
            )}
          </Card>
        )}

        <View style={{ height: spacing.xl }} />
        <Button label="Save as planned" onPress={() => handleSave('planned')} />
        <View style={{ height: spacing.sm }} />
        <Button label="Keep as draft" onPress={() => handleSave('draft')} variant="ghost" />
      </ScrollView>
    </Screen>
  );
}

// Accepts "YYYY-MM-DD HH:mm" or anything Date can parse; null otherwise.
function parseWhen(input: string): string | null {
  if (!input.trim()) return null;
  const parsed = new Date(input.replace(' ', 'T'));
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 64,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  pickRowSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coralSoft,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  checkboxOn: {
    borderColor: colors.coral,
    backgroundColor: colors.coral,
  },
  stop: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stopTime: {
    ...typography.small,
    color: colors.coral,
    fontWeight: '600',
    width: 64,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
