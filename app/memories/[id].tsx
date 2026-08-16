import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Card, EmptyState, RatingRow, Screen, SectionHeader } from '@/components/ui';
import { formatMemoryDate, THEME_STYLES } from '@/components/MemoryCard';
import { IdeaCard } from '@/components/IdeaCard';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import { THEME_LABELS } from '@/types/bridge';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memory = useBridgeStore((s) => s.memories.find((m) => m.id === id));
  const ideas = useBridgeStore((s) => s.ideas);

  if (!memory) {
    return (
      <Screen>
        <EmptyState title="Memory not found" body="It may have been removed." />
      </Screen>
    );
  }

  const theme = THEME_STYLES[memory.aesthetic_theme];
  const linkedIdeas = ideas.filter((i) => memory.idea_ids.includes(i.id));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: theme.mat }]}>
          <View style={[styles.photo, { borderColor: theme.accent }]}>
            <Text style={[styles.photoHint, { color: theme.accent }]}>
              {memory.photos.length > 0 ? `${memory.photos.length} photos` : 'Photos coming soon'}
            </Text>
          </View>
          <Text style={[typography.display, { color: theme.ink }]}>{memory.title}</Text>
          <Text style={[typography.small, { color: theme.accent, marginTop: spacing.xs }]}>
            {formatMemoryDate(memory.occurred_at)}
            {memory.location_name ? ` · ${memory.location_name}` : ''} ·{' '}
            {THEME_LABELS[memory.aesthetic_theme]} theme
          </Text>
          {memory.song_title ? (
            <Text style={[typography.body, { color: theme.ink, marginTop: spacing.md }]}>
              ♪ {memory.song_title}
              {memory.song_artist ? ` — ${memory.song_artist}` : ''}
            </Text>
          ) : null}
        </View>

        <SectionHeader title="How it went" />
        <Card>
          <RatingRow label="Food" value={memory.food_rating} />
          <RatingRow label="Vibe" value={memory.vibe_rating} />
          <RatingRow label="Value" value={memory.value_rating} />
          <RatingRow label="Overall" value={memory.overall_rating} />
          <Text style={[typography.small, { marginTop: spacing.sm }]}>
            {memory.would_do_again ? 'Would do again.' : 'Once was enough.'}
          </Text>
        </Card>

        {memory.notes ? (
          <>
            <SectionHeader title="Notes" />
            <Card>
              <Text style={typography.body}>{memory.notes}</Text>
            </Card>
          </>
        ) : null}

        {linkedIdeas.length > 0 && (
          <>
            <SectionHeader title="Started as" />
            {linkedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} compact />
            ))}
          </>
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
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  photo: {
    height: 160,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoHint: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
