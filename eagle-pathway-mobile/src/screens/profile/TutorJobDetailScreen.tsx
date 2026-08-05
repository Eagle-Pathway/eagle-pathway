import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button, Skeleton } from '@/components/common';
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
  const isFocused = useIsFocused();

  useEffect(() => {
    let isMounted = true;
    if (jobId) {
      loadJobDetail(jobId).finally(() => {
        if (isMounted) setLoading(false);
      });
    }
    return () => {
      isMounted = false;
      clearSelectedJob();
    };
  }, [jobId]);

  useEffect(() => {
    let isMounted = true;
    if (jobId && user) {
      tutorJobsService.hasApplied(jobId, user.id).then(hasApplied => {
        if (isMounted) setHasApplied(hasApplied);
      }).catch(console.error);
    }
    return () => { isMounted = false; };
  }, [jobId, user?.id]);

  useEffect(() => {
    if (user) loadTutorApplication(user.id);
  }, [user?.id]);

  if (loading) return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <View style={s.backBtn}>
          <Skeleton width={24} height={24} borderRadius={12} />
        </View>
        <Skeleton width={120} height={28} borderRadius={6} />
        <View style={{ width: 40 }} />
      </View>
      <View style={{ padding: Spacing.lg }}>
        <Skeleton width="80%" height={36} borderRadius={8} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: Spacing.lg }} />
        <View style={s.detailCard}>
          {[1, 2, 3, 4, 5, 6].map((i, index) => (
            <View key={i} style={[s.detailRow, index === 5 && { borderBottomWidth: 0 }]}>
              <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: 8 }} />
              <Skeleton width={80} height={20} borderRadius={4} />
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Skeleton width={100} height={20} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
  if (!selectedJob) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
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
  const approval = tutorJobsService.getTutorApprovalStatus(user, tutorApplication);
  const showApply = !hasApplied && job.status === 'open';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Job Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 140 }}>
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

        {/* Notice Card for Non-Approved / Missing Fields Status */}
        {!approval.canApply && showApply && (
          <View style={[
            s.noticeCard,
            approval.status === 'missing_fields' && { backgroundColor: '#fff7ed', borderColor: Colors.orange },
            approval.status === 'pending_approval' && { backgroundColor: Colors.blueLight, borderColor: Colors.blue },
            approval.status === 'rejected' && { backgroundColor: Colors.redLight, borderColor: Colors.red },
          ]}>
            <View style={s.noticeHeader}>
              <Text style={s.noticeIcon}>
                {approval.status === 'missing_fields' ? '📝' : approval.status === 'pending_approval' ? '🔒' : '❌'}
              </Text>
              <Text style={[
                s.noticeTitle,
                approval.status === 'missing_fields' && { color: Colors.orange },
                approval.status === 'pending_approval' && { color: Colors.blue },
                approval.status === 'rejected' && { color: Colors.red },
              ]}>
                {approval.status === 'missing_fields'
                  ? 'Complete Your Profile to Apply'
                  : approval.status === 'pending_approval'
                  ? 'Application Under Admin Review'
                  : 'Account Not Approved'}
              </Text>
            </View>

            {approval.status === 'missing_fields' ? (
              <>
                <Text style={s.noticeSub}>
                  Fill in these required fields in your profile to unlock job applications:
                </Text>
                <View style={s.missingList}>
                  {approval.missingFields.map(field => (
                    <View key={field} style={s.missingBadge}>
                      <Text style={s.missingBadgeText}>• {field}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={s.noticeSub}>{approval.reason}</Text>
            )}
          </View>
        )}

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
          {approval.canApply ? (
            <Button
              title="Apply for This Job"
              onPress={() => router.push({ pathname: '/apply-job', params: { jobId: job.id } } as any)}
              variant="primary"
              size="lg"
              fullWidth
            />
          ) : approval.status === 'missing_fields' ? (
            <Button
              title="Complete Profile & Apply"
              onPress={() => router.push('/profile/edit')}
              variant="primary"
              size="lg"
              fullWidth
            />
          ) : approval.status === 'pending_approval' ? (
            <Button
              title="Under Admin Review"
              onPress={() => router.push('/my-applications' as any)}
              variant="outline"
              size="lg"
              fullWidth
              disabled
            />
          ) : (
            <Button
              title="Application Not Approved"
              onPress={() => router.push('/my-applications' as any)}
              variant="outline"
              size="lg"
              fullWidth
              disabled
            />
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
  noticeCard: { marginTop: Spacing.lg, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1.5 },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  noticeIcon: { fontSize: 20 },
  noticeTitle: { fontSize: Typography.base, fontWeight: Typography.bold },
  noticeSub: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  missingList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  missingBadge: { backgroundColor: Colors.white, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.md },
  missingBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.text },
  infoBox: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.lg, gap: Spacing.sm },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: Typography.base, color: Colors.text, flex: 1 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, paddingBottom: 30, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  hint: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
