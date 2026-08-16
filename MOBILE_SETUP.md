# Mobile View Setup Guide

Your app now has enhanced mobile responsiveness! Here's what's been set up and how to use it.

## What's Been Added

### 1. Responsive Utilities (`src/theme/responsive.ts`)

A comprehensive set of responsive utilities for detecting screen sizes and platforms:

```typescript
import { screen, responsive, platformSelect, safePadding } from '@/theme/responsive';
```

**Screen Detection:**
- `screen.isSmallPhone` - Devices < 375px (iPhone SE)
- `screen.isPhone` - 375px-768px (standard phones)
- `screen.isLargePhone` - 414px-768px (Pro Max sizes)
- `screen.isTablet` - 768px-1024px (iPads)
- `screen.isDesktop` - 1024px+ (web desktop)
- `screen.isIOS`, `screen.isAndroid`, `screen.isWeb` - Platform detection
- `screen.isMobile` - True for iOS or Android

**Responsive Values:**
```typescript
fontSize: responsive({
  smallPhone: 28,
  phone: 32,
  tablet: 36,
  default: 32,
})
```

**Platform-Specific Values:**
```typescript
paddingVertical: platformSelect({
  ios: 13,
  android: 14,
  web: 13,
  default: 13,
})
```

**Safe Padding:**
```typescript
padding: safePadding.horizontal  // Auto-adjusts: 12px (small) → 32px (desktop)
padding: safePadding.vertical
```

### 2. Optimized Pages

All main screens now use responsive padding and layouts:
- **Home** (`app/(tabs)/index.tsx`) - Responsive greeting, stacked actions on small phones, scaled stats
- **Ideas** (`app/(tabs)/ideas.tsx`) - Responsive padding
- **Memories** (`app/(tabs)/memories.tsx`) - Responsive padding
- **IdeaCard** (`src/components/IdeaCard.tsx`) - Scaled thumbnail and padding
- **UI Components** (`src/components/ui.tsx`) - Platform-specific touch targets

### 3. Platform-Specific Enhancements

- **iOS**: Minimum 44px touch targets (Apple HIG compliance)
- **Android**: Slightly larger button padding for Material Design
- **Web**: Desktop-optimized spacing

## How to Test Mobile View

### Using Expo Go (Recommended)

1. **Start the dev server:**
   ```bash
   npm run start
   ```

2. **Scan QR code:**
   - iOS: Open Camera app, scan QR
   - Android: Open Expo Go app, scan QR

3. **Test on different devices:**
   - Test on iPhone SE (small screen)
   - Test on standard iPhone (iPhone 12/13/14)
   - Test on iPhone Pro Max (large screen)
   - Test on iPad (tablet view)

### Using Web Preview

```bash
npm run web
```

Then resize your browser to test different screen sizes:
- 320px width (iPhone SE)
- 375px width (iPhone 12)
- 414px width (iPhone 14 Pro Max)
- 768px width (iPad)

### Using iOS Simulator

```bash
npm run ios
```

Test on different simulators:
- iPhone SE (3rd generation) - Small screen
- iPhone 15 - Standard screen
- iPhone 15 Pro Max - Large screen
- iPad Pro - Tablet

### Using Android Emulator

```bash
npm run android
```

## Key Responsive Features

### 1. Adaptive Padding
Content padding automatically adjusts:
- **Small phones (< 375px)**: 12px
- **Standard phones**: 16px
- **Tablets**: 24px
- **Desktop/Web**: 32px

### 2. Flexible Layouts
- **Quick actions (Home)**: Stack vertically on small phones, horizontal on larger screens
- **Stats row**: Reduced gap and padding on small phones
- **IdeaCard thumbnails**: 64px on small phones, 84px on larger screens

### 3. Scaled Typography
- **Greeting text**: 28px → 32px → 36px (small → standard → tablet)
- **Stat values**: 18px → 22px → 24px

### 4. Platform-Specific Touch Targets
All interactive elements (buttons, inputs) have minimum 44px height on iOS for better tap accuracy.

## Usage Examples

### Creating a Responsive Component

```typescript
import { screen, responsive, safePadding } from '@/theme/responsive';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: safePadding.horizontal,
    flexDirection: screen.isSmallPhone ? 'column' : 'row',
  },
  title: {
    fontSize: responsive({
      smallPhone: 20,
      phone: 24,
      tablet: 28,
      default: 24,
    }),
  },
});
```

### Platform-Specific Styling

```typescript
import { platformSelect } from '@/theme/responsive';

const styles = StyleSheet.create({
  button: {
    paddingVertical: platformSelect({
      ios: 12,
      android: 14,
      default: 12,
    }),
  },
});
```

### Conditional Rendering

```typescript
import { screen } from '@/theme/responsive';

function MyComponent() {
  return (
    <View>
      {screen.isSmallPhone ? (
        <Text>Compact view</Text>
      ) : (
        <Text>Full view with details</Text>
      )}
    </View>
  );
}
```

## Best Practices

1. **Always use `safePadding`** for main screen content padding
2. **Use `screen.isSmallPhone`** for major layout changes (column vs row)
3. **Use `responsive()`** for scaling numeric values (font sizes, dimensions)
4. **Use `platformSelect()`** for platform-specific UI differences
5. **Maintain minimum 44px touch targets** on interactive elements
6. **Test on real devices** when possible, not just simulators

## Testing Checklist

- [ ] Home page loads correctly on iPhone SE
- [ ] Quick actions stack vertically on small screens
- [ ] Stats row displays properly on all screen sizes
- [ ] Ideas page filter chips scroll horizontally
- [ ] IdeaCard thumbnails scale appropriately
- [ ] All buttons are tappable (44px minimum)
- [ ] Text is readable on small screens
- [ ] Memories page displays correctly
- [ ] Forms are easy to fill out on mobile
- [ ] Navigation works smoothly

## Troubleshooting

### Layout doesn't update on resize
React Native uses static values from `Dimensions.get('window')` at load time. To make layouts dynamic on web, use `useWindowDimensions()` hook:

```typescript
import { useWindowDimensions } from 'react-native';

function MyComponent() {
  const { width } = useWindowDimensions();
  const isSmall = width < 375;
  // Use isSmall for dynamic layouts
}
```

### Platform-specific styles not applying
Make sure you're importing from the correct location:
```typescript
import { platformSelect } from '@/theme/responsive'; // ✅ Correct
```

### Touch targets too small
All buttons and inputs now have `minHeight: 44` for iOS compliance. If adding new interactive elements, ensure they meet this requirement.

## Next Steps

1. Run the app on your phone to test the mobile experience
2. Check all screens for proper responsive behavior
3. Adjust spacing/sizing based on your preferences
4. Consider adding tablet-specific layouts if needed
5. Test form inputs on different keyboard configurations

Your mobile view is ready! 🎉
