import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, Skeleton, ScaleBounce } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';
import { getUserRole } from '@/utils/role';
import { withTimeout } from '@/utils/asyncUtils';

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

  useEffect(() => { withTimeout(loadJobs(), 3500); }, []);

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

  const openJobs = jobs.filter(j => j.status === 'open');

  return (
    <View style={CommonStyles.flex1}>
      {/* Top Header Bar */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.headerTitle}>Available Jobs</Text>
          <View style={s.openCountBadge}>
            <Text style={s.openCountText}>{openJobs.length} Open</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={s.myAppsBtn}
          onPress={() => router.push('/my-applications' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={14} color={Colors.blue} />
          <Text style={s.headerLink}>My Applications</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
      >
        {loadingJobs && jobs.length === 0 ? (
          <View style={{ gap: Spacing.md }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Skeleton width={160} height={20} borderRadius={6} style={{ marginBottom: 6 }} />
                    <Skeleton width={100} height={14} borderRadius={4} />
                  </View>
                  <Skeleton width={80} height={24} borderRadius={8} />
                </View>
                <Skeleton width="90%" height={16} borderRadius={4} style={{ marginTop: 12, marginBottom: 12 }} />
                <View style={s.metaRow}>
                  <Skeleton width={70} height={20} borderRadius={6} />
                  <Skeleton width={70} height={20} borderRadius={6} />
                </View>
              </View>
            ))}
          </View>
        ) : jobs.length === 0 ? (
          <EmptyState 
            icon="briefcase-outline" 
            title="No Open Jobs Right Now" 
            subtitle="New parent and student tutoring requests will appear here as soon as they are approved." 
          />
        ) : (
          jobs.map(job => {
            const hasApplied = appliedIds.has(job.id);
            const isClosed = (job.status as string) === 'closed' || (job.status as string) === 'hired';

            return (
              <ScaleBounce
                key={job.id}
                style={[s.card, isClosed && { opacity: 0.7 }]}
                onPress={() => router.push({ pathname: '/tutor-job-detail', params: { jobId: job.id } } as any)}
              >
                {/* Location & Rate Row */}
                <View style={s.cardTop}>
                  <View style={{ flex: 1, marginRight: Spacing.sm }}>
                    <View style={s.locationRow}>
                      <Ionicons name="location-sharp" size={15} color="#2563EB" />
                      <Text style={s.place} numberOfLines={1}>{job.place || 'Addis Ababa'}</Text>
                    </View>
                    <View style={s.gradePill}>
                      <Text style={s.gradeText}>🎓 {job.grade || 'General'}</Text>
                    </View>
                  </View>

                  <View style={s.rateBadge}>
                    <Text style={s.rateAmount}>{job.hourly_rate || 'Negotiable'}</Text>
                    <Text style={s.rateUnit}>ETB/hr</Text>
                  </View>
                </View>

                {/* Subjects Badges */}
                <View style={s.subjectsWrap}>
                  {(job.subjects || ['Academic Tutoring']).map((sub, idx) => (
                    <View key={idx} style={s.subjectPill}>
                      <Text style={s.subjectPillText}>{sub}</Text>
                    </View>
                  ))}
                </View>

                {/* Schedule Meta Info */}
                <View style={s.metaRow}>
                  <View style={s.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#64748B" />
                    <Text style={s.metaText}>{job.days_per_week || '3'} days/wk</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#64748B" />
                    <Text style={s.metaText}>{job.session_hours || '2'} hrs/day</Text>
                  </View>
                  {job.start_time && (
                    <View style={s.metaItem}>
                      <Ionicons name="alarm-outline" size={13} color="#64748B" />
                      <Text style={s.metaText}>{job.start_time}</Text>
                    </View>
                  )}
                </View>

                {/* Card Footer with Status / Apply CTA */}
                <View style={s.cardFooter}>
                  <Text style={s.timeAgo}>Posted {timeAgo(job.created_at)}</Text>

                  {hasApplied ? (
                    <View style={s.appliedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#2563EB" />
                      <Text style={s.appliedText}>Applied</Text>
                    </View>
                  ) : isClosed ? (
                    <View style={s.closedBadge}>
                      <Text style={s.closedText}>Filled / Closed</Text>
                    </View>
                  ) : (
                    <View style={s.applyBtn}>
                      <Text style={s.applyBtnText}>Apply Now</Text>
                      <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </ScaleBounce>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.md, 
    backgroundColor: Colors.white, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { 
    fontSize: Typography['2xl'], 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  openCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  openCountText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#059669',
  },
  myAppsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.lg,
  },
  headerLink: { 
    fontSize: Typography.xs, 
    color: Colors.blue, 
    fontWeight: Typography.bold,
  },
  card: { 
    backgroundColor: Colors.white, 
    borderRadius: Radius['2xl'], 
    padding: Spacing.lg, 
    marginBottom: Spacing.md, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  place: { 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  gradePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeText: { 
    fontSize: Typography.xs, 
    color: '#475569', 
    fontWeight: Typography.semibold,
  },
  rateBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rateAmount: { 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold, 
    color: '#1E40AF',
    lineHeight: 20,
  },
  rateUnit: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#3B82F6',
  },
  subjectsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  subjectPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: Typography.medium,
  },
  metaRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    gap: Spacing.md, 
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { 
    fontSize: Typography.xs, 
    color: '#64748B',
    fontWeight: Typography.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  appliedBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  appliedText: {
    fontSize: 11, 
    fontWeight: Typography.bold, 
    color: '#2563EB',
  },
  closedBadge: { 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: Radius.full,
  },
  closedText: {
    fontSize: 11, 
    fontWeight: Typography.semibold, 
    color: '#94A3B8',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.lg,
  },
  applyBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
  },
  timeAgo: { 
    fontSize: 11, 
    color: '#94A3B8',
  },
});
