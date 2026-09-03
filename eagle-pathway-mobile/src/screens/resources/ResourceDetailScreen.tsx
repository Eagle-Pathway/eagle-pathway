import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator } from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ErrorState, Skeleton } from '@/components/common';
import { resourcesService, type Resource } from '@/services/resources';

function formatBytes(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [opening, setOpening] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    resourcesService
      .getById(id)
      .then((r) => {
        if (!r) setError(true);
        else setResource(r);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/resources'));

  const openResource = useCallback(async () => {
    if (!resource || opening) return;
    try {
      if (resource.resource_type === 'link') {
        if (!resource.external_url) throw new Error('missing url');
        let targetUrl = resource.external_url.trim();
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          targetUrl = `https://${targetUrl}`;
        }
        await Linking.openURL(targetUrl);
        resourcesService.incrementDownload(resource.id);
        return;
      }
      if (!resource.file_path) throw new Error('missing file');
      setOpening(true);
      const url = await resourcesService.getFileUrl(resource.file_path);
      if (!url) throw new Error('sign failed');
      await Linking.openURL(url);
      resourcesService.incrementDownload(resource.id);
    } catch {
      toast.error('Unavailable', "We couldn't open this resource. Please try again.");
    } finally {
      setOpening(false);
    }
  }, [resource, opening]);

  const isFile = resource?.resource_type === 'file';
  const actionLabel = isFile ? 'Open PDF Document' : 'Open Official Link';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          style={s.backBtn} 
          onPress={goBack} 
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Resource Details</Text>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.xl, paddingTop: 30 }}>
          <Skeleton width={64} height={64} borderRadius={18} style={{ marginBottom: Spacing.md }} />
          <Skeleton width={100} height={18} borderRadius={6} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="85%" height={28} borderRadius={8} style={{ marginBottom: Spacing.lg }} />
          <Skeleton width="100%" height={20} borderRadius={4} style={{ marginBottom: Spacing.xs }} />
          <Skeleton width="90%" height={20} borderRadius={4} style={{ marginBottom: Spacing.xs }} />
        </View>
      ) : error || !resource ? (
        <ErrorState subtitle="We couldn't load this resource. Check your connection and retry." onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {/* Top Hero Icon Card */}
          <View style={[s.iconBox, { backgroundColor: isFile ? '#EFF6FF' : '#ECFDF5', borderColor: isFile ? '#BFDBFE' : '#A7F3D0' }]}>
            <Ionicons 
              name={isFile ? 'document-text' : 'globe-outline'} 
              size={32} 
              color={isFile ? '#2563EB' : '#059669'} 
            />
          </View>

          <View style={s.categoryRow}>
            <View style={s.categoryPill}>
              <Text style={s.category}>{resource.category || 'General'}</Text>
            </View>
            <View style={s.typeTag}>
              <Text style={s.typeTagText}>{isFile ? 'PDF Document' : 'External Link'}</Text>
            </View>
          </View>

          <Text style={s.title}>{resource.title}</Text>

          {!!resource.description && (
            <View style={s.descCard}>
              <Text style={s.descHeading}>Overview &amp; Instructions</Text>
              <Text style={s.description}>{resource.description}</Text>
            </View>
          )}

          {isFile && (resource.file_name || formatBytes(resource.file_size)) && (
            <View style={s.metaRow}>
              <Ionicons name="attach-outline" size={18} color="#2563EB" />
              <View style={{ flex: 1 }}>
                {!!resource.file_name && <Text style={s.meta} numberOfLines={1}>{resource.file_name}</Text>}
                {!!formatBytes(resource.file_size) && <Text style={s.metaDim}>{formatBytes(resource.file_size)}</Text>}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {!loading && !error && resource && (
        <View style={s.footer}>
          <TouchableOpacity 
            style={s.actionBtn} 
            onPress={openResource} 
            disabled={opening} 
            activeOpacity={0.88}
          >
            {opening ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name={isFile ? 'download-outline' : 'open-outline'} size={18} color="#FFFFFF" />
                <Text style={s.actionText}>{actionLabel}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.lg, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { 
    width: 42, 
    height: 42, 
    backgroundColor: '#F1F5F9', 
    borderRadius: Radius.lg, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: { 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  iconBox: { 
    width: 68, 
    height: 68, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  category: { 
    fontSize: 11, 
    fontWeight: Typography.bold, 
    color: '#1E40AF', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  typeTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeTagText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  title: { 
    fontSize: 22, 
    fontWeight: Typography.bold, 
    color: '#0F172A', 
    lineHeight: 28,
  },
  descCard: {
    marginTop: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  descHeading: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  description: { 
    fontSize: Typography.sm, 
    color: '#475569', 
    lineHeight: 22, 
  },
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    marginTop: Spacing.md, 
    padding: Spacing.md, 
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius.xl, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
  },
  meta: { 
    fontSize: Typography.sm, 
    color: '#0F172A',
    fontWeight: Typography.semibold,
  },
  metaDim: { 
    fontSize: Typography.xs, 
    color: '#64748B',
    marginTop: 1,
  },
  footer: { 
    padding: Spacing.xl, 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    backgroundColor: '#FFFFFF',
  },
  actionBtn: { 
    backgroundColor: '#2563EB', 
    borderRadius: Radius.xl, 
    paddingVertical: 15, 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionText: { 
    fontSize: Typography.base, 
    fontWeight: Typography.bold, 
    color: '#FFFFFF',
  },
});
