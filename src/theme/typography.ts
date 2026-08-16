import { TextStyle } from 'react-native';
import { colors } from './colors';

// Type is the personality: a quiet serif for headings (system Georgia)
// against a plain sans body. Small caps-style letterspaced labels act
// as the "ticket stub" utility voice.
export const typography = {
  display: {
    fontFamily: 'Georgia',
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  } as TextStyle,
  title: {
    fontFamily: 'Georgia',
    fontSize: 20,
    lineHeight: 26,
    color: colors.ink,
  } as TextStyle,
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  } as TextStyle,
  bodySoft: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkSoft,
  } as TextStyle,
  small: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
  } as TextStyle,
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    fontWeight: '600',
  } as TextStyle,
} as const;
