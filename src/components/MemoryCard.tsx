import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AestheticTheme, Memory } from '@/types/bridge';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Each aesthetic theme maps to a "photo mat" treatment so the timeline
// reads like a scrapbook of differently-developed prints.
export const THEME_STYLES: Record<
  AestheticTheme,
  { mat: string; accent: string; ink: string }
> = {
  warm: { mat: '#F3E4D3', accent: colors.coral, ink: colors.ink },
  film: { mat: '#EAE3D2', accent: colors.film, ink: '#4C4436' },
  night: { mat: '#3A3644', accent: '#C9C2DD', ink: '#F0EDF6' },
  minimal: { mat: colors.bgRaised, accent: colors.inkSoft, ink: colors.ink },
  colorful: { mat: '#E9EDD9', accent: colors.blue, ink: colors.ink },
};

export function formatMemoryDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MemoryCard({ memory, onPress }: { memory: Memory; onPress?: () => void }) {
  const theme = THEME_STYLES[memory.aesthetic_theme];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.mat },
        pressed && { opacity: 0.85 },
      ]}
    >
      {/* Photo placeholder "print" */}
      <View style={[styles.photo, { borderColor: theme.accent }]}>
        <Text style={[styles.photoHint, { color: theme.accent }]}>
          {memory.photos.length > 0 ? `${memory.photos.length} photos` : 'Add photos'}
        </Text>
      </View>
      <Text style={[typography.title, { color: theme.ink }]}>{memory.title}</Text>
      <Text style={[typography.small, { color: theme.accent, marginTop: 2 }]}>
        {formatMemoryDate(memory.occurred_at)}
        {memory.location_name ? ` · ${memory.location_name}` : ''}
      </Text>
      {memory.song_title ? (
        <Text style={[typography.small, { color: theme.ink, marginTop: spacing.sm }]}>
          ♪ {memory.song_title}
          {memory.song_artist ? ` — ${memory.song_artist}` : ''}
        </Text>
      ) : null}
      <View style={styles.footer}>
        <Text style={[typography.small, { color: theme.ink }]}>
          {'●'.repeat(memory.overall_rating ?? 0)}
          {'○'.repeat(5 - (memory.overall_rating ?? 0))}
        </Text>
        {memory.would_do_again && (
          <Text style={[typography.small, { color: theme.accent, fontWeight: '600' }]}>
            Again, yes
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  photoHint: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
