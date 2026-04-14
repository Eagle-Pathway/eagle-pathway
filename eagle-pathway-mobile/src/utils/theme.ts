import { StyleSheet, Platform } from 'react-native';

export const Colors = {
  // Brand
  blue: '#1E4D9B',
  blueMid: '#2563EB',
  blueLight: '#EEF3FF',
  blueDark: '#0d2051',
  gold: '#C9A84C',
  goldLight: '#FDF6E3',
  goldDark: '#9A6F1E',

  // Semantic
  green: '#16a34a',
  greenLight: '#dcfce7',
  red: '#dc2626',
  redLight: '#fee2e2',
  orange: '#ea580c',
  orangeLight: '#fff7ed',

  // Neutral
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  card: '#ffffff',
  bg: '#F5F6FA',
  grayLight: '#f3f4f6',

  // Status
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  // Font sizes
  xs: 10,
  sm: 11,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  '2xl': 18,
  '3xl': 20,
  '4xl': 22,
  '5xl': 24,
  '6xl': 28,
  '7xl': 32,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  full: 999,
};

export const Shadow = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
  }),
};

// Common shared styles
export const CommonStyles = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  screenBg: { flex: 1, backgroundColor: Colors.bg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  pill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillBlue: {
    backgroundColor: Colors.blueLight,
  },
  pillGold: {
    backgroundColor: Colors.goldLight,
  },
  pillGreen: {
    backgroundColor: Colors.greenLight,
  },
  pillRed: {
    backgroundColor: Colors.redLight,
  },
  pillOrange: {
    backgroundColor: Colors.orangeLight,
  },
  pillText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  pillBlueText: { color: Colors.blue },
  pillGoldText: { color: Colors.goldDark },
  pillGreenText: { color: Colors.green },
  pillRedText: { color: Colors.red },
  pillOrangeText: { color: Colors.orange },
});
