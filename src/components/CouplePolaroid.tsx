import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { responsive, screen } from '@/theme/responsive';

export function CouplePolaroid({
  imageUri,
  coupleName,
  onPress,
  onAddPhoto,
}: {
  imageUri?: string | null;
  coupleName: string;
  onPress?: () => void;
  onAddPhoto?: () => void;
}) {
  const content = (
    <View style={styles.container}>
      {/* Washi tape effect at the top */}
      <View style={styles.tape} />

      {/* Polaroid frame */}
      <View style={styles.polaroid}>
        {/* Photo area */}
        <View style={styles.photoArea}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="heart" size={48} color={colors.coral} />
              <Text style={styles.placeholderText}>Add your photo</Text>
            </View>
          )}
        </View>

        {/* Polaroid caption area (white bottom strip) */}
        <View style={styles.caption}>
          <Text style={styles.captionText}>{coupleName}</Text>
        </View>
      </View>

      {/* Add/edit button overlay */}
      {onAddPhoto && (
        <Pressable
          onPress={onAddPhoto}
          style={({ pressed }) => [
            styles.editButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="camera" size={18} color={colors.white} />
        </Pressable>
      )}
    </View>
  );

  if (onPress && !onAddPhoto) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.95 }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignSelf: 'center',
    marginVertical: spacing.lg,
  },
  tape: {
    position: 'absolute',
    top: -8,
    left: '15%',
    right: '15%',
    height: 24,
    backgroundColor: colors.coralSoft,
    opacity: 0.6,
    transform: [{ rotate: '-2deg' }],
    zIndex: 2,
  },
  polaroid: {
    backgroundColor: colors.white,
    borderRadius: 4,
    padding: responsive({
      smallPhone: 10,
      phone: 12,
      tablet: 16,
      default: 12,
    }),
    // Subtle shadow for depth
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    // Slight rotation for scrapbook feel
    transform: [{ rotate: '1deg' }],
  },
  photoArea: {
    width: responsive({
      smallPhone: 200,
      phone: 240,
      tablet: 300,
      default: 240,
    }),
    height: responsive({
      smallPhone: 200,
      phone: 240,
      tablet: 300,
      default: 240,
    }),
    backgroundColor: colors.bgSunken,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    ...typography.small,
    color: colors.inkSoft,
  },
  caption: {
    height: responsive({
      smallPhone: 44,
      phone: 52,
      tablet: 60,
      default: 52,
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionText: {
    fontFamily: 'Georgia',
    fontSize: responsive({
      smallPhone: 18,
      phone: 20,
      tablet: 24,
      default: 20,
    }),
    color: colors.ink,
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: responsive({
      smallPhone: 56,
      phone: 64,
      default: 64,
    }),
    right: responsive({
      smallPhone: 16,
      phone: 20,
      default: 20,
    }),
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow for button
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
