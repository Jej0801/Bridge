import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, ChoiceRow, Field, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
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
import { extractDateSpotFromURL } from '@/lib/aiExtraction';

const schema = z.object({
  source_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  caption: z.string().optional(),
  title: z.string().min(1, 'Give it a name you will both recognize.'),
  description: z.string().optional(),
  location_name: z.string().optional(),
  address: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const SOURCE_OPTIONS: SourceType[] = ['tiktok', 'instagram', 'maps', 'restaurant', 'event', 'other'];
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
  return 'other';
}

export default function NewIdea() {
  const addIdea = useBridgeStore((s) => s.addIdea);
  const [sourceType, setSourceType] = useState<SourceType>('tiktok');
  const [category, setCategory] = useState<IdeaCategory>('activity');
  const [cost, setCost] = useState<CostLevel>('$$');
  const [useAI, setUseAI] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);

  const { control, handleSubmit, setValue, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source_url: '',
      caption: '',
      title: '',
      description: '',
      location_name: '',
      address: '',
      tags: '',
    },
  });

  const sourceUrl = watch('source_url');

  const handleExtractWithAI = async () => {
    const url = sourceUrl?.trim();
    const caption = watch('caption')?.trim();

    if (!url) {
      Alert.alert('Missing URL', 'Please enter a TikTok or Instagram URL');
      return;
    }

    // Caption is now optional - AI will try to fetch it or use a placeholder
    setExtracting(true);

    try {
      // Enable web enrichment for better data quality
      const result = await extractDateSpotFromURL(url, sourceType, caption, {
        enableEnrichment: true,
      });

      // Auto-fill the form with extracted data
      setValue('title', result.extracted.title);
      setValue('description', result.extracted.description || '');
      setValue('location_name', result.extracted.location_name || '');
      setValue('address', result.extracted.address || '');
      setValue('tags', result.extracted.tags.join(', '));

      if (result.extracted.category) {
        setCategory(result.extracted.category);
      }
      if (result.extracted.cost_level) {
        setCost(result.extracted.cost_level);
      }

      // Store the full extracted data for later submission
      (window as any).__extractedSpotData = result.extracted;
      (window as any).__extractedCoordinates = result.coordinates;

      setExtracted(true);

      const enrichmentNote = result.extracted.phone_number || result.extracted.website_url
        ? ' (includes contact info)'
        : '';
      Alert.alert(
        '✨ Extracted!',
        `AI has filled in the details${enrichmentNote}. Review and save below.`
      );
    } catch (error: any) {
      console.error('AI extraction error:', error);
      Alert.alert('Extraction Failed', error.message || 'Could not extract spot details');
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    // Get extracted data if available
    const extractedData = (window as any).__extractedSpotData;
    const coordinates = (window as any).__extractedCoordinates;

    await addIdea({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      source_type: sourceType,
      source_url: values.source_url?.trim() || null,
      thumbnail_url: null,
      category,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      location_name: values.location_name?.trim() || null,
      address: values.address?.trim() || null,
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null,
      cost_level: cost,
      status: 'new',
      // Enhanced fields from AI extraction
      estimated_duration_minutes: extractedData?.estimated_duration_minutes || null,
      best_time_of_day: extractedData?.best_time_of_day || null,
      vibe_tags: extractedData?.vibe_tags || null,
      ai_extracted: useAI && extracted,
      rating: extractedData?.rating || null,
      phone_number: extractedData?.phone_number || null,
      website_url: extractedData?.website_url || null,
      hours_of_operation: extractedData?.hours_of_operation || null,
      popular_times: null,
      nearby_spots: null,
    });

    // Clean up stored data
    delete (window as any).__extractedSpotData;
    delete (window as any).__extractedCoordinates;
    router.back();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.bodySoft, { marginBottom: spacing.md }]}>
          Paste a link from TikTok or Instagram, then let AI extract the details.
        </Text>

        {/* AI Toggle */}
        <View style={styles.aiToggle}>
          <Text style={typography.body}>Use AI Extraction</Text>
          <Switch
            value={useAI}
            onValueChange={setUseAI}
            trackColor={{ false: colors.border, true: colors.coral }}
            thumbColor={colors.white}
          />
        </View>

        {/* Source Selection */}
        <ChoiceRow
          label="Source"
          options={SOURCE_OPTIONS}
          value={sourceType}
          onChange={setSourceType}
          format={(s) => SOURCE_LABELS[s]}
        />

        {useAI ? (
          <>
            {/* AI Extraction Flow */}
            <Controller
              control={control}
              name="source_url"
              render={({ field }) => (
                <Field
                  label="Paste URL"
                  value={field.value}
                  onChangeText={(text) => {
                    field.onChange(text);
                    const inferred = inferSource(text);
                    if (inferred) setSourceType(inferred);
                    setExtracted(false);
                  }}
                  placeholder="https://www.tiktok.com/@user/video/..."
                  autoCapitalize="none"
                  error={formState.errors.source_url?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="caption"
              render={({ field }) => (
                <Field
                  label="Paste Caption/Description"
                  value={field.value}
                  onChangeText={(text) => {
                    field.onChange(text);
                    setExtracted(false);
                  }}
                  placeholder="Copy and paste the post's caption here..."
                  multiline
                  numberOfLines={4}
                />
              )}
            />

            <Button
              label={extracting ? 'Extracting...' : extracted ? '✓ Extracted' : '✨ Extract with AI'}
              onPress={handleExtractWithAI}
              disabled={extracting || !sourceUrl || !watch('caption')}
              variant={extracted ? 'secondary' : 'primary'}
              style={{ marginBottom: spacing.lg }}
            />

            {extracting && (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.coral} />
                <Text style={[typography.small, { marginTop: spacing.sm, color: colors.inkSoft }]}>
                  AI is analyzing the spot...
                </Text>
              </View>
            )}

            {/* Extracted Fields (editable) */}
            {extracted && (
              <View style={styles.extractedSection}>
                <Text style={[typography.title, { marginBottom: spacing.md }]}>
                  Review & Edit
                </Text>
              </View>
            )}
          </>
        ) : null}

        {/* Manual or AI-extracted fields */}
        {(!useAI || extracted) && (
          <>
            <Controller
              control={control}
              name="title"
              render={({ field }) => (
                <Field
                  label="Title"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="That rooftop bar from TikTok"
                  error={formState.errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Field
                  label="Description (optional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Why it caught your eye"
                  multiline
                />
              )}
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
                  label="Location/Venue (optional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="The Rooftop Bar, Silver Lake"
                />
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field }) => (
                <Field
                  label="Address (optional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="123 Main St, Los Angeles, CA"
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
                  placeholder="romantic, views, cocktails"
                />
              )}
            />

            <Button label="Save Spot" onPress={handleSubmit(onSubmit)} />
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
  aiToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bgRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loading: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  extractedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
