import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, LoadingScreen } from '@/components/common';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';
import { useAuthStore } from '@/store/authStore';

function toEATDisplay(utcTime: string): string {
  if (!utcTime) return '';
  const [h, m] = utcTime.split(':');
  const hNum = parseInt(h, 10);
  const eatH = (hNum + 3) % 24;
  const period = eatH >= 12 ? 'PM' : 'AM';
  const displayH = eatH % 12 || 12;
  return `${displayH}:${m} ${period} EAT`;
}

export function TutorJobDetailScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user } = useAuthStore();
  const { loadJobDetail, selectedJob, clearSelectedJob, loadTutorApplication, tutorApplication } = useTutorJobStore();
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jobId) {
      loadJobDetail(jobId).finally(() => setLoading(false));
    }
    return () => clearSelectedJob();
  }, [jobId]);

  useEffect(() => {
    if (jobId && user) {
      tutorJobsService.hasApplied(jobId, user.id).then(setHasApplied).catch(console.error);
    }
  }, [jobId, user?.id]);

  useEffect(() => {
    if (user) loadTutorApplication(user.id);
  }, [user?.id]);

  if (loading) return <LoadingScreen />;
  if (!selectedJob) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backText}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Job Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] }}>
          <Text style={{ fontSize: Typography.base, color: Colors.textSecondary }}>This job posting is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const insets = useSafeAreaInsets();
  const job = selectedJob;
  const isApproved = tutorApplication?.status === 'approved';
  const showApply = !hasApplied && job.status === 'open';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
        <Text style={s.title}>📌 Tutor at {job.place}</Text>
        <Text style={s.subtitle}>{job.grade}</Text>

        <View style={s.detailCard}>
          <DetailRow icon="📍" label="Place" value={job.place} />
          <DetailRow icon="📚" label="Grade" value={job.grade} />
          <DetailRow icon="📖" label="Subjects" value={job.subjects?.join(', ')} />
          <DetailRow icon="⏱" label="Session" value={`${job.session_hours} hrs/day`} />
          <DetailRow icon="📅" label="Days" value={`${job.days_per_week} days/week`} />
          <DetailRow icon="🕐" label="Start Time" value={toEATDisplay(job.start_time)} />
          <DetailRow icon="💰" label="Hourly Rate" value={`${job.hourly_rate} ETB/hr`} highlight />
          <DetailRow icon="👤" label="Gender" value={job.gender_preference === 'both' ? 'Male & Female' : job.gender_preference === 'male' ? 'Male Only' : 'Female Only'} />
        </View>

        {hasApplied && (
          <View style={[s.infoBox, { backgroundColor: Colors.blueLight }]}>
            <Text style={s.infoIcon}>✅</Text>
            <Text style={s.infoText}>You have already applied for this position.</Text>
          </View>
        )}

        {job.status === 'closed' && (
          <View style={[s.infoBox, { backgroundColor: Colors.grayLight }]}>
            <Text style={s.infoIcon}>🔒</Text>
            <Text style={s.infoText}>This position is no longer accepting applications.</Text>
          </View>
        )}
      </ScrollView>

      {showApply && (
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
          {isApproved ? (
            <Button
              title="Apply for This Job"
              onPress={() => router.push({ pathname: '/apply-job', params: { jobId: job.id } } as any)}
              variant="primary"
              size="lg"
              fullWidth
            />
          ) : (
            <>
              <Button
                title="Complete Profile & Apply"
                onPress={() => router.push('/my-applications' as any)}
                variant="primary"
                size="lg"
                fullWidth
              />
              <Text style={s.hint}>Your profile must be approved before applying.</Text>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailIcon}>{icon}</Text>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, highlight && { color: Colors.gold, fontWeight: Typography.bold }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography['2xl'], color: Colors.blue },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: Typography.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  detailCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailIcon: { fontSize: 16, width: 28 },
  detailLabel: { fontSize: Typography.base, color: Colors.textSecondary, width: 90 },
  detailValue: { fontSize: Typography.base, color: Colors.text, flex: 1, textAlign: 'right' },
  infoBox: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: Typography.base, color: Colors.text, flex: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: 30, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  hint: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
