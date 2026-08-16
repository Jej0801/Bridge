import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, ChoiceRow, Field, RatingRow, Screen, SectionHeader } from '@/components/ui';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { AestheticTheme, THEME_LABELS } from '@/types/bridge';

const THEME_OPTIONS: AestheticTheme[] = ['warm', 'film', 'night', 'minimal', 'colorful'];

export default function NewMemory() {
  // When opened from a completed plan, pre-fill from it.
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const plan = useBridgeStore((s) => s.plans.find((p) => p.id === planId));
  const ideas = useBridgeStore((s) => s.ideas);
  const addMemory = useBridgeStore((s) => s.addMemory);

  const [title, setTitle] = useState(plan?.title ?? '');
  const [when, setWhen] = useState(
    plan?.scheduled_at ? plan.scheduled_at.slice(0, 10) : ''
  );
  const [location, setLocation] = useState(plan?.location_name ?? '');
  const [notes, setNotes] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [theme, setTheme] = useState<AestheticTheme>('warm');
  const [food, setFood] = useState<number | null>(null);
  const [vibe, setVibe] = useState<number | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const [again, setAgain] = useState(true);
  const [linkedIds, setLinkedIds] = useState<string[]>(plan?.idea_ids ?? []);
  const [error, setError] = useState<string | null>(null);

  const linkable = ideas.filter((i) => i.status !== 'archived');

  const toggleLink = (id: string) =>
    setLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Give this memory a title.');
      return;
    }
    const occurred = when ? new Date(when.replace(' ', 'T')) : new Date();
    await addMemory({
      date_plan_id: plan?.id ?? null,
      title: title.trim(),
      occurred_at: isNaN(occurred.getTime())
        ? new Date().toISOString()
        : occurred.toISOString(),
      location_name: location.trim() || null,
      notes: notes.trim() || null,
      song_title: songTitle.trim() || null,
      song_artist: songArtist.trim() || null,
      aesthetic_theme: theme,
      food_rating: food,
      vibe_rating: vibe,
      value_rating: value,
      overall_rating: overall,
      would_do_again: again,
      idea_ids: linkedIds,
    });
    router.replace('/(tabs)/memories');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="The night we found the taco truck"
          error={error ?? undefined}
        />
        <Field label="When" value={when} onChangeText={setWhen} placeholder="2026-08-21" />
        <Field
          label="Where"
          value={location}
          onChangeText={setLocation}
          placeholder="Echo Park"
        />
        <Field
          label="What happened"
          value={notes}
          onChangeText={setNotes}
          placeholder="The details you’ll want in a year"
          multiline
        />

        <SectionHeader title="The song" />
        <Field label="Song" value={songTitle} onChangeText={setSongTitle} placeholder="Dreams" />
        <Field
          label="Artist"
          value={songArtist}
          onChangeText={setSongArtist}
          placeholder="The Cranberries"
        />

        <ChoiceRow
          label="Aesthetic"
          options={THEME_OPTIONS}
          value={theme}
          onChange={setTheme}
          format={(t) => THEME_LABELS[t]}
        />

        <SectionHeader title="Ratings" />
        <Card>
          <RatingRow label="Food" value={food} onChange={setFood} />
          <RatingRow label="Vibe" value={vibe} onChange={setVibe} />
          <RatingRow label="Value" value={value} onChange={setValue} />
          <RatingRow label="Overall" value={overall} onChange={setOverall} />
        </Card>

        <View style={{ height: spacing.lg }} />
        <Pressable onPress={() => setAgain(!again)} style={styles.againRow}>
          <View style={[styles.checkbox, again && styles.checkboxOn]} />
          <Text style={typography.body}>We'd do this again</Text>
        </Pressable>

        <SectionHeader title="Link the ideas it came from" />
        {linkable.map((idea) => {
          const on = linkedIds.includes(idea.id);
          return (
            <Pressable
              key={idea.id}
              onPress={() => toggleLink(idea.id)}
              style={[styles.linkRow, on && styles.linkRowOn]}
            >
              <Text style={typography.body} numberOfLines={1}>
                {idea.title}
              </Text>
            </Pressable>
          );
        })}

        <View style={{ height: spacing.xl }} />
        <Button label="Save memory" onPress={handleSave} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 64,
  },
  againRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  checkboxOn: {
    borderColor: colors.coral,
    backgroundColor: colors.coral,
  },
  linkRow: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  linkRowOn: {
    borderColor: colors.sage,
    backgroundColor: colors.sageSoft,
  },
});
