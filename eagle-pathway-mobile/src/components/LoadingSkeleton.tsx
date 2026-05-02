import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing } from '../utils/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius: borderRadius || height / 2 },
        { opacity },
        style,
      ]}
    />
  );
}

interface ListSkeletonProps {
  count?: number;
  gap?: number;
}

export function ListSkeleton({ count = 5, gap = 12 }: ListSkeletonProps) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.listItem}>
          <Skeleton width={44} height={44} borderRadius={Radius.lg} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <View style={{ gap: Spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width={50} height={50} borderRadius={Radius.lg} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="80%" height={14} />
              <Skeleton width="50%" height={12} />
            </View>
          </View>
          <Skeleton width="100%" height={1} style={{ marginTop: 12 }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Skeleton width={60} height={24} borderRadius={Radius.full} />
            <Skeleton width={80} height={24} borderRadius={Radius.full} />
          </View>
        </View>
      ))}
    </View>
  );
}

interface DetailSkeletonProps {
  type?: 'profile' | 'scholarship' | 'generic';
}

export function DetailSkeleton({ type = 'generic' }: DetailSkeletonProps) {
  if (type === 'profile') {
    return (
      <View style={styles.detailProfile}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width="50%" height={20} style={{ marginTop: Spacing.lg }} />
        <Skeleton width="30%" height={14} />
        <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg }}>
          <Skeleton width={100} height={36} borderRadius={Radius.lg} />
          <Skeleton width={100} height={36} borderRadius={Radius.lg} />
        </View>
      </View>
    );
  }

  if (type === 'scholarship') {
    return (
      <View style={styles.detailGeneric}>
        <View style={styles.detailRow}>
          <Skeleton width={60} height={60} borderRadius={Radius.lg} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="80%" height={18} />
            <Skeleton width="50%" height={14} />
          </View>
        </View>
        <Skeleton width="100%" height={1} style={{ marginVertical: Spacing.lg }} />
        <View style={{ gap: Spacing.md }}>
          <Skeleton width="100%" height={14} />
          <Skeleton width="90%" height={14} />
          <Skeleton width="95%" height={14} />
          <Skeleton width="60%" height={14} />
        </View>
        <Skeleton width="100%" height={48} borderRadius={Radius.lg} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={styles.detailGeneric}>
      <Skeleton width="100%" height={16} />
      <Skeleton width="90%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="70%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="100%" height={200} borderRadius={Radius.lg} style={{ marginTop: 20 }} />
    </View>
  );
}

interface SearchSkeletonProps {
  count?: number;
}

export function SearchSkeleton({ count = 6 }: SearchSkeletonProps) {
  return (
    <View style={{ gap: Spacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.searchItem}>
          <Skeleton width={40} height={40} borderRadius={Radius.md} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="75%" height={14} />
            <Skeleton width="50%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.grayLight,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailProfile: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing['4xl'],
    paddingTop: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  detailGeneric: {
    flex: 1,
    padding: Spacing.xl,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});