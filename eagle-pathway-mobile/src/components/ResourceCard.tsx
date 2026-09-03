import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import type { Resource } from '@/services/resources';
import { ScaleBounce } from './common';

/**
 * Modern Resource Card with high-contrast typography, category badges,
 * and clean action affordance.
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const isFile = resource.resource_type === 'file';

  return (
    <ScaleBounce
      style={s.card}
      onPress={() => router.push(`/resources/${resource.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${resource.title}`}
    >
      <View style={[s.iconBox, { backgroundColor: isFile ? '#EFF6FF' : '#ECFDF5', borderColor: isFile ? '#BFDBFE' : '#A7F3D0' }]}>
        <Ionicons 
          name={isFile ? 'document-text' : 'globe-outline'} 
          size={22} 
          color={isFile ? '#2563EB' : '#059669'} 
        />
      </View>

      <View style={{ flex: 1 }}>
        <View style={s.topMetaRow}>
          <View style={s.categoryPill}>
            <Text style={s.categoryText}>{resource.category || 'Guide'}</Text>
          </View>
          <View style={s.typeTag}>
            <Text style={s.typeTagText}>{isFile ? 'PDF Document' : 'Official Link'}</Text>
          </View>
        </View>

        <Text style={s.cardTitle} numberOfLines={2}>{resource.title}</Text>
        
        {!!resource.description && (
          <Text style={s.cardDesc} numberOfLines={2}>
            {resource.description}
          </Text>
        )}

        <View style={s.cardFooter}>
          <View style={s.actionBtn}>
            <Text style={s.actionText}>View Resource</Text>
            <Ionicons name="arrow-forward" size={12} color="#2563EB" />
          </View>
        </View>
      </View>
    </ScaleBounce>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#475569',
    textTransform: 'uppercase',
  },
  typeTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: Typography.medium,
  },
  cardTitle: { 
    fontSize: 15, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
    lineHeight: 20,
  },
  cardDesc: { 
    fontSize: Typography.xs, 
    color: '#64748B', 
    marginTop: 4, 
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
  },
  actionText: { 
    fontSize: 11, 
    fontWeight: Typography.bold, 
    color: '#2563EB',
  },
});
