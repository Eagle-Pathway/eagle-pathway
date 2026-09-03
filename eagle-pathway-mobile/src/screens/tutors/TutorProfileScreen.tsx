import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Pill, Avatar, Button, Skeleton } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { tutorsService } from '@/services/tutors';
import { Tutor, TutorReview } from '@/types';

export default function TutorProfileScreen() {
  const { tutorId } = useLocalSearchParams<{ tutorId: string }>();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<TutorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editRate, setEditRate] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [t, r] = await Promise.all([
          tutorsService.getTutorById(tutorId),
          tutorsService.getTutorReviews(tutorId),
        ]);
        if (isMounted) {
          setTutor(t);
          setReviews(r);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (tutorId) load();
    return () => { isMounted = false; };
  }, [tutorId]);

  const handleSave = async () => {
    if (!tutor || !user) return;
    try {
      setLoading(true);
      await tutorsService.updateTutorProfile(user.id, {
        bio: editBio,
        hourly_rate: parseInt(editRate) || tutor.hourly_rate,
      });
      setTutor({ ...tutor, bio: editBio, hourly_rate: parseInt(editRate) || tutor.hourly_rate });
      setIsEditing(false);
      toast.success('Profile updated', 'Your tutor profile changes have been saved.');
    } catch {
      toast.error('Update Failed', 'Failed to update tutor profile.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    if (!tutor) return;
    setEditBio(tutor.bio);
    setEditRate(tutor.hourly_rate.toString());
    setIsEditing(true);
  };

  if (loading) return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <Skeleton width={36} height={36} borderRadius={10} color="rgba(255,255,255,0.15)" />
          <Skeleton width={36} height={36} borderRadius={10} color="rgba(255,255,255,0.15)" />
        </View>
        <Skeleton width={80} height={80} borderRadius={24} style={styles.heroAvatar} color="rgba(255,255,255,0.2)" />
        <Skeleton width={180} height={32} borderRadius={8} style={{ marginBottom: 4, alignSelf: 'center' }} color="rgba(255,255,255,0.2)" />
        <Skeleton width={220} height={20} borderRadius={6} style={{ alignSelf: 'center' }} color="rgba(255,255,255,0.2)" />
        <View style={styles.heroStats}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.heroStat}>
              <Skeleton width={40} height={28} borderRadius={6} style={{ marginBottom: 2 }} color="rgba(255,255,255,0.2)" />
              <Skeleton width={60} height={16} borderRadius={4} color="rgba(255,255,255,0.2)" />
            </View>
          ))}
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: Colors.bg, padding: Spacing.lg }}>
        <Skeleton width="100%" height={120} borderRadius={Radius.xl} style={{ marginBottom: Spacing.md }} />
        <Skeleton width="100%" height={150} borderRadius={Radius.xl} />
      </View>
    </SafeAreaView>
  );

  if (!tutor) return null;

  const tutorName = tutor.user?.full_name || 'Verified Tutor';
  const initials = tutorName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'T';

  const insets = useSafeAreaInsets();

  const subjectsList = (tutor.subjects && tutor.subjects.length > 0)
    ? tutor.subjects
    : (tutor.user?.interested_subjects && tutor.user.interested_subjects.length > 0 ? tutor.user.interested_subjects : ['Academic Tutoring']);

  const heroTitle = `${subjectsList.slice(0, 2).join(' & ')} Tutor · ${tutor.total_sessions || 0}+ Sessions`;
  const location = tutor.user?.city || tutor.user?.living_address || tutor.location || 'Addis Ababa, Ethiopia';
  const education = tutor.user?.university_name || tutor.education || 'University Graduate';
  const displayBio = tutor.bio || tutor.user?.teaching_experience || 'Experienced and verified tutor on Eagle Pathway.';
  const allGrades = (tutor.grade_levels && tutor.grade_levels.length > 0) ? tutor.grade_levels : ['Primary', 'High School', 'University'];

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top', 'bottom']}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} 
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.white} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {user?.id === tutor.user_id && (
              <TouchableOpacity 
                style={[styles.editBtn, isEditing && { backgroundColor: Colors.gold }]} 
                onPress={isEditing ? handleSave : startEditing}
                activeOpacity={0.8}
              >
                <Text style={styles.editBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
              </TouchableOpacity>
            )}
            {!isEditing && (
              <TouchableOpacity style={styles.heartBtn} activeOpacity={0.8}>
                <Ionicons name="heart-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
            {isEditing && (
              <TouchableOpacity style={styles.heartBtn} onPress={() => setIsEditing(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Avatar initials={initials} size={80} borderRadius={24} color={Colors.gold} style={styles.heroAvatar} />
        
        <View style={styles.nameRow}>
          <Text style={styles.heroName}>{tutorName}</Text>
          <Ionicons name="shield-checkmark" size={20} color="#60A5FA" />
        </View>

        <Text style={styles.heroTitle}>{heroTitle}</Text>

        <View style={styles.heroStats}>
          {[
            { num: tutor.rating.toFixed(1), lbl: 'Rating', icon: 'star' },
            { num: tutor.total_reviews > 0 ? tutor.total_reviews : 'New', lbl: 'Reviews' },
            { num: tutor.total_sessions || 0, lbl: 'Sessions' },
            { num: `${tutor.response_rate || 100}%`, lbl: 'Response' },
          ].map(s => (
            <View key={s.lbl} style={styles.heroStat}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                {s.icon && <Ionicons name="star" size={13} color="#FBBF24" />}
                <Text style={styles.heroStatNum}>{s.num}</Text>
              </View>
              <Text style={styles.heroStatLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAwareScreen style={{ backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* About Card */}
        <View style={[CommonStyles.card, { marginTop: Spacing.lg, marginHorizontal: Spacing.lg }]}>
          <View style={{ padding: Spacing.lg }}>
            <Text style={styles.cardSectionTitle}>About Tutor</Text>
            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                multiline
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Write your bio..."
                placeholderTextColor={Colors.textSecondary}
              />
            ) : (
              <Text style={styles.bioText}>{displayBio}</Text>
            )}
          </View>
        </View>

        {/* Info rows */}
        <View style={[CommonStyles.card, { marginHorizontal: Spacing.lg, marginTop: Spacing.md }]}>
          {[
            { icon: 'location-outline', label: 'Location', value: location },
            { icon: 'school-outline', label: 'Education / University', value: education },
            { icon: 'cash-outline', label: 'Hourly Rate', value: isEditing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: Colors.text, marginRight: 4 }}>ETB</Text>
                <TextInput
                  style={styles.rateInput}
                  keyboardType="numeric"
                  value={editRate}
                  onChangeText={setEditRate}
                />
                <Text style={{ color: Colors.text }}>/hour</Text>
              </View>
            ) : `ETB ${tutor.hourly_rate} / hour` },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Ionicons name={row.icon as any} size={16} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Subjects & Levels */}
        <View style={[CommonStyles.card, { marginHorizontal: Spacing.lg, marginTop: Spacing.md }]}>
          <View style={{ padding: Spacing.lg }}>
            <Text style={styles.cardSectionTitle}>Subjects &amp; Grade Levels</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm }}>
              {subjectsList.map(s => <Pill key={s} label={s} variant="blue" />)}
              {allGrades.map(g => <Pill key={g} label={g} variant="green" />)}
            </View>
          </View>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={[CommonStyles.card, { marginHorizontal: Spacing.lg, marginTop: Spacing.md }]}>
            <View style={{ padding: Spacing.lg, paddingBottom: Spacing.sm }}>
              <Text style={styles.cardSectionTitle}>Student Reviews ({reviews.length})</Text>
            </View>
            {reviews.slice(0, 3).map((r, i) => (
              <View key={r.id} style={[styles.reviewItem, i === reviews.slice(0,3).length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={styles.reviewName}>{r.student?.full_name || 'Student'}</Text>
                  <Text style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 2, marginBottom: 6 }}>
                  {[...Array(5)].map((_, idx) => (
                    <Ionicons key={idx} name={idx < r.rating ? 'star' : 'star-outline'} size={12} color="#f59e0b" />
                  ))}
                </View>
                <Text style={styles.reviewText}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}
      </KeyboardAwareScreen>

      {/* Bottom CTA Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: tutor.user_id, fullName: tutor.user?.full_name } })}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2563EB" />
        </TouchableOpacity>
        <Button
          title="Direct Request"
          variant="outline"
          onPress={() => router.push({ pathname: '/request-tutor', params: { tutorId: tutor.id } } as any)}
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
  hero: { 
    backgroundColor: Colors.blueDark, 
    padding: Spacing.xl, 
    paddingBottom: Spacing['3xl'], 
    alignItems: 'center',
  },
  heroNav: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignSelf: 'stretch', 
    marginBottom: Spacing.lg,
  },
  backBtn: { 
    width: 38, 
    height: 38, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: Radius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  editBtn: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 12, 
    height: 38, 
    borderRadius: Radius.md, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  editBtnText: { color: Colors.white, fontSize: 13, fontWeight: Typography.bold },
  heartBtn: { 
    width: 38, 
    height: 38, 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: Radius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  heroAvatar: { marginBottom: Spacing.md, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroName: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.white },
  heroTitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  heroStats: { flexDirection: 'row', gap: Spacing['2xl'], marginTop: Spacing.lg },
  heroStat: { alignItems: 'center' },
  heroStatNum: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.white },
  heroStatLbl: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  cardSectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, color: '#64748B', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm },
  bioText: { fontSize: Typography.sm, color: '#334155', lineHeight: 22 },
  bioInput: { fontSize: Typography.sm, color: '#0F172A', lineHeight: 22, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top' },
  rateInput: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: '#0F172A', backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 60 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoIcon: { width: 34, height: 34, backgroundColor: '#EFF6FF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: Typography.xs, color: '#64748B' },
  infoValue: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#0F172A', marginTop: 1 },
  reviewItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  reviewName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: '#0F172A' },
  reviewDate: { fontSize: Typography.xs, color: '#94A3B8' },
  reviewText: { fontSize: Typography.xs, color: '#475569', lineHeight: 18 },
  chatBtn: {
    width: 48, 
    height: 48,
    backgroundColor: '#EFF6FF', 
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginRight: Spacing.xs,
  },
  bottomBar: { 
    padding: Spacing.lg, 
    backgroundColor: '#FFFFFF', 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0', 
    flexDirection: 'row', 
    gap: Spacing.sm,
  },
});
