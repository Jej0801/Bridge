import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints based on common device sizes
export const breakpoints = {
  smallPhone: 320,   // iPhone SE
  phone: 375,        // iPhone 12/13/14
  largPhone: 414,    // iPhone Pro Max
  tablet: 768,       // iPad
  desktop: 1024,     // Web desktop
};

// Screen size helpers
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallPhone: SCREEN_WIDTH < breakpoints.phone,
  isPhone: SCREEN_WIDTH >= breakpoints.phone && SCREEN_WIDTH < breakpoints.tablet,
  isLargePhone: SCREEN_WIDTH >= breakpoints.largPhone && SCREEN_WIDTH < breakpoints.tablet,
  isTablet: SCREEN_WIDTH >= breakpoints.tablet && SCREEN_WIDTH < breakpoints.desktop,
  isDesktop: SCREEN_WIDTH >= breakpoints.desktop,
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',
  isMobile: Platform.OS === 'ios' || Platform.OS === 'android',
};

// Platform-specific values
export function platformSelect<T>(values: {
  ios?: T;
  android?: T;
  web?: T;
  default: T;
}): T {
  if (Platform.OS === 'ios' && values.ios !== undefined) return values.ios;
  if (Platform.OS === 'android' && values.android !== undefined) return values.android;
  if (Platform.OS === 'web' && values.web !== undefined) return values.web;
  return values.default;
}

// Responsive value selector
export function responsive<T>(values: {
  smallPhone?: T;
  phone?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T {
  if (screen.isSmallPhone && values.smallPhone !== undefined) return values.smallPhone;
  if (screen.isPhone && values.phone !== undefined) return values.phone;
  if (screen.isTablet && values.tablet !== undefined) return values.tablet;
  if (screen.isDesktop && values.desktop !== undefined) return values.desktop;
  return values.default;
}

// Scale helper for proportional sizing
export const scale = (size: number) => (SCREEN_WIDTH / 375) * size;

// Vertical scale for height-based sizing
export const verticalScale = (size: number) => (SCREEN_HEIGHT / 812) * size;

// Moderate scale - balanced between width and height
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Safe padding for different screen sizes
export const safePadding = {
  horizontal: responsive({
    smallPhone: 12,
    phone: 16,
    tablet: 24,
    desktop: 32,
    default: 16,
  }),
  vertical: responsive({
    smallPhone: 12,
    phone: 16,
    tablet: 20,
    desktop: 24,
    default: 16,
  }),
};
