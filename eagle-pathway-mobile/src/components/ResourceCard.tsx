import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import type { Resource } from '@/services/resources';

/**
 * Reusable resource card. Tapping it navigates to the resource detail screen —
 * it never opens a browser directly. The actual open/download (signed URL for
 * files, external URL for links) happens from the detail screen.
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const isFile = resource.resource_type === 'file';
  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/resources/${resource.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${resource.title}`}
    >
      <View style={[s.iconBox, { backgroundColor: isFile ? Colors.blueLight : Colors.greenLight }]}>
        <Text style={{ fontSize: 20 }}>{isFile ? '📄' : '🔗'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.cardTitle}>{resource.title}</Text>
        {!!resource.description && (
          <Text style={s.cardDesc} numberOfLines={2}>
            {resource.description}
          </Text>
        )}
      </View>
      <Text style={s.action}>View</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  action: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue },
});
