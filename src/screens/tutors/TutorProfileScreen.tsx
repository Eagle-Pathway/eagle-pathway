import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../../utils/theme';
import { Pill, Avatar, Button } from '../../components/common';
import { tutorsService } from '../../services/tutors';
import { Tutor, TutorReview } from '../../types';

export default function TutorProfileScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, r] = await Promise.all([
          tutorsService.getTutorById(tutorId),
          tutorsService.getTutorReviews(tutorId),
        ]);
        setTutor(t);
        setReviews(r);
      } finally {
        setLoading(false);
      }
    };
    if (tutorId) load();
  }, [tutorId]);

  if (loading) return (
    <View style={[CommonStyles.flex1, CommonStyles.center, { backgroundColor: Colors.bg }]}>
      <ActivityIndicator color={Colors.blue} size="large" />
    </View>
  );

  if (!tutor) return null;

  const initials = tutor.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top']}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8}>
            <Text style={{ fontSize: 18 }}>🤍</Text>
          </TouchableOpacity>
        </View>
        <Avatar initials={initials} size={80} borderRadius={24} color={Colors.gold} style={styles.heroAvatar} />
        <Text style={styles.heroName}>{tutor.user?.full_name}</Text>
        <Text style={styles.heroTitle}>{tutor.subjects.slice(0,2).join(' & ')} Tutor · {tutor.total_sessions}+ Sessions</Text>
        <View style={styles.heroStats}>
          {[
            { num: tutor.rating.toFixed(1), lbl: 'Rating' },
            { num: tutor.total_reviews, lbl: 'Reviews' },
            { num: tutor.total_sessions, lbl: 'Sessions' },
            { num: `${tutor.response_rate}%`, lbl: 'Response' },
          ].map(s => (
            <View key={s.lbl} style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{s.num}</Text>
              <Text style={styles.heroStatLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={{ backgroundColor: Colors.bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* About */}
        <View style={[CommonStyles.card, { marginTop: Spacing.lg }]}>
          <View style={{ padding: Spacing.lg }}>
            <Text style={styles.cardSectionTitle}>About</Text>
            <Text style={styles.bioText}>{tutor.bio}</Text>
          </View>
        </View>

        {/* Info rows */}
        <View style={CommonStyles.card}>
          {[
            { icon: '📍', label: 'Location', value: tutor.location || 'Addis Ababa' },
            { icon: '🎓', label: 'Education', value: tutor.education },
            { icon: '🕐', label: 'Availability', value: 'Mon–Sat · 9AM – 8PM' },
            { icon: '💰', label: 'Rate', value: `ETB ${tutor.hourly_rate}/hour` },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}><Text style={{ fontSize: 16 }}>{row.icon}</Text></View>
              <View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subjects */}
        <View style={CommonStyles.card}>
          <View style={{ padding: Spacing.lg }}>
            <Text style={styles.cardSectionTitle}>Subjects & Levels</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm }}>
              {tutor.subjects.map(s => <Pill key={s} label={s} variant="blue" />)}
              {tutor.grade_levels.map(g => <Pill key={g} label={g} variant="green" />)}
            </View>
          </View>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={CommonStyles.card}>
            <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}>
              <Text style={styles.cardSectionTitle}>Student Reviews</Text>
            </View>
            {reviews.slice(0, 3).map((r, i) => (
              <View key={r.id} style={[styles.reviewItem, i === reviews.slice(0,3).length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.reviewName}>{r.student?.full_name || 'Student'}</Text>
                  <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={{ color: '#f59e0b', fontSize: Typography.sm, marginBottom: 6 }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </Text>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title="Check Availability"
          variant="outline"
          onPress={() => router.push({ pathname: '/booking', params: { tutorId: tutor.id } })}
          style={{ flex: 1 }}
          fullWidth={false}
        />
        <Button
          title="Book Session"
          variant="primary"
          onPress={() => router.push({ pathname: '/booking', params: { tutorId: tutor.id } })}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, padding: Spacing.xl, paddingBottom: Spacing['3xl'], alignItems: 'center' },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginBottom: Spacing.lg },
  backBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: Colors.white, fontSize: 20 },
  heartBtn: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heroAvatar: { marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  heroName: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white },
  heroTitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  heroStats: { flexDirection: 'row', gap: Spacing['2xl'], marginTop: Spacing.lg },
  heroStat: { alignItems: 'center' },
  heroStatNum: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.white },
  heroStatLbl: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cardSectionTitle: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm },
  bioText: { fontSize: Typography.md, color: Colors.text, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 32, height: 32, backgroundColor: Colors.blueLight, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  reviewItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  reviewDate: { fontSize: Typography.sm, color: Colors.textSecondary },
  reviewText: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 20 },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
});
