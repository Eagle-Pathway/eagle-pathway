import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { resourcesService, type Resource } from '@/services/resources';
import { useAuthStore } from '@/store/authStore';
import { getUserRole } from '@/utils/role';

interface Section {
  title: string;
  data: Resource[];
}

function groupByCategory(items: Resource[]): Section[] {
  const map = new Map<string, Resource[]>();
  for (const r of items) {
    const key = r.category || 'General';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map, ([title, data]) => ({ title, data }));
}

export default function ResourcesScreen() {
  const { user } = useAuthStore();
  const role = getUserRole(user);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    resourcesService
      .list(role)
      .then(setResources)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q),
    );
  }, [resources, query]);

  const sections = useMemo(() => groupByCategory(filtered), [filtered]);

  const openResource = useCallback(async (item: Resource) => {
    if (openingId) return;
    try {
      if (item.resource_type === 'link') {
        if (!item.external_url) throw new Error('missing url');
        await Linking.openURL(item.external_url);
        resourcesService.incrementDownload(item.id);
        return;
      }
      // File: sign on demand, then hand off to the OS viewer/browser.
      if (!item.file_path) throw new Error('missing file');
      setOpeningId(item.id);
      const url = await resourcesService.getFileUrl(item.file_path);
      if (!url) throw new Error('sign failed');
      await Linking.openURL(url);
      resourcesService.incrementDownload(item.id);
    } catch {
      Alert.alert('Unavailable', "We couldn't open this resource. Please try again.");
    } finally {
      setOpeningId(null);
    }
  }, [openingId]);

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Resources</Text>
          <Text style={s.subtitle} numberOfLines={1}>Guides, templates and downloads picked for you</Text>
        </View>
      </View>

      {!loading && !error && resources.length > 0 && (
        <View style={s.searchWrap}>
          <TextInput
            style={s.search}
            placeholder="Search resources"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={Colors.textSecondary}
            returnKeyType="search"
          />
        </View>
      )}

      {loading ? (
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}><ListSkeleton count={5} /></View>
      ) : error && resources.length === 0 ? (
        <ErrorState subtitle="We couldn't load resources. Check your connection and retry." onRetry={load} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No resources yet"
          subtitle="Helpful guides and templates are on the way — check back soon."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No matches" subtitle={`Nothing matches "${query.trim()}".`} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={s.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => {
            const isFile = item.resource_type === 'file';
            const busy = openingId === item.id;
            return (
              <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => openResource(item)} disabled={busy}>
                <View style={[s.iconBox, { backgroundColor: isFile ? Colors.blueLight : Colors.greenLight }]}>
                  <Text style={{ fontSize: 20 }}>{isFile ? '📄' : '🔗'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  {!!item.description && <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>}
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={Colors.blue} />
                ) : (
                  <Text style={s.action}>{isFile ? 'Open' : 'View'}</Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  subtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  searchWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: Spacing.md },
  search: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, fontSize: Typography.md, color: Colors.text, backgroundColor: '#fafafa' },
  sectionHeader: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  cardDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 19 },
  action: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue },
});
