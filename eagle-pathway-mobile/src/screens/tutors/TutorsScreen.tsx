import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pill, EmptyState, ErrorState, Avatar, Skeleton, ScaleBounce } from '@/components/common';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { tutorsService } from '@/services/tutors';
import { Tutor } from '@/types';
import { withTimeout } from '@/utils/asyncUtils';

const MODES = ['All', 'Online', 'In-Person', 'Top Rated'];

export default function TutorsScreen() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const filtered = tutors.filter(t => {
    const s = search.trim().toLowerCase();
    if (!s && activeMode === 'All') return true;

    const fullName = t.user?.full_name?.toLowerCase() || '';
    const uni = t.user?.university_name?.toLowerCase() || '';
    const city = (t.user?.city || t.location || '').toLowerCase();
    const exp = (t.bio || t.user?.teaching_experience || '').toLowerCase();
    const allSubjects = (t.subjects || []).concat(t.user?.interested_subjects || []).map(sub => sub.toLowerCase());

    const matchesSearch = !s || 
      fullName.includes(s) ||
      uni.includes(s) ||
      city.includes(s) ||
      exp.includes(s) ||
      allSubjects.some(sub => sub.includes(s));

    const matchesMode = activeMode !== 'Top Rated' || t.rating >= 4.8;

    return matchesSearch && matchesMode;
  });

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Find a Tutor</Text>
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Find a Tutor</Text>
          <Text style={{ fontSize: Typography.xs, color: '#64748B', marginTop: 2 }}>
            Browse verified tutors or request a custom match
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/request-tutor' as any)}
          style={styles.requestBtn}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={13} color={Colors.white} style={{ marginRight: 4 }} />
          <Text style={styles.requestBtnText}>Request Tutor</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={16} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject, name, university, city..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={load}
          placeholderTextColor="#94A3B8"
          returnKeyType="search"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Mode filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={[styles.filterScroll2, { flexGrow: 0 }]} 
        contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm, alignItems: 'center' }}
      >
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.chip, styles.chipSm, activeMode === m && styles.chipActive]}
            onPress={() => setActiveMode(m)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, activeMode === m && styles.chipTextActive]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Prominent Request 1-on-1 Banner */}
      <TouchableOpacity
        style={styles.customBanner}
        onPress={() => router.push('/request-tutor' as any)}
        activeOpacity={0.88}
      >
        <View style={styles.customBannerIcon}>
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.customBannerTitle}>Can't find your exact match?</Text>
          <Text style={styles.customBannerSub}>Submit a 1-minute custom request &amp; let tutors apply directly.</Text>
        </View>
        <View style={styles.customBannerBtn}>
          <Text style={styles.customBannerBtnText}>Request</Text>
          <Ionicons name="arrow-forward" size={11} color="#2563EB" />
        </View>
      </TouchableOpacity>

      {error && tutors.length === 0 ? (
        <ErrorState subtitle="We couldn't load tutors. Check your connection and retry." onRetry={load} style={{ padding: Spacing.xl }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="school-outline"
          title="No tutors found"
          subtitle="Try adjusting your search or post a custom 1-on-1 tutoring request."
          actionLabel="Request a Tutor"
          onAction={() => router.push('/request-tutor' as any)}
          style={{ padding: Spacing.xl }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TutorCard tutor={item} />}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.blue} />}
          initialNumToRender={8} 
          maxToRenderPerBatch={8} 
          windowSize={5} 
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

function TutorCard({ tutor }: { tutor: Tutor }) {
  const tutorName = tutor.user?.full_name || 'Verified Tutor';
  const initials = tutorName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'T';

  const colors = ['#1E4D9B', '#9d174d', '#065f46', '#7e22ce', '#c2410c'];
  const colorIndex = tutor.id.charCodeAt(0) % colors.length;

  const subjectsList = (tutor.subjects && tutor.subjects.length > 0)
    ? tutor.subjects
    : (tutor.user?.interested_subjects && tutor.user.interested_subjects.length > 0 ? tutor.user.interested_subjects : []);

  const subtitleParts = [
    subjectsList.slice(0, 2).join(', '),
    tutor.grade_levels?.[0],
    tutor.user?.university_name || tutor.education,
    tutor.user?.city || tutor.location,
  ].filter(Boolean);

  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'Experienced Tutor';
  const bioSnippet = tutor.bio || tutor.user?.teaching_experience;

  const displayTags = [
    ...subjectsList.slice(0, 3),
    tutor.user?.university_name || tutor.education,
    tutor.user?.city || tutor.location,
  ].filter(Boolean) as string[];

  const uniqueTags = Array.from(new Set(displayTags)).slice(0, 3);

  return (
    <ScaleBounce
      style={styles.tutorCard}
      onPress={() => router.push({ pathname: '/tutor-profile', params: { tutorId: tutor.id } })}
    >
      <View style={styles.tutorTop}>
        <Avatar initials={initials} size={52} borderRadius={15} color={colors[colorIndex]} />
        <View style={styles.tutorInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.tutorName} numberOfLines={1}>{tutorName}</Text>
            <Ionicons name="checkmark-circle" size={15} color="#2563EB" />
          </View>
          <Text style={styles.tutorSubject} numberOfLines={1}>{subtitle}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
            <Text style={styles.rating}><Ionicons name="star" size={12} color="#f59e0b" /> {tutor.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>
              {tutor.total_reviews > 0 ? `(${tutor.total_reviews} reviews)` : '(New tutor)'}
            </Text>
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

      {bioSnippet && (
        <Text style={styles.tutorBio} numberOfLines={2}>{bioSnippet}</Text>
      )}

      {uniqueTags.length > 0 && (
        <View style={styles.tags}>
          {uniqueTags.map(tag => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

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
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: tutor.user_id, fullName: tutor.user?.full_name } })}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </ScaleBounce>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.md, 
    paddingBottom: Spacing.xs,
    gap: Spacing.md,
  },
  title: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: '#0F172A' },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  requestBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: Typography.xs,
  },
  searchBar: {
    marginHorizontal: Spacing.xl, 
    marginTop: Spacing.md, 
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: Spacing.md, 
    paddingVertical: 9, 
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: Typography.sm, color: '#0F172A' },
  filterScroll2: { marginTop: Spacing.xs, marginBottom: Spacing.sm },
  chip: {
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    borderRadius: Radius.full, 
    paddingHorizontal: 16, 
    paddingVertical: 6,
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 34,
  },
  chipSm: { paddingVertical: 5, paddingHorizontal: 13, minHeight: 32 },
  chipActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  chipText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: '#64748B' },
  chipTextActive: { color: '#2563EB', fontWeight: Typography.bold },

  customBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: '#0D2051',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.35)',
  },
  customBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customBannerTitle: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  customBannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  customBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  customBannerBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: Typography.bold,
  },

  tutorCard: {
    marginHorizontal: Spacing.xl, 
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius['2xl'],
    padding: Spacing.lg, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tutorTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#0F172A' },
  tutorSubject: { fontSize: Typography.xs, color: '#64748B', marginTop: 2 },
  tutorBio: { fontSize: Typography.xs, color: '#64748B', lineHeight: 18, marginBottom: Spacing.sm },
  rating: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#D97706' },
  reviewCount: { fontSize: Typography.xs, color: '#94A3B8' },
  price: { fontSize: Typography.lg, fontWeight: Typography.bold, color: '#1E40AF' },
  priceLabel: { fontSize: 10, color: '#64748B' },
  tags: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.md },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, color: '#475569', fontWeight: Typography.medium },
  tutorActions: { flexDirection: 'row', gap: Spacing.sm },
  btnBook: { 
    flex: 1, 
    backgroundColor: '#2563EB', 
    borderRadius: Radius.lg, 
    paddingVertical: 10, 
    alignItems: 'center',
  },
  btnBookText: { color: Colors.white, fontWeight: Typography.bold, fontSize: Typography.sm },
  btnMsg: { 
    width: 42, 
    height: 42, 
    backgroundColor: '#EFF6FF', 
    borderRadius: Radius.lg, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
});
