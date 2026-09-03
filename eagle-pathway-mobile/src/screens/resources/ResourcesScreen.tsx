import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { ResourceCard } from '@/components/ResourceCard';
import { resourcesService, type Resource } from '@/services/resources';
import { useAuthStore } from '@/store/authStore';
import { getUserRole } from '@/utils/role';
import { withTimeout } from '@/utils/asyncUtils';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    withTimeout(resourcesService.list(role), 3500)
      .then(setResources)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [role]);

  useEffect(() => { load(); }, [load]);

  const allCategories = useMemo(() => {
    const set = new Set<string>(['All']);
    resources.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [resources]);

  const filtered = useMemo(() => {
    let result = resources;
    if (selectedCategory !== 'All') {
      result = result.filter(r => (r.category || 'General').toLowerCase() === selectedCategory.toLowerCase());
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [resources, query, selectedCategory]);

  const sections = useMemo(() => groupByCategory(filtered), [filtered]);

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          style={s.backBtn} 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} 
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Study &amp; Teaching Hub</Text>
          <Text style={s.subtitle} numberOfLines={1}>Handbooks, curriculum guides &amp; templates</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={s.searchWrap}>
        <View style={s.searchInputRow}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={s.search}
            placeholder="Search guides, cheat sheets, SOPs..."
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters Pills */}
        {allCategories.length > 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryPillRow}>
            {allCategories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.filterPill, active && s.filterPillActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.filterPillText, active && s.filterPillTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
          <ListSkeleton count={4} />
        </View>
      ) : error && resources.length === 0 ? (
        <ErrorState subtitle="We couldn't load resources. Check your connection and retry." onRetry={load} />
      ) : resources.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="No resources yet"
          subtitle="Helpful guides, cheat sheets, and templates are on the way — check back soon."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search-outline" title="No matches found" subtitle={`Nothing matches "${query.trim()}". Try different keywords.`} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeaderWrap}>
              <Text style={s.sectionHeader}>{section.title}</Text>
              <View style={s.sectionCountBadge}>
                <Text style={s.sectionCountText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => <ResourceCard resource={item} />}
          ListFooterComponent={
            <TouchableOpacity 
              style={s.aiPromptCard}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.88}
            >
              <View style={s.aiIconCircle}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.aiPromptTitle}>Looking for specific materials?</Text>
                <Text style={s.aiPromptSub}>
                  Ask Eagle AI to draft practice problems, essay templates, or summaries.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#2563EB" />
            </TouchableOpacity>
          }
        />
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
  title: { 
    fontSize: Typography.xl, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  subtitle: { 
    fontSize: Typography.xs, 
    color: '#64748B', 
    marginTop: 2,
  },
  searchWrap: { 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.md, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0', 
    paddingBottom: Spacing.md,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  search: { 
    flex: 1,
    paddingVertical: 10, 
    fontSize: Typography.sm, 
    color: '#0F172A', 
  },
  categoryPillRow: {
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterPillText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionHeader: { 
    fontSize: Typography.sm, 
    fontWeight: Typography.bold, 
    color: '#475569', 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  sectionCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#2563EB',
  },
  aiPromptCard: {
    marginTop: Spacing.xl,
    backgroundColor: '#EFF6FF',
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPromptTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#1E40AF',
  },
  aiPromptSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
    lineHeight: 16,
  },
});
