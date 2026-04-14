import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Radius, Spacing, CommonStyles } from '../../utils/theme';

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', size = 'lg',
  loading, disabled, style, textStyle, fullWidth = true,
}) => {
  const btnStyle = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    fullWidth && styles.btnFull,
    (disabled || loading) && styles.btnDisabled,
    style,
  ];

  const txtStyle = [
    styles.btnText,
    styles[`btnText_${variant}`],
    styles[`btnText_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled || loading} activeOpacity={0.85}>
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.blue} size="small" />
        : <Text style={txtStyle}>{title}</Text>}
    </TouchableOpacity>
  );
};

// ─── Pill / Badge ─────────────────────────────────────────────────────────────
interface PillProps {
  label: string;
  variant?: 'blue' | 'gold' | 'green' | 'red' | 'orange' | 'gray';
  style?: ViewStyle;
}

export const Pill: React.FC<PillProps> = ({ label, variant = 'blue', style }) => (
  <View style={[CommonStyles.pill, CommonStyles[`pill${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof CommonStyles] as ViewStyle, style]}>
    <Text style={[CommonStyles.pillText, CommonStyles[`pill${variant.charAt(0).toUpperCase() + variant.slice(1)}Text` as keyof typeof CommonStyles] as TextStyle]}>
      {label}
    </Text>
  </View>
);

// ─── Section Title ────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ title: string; style?: TextStyle }> = ({ title, style }) => (
  <Text style={[CommonStyles.sectionTitle, style]}>{title}</Text>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon: string; title: string; subtitle: string; style?: any }> = ({ icon, title, subtitle, style }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────
export const LoadingScreen: React.FC = () => (
  <View style={[CommonStyles.flex1, CommonStyles.center, { backgroundColor: Colors.bg }]}>
    <ActivityIndicator size="large" color={Colors.blue} />
  </View>
);

import { Image } from 'react-native';

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  imageUri?: string;
  size?: number;
  color?: string;
  textColor?: string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials, imageUri, size = 44, color = Colors.blue,
  textColor = Colors.white, borderRadius = 13, style,
}) => (
  <View style={[
    { width: size, height: size, borderRadius, backgroundColor: color,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style
  ]}>
    {imageUri ? (
      <Image source={{ uri: imageUri }} style={{ width: size, height: size }} />
    ) : (
      <Text style={{ color: textColor, fontWeight: Typography.bold, fontSize: size * 0.32 }}>
        {initials}
      </Text>
    )}
  </View>
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress, color = Colors.gold, height = 6, style,
}) => (
  <View style={[styles.progressTrack, { height }, style]}>
    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color, height }]} />
  </View>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle; onPress?: () => void }> = ({
  children, style, onPress,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[CommonStyles.card, style]} onPress={onPress} activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[CommonStyles.card, style]}>{children}</View>;
};

export { StatusTimeline } from './StatusTimeline';

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  btn: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: { width: '100%' },
  btn_primary: { backgroundColor: Colors.blue },
  btn_secondary: { backgroundColor: Colors.blueLight },
  btn_outline: { backgroundColor: Colors.transparent, borderWidth: 1.5, borderColor: Colors.blue },
  btn_ghost: { backgroundColor: Colors.transparent },
  btn_sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  btn_md: { paddingVertical: 10, paddingHorizontal: Spacing.lg },
  btn_lg: { paddingVertical: 14, paddingHorizontal: Spacing.lg },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontWeight: Typography.semibold },
  btnText_primary: { color: Colors.white },
  btnText_secondary: { color: Colors.blue },
  btnText_outline: { color: Colors.blue },
  btnText_ghost: { color: Colors.blue },
  btnText_sm: { fontSize: Typography.base },
  btnText_md: { fontSize: Typography.md },
  btnText_lg: { fontSize: Typography.lg },
  emptyState: { alignItems: 'center', padding: Spacing['4xl'], gap: Spacing.md },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontSize: Typography.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  progressTrack: { backgroundColor: Colors.grayLight, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { borderRadius: Radius.full },
});
