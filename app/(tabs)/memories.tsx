import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, EmptyState, Screen } from '@/components/ui';
import { MemoryCard } from '@/components/MemoryCard';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { safePadding } from '@/theme/responsive';
import { useBridgeStore } from '@/store/useBridgeStore';

export default function MemoriesTimeline() {
  const memories = useBridgeStore((s) => s.memories);

  const sorted = [...memories].sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));

  return (
    <Screen>
      <FlatList
        data={sorted}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={typography.bodySoft}>
              The dates you actually went on, kept somewhere better than a camera roll.
            </Text>
            <View style={{ height: spacing.md }} />
            <Button label="+ Log a memory" onPress={() => router.push('/memories/new')} />
          </View>
        }
        renderItem={({ item }) => (
          <MemoryCard memory={item} onPress={() => router.push(`/memories/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No memories yet"
            body="After your next date, log it here — photos, the song that was playing, and how it really went."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: safePadding.horizontal,
    paddingBottom: 48,
  },
});
