import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { ResourceCard } from '@/components/ResourceCard';
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
          renderItem={({ item }) => <ResourceCard resource={item} />}
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
});
