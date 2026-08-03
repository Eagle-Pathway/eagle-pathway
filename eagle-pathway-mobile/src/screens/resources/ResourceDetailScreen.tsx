import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
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

  // Same signed-URL flow the list used to run on tap — now behind an explicit
  // button on the detail screen.
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
      Alert.alert('Unavailable', "We couldn't open this resource. Please try again.");
    } finally {
      setOpening(false);
    }
  }, [resource, opening]);

  const isFile = resource?.resource_type === 'file';
  const actionLabel = isFile ? 'Open Document' : 'Open Link';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={goBack} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Resource</Text>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.xl, paddingTop: 40 }}>
          <Skeleton style={[s.iconBox, { width: 64, height: 64, borderRadius: 18 }]} />
          <Skeleton style={{ width: 100, height: 16, borderRadius: 4, marginTop: Spacing.xs, marginBottom: Spacing.xs }} />
          <Skeleton style={{ width: '80%', height: 32, borderRadius: 8, marginBottom: Spacing.lg }} />
          <Skeleton style={{ width: '100%', height: 20, borderRadius: 4, marginBottom: Spacing.xs }} />
          <Skeleton style={{ width: '90%', height: 20, borderRadius: 4, marginBottom: Spacing.xs }} />
          <Skeleton style={{ width: '95%', height: 20, borderRadius: 4, marginBottom: Spacing.xl }} />
          <Skeleton style={[s.metaRow, { height: 50, borderWidth: 0 }]} />
        </View>
      ) : error || !resource ? (
        <ErrorState subtitle="We couldn't load this resource. Check your connection and retry." onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <View style={[s.iconBox, { backgroundColor: isFile ? Colors.blueLight : Colors.greenLight }]}>
            <Text style={{ fontSize: 30 }}>{isFile ? '📄' : '🔗'}</Text>
          </View>

          <Text style={s.category}>{resource.category || 'General'}</Text>
          <Text style={s.title}>{resource.title}</Text>

          {!!resource.description && <Text style={s.description}>{resource.description}</Text>}

          {isFile && (resource.file_name || formatBytes(resource.file_size)) && (
            <View style={s.metaRow}>
              {!!resource.file_name && <Text style={s.meta} numberOfLines={1}>{resource.file_name}</Text>}
              {!!formatBytes(resource.file_size) && <Text style={s.metaDim}>{formatBytes(resource.file_size)}</Text>}
            </View>
          )}
        </ScrollView>
      )}

      {!loading && !error && resource && (
        <View style={s.footer}>
          <TouchableOpacity style={s.actionBtn} onPress={openResource} disabled={opening} activeOpacity={0.85}>
            {opening ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={s.actionText}>{actionLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  category: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text, marginTop: Spacing.xs },
  description: { fontSize: Typography.md, color: Colors.text, lineHeight: 24, marginTop: Spacing.lg },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xl, padding: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  meta: { flex: 1, fontSize: Typography.sm, color: Colors.text },
  metaDim: { fontSize: Typography.sm, color: Colors.textSecondary },
  footer: { padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  actionBtn: { backgroundColor: Colors.blue, borderRadius: Radius.lg, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.white },
});
