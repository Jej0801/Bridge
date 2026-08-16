import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { platformSelect, screen } from '@/theme/responsive';

// Small shared primitives. Anything used on 2+ screens lives here.

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={typography.label}>{title}</Text>
      {action}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: colors.coral },
        variant === 'secondary' && {
          backgroundColor: colors.bgRaised,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'danger' && { backgroundColor: colors.danger },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === 'primary' || variant === 'danger'
            ? { color: colors.white }
            : { color: variant === 'ghost' ? colors.blue : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  tone = 'neutral',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'neutral' | 'coral' | 'sage' | 'blue';
}) {
  const toneBg = {
    neutral: colors.bgSunken,
    coral: colors.coralSoft,
    sage: colors.sageSoft,
    blue: colors.blueSoft,
  }[tone];
  const content = (
    <View
      style={[
        styles.chip,
        { backgroundColor: selected ? colors.ink : toneBg },
      ]}
    >
      <Text style={[styles.chipLabel, selected && { color: colors.bg }]}>{label}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {content}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...inputProps
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.label, { marginBottom: spacing.xs }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, inputProps.multiline && { height: 88, textAlignVertical: 'top' }]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  format,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  format?: (value: T) => string;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.label, { marginBottom: spacing.sm }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => (
          <Chip
            key={option}
            label={format ? format(option) : option}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </View>
    </View>
  );
}

export function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange?: (value: number) => void;
}) {
  return (
    <View style={styles.ratingRow}>
      <Text style={[typography.small, { width: 64 }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (value ?? 0) >= n;
          const dot = (
            <View
              key={n}
              style={[
                styles.ratingDot,
                { backgroundColor: filled ? colors.coral : colors.bgSunken },
              ]}
            />
          );
          if (!onChange) return dot;
          return (
            <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
              {dot}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={[typography.title, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[typography.bodySoft, { textAlign: 'center', marginTop: spacing.sm }]}>
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: platformSelect({
      ios: 13,
      android: 14,
      web: 13,
      default: 13,
    }),
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    minHeight: 44, // iOS minimum touch target
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipLabel: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: screen.isSmallPhone ? spacing.sm : spacing.md,
    paddingVertical: platformSelect({
      ios: 11,
      android: 12,
      web: 11,
      default: 11,
    }),
    fontSize: 15,
    color: colors.ink,
    minHeight: 44, // iOS minimum touch target
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
});
