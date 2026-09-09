import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, Screen } from '@/components/ui';
import { CouplePolaroid } from '@/components/CouplePolaroid';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';

const schema = z.object({
  name: z.string().min(1, 'Couple name is required').max(50, 'Too long'),
});

type FormValues = z.infer<typeof schema>;

export default function EditCouple() {
  const couple = useBridgeStore((s) => s.couple);
  const updateCouple = useBridgeStore((s) => s.updateCouple);
  const uploadCouplePhoto = useBridgeStore((s) => s.uploadCouplePhoto);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: couple?.name || 'Us',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!couple?.id) {
      Alert.alert('Error', 'No couple space found');
      return;
    }

    setSaving(true);
    try {
      await updateCouple(couple.id, {
        name: values.name.trim(),
      });

      Alert.alert('Saved!', 'Your couple space has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save couple');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library.');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5], // Polaroid aspect ratio
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        await uploadCouplePhoto(result.assets[0].uri);
        Alert.alert('Success', 'Photo updated!');
      } catch (error: any) {
        Alert.alert('Upload Failed', error.message || 'Could not upload photo');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Couple Space</Text>
        <Text style={styles.subtitle}>Customize your shared space</Text>

        {/* Couple Photo */}
        <View style={styles.photoSection}>
          <CouplePolaroid
            imageUri={couple?.photo_url}
            coupleName={couple?.name ?? 'Us'}
            onAddPhoto={handleAddPhoto}
          />
          {uploadingPhoto && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={colors.coral} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Field
                label="Couple Name"
                value={value}
                onChangeText={onChange}
                placeholder="Us"
                error={error?.message}
              />
            )}
          />

          <Text style={styles.hint}>
            This name appears at the top of your home screen and in memories.
          </Text>
        </View>

        {/* Invite Code Display */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteLabel}>Invite Code</Text>
          <Pressable
            style={styles.inviteCode}
            onPress={() => {
              Alert.alert(
                'Invite Code',
                `Share this code with your partner:\n\n${couple?.invite_code ?? 'BRIDGE-XXXX'}`
              );
            }}
          >
            <Text style={styles.inviteCodeText}>{couple?.invite_code ?? 'BRIDGE-XXXX'}</Text>
            <Ionicons name="copy-outline" size={20} color={colors.coral} />
          </Pressable>
          <Text style={styles.inviteHint}>
            Your partner can use this code to join your couple space.
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            label="Cancel"
            onPress={() => router.back()}
            variant="secondary"
            disabled={saving}
          />
          <Button
            label={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSubmit(onSubmit)}
            disabled={saving || !formState.isDirty}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    ...typography.display,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySoft,
    marginBottom: spacing.lg,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(247, 242, 234, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  uploadingText: {
    marginTop: spacing.sm,
    fontSize: 16,
    fontWeight: '600',
    color: colors.coral,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  hint: {
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: -spacing.sm,
  },
  inviteSection: {
    marginBottom: spacing.xl,
  },
  inviteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: spacing.sm,
  },
  inviteCode: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.coral,
    letterSpacing: 1,
  },
  inviteHint: {
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
