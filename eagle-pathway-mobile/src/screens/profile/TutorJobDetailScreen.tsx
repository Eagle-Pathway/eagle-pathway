import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, LoadingScreen } from '@/components/common';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';
import { useAuthStore } from '@/store/authStore';
import type { TutorJobPost } from '@/types';

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
      tutorJobsService.hasApplied(jobId, user.id).then(setHasApplied);
    }
  }, [jobId, user?.id]);

  useEffect(() => {
    if (user) loadTutorApplication(user.id);
  }, [user?.id]);

  if (loading) return <LoadingScreen />;
  if (!selectedJob) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={profStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn}>
            <Text style={profStyles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={profStyles.headerTitle}>Job Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] }}>
          <Text style={{ fontSize: Typography.base, color: Colors.textSecondary }}>This job posting is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const job = selectedJob;
  const canApply = !hasApplied && job.status === 'open' && tutorApplication?.status === 'approved';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={profStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn}>
          <Text style={profStyles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={profStyles.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }}>
        <Text style={profStyles.title}>📌 New Tutor Job</Text>
        <Text style={profStyles.subtitle}>{job.place} — {job.grade}</Text>

        <View style={profStyles.detailCard}>
          <DetailRow icon="📍" label="Place" value={job.place} />
          <DetailRow icon="📚" label="Grade" value={job.grade} />
          <DetailRow icon="📖" label="Subjects" value={job.subjects?.join(', ')} />
          <DetailRow icon="⏱" label="Session" value={`${job.session_hours} hrs/day`} />
          <DetailRow icon="📅" label="Days" value={`${job.days_per_week} days/week`} />
          <DetailRow icon="🕐" label="Start Time" value={toEATDisplay(job.start_time)} />
          <DetailRow icon="💰" label="Hourly Rate" value={`${job.hourly_rate} ETB/hr`} highlight />
          <DetailRow icon="👤" label="Gender Preference" value={job.gender_preference === 'both' ? 'Male & Female' : job.gender_preference === 'male' ? 'Male Only' : 'Female Only'} />
        </View>

        {hasApplied && (
          <View style={profStyles.infoBox}>
            <Text style={profStyles.infoIcon}>✅</Text>
            <Text style={profStyles.infoText}>You have already applied for this position.</Text>
          </View>
        )}

        {job.status === 'closed' && (
          <View style={[profStyles.infoBox, { backgroundColor: Colors.grayLight }]}>
            <Text style={profStyles.infoIcon}>🔒</Text>
            <Text style={profStyles.infoText}>This position is no longer accepting applications.</Text>
          </View>
        )}

        {tutorApplication?.status !== 'approved' && !hasApplied && job.status === 'open' && (
          <View style={[profStyles.infoBox, { backgroundColor: Colors.orangeLight }]}>
            <Text style={profStyles.infoIcon}>📋</Text>
            <Text style={profStyles.infoText}>Your tutor profile needs to be approved before you can apply.</Text>
          </View>
        )}
      </ScrollView>

      {canApply && (
        <View style={profStyles.bottomBar}>
          <Button
            title="Apply for This Job"
            onPress={() => router.push({ pathname: '/apply-job', params: { jobId: job.id } } as any)}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <View style={profStyles.detailRow}>
      <Text style={profStyles.detailIcon}>{icon}</Text>
      <Text style={profStyles.detailLabel}>{label}</Text>
      <Text style={[profStyles.detailValue, highlight && { color: Colors.gold, fontWeight: Typography.bold }]}>{value}</Text>
    </View>
  );
}

const profStyles = StyleSheet.create({
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
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.blueLight, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: Typography.base, color: Colors.text, flex: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: 30, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
