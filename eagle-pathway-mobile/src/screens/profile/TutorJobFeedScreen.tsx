import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Card, Button, EmptyState } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useTutorJobStore } from '@/store/tutorJobStore';
import { tutorJobsService } from '@/services/tutorJobs';
import { getUserRole } from '@/utils/role';
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

export function TutorJobFeedScreen() {
  const { user } = useAuthStore();
  const { jobs, loadingJobs, loadJobs, loadTutorApplication, tutorApplication, loadingTutorApp } = useTutorJobStore();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (user && user.role === 'tutor') {
      const check = async () => {
        await loadTutorApplication(user.id);
        const app = useTutorJobStore.getState().tutorApplication;
        setIsApproved(app?.status === 'approved');
      };
      check();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && jobs.length > 0) {
      Promise.all(jobs.map(j => tutorJobsService.hasApplied(j.id, user.id)))
        .then(results => {
          const ids = new Set<string>();
          jobs.forEach((j, i) => { if (results[i]) ids.add(j.id); });
          setAppliedIds(ids);
        });
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
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={profStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn}>
            <Text style={profStyles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={profStyles.headerTitle}>Tutor Jobs</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState icon="🔒" title="Tutor Only" subtitle="Only tutor accounts can view job postings." />
      </SafeAreaView>
    );
  }

  if (loadingTutorApp || isApproved === null) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <View style={profStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn}>
            <Text style={profStyles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={profStyles.headerTitle}>Tutor Jobs</Text>
          <View style={{ width: 40 }} />
        </View>
        <ActivityIndicator size="large" color={Colors.blue} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <View style={profStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn}>
          <Text style={profStyles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={profStyles.headerTitle}>Tutor Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/my-applications' as any)}>
          <Text style={profStyles.headerLink}>My Apps</Text>
        </TouchableOpacity>
      </View>

      {isApproved ? (
        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
        >
          {loadingJobs && jobs.length === 0 ? (
            <ActivityIndicator size="large" color={Colors.blue} style={{ marginTop: 40 }} />
          ) : jobs.length === 0 ? (
            <EmptyState icon="📭" title="No Jobs Available" subtitle="Check back later for new tutor job postings." />
          ) : (
            jobs.map(job => (
              <TouchableOpacity
                key={job.id}
                style={profStyles.jobCard}
                onPress={() => router.push({ pathname: '/tutor-job-detail', params: { jobId: job.id } } as any)}
                activeOpacity={0.7}
              >
                <View style={profStyles.jobHeader}>
                  <Text style={profStyles.jobBadgeNew}>📌 New Tutor Job</Text>
                  {appliedIds.has(job.id) && (
                    <View style={profStyles.appliedBadge}>
                      <Text style={profStyles.appliedText}>Applied</Text>
                    </View>
                  )}
                  {job.status === 'closed' && (
                    <View style={profStyles.closedBadge}>
                      <Text style={profStyles.closedText}>Closed</Text>
                    </View>
                  )}
                </View>

                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>📍 Place:</Text>
                  <Text style={profStyles.jobValue}>{job.place}</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>📚 Grade:</Text>
                  <Text style={profStyles.jobValue}>{job.grade}</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>📖 Subjects:</Text>
                  <Text style={profStyles.jobValue}>{job.subjects?.join(', ')}</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>⏱ Session:</Text>
                  <Text style={profStyles.jobValue}>{job.session_hours} hrs/day</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>📅 Days:</Text>
                  <Text style={profStyles.jobValue}>{job.days_per_week} days/week</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>🕐 Start:</Text>
                  <Text style={profStyles.jobValue}>{toEATDisplay(job.start_time)}</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>💰 Rate:</Text>
                  <Text style={[profStyles.jobValue, { color: Colors.gold, fontWeight: Typography.bold }]}>{job.hourly_rate} ETB/hr</Text>
                </View>
                <View style={profStyles.jobRow}>
                  <Text style={profStyles.jobLabel}>👤 Gender:</Text>
                  <Text style={profStyles.jobValue}>{job.gender_preference === 'both' ? 'Male & Female' : job.gender_preference === 'male' ? 'Male Only' : 'Female Only'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={profStyles.notApproved}>
          <Text style={profStyles.notApprovedIcon}>📋</Text>
          <Text style={profStyles.notApprovedTitle}>Application Required</Text>
          <Text style={profStyles.notApprovedText}>
            Submit your tutor profile for review before you can apply for jobs.
            Our team will verify your documents and approve your application.
          </Text>
          <Button
            title={tutorApplication ? 'View Application Status' : 'Complete Profile & Apply'}
            onPress={() => {
              if (tutorApplication) {
                router.push('/my-applications' as any);
              } else {
                router.push({ pathname: '/apply-job', params: {} } as any);
              }
            }}
            variant="primary"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const profStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography['2xl'], color: Colors.blue },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  headerLink: { fontSize: Typography.md, color: Colors.blue, fontWeight: Typography.semibold },
  jobCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  jobBadgeNew: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  appliedBadge: { backgroundColor: Colors.blueLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  appliedText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.blue },
  closedBadge: { backgroundColor: Colors.grayLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  closedText: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.textSecondary },
  jobRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  jobLabel: { fontSize: Typography.base, color: Colors.textSecondary, width: 80 },
  jobValue: { fontSize: Typography.base, color: Colors.text, flex: 1 },
  notApproved: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  notApprovedIcon: { fontSize: 48, marginBottom: Spacing.lg },
  notApprovedTitle: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.md },
  notApprovedText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing['2xl'] },
});
