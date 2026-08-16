import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, EmptyState, Screen } from '@/components/ui';
import { IdeaCard } from '@/components/IdeaCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { safePadding } from '@/theme/responsive';
import { useBridgeStore } from '@/store/useBridgeStore';
import {
  CATEGORY_LABELS,
  CostLevel,
  Idea,
  IdeaCategory,
  IdeaStatus,
} from '@/types/bridge';

const STATUS_FILTERS: { value: IdeaStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'planned', label: 'Planned' },
  { value: 'done', label: 'Done' },
  { value: 'archived', label: 'Archived' },
];

const COST_FILTERS: (CostLevel | 'all')[] = ['all', 'free', '$', '$$', '$$$'];
const CATEGORY_FILTERS: (IdeaCategory | 'all')[] = [
  'all',
  'food',
  'drinks',
  'activity',
  'event',
  'outdoors',
  'travel',
  'cozy',
  'fancy',
  'cheap',
  'other',
];

export default function IdeasInbox() {
  const ideas = useBridgeStore((s) => s.ideas);
  const updateIdea = useBridgeStore((s) => s.updateIdea);

  const [status, setStatus] = useState<IdeaStatus | 'all'>('all');
  const [category, setCategory] = useState<IdeaCategory | 'all'>('all');
  const [cost, setCost] = useState<CostLevel | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      // "All" hides archived; pick the Archived chip to see them.
      if (status === 'all') {
        if (idea.status === 'archived') return false;
      } else if (idea.status !== status) {
        return false;
      }
      if (category !== 'all' && idea.category !== category) return false;
      if (cost !== 'all' && idea.cost_level !== cost) return false;
      return true;
    });
  }, [ideas, status, category, cost]);

  const toggleShortlist = (idea: Idea) => {
    updateIdea(idea.id, {
      status: idea.status === 'shortlisted' ? 'new' : 'shortlisted',
    });
  };

  const archive = (idea: Idea) => {
    updateIdea(idea.id, { status: idea.status === 'archived' ? 'new' : 'archived' });
    setExpandedId(null);
  };

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Button label="+ Save an idea" onPress={() => router.push('/ideas/new')} />
            <FilterRow>
              {STATUS_FILTERS.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  selected={status === f.value}
                  onPress={() => setStatus(f.value)}
                />
              ))}
            </FilterRow>
            <FilterRow>
              {CATEGORY_FILTERS.map((c) => (
                <Chip
                  key={c}
                  label={c === 'all' ? 'Any category' : CATEGORY_LABELS[c]}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  tone="sage"
                />
              ))}
            </FilterRow>
            <FilterRow>
              {COST_FILTERS.map((c) => (
                <Chip
                  key={c}
                  label={c === 'all' ? 'Any cost' : c === 'free' ? 'Free' : c}
                  selected={cost === c}
                  onPress={() => setCost(c)}
                  tone="blue"
                />
              ))}
            </FilterRow>
            <View style={{ height: spacing.lg }} />
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <IdeaCard
              idea={item}
              onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
            />
            {expandedId === item.id && (
              <View style={styles.rowActions}>
                {item.source_url ? (
                  <Text style={typography.small} numberOfLines={1}>
                    {item.source_url}
                  </Text>
                ) : null}
                <View style={styles.rowButtons}>
                  <Pressable onPress={() => toggleShortlist(item)}>
                    <Text style={styles.actionText}>
                      {item.status === 'shortlisted' ? 'Remove shortlist' : 'Shortlist'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => archive(item)}>
                    <Text style={[styles.actionText, { color: colors.danger }]}>
                      {item.status === 'archived' ? 'Restore' : 'Archive'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title={status === 'archived' ? 'No archived ideas' : 'Nothing here yet'}
            body="Paste a link or jot down a note the next time one of you says “we should go here.”"
          />
        }
      />
    </Screen>
  );
}

function FilterRow({ children }: { children: React.ReactNode }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={React.Children.toArray(children)}
      keyExtractor={(_, i) => String(i)}
      renderItem={({ item }) => <View style={{ marginRight: spacing.sm }}>{item}</View>}
      style={{ marginTop: spacing.md }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: safePadding.horizontal,
    paddingBottom: 48,
  },
  rowActions: {
    backgroundColor: colors.bgSunken,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.sm,
  },
  actionText: {
    ...typography.small,
    color: colors.blue,
    fontWeight: '600',
  },
});
