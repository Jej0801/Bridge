import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, ChoiceRow, Field, Screen } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';
import {
  CATEGORY_LABELS,
  CostLevel,
  IdeaCategory,
  SOURCE_LABELS,
  SourceType,
} from '@/types/bridge';

// Ideas arrive as pasted links or manual notes. `inferSource` gives the
// pasted-link path a head start; a metadata enrichment service can later
// hydrate title/thumbnail from the URL server-side.

const schema = z.object({
  title: z.string().min(1, 'Give it a name you’ll both recognize.'),
  description: z.string(),
  source_url: z.string(),
  location_name: z.string(),
  tags: z.string(),
});

type FormValues = z.infer<typeof schema>;

const SOURCE_OPTIONS: SourceType[] = [
  'manual',
  'tiktok',
  'instagram',
  'maps',
  'restaurant',
  'event',
  'other',
];
const CATEGORY_OPTIONS: IdeaCategory[] = [
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
const COST_OPTIONS: CostLevel[] = ['free', '$', '$$', '$$$'];

function inferSource(url: string): SourceType | null {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('maps.google') || u.includes('goo.gl/maps') || u.includes('maps.app'))
    return 'maps';
  if (u.startsWith('http')) return 'other';
  return null;
}

export default function NewIdea() {
  const addIdea = useBridgeStore((s) => s.addIdea);
  const [sourceType, setSourceType] = React.useState<SourceType>('manual');
  const [category, setCategory] = React.useState<IdeaCategory>('activity');
  const [cost, setCost] = React.useState<CostLevel>('$$');

  const { control, handleSubmit, setValue, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', source_url: '', location_name: '', tags: '' },
  });

  const onSubmit = async (values: FormValues) => {
    await addIdea({
      title: values.title.trim(),
      description: values.description.trim() || null,
      source_type: sourceType,
      source_url: values.source_url.trim() || null,
      thumbnail_url: null,
      category,
      tags: values.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      location_name: values.location_name.trim() || null,
      latitude: null,
      longitude: null,
      cost_level: cost,
      status: 'new',
    });
    router.back();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.bodySoft, { marginBottom: spacing.lg }]}>
          Paste a link from TikTok, Instagram, or Maps — or just write it down.
        </Text>

        <Controller
          control={control}
          name="source_url"
          render={({ field }) => (
            <Field
              label="Link (optional)"
              value={field.value}
              onChangeText={(text) => {
                field.onChange(text);
                const inferred = inferSource(text);
                if (inferred) setSourceType(inferred);
              }}
              placeholder="https://…"
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Field
              label="Title"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="That rooftop bar Sam sent"
              error={formState.errors.title?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field
              label="Notes (optional)"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Why it caught your eye"
              multiline
            />
          )}
        />

        <ChoiceRow
          label="Source"
          options={SOURCE_OPTIONS}
          value={sourceType}
          onChange={setSourceType}
          format={(s) => SOURCE_LABELS[s]}
        />
        <ChoiceRow
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
          format={(c) => CATEGORY_LABELS[c]}
        />
        <ChoiceRow
          label="Cost"
          options={COST_OPTIONS}
          value={cost}
          onChange={setCost}
          format={(c) => (c === 'free' ? 'Free' : c)}
        />

        <Controller
          control={control}
          name="location_name"
          render={({ field }) => (
            <Field
              label="Neighborhood (optional)"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="Silver Lake"
            />
          )}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <Field
              label="Tags (comma separated)"
              value={field.value}
              onChangeText={field.onChange}
              placeholder="birthday, patio, live music"
            />
          )}
        />

        <Button label="Save idea" onPress={handleSubmit(onSubmit)} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: 64,
  },
});
