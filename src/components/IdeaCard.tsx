import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_LABELS, Idea, SOURCE_LABELS } from '@/types/bridge';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { screen } from '@/theme/responsive';
import { useBridgeStore } from '@/store/useBridgeStore';

// Source badges get a muted per-source tint so a mixed inbox still
// scans as one collection, not a wall of brand colors.
const SOURCE_TINT: Record<Idea['source_type'], string> = {
  tiktok: colors.night,
  instagram: colors.coral,
  maps: colors.sage,
  event: colors.blue,
  restaurant: colors.film,
  manual: colors.inkSoft,
  other: colors.inkSoft,
};

export function IdeaCard({
  idea,
  onPress,
  compact,
}: {
  idea: Idea;
  onPress?: () => void;
  compact?: boolean;
}) {
  const profileName = useBridgeStore((s) => s.profileName);
  const tint = SOURCE_TINT[idea.source_type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}
    >
      {/* Thumbnail placeholder: tinted panel with the source initial. */}
      <View style={[styles.thumb, { backgroundColor: `${tint}22` }]}>
        <Text style={[styles.thumbInitial, { color: tint }]}>
          {SOURCE_LABELS[idea.source_type][0]}
        </Text>
        <Text style={[styles.thumbSource, { color: tint }]}>
          {SOURCE_LABELS[idea.source_type]}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={typography.body} numberOfLines={2}>
          {idea.title}
        </Text>
        <Text style={[typography.small, { marginTop: 2 }]} numberOfLines={1}>
          {CATEGORY_LABELS[idea.category]}
          {idea.location_name ? ` · ${idea.location_name}` : ''}
          {` · ${idea.cost_level === 'free' ? 'Free' : idea.cost_level}`}
        </Text>
        {!compact && (
          <View style={styles.metaRow}>
            <Text style={[typography.small, { color: colors.inkFaint }]}>
              Saved by {profileName(idea.created_by)}
            </Text>
            {idea.status === 'shortlisted' && (
              <View style={styles.shortlistBadge}>
                <Text style={styles.shortlistText}>Shortlisted</Text>
              </View>
            )}
            {idea.status === 'planned' && (
              <View style={[styles.shortlistBadge, { backgroundColor: colors.blueSoft }]}>
                <Text style={[styles.shortlistText, { color: colors.blue }]}>Planned</Text>
              </View>
            )}
            {idea.status === 'done' && (
              <View style={[styles.shortlistBadge, { backgroundColor: colors.sageSoft }]}>
                <Text style={[styles.shortlistText, { color: colors.sage }]}>Done</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  thumb: {
    width: screen.isSmallPhone ? 64 : 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  thumbInitial: {
    fontFamily: 'Georgia',
    fontSize: screen.isSmallPhone ? 22 : 26,
  },
  thumbSource: {
    fontSize: screen.isSmallPhone ? 9 : 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
    padding: screen.isSmallPhone ? spacing.sm : spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  shortlistBadge: {
    backgroundColor: colors.coralSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  shortlistText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.coral,
  },
});
