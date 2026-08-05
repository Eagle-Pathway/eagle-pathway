import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Pill, EmptyState, ErrorState, Avatar, Dropdown, Skeleton, ScaleBounce } from '@/components/common';
import { tutorsService } from '@/services/tutors';
import { Tutor } from '@/types';

import { withTimeout } from '@/utils/asyncUtils';

const SUBJECT_OPTIONS = [
  { label: 'Mathematics', value: 'Mathematics' },
  { label: 'English', value: 'English' },
  { label: 'Physics', value: 'Physics' },
  { label: 'Chemistry', value: 'Chemistry' },
  { label: 'Biology', value: 'Biology' },
  { label: 'IELTS Prep', value: 'IELTS Prep' },
  { label: 'History', value: 'History' },
];

const MODES = ['All', 'Online', 'In-Person', 'Top Rated'];

export default function TutorsScreen() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [activeMode, setActiveMode] = useState('All');
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await withTimeout(tutorsService.getTutors({
        isOnline: activeMode === 'Online' ? true : undefined,
        isInPerson: activeMode === 'In-Person' ? true : undefined,
        search: search || undefined,
      }), 3500);
      setTutors(data);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeMode]);

  const locationOptions = React.useMemo(() => {
    const locs = Array.from(new Set(tutors.map(t => t.location).filter(Boolean))) as string[];
    return [{ label: 'All Locations', value: 'All' }, ...locs.map(l => ({ label: l, value: l }))];
  }, [tutors]);

  const filtered = tutors.filter(t => {
    const matchesSearch = !search || 
      t.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()));

    const matchesSubject = selectedSubjects.length === 0 ||
      t.subjects.some(sub => selectedSubjects.includes(sub));

    const matchesLocation = selectedLocation === 'All' ||
      t.location === selectedLocation;

    const matchesMode = activeMode !== 'Top Rated' || t.rating >= 4.8;

    return matchesSearch && matchesSubject && matchesLocation && matchesMode;
  });

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find a Tutor</Text>
          <View style={styles.filterBtn}>
            <Ionicons name="options-outline" size={20} color={Colors.text} />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput style={styles.searchInput} editable={false} placeholder="Loading tutors..." placeholderTextColor={Colors.textSecondary} />
        </View>

        {/* Skeletons list */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: Spacing.md, paddingBottom: 100 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.tutorCard}>
              <View style={styles.tutorTop}>
                <Skeleton width={52} height={52} borderRadius={15} />
                <View style={[styles.tutorInfo, { gap: 6 }]}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="80%" height={12} />
                  <Skeleton width="40%" height={12} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Skeleton width={60} height={16} />
                  <Skeleton width={40} height={10} />
                  <Skeleton width={50} height={18} borderRadius={6} />
                </View>
              </View>
              <View style={[styles.tags, { gap: 6 }]}>
                <Skeleton width={60} height={20} borderRadius={6} />
                <Skeleton width={70} height={20} borderRadius={6} />
                <Skeleton width={80} height={20} borderRadius={6} />
              </View>
              <View style={[styles.tutorActions, { gap: Spacing.sm }]}>
                <Skeleton width="80%" height={36} borderRadius={10} style={{ flex: 1 }} />
                <Skeleton width={40} height={36} borderRadius={10} />
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Tutor</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject or name..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
          placeholderTextColor={Colors.textSecondary}
          returnKeyType="search"
        />
      </View>

      {/* Dropdown Filters */}
      <View style={{ flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginTop: Spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Dropdown
            label="Subjects"
            options={SUBJECT_OPTIONS}
            selectedValue=""
            onValueChange={(val) => {
              if (val && !selectedSubjects.includes(val)) {
                setSelectedSubjects([...selectedSubjects, val]);
              }
            }}
            placeholder="Select Subjects"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Dropdown
            label="Location"
            options={locationOptions}
            selectedValue={selectedLocation}
            onValueChange={setSelectedLocation}
            placeholder="Select Location"
          />
        </View>
      </View>

      {/* Selected Subject Chips */}
      {selectedSubjects.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginVertical: 6 }} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.xs, alignItems: 'center' }}>
          {selectedSubjects.map(sub => (
            <TouchableOpacity
              key={sub}
              style={[styles.chip, styles.chipActive, { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, minHeight: 32 }]}
              onPress={() => setSelectedSubjects(selectedSubjects.filter(s => s !== sub))}
            >
              <Text style={styles.chipTextActive}>{sub}</Text>
              <Text style={{ fontSize: 12, color: Colors.blue, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Mode filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll2, { flexGrow: 0 }]} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm, alignItems: 'center' }}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, styles.chipSm, activeMode === m && styles.chipActive]}
            onPress={() => setActiveMode(m)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeMode === m && styles.chipTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && tutors.length === 0 ? (
        <ErrorState subtitle="We couldn't load tutors. Check your connection and retry." onRetry={load} style={{ padding: Spacing.xl }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="No tutors found"
          subtitle="Try adjusting your search or filters"
          actionLabel="Clear Filters"
          onAction={() => { setSearch(''); setSelectedSubjects([]); setSelectedLocation('All'); setActiveMode('All'); }}
          style={{ padding: Spacing.xl }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TutorCard tutor={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}
          initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  const initials = tutor.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const colors = ['#1E4D9B', '#9d174d', '#065f46', '#7e22ce', '#c2410c'];
  const colorIndex = tutor.id.charCodeAt(0) % colors.length;

  return (
    <ScaleBounce
      style={styles.tutorCard}
      onPress={() => router.push({ pathname: '/tutor-profile', params: { tutorId: tutor.id } })}
    >
      <View style={styles.tutorTop}>
        <Avatar initials={initials} size={52} borderRadius={15} color={colors[colorIndex]} />
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>{tutor.user?.full_name || 'Tutor'}</Text>
          <Text style={styles.tutorSubject}>{tutor.subjects.slice(0, 2).join(', ')} · {tutor.grade_levels[0]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
            <Text style={styles.rating}><Ionicons name="star" size={12} color="#f59e0b" /> {tutor.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({tutor.total_reviews} reviews)</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>ETB {tutor.hourly_rate}</Text>
          <Text style={styles.priceLabel}>per hour</Text>
          <View style={{ marginTop: 4 }}>
            {tutor.is_online && <Pill label="Online" variant="green" />}
            {tutor.is_in_person && !tutor.is_online && <Pill label="In-Person" variant="blue" />}
          </View>
        </View>
      </View>

      <View style={styles.tags}>
        {tutor.subjects.slice(0, 3).map(s => (
          <View key={s} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
        ))}
        {tutor.location && <View style={styles.tag}><Text style={styles.tagText}>{tutor.location}</Text></View>}
      </View>

      <View style={styles.tutorActions}>
        <TouchableOpacity
          style={styles.btnBook}
          onPress={() => router.push({ pathname: '/booking', params: { tutorId: tutor.id } })}
          activeOpacity={0.85}
        >
          <Text style={styles.btnBookText}>Book Session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnMsg}
          onPress={() => {
            router.push({
              pathname: '/chat/[id]',
              params: {
                id: tutor.user_id,
                fullName: tutor.user?.full_name,
              }
            });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors.blue} />
        </TouchableOpacity>
      </View>
    </ScaleBounce>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  filterBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 16 },
  searchBar: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.md, marginBottom: 4,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 10, gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: Typography.md, color: Colors.text },
  filterScroll: { marginTop: Spacing.md },
  filterScroll2: { marginTop: Spacing.xs, marginBottom: Spacing.md },
  chip: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    minHeight: 36,
  },
  chipSm: { paddingVertical: 6, paddingHorizontal: 14, minHeight: 34 },
  chipActive: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, includeFontPadding: false },
  chipTextActive: { color: Colors.blue, fontWeight: Typography.bold },
  tutorCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius['2xl'],
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  tutorTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  tutorSubject: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  rating: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#92400e' },
  reviewCount: { fontSize: Typography.sm, color: Colors.textSecondary },
  price: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.blue },
  priceLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  tags: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.md },
  tag: { backgroundColor: Colors.grayLight, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: Typography.sm, color: Colors.textSecondary },
  tutorActions: { flexDirection: 'row', gap: Spacing.sm },
  btnBook: { flex: 1, backgroundColor: Colors.blue, borderRadius: 10, padding: 10, alignItems: 'center' },
  btnBookText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.base },
  btnMsg: { width: 40, height: 40, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
