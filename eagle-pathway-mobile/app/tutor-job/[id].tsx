import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../../src/utils/theme';
import { Skeleton } from '../../src/components/common';
import { supabase } from '../../src/services/supabase';
import { useAuthStore } from '../../src/store/authStore';
import { useTutorJobsStore, TutorJobPost } from '../../src/store/tutorJobsStore';
import { getUserRole } from '../../src/utils/role';
import { Ionicons } from '@expo/vector-icons';

const formatTimeEAT = (timeString: string) => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  let eatHours = (parseInt(hours, 10) + 3) % 24;
  const ampm = eatHours >= 12 ? 'PM' : 'AM';
  eatHours = eatHours % 12;
  eatHours = eatHours ? eatHours : 12;
  return `${eatHours}:${minutes} ${ampm}`;
};

// Required tutor profile fields for the gate
const REQUIRED_TUTOR_FIELDS: (keyof any)[] = [
  'full_name', 'phone',
];

export default function TutorJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { myApplications, fetchMyApplications } = useTutorJobsStore();

  const [job, setJob] = useState<TutorJobPost | null>(null);
  const [loading, setLoading] = useState(true);

  const hasApplied = myApplications.some(app => app.job_post_id === id);
  const activeRole = getUserRole(user);

  useEffect(() => {
    if (!id) return;
    fetchJob();
    fetchMyApplications();
  }, [id]);

  async function fetchJob() {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setJob(data as TutorJobPost);
    } else {
      toast.error('Load Error', 'Could not load job details.');
    }
    setLoading(false);
  }

  const handleApply = () => {
    if (!user) return;

    // Profile completion gate
    const missingFields = REQUIRED_TUTOR_FIELDS.filter(f => !user[f as keyof typeof user]);
    if (missingFields.length > 0) {
      Alert.alert(
        'Complete Your Profile First',
        'Complete your profile to apply for tutor jobs. We\'ll pre-fill your application to save you time.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Complete Profile', onPress: () => router.push('/profile/edit') },
        ]
      );
      return;
    }

    router.push(`/tutor-job/apply/${id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={styles.header}>
          <Skeleton width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
            <Skeleton width={120} height={28} borderRadius={6} />
          </View>
          <Skeleton width={60} height={28} borderRadius={14} />
        </View>
        <View style={styles.content}>
          <View style={styles.card}>
            <Skeleton width={100} height={36} borderRadius={8} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={20} borderRadius={4} />
          </View>
          <View style={styles.card}>
            <Skeleton width={150} height={20} borderRadius={4} style={{ marginBottom: Spacing.md }} />
            {[1, 2, 3, 4].map((i, index) => (
              <View key={i} style={[styles.detailRow, index === 3 && { borderBottomWidth: 0 }]}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <View style={styles.detailContent}>
                  <Skeleton width={100} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                  <Skeleton width={140} height={20} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={[CommonStyles.flex1, CommonStyles.center]}>
          <Text style={{ color: Colors.textSecondary }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/tutor-jobs'))}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Job Details</Text>
        {job.status === 'open' ? (
          <View style={styles.badgeOpen}><Text style={styles.badgeOpenText}>Open</Text></View>
        ) : (
          <View style={styles.badgeClosed}><Text style={styles.badgeClosedText}>Closed</Text></View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Info Card */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.xs }}>
            <Ionicons name="bookmark-outline" size={16} color={Colors.blue} />
            <Text style={[styles.gradeText, { marginBottom: 0 }]}>{job.grade}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="library-outline" size={16} color={Colors.blue} />
            <Text style={styles.subjectsText}>{job.subjects.join(', ')}</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Job Information</Text>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{job.place}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Session Duration</Text>
              <Text style={styles.detailValue}>{job.session_hours} hours/day</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Days Per Week</Text>
              <Text style={styles.detailValue}>{job.days_per_week} days/week</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={Colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Start Time (Ethiopian Time)</Text>
              <Text style={styles.detailValue}>{formatTimeEAT(job.start_time)} EAT</Text>
            </View>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.detailIcon} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Gender Preference</Text>
              <Text style={styles.detailValue}>
                {job.gender_preference === 'both' ? 'Any Gender' :
                 job.gender_preference === 'male' ? 'Male Only' : 'Female Only'}
              </Text>
            </View>
          </View>
        </View>

        {/* Rate Card */}
        <View style={[styles.card, styles.rateCard]}>
          <View>
            <Text style={styles.rateLabel}>Hourly Rate</Text>
            <Text style={styles.rateValue}>{job.hourly_rate} ETB</Text>
            <Text style={styles.rateSub}>per hour</Text>
          </View>
          <View style={styles.rateEst}>
            <Text style={styles.rateEstLabel}>Monthly Estimate</Text>
            <Text style={styles.rateEstValue}>
              ~{Math.round(job.hourly_rate * job.session_hours * job.days_per_week * 4).toLocaleString()} ETB
            </Text>
          </View>
        </View>

        {/* Spacer for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Apply Button (fixed at bottom) */}
      {activeRole === 'tutor' && (
        <View style={styles.applyContainer}>
          {hasApplied ? (
            <View style={styles.appliedBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.green} />
                <Text style={styles.appliedText}>You have already applied to this job</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/my-applications')}>
                <Text style={styles.appliedLink}>View My Applications →</Text>
              </TouchableOpacity>
            </View>
          ) : job.status === 'closed' ? (
            <View style={[styles.appliedBox, { backgroundColor: Colors.grayLight }]}>
              <Text style={{ color: Colors.textSecondary, textAlign: 'center', fontWeight: Typography.semibold }}>
                This job is no longer accepting applications.
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>Apply for this Job</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.lg, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: Colors.grayLight,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  badgeOpen: { backgroundColor: Colors.greenLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeOpenText: { color: Colors.green, fontSize: Typography.sm, fontWeight: Typography.bold },
  badgeClosed: { backgroundColor: Colors.grayLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeClosedText: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.bold },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  gradeText: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.xs },
  subjectsText: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: Typography.medium },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: Typography.bold,
    color: Colors.textSecondary, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailIcon: { fontSize: 20, width: 28 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semibold, marginBottom: 2 },
  detailValue: { fontSize: Typography.base, color: Colors.text, fontWeight: Typography.medium },
  rateCard: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', backgroundColor: Colors.goldLight,
    borderColor: Colors.gold,
  },
  rateLabel: { fontSize: Typography.xs, color: Colors.goldDark, fontWeight: Typography.semibold, marginBottom: 4 },
  rateValue: { fontSize: Typography['6xl'], fontWeight: Typography.bold, color: Colors.gold },
  rateSub: { fontSize: Typography.xs, color: Colors.goldDark },
  rateEst: { alignItems: 'flex-end' },
  rateEstLabel: { fontSize: Typography.xs, color: Colors.goldDark, marginBottom: 4 },
  rateEstValue: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.goldDark },
  applyContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.lg, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  applyBtn: {
    backgroundColor: Colors.blue, borderRadius: Radius.xl,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  applyBtnText: { color: Colors.white, fontSize: Typography.lg, fontWeight: Typography.bold },
  appliedBox: {
    backgroundColor: Colors.greenLight, borderRadius: Radius.xl,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    alignItems: 'center', gap: Spacing.xs,
  },
  appliedText: { color: Colors.green, fontWeight: Typography.semibold, fontSize: Typography.base },
  appliedLink: { color: Colors.blue, fontWeight: Typography.semibold, fontSize: Typography.sm },
});
