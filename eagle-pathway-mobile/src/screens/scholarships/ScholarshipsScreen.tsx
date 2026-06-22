import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState, ScaleBounce } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { Scholarship } from '@/types';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getFlagEmoji } from '@eagle-pathway/shared';

const DEGREE_FILTERS = ['All', 'Undergraduate', 'Masters', 'PhD', 'Fully Funded'];

function freshnessLabel(scholarship: Scholarship) {
  if (scholarship.source_status === 'verified' && scholarship.verified_at) {
    return `Verified ${format(new Date(scholarship.verified_at), 'MMM d')}`;
  }
  if (scholarship.source_status === 'stale') return 'Needs recheck';
  if (scholarship.source_status === 'broken') return 'Link issue';
  return 'Unverified';
}

function freshnessTone(sourceStatus?: Scholarship['source_status']) {
  if (sourceStatus === 'verified') return { bg: Colors.greenLight, color: Colors.green };
  if (sourceStatus === 'broken') return { bg: Colors.redLight, color: Colors.red };
  return { bg: Colors.goldLight, color: Colors.goldDark };
}

export default function ScholarshipsScreen({ hideBack = false }: { hideBack?: boolean }) {
  const { scholarships, savedScholarshipIds, loadScholarships, toggleSaveScholarship, isLoadingScholarships } = useScholarshipStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try { await loadScholarships(); } catch { setError(true); }
  }, [loadScholarships]);

  useEffect(() => { load(); }, []);

  const filtered = (scholarships || []).filter(s => {
    const matchSearch = !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.country || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' ||
      (activeFilter === 'Fully Funded' && s.funding_type === 'fully_funded') ||
      (s.degree_levels && s.degree_levels.some(d => d.toLowerCase() === activeFilter.toLowerCase()));
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={hideBack ? [] : ['top']}>
      <View style={styles.hero}>
        {!hideBack && (
          <View style={{ marginBottom: Spacing.md }}>
            <TouchableOpacity 
              style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }} 
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            >
              <Text style={{ fontSize: 20, color: Colors.white }}>←</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Scholarships</Text>
            <Text style={styles.heroSub}>{(scholarships || []).length} opportunities available</Text>
          </View>
          <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.8}>
            <Text style={{ fontSize: 16, color: Colors.white }}>⚙️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Country, university, field..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.md }} contentContainerStyle={{ gap: Spacing.sm }}>
          {DEGREE_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoadingScholarships ? (
        <View style={{ flex: 1, paddingTop: Spacing.lg, paddingHorizontal: Spacing.xl }}>
          <ListSkeleton count={4} />
        </View>
      ) : error && (scholarships || []).length === 0 ? (
        <ErrorState subtitle="We couldn't load scholarships. Check your connection and retry." onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon="🎓" 
          title="No scholarships found" 
          subtitle="Try adjusting your search or filters"
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setActiveFilter('All'); }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <ScholarshipCard
              scholarship={item}
              isSaved={savedScholarshipIds.includes(item.id)}
              onSave={() => toggleSaveScholarship(item.id)}
            />
          )}
          contentContainerStyle={{ paddingTop: Spacing.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function ScholarshipCard({ scholarship: s, isSaved, onSave }: { scholarship: Scholarship; isSaved: boolean; onSave: () => void }) {
  const freshness = freshnessTone(s.source_status);

  return (
    <ScaleBounce
      style={styles.card}
      onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
    >
      {s.image_url && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: s.image_url }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          <View style={styles.imageBadge}>
            <Text style={styles.imageBadgeText}>{s.funding_type === 'fully_funded' ? 'Full Funding' : 'Partial'}</Text>
          </View>
        </View>
      )}
      
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.flagAndTitle}>
            <View style={[styles.flagCircle, { padding: 4 }]}>
              {(() => {
                const flag = getFlagEmoji(s.country_flag);
                const isWord = /[a-zA-Z]/.test(flag);
                return (
                  <Text 
                    numberOfLines={1} 
                    adjustsFontSizeToFit 
                    minimumFontScale={0.5} 
                    style={{ 
                      fontSize: isWord ? 9 : 22, 
                      fontWeight: isWord ? 'bold' : 'normal', 
                      textAlign: 'center', 
                      color: Colors.text 
                    }}
                  >
                    {flag}
                  </Text>
                );
              })()}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.schName} numberOfLines={2}>{s.name}</Text>
              <Text style={styles.schOrg} numberOfLines={1}>{s.organization}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.7}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={20} color={isSaved ? Colors.blue : Colors.textSecondary} />
          </TouchableOpacity>
        </View>
 
        <View style={styles.cardFooter}>
          <View style={styles.metaRow}>
            {s.deadline && (
              <View style={[styles.metaPill, { backgroundColor: Colors.redLight }]}>
                <Ionicons name="time-outline" size={12} color={Colors.red} style={{ marginRight: 4 }} />
                <Text style={[styles.metaText, { color: Colors.red }]}>
                  {format(new Date(s.deadline), 'MMM d')}
                </Text>
              </View>
            )}
            <View style={[styles.metaPill, { backgroundColor: Colors.blueLight }]}>
               <Ionicons name="location-outline" size={12} color={Colors.blue} style={{ marginRight: 4 }} />
               <Text style={[styles.metaText, { color: Colors.blue }]}>{s.country || 'International'}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: freshness.bg }]}>
              <Ionicons name="shield-checkmark-outline" size={12} color={freshness.color} style={{ marginRight: 4 }} />
              <Text style={[styles.metaText, { color: freshness.color }]}>{freshnessLabel(s)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.border} />
        </View>
      </View>
    </ScaleBounce>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['2xl'] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  heroTitle: { fontSize: Typography['5xl'], fontWeight: Typography.bold, color: Colors.white },
  heroSub: { fontSize: Typography.base, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  filterIconBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchBar: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  searchInput: { flex: 1, fontSize: Typography.md, color: Colors.white },
  filterChip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, backgroundColor: 'transparent' },
  filterChipActive: { borderColor: 'rgba(255,255,255,0.5)', backgroundColor: 'rgba(255,255,255,0.15)' },
  filterChipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: 'rgba(255,255,255,0.7)' },
  filterChipTextActive: { color: Colors.white },
  card: { 
    marginHorizontal: Spacing.xl, 
    marginBottom: Spacing.lg, 
    backgroundColor: Colors.card, 
    borderRadius: Radius['2xl'], 
    borderWidth: 1, 
    borderColor: Colors.border, 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: { width: '100%', height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  imageBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  imageBadgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  cardContent: { padding: Spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  flagAndTitle: { flexDirection: 'row', gap: Spacing.md, flex: 1, alignItems: 'center' },
  flagCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  schName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text, marginBottom: 2 },
  schOrg: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  saveBtn: { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  metaRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', flex: 1 },
  metaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  metaText: { fontSize: 11, fontWeight: 'bold' },
});
