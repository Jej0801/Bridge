import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useBridgeStore } from '@/store/useBridgeStore';

const schema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(50, 'Too long'),
});

type FormValues = z.infer<typeof schema>;

export default function EditProfile() {
  const currentUserId = useBridgeStore((s) => s.currentUserId);
  const profiles = useBridgeStore((s) => s.profiles);
  const updateProfile = useBridgeStore((s) => s.updateProfile);
  const [saving, setSaving] = useState(false);

  const currentUser = profiles.find((p) => p.id === currentUserId);

  const { control, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: currentUser?.display_name || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!currentUserId) {
      Alert.alert('Error', 'Not signed in');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(currentUserId, {
        display_name: values.display_name.trim(),
      });

      Alert.alert('Saved!', 'Your profile has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Update your display name</Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="display_name"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <Field
                label="Display Name"
                value={value}
                onChangeText={onChange}
                placeholder="Your name"
                error={error?.message}
                autoFocus
              />
            )}
          />

          <Text style={styles.hint}>
            This is how your name appears to your partner throughout the app.
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
    marginBottom: spacing.xl,
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
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
