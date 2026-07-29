import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Pill, Avatar, Button } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { tutorsService } from '@/services/tutors';
import { Tutor, TutorReview } from '@/types';
import { openWhatsApp } from '@/utils/linking';

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
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
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
    <View style={[CommonStyles.flex1, CommonStyles.center, { backgroundColor: Colors.bg }]}>
      <ActivityIndicator color={Colors.blue} size="large" />
    </View>
  );

  if (!tutor) return null;

  const initials = tutor.user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'T';
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[CommonStyles.flex1, { backgroundColor: Colors.blueDark }]} edges={['top', 'bottom']}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8}>
            <Text style={styles.backIcon}>←</Text>
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
                <Text style={{ fontSize: 18, color: Colors.white }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
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

      <KeyboardAwareScreen style={{ backgroundColor: Colors.bg }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* About */}
        <View style={[CommonStyles.card, { marginTop: Spacing.lg }]}>
          <View style={{ padding: Spacing.lg }}>
            <Text style={styles.cardSectionTitle}>About</Text>
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
              <Text style={styles.bioText}>{tutor.bio}</Text>
            )}
          </View>
        </View>

        {/* Info rows */}
        <View style={CommonStyles.card}>
          {[
            { icon: 'location-outline', label: 'Location', value: tutor.location || 'Addis Ababa' },
            { icon: 'school-outline', label: 'Education', value: tutor.education },
            { icon: 'cash-outline', label: 'Rate', value: isEditing ? (
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
            ) : `ETB ${tutor.hourly_rate}/hour` },
          ].map((row, i, arr) => (
            <View key={row.label} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Ionicons name={row.icon as any} size={16} color={Colors.textSecondary} />
              </View>
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

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={() => router.push({ pathname: '/chat/[id]', params: { id: tutor.user_id, fullName: tutor.user?.full_name } })}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
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
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  editBtnText: { color: Colors.white, fontSize: 13, fontWeight: Typography.bold },
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
  bioInput: { fontSize: Typography.md, color: Colors.text, lineHeight: 22, backgroundColor: Colors.grayLight, borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top' },
  rateInput: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text, backgroundColor: Colors.grayLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 60 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoIcon: { width: 32, height: 32, backgroundColor: Colors.blueLight, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
  infoValue: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  reviewItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewName: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  reviewDate: { fontSize: Typography.sm, color: Colors.textSecondary },
  reviewText: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 20 },
  chatBtn: {
    width: 48, height: 48,
    backgroundColor: Colors.blue, 
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  bottomBar: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, flexDirection: 'row', gap: Spacing.sm },
});
