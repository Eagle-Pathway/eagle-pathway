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

export type BrandColors = keyof typeof Colors;
export type SemanticColors = 'green' | 'red' | 'orange';
export type NeutralColors = 'text' | 'textSecondary' | 'border' | 'card' | 'bg';