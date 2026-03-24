import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState } from '@/components/common';
import { useAppStore } from '@/store/appStore';
import { Scholarship } from '@/types';
import { format } from 'date-fns';

const DEGREE_FILTERS = ['All', 'Undergraduate', 'Masters', 'PhD', 'Fully Funded'];

export default function ScholarshipsScreen() {
  const { scholarships, savedScholarshipIds, loadScholarships, toggleSaveScholarship, isLoadingScholarships } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => { loadScholarships(); }, []);

  const filtered = scholarships.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'All' ||
      (activeFilter === 'Fully Funded' && s.funding_type === 'fully_funded') ||
      s.degree_levels.some(d => d.toLowerCase() === activeFilter.toLowerCase());
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Scholarships</Text>
            <Text style={styles.heroSub}>{scholarships.length} opportunities available</Text>
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
        <View style={[CommonStyles.flex1, CommonStyles.center]}><ActivityIndicator color={Colors.blue} size="large" /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎓" title="No scholarships found" subtitle="Try adjusting your search or filters" />
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
  const isDeadlineSoon = new Date(s.deadline) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.cardTop}>
        <View style={{ flexDirection: 'row', gap: Spacing.md, flex: 1, alignItems: 'flex-start' }}>
          <View style={styles.flagBox}><Text style={{ fontSize: 22 }}>{s.country_flag}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.schName} numberOfLines={2}>{s.name}</Text>
            <Text style={styles.schOrg} numberOfLines={1}>{s.organization}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onSave} style={styles.saveBtn} activeOpacity={0.8}>
          <Text style={{ fontSize: 18 }}>{isSaved ? '🔖' : '🏷️'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardMeta}>
        <View style={[styles.metaPill, { backgroundColor: Colors.redLight }]}>
          <Text style={[styles.metaText, { color: Colors.red }]}>
            {isDeadlineSoon ? '⚡ ' : ''}Deadline: {format(new Date(s.deadline), 'MMM d, yyyy')}
          </Text>
        </View>
        {s.degree_levels.slice(0, 2).map(d => (
          <View key={d} style={[styles.metaPill, { backgroundColor: Colors.blueLight }]}>
            <Text style={[styles.metaText, { color: Colors.blue }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
          </View>
        ))}
        <View style={[styles.metaPill, { backgroundColor: Colors.greenLight }]}>
          <Text style={[styles.metaText, { color: Colors.green }]}>
            {s.funding_type === 'fully_funded' ? 'Fully Funded' : s.funding_details}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
  card: { marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  flagBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.grayLight, alignItems: 'center', justifyContent: 'center' },
  schName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, marginBottom: 3 },
  schOrg: { fontSize: Typography.sm, color: Colors.textSecondary },
  saveBtn: { width: 32, height: 32, backgroundColor: Colors.grayLight, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  metaPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 6 },
  metaText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
});
