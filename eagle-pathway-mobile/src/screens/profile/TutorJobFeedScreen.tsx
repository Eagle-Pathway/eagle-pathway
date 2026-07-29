import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, Skeleton } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';
import { getUserRole } from '@/utils/role';

function timeAgo(utc: string): string {
  try {
    return formatDistanceToNow(new Date(utc), { addSuffix: true });
  } catch { return ''; }
}

export function TutorJobFeedScreen() {
  const { user } = useAuthStore();
  const { jobs, loadingJobs, loadJobs } = useTutorJobStore();
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    if (user && jobs.length > 0) {
      Promise.all(jobs.map(j => tutorJobsService.hasApplied(j.id, user.id)))
        .then(results => {
          const ids = new Set<string>();
          jobs.forEach((j, i) => { if (results[i]) ids.add(j.id); });
          setAppliedIds(ids);
        })
        .catch(console.error);
    }
  }, [jobs, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const role = getUserRole(user);

  if (role !== 'tutor') {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Tutor Jobs</Text>
        </View>
        <EmptyState icon="lock-closed-outline" title="Tutor Only" subtitle="Only tutor accounts can view job postings." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Available Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/my-applications' as any)}>
          <Text style={s.headerLink}>My Applications</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
      >
        {loadingJobs && jobs.length === 0 ? (
          <View style={{ gap: Spacing.md }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Skeleton width={150} height={24} borderRadius={6} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={16} borderRadius={4} />
                  </View>
                  <Skeleton width={80} height={24} borderRadius={6} />
                </View>
                <Skeleton width="60%" height={20} borderRadius={4} style={{ marginTop: 12, marginBottom: 12 }} />
                <View style={s.metaRow}>
                  <Skeleton width={60} height={16} borderRadius={4} />
                  <Skeleton width={60} height={16} borderRadius={4} />
                </View>
                <Skeleton width={80} height={14} borderRadius={4} style={{ marginTop: 12 }} />
              </View>
            ))}
          </View>
        ) : jobs.length === 0 ? (
          <EmptyState icon="mail-open-outline" title="No Jobs Yet" subtitle="Check back later for new tutor job postings." />
        ) : (
          jobs.map(job => (
            <TouchableOpacity
              key={job.id}
              style={s.card}
              onPress={() => router.push({ pathname: '/tutor-job-detail', params: { jobId: job.id } } as any)}
              activeOpacity={0.7}
            >
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.place}>{job.place}</Text>
                  <Text style={s.grade}>{job.grade}</Text>
                </View>
                <Text style={s.rate}>{job.hourly_rate} ETB/hr</Text>
              </View>

              <Text style={s.subjects} numberOfLines={1}>{job.subjects?.join(', ')}</Text>

              <View style={s.metaRow}>
                <Text style={s.meta}>📅 {job.days_per_week}d/wk</Text>
                <Text style={s.meta}>⏱ {job.session_hours}h/day</Text>
                {appliedIds.has(job.id) && <Text style={s.appliedChip}>Applied</Text>}
                {job.status === 'closed' && <Text style={s.closedChip}>Closed</Text>}
              </View>

              <Text style={s.timeAgo}>{timeAgo(job.created_at)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  headerLink: { fontSize: Typography.md, color: Colors.blue, fontWeight: Typography.semibold },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  place: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  grade: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  rate: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.gold },
  subjects: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 4, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  meta: { fontSize: Typography.sm, color: Colors.textSecondary },
  appliedChip: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.blue, backgroundColor: Colors.blueLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  closedChip: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary, backgroundColor: Colors.grayLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  timeAgo: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 6 },
});
