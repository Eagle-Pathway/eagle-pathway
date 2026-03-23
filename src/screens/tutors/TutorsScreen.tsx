import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../../utils/theme';
import { Pill, EmptyState, Avatar } from '../../components/common';
import { tutorsService } from '../../services/tutors';
import { Tutor } from '../../types';

const SUBJECTS = ['All', 'Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'IELTS Prep', 'History'];
const MODES = ['All', 'Online', 'In-Person', 'Top Rated'];

export default function TutorsScreen() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [activeMode, setActiveMode] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const data = await tutorsService.getTutors({
        subject: activeSubject !== 'All' ? activeSubject : undefined,
        isOnline: activeMode === 'Online' ? true : undefined,
        isInPerson: activeMode === 'In-Person' ? true : undefined,
        search: search || undefined,
      });
      setTutors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeSubject, activeMode]);

  const filtered = tutors.filter(t =>
    !search || t.user?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Tutor</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
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

      {/* Subject filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
        {SUBJECTS.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, activeSubject === s && styles.chipActive]}
            onPress={() => setActiveSubject(s)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeSubject === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mode filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll2} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, styles.chipSm, activeMode === m && styles.chipActive]}
            onPress={() => setActiveMode(m)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeMode === m && styles.chipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={CommonStyles.center}><ActivityIndicator color={Colors.blue} size="large" /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="👨‍🏫" title="No tutors found" subtitle="Try adjusting your search or filters" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TutorCard tutor={item} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
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
    <TouchableOpacity
      style={styles.tutorCard}
      onPress={() => router.push({ pathname: '/tutor-profile', params: { tutorId: tutor.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.tutorTop}>
        <Avatar initials={initials} size={52} borderRadius={15} color={colors[colorIndex]} />
        <View style={styles.tutorInfo}>
          <Text style={styles.tutorName}>{tutor.user?.full_name || 'Tutor'}</Text>
          <Text style={styles.tutorSubject}>{tutor.subjects.slice(0, 2).join(', ')} · {tutor.grade_levels[0]}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
            <Text style={styles.rating}>⭐ {tutor.rating.toFixed(1)}</Text>
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
        <TouchableOpacity style={styles.btnMsg} activeOpacity={0.85}>
          <Text style={{ fontSize: 16 }}>💬</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
  filterScroll2: { marginTop: Spacing.sm, marginBottom: Spacing.md },
  chip: {
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 6,
    backgroundColor: Colors.card,
  },
  chipSm: { paddingVertical: 4 },
  chipActive: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  chipTextActive: { color: Colors.blue },
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
