import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useShareIntent } from 'expo-share-intent';
import { router } from 'expo-router';
import { Screen } from '@/components/ui';
import { useBridgeStore } from '@/store/useBridgeStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { submitSharedLink, waitForEnrichment } from '@/lib/shareService';
import { extractSpotFromCaption, geocodeAddress, enrichSpotWithWebSearch } from '@/lib/aiExtraction';

type ProcessingStage = 'metadata' | 'ai_extraction' | 'enrichment' | 'geocoding' | 'saving';

export default function ShareIntentScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const currentUserId = useBridgeStore((s) => s.currentUserId);
  const couple = useBridgeStore((s) => s.couple);
  const addIdea = useBridgeStore((s) => s.addIdea);

  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>('metadata');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleShare() {
      // Guard: need auth and couple
      if (!currentUserId || !couple) {
        Alert.alert(
          'Not Set Up',
          'Please sign in and set up your couple space before saving spots.',
          [
            {
              text: 'Go to Settings',
              onPress: () => {
                resetShareIntent();
                router.replace('/(tabs)/settings');
              },
            },
          ]
        );
        return;
      }

      // Extract shared URL or text
      const sharedUrl = shareIntent?.webUrl || shareIntent?.text;

      if (!sharedUrl) {
        setError('No URL found in shared content');
        return;
      }

      // Detect platform from URL
      let platform: 'tiktok' | 'instagram' | 'manual' = 'manual';
      if (sharedUrl.includes('tiktok.com') || sharedUrl.includes('vm.tiktok.com')) {
        platform = 'tiktok';
      } else if (sharedUrl.includes('instagram.com')) {
        platform = 'instagram';
      }

      setProcessing(true);
      setError(null);

      try {
        // STAGE 1: Fetch oEmbed metadata from Python backend
        setStage('metadata');
        let oembedData = null;
        let caption = null;

        try {
          const created = await submitSharedLink(currentUserId, sharedUrl);
          const enriched = await waitForEnrichment(created.id, {
            intervalMs: 1000,
            timeoutMs: 10000
          });

          if (enriched.status === 'enriched') {
            oembedData = enriched;
            // Try to extract caption from title or embed_html
            caption = enriched.title || extractTextFromHTML(enriched.embed_html);
          }
        } catch (oembedErr) {
          console.warn('oEmbed fetch failed, continuing without metadata:', oembedErr);
          // Continue without oEmbed data - AI can still work with URL
        }

        // STAGE 2: AI extraction for structured data
        setStage('ai_extraction');
        let extracted = await extractSpotFromCaption(
          caption || sharedUrl, // Use caption if available, otherwise URL
          platform,
          sharedUrl
        );

        // If we got oEmbed data, override title with it (more reliable)
        if (oembedData?.title) {
          extracted.title = oembedData.title;
        }

        // STAGE 3: Web enrichment (optional)
        setStage('enrichment');
        if (process.env.TAVILY_API_KEY && extracted.location_name) {
          try {
            const enriched = await enrichSpotWithWebSearch(extracted);
            extracted = { ...extracted, ...enriched };
          } catch (enrichErr) {
            console.warn('Enrichment failed:', enrichErr);
          }
        }

        // STAGE 4: Geocoding
        setStage('geocoding');
        let coordinates = null;
        if (extracted.address) {
          coordinates = await geocodeAddress(extracted.address);
        } else if (extracted.location_name) {
          coordinates = await geocodeAddress(extracted.location_name);
        }

        // STAGE 5: Save to database
        setStage('saving');
        await addIdea({
          title: extracted.title,
          description: extracted.description,
          source_type: platform,
          source_url: sharedUrl,
          thumbnail_url: oembedData?.thumbnail_url || null,
          category: extracted.category,
          tags: extracted.tags,
          location_name: extracted.location_name,
          address: extracted.address,
          latitude: coordinates?.latitude || null,
          longitude: coordinates?.longitude || null,
          cost_level: extracted.cost_level,
          status: 'new',
          estimated_duration_minutes: extracted.estimated_duration_minutes,
          best_time_of_day: extracted.best_time_of_day,
          vibe_tags: extracted.vibe_tags,
          ai_extracted: true,
          phone_number: extracted.phone_number,
          website_url: extracted.website_url,
          hours_of_operation: extracted.hours_of_operation,
          rating: null,
          popular_times: null,
          nearby_spots: null,
        });

        // Success - navigate to ideas tab
        Alert.alert(
          'Spot Saved!',
          `"${extracted.title}" has been added to your ideas.`,
          [
            {
              text: 'View Ideas',
              onPress: () => {
                resetShareIntent();
                router.replace('/(tabs)/ideas');
              },
            },
          ]
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save spot';
        setError(message);
        Alert.alert('Could Not Save Spot', message, [
          {
            text: 'Try Manually',
            onPress: () => {
              resetShareIntent();
              router.replace('/ideas/new');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } finally {
        setProcessing(false);
      }
    }

    if (hasShareIntent && shareIntent) {
      handleShare();
    }
  }, [hasShareIntent, shareIntent, currentUserId, couple]);

  const getStageMessage = (): string => {
    switch (stage) {
      case 'metadata':
        return 'Fetching post metadata...';
      case 'ai_extraction':
        return 'Extracting spot details with AI...';
      case 'enrichment':
        return 'Enriching with web data...';
      case 'geocoding':
        return 'Finding location coordinates...';
      case 'saving':
        return 'Saving to your ideas...';
      default:
        return 'Processing...';
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.content}>
          {processing && (
            <>
              <ActivityIndicator size="large" color={colors.coral} />
              <Text style={styles.title}>Processing Shared Spot</Text>
              <Text style={styles.subtitle}>{getStageMessage()}</Text>
              <View style={styles.stageIndicator}>
                <StageIndicator current={stage} stage="metadata" label="Metadata" />
                <StageIndicator current={stage} stage="ai_extraction" label="AI" />
                <StageIndicator current={stage} stage="enrichment" label="Enrich" />
                <StageIndicator current={stage} stage="geocoding" label="Location" />
                <StageIndicator current={stage} stage="saving" label="Save" />
              </View>
            </>
          )}

          {error && !processing && (
            <>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.title}>Could Not Process</Text>
              <Text style={styles.errorText}>{error}</Text>
            </>
          )}

          {!processing && !error && !hasShareIntent && (
            <>
              <Text style={styles.title}>No Shared Content</Text>
              <Text style={styles.subtitle}>
                Share a TikTok or Instagram post to Bridge to save it as a date spot
              </Text>
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

function StageIndicator({
  current,
  stage,
  label
}: {
  current: ProcessingStage;
  stage: ProcessingStage;
  label: string;
}) {
  const stages: ProcessingStage[] = ['metadata', 'ai_extraction', 'enrichment', 'geocoding', 'saving'];
  const currentIndex = stages.indexOf(current);
  const stageIndex = stages.indexOf(stage);
  const isActive = currentIndex === stageIndex;
  const isCompleted = currentIndex > stageIndex;

  return (
    <View style={styles.stage}>
      <View style={[
        styles.stageDot,
        isCompleted && styles.stageDotCompleted,
        isActive && styles.stageDotActive,
      ]} />
      <Text style={[
        styles.stageLabel,
        (isCompleted || isActive) && styles.stageLabelActive,
      ]}>
        {label}
      </Text>
    </View>
  );
}

function extractTextFromHTML(html: string | null): string | null {
  if (!html) return null;
  // Simple HTML tag removal (basic, not production-grade)
  return html.replace(/<[^>]*>/g, '').trim() || null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    alignItems: 'center',
    gap: spacing.md,
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    fontSize: 15,
    color: colors.coral,
    textAlign: 'center',
    lineHeight: 22,
  },
  stageIndicator: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stage: {
    alignItems: 'center',
    gap: 4,
  },
  stageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bgRaised,
    borderWidth: 2,
    borderColor: colors.inkFaint,
  },
  stageDotActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  stageDotCompleted: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  stageLabel: {
    fontSize: 10,
    color: colors.inkFaint,
    fontWeight: '500',
  },
  stageLabelActive: {
    color: colors.ink,
    fontWeight: '600',
  },
});
