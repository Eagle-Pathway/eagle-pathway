import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, Skeleton, ScaleBounce } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useTutorJobStore } from '@/store/tutorJobStore';

import { withTimeout } from '@/utils/asyncUtils';

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  pending: { icon: '🟡', label: 'Pending', color: '#b45309', bg: '#fffbeb' },
  contacted: { icon: '🔵', label: 'Contacted', color: '#1d4ed8', bg: '#eff6ff' },
  hired: { icon: '🟢', label: 'Hired', color: '#15803d', bg: '#f0fdf4' },
  rejected: { icon: '🔴', label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
};

function toEATDisplay(utcTime: string): string {
  if (!utcTime) return '';
  const [h, m] = utcTime.split(':');
  const hNum = parseInt(h, 10);
  const eatH = (hNum + 3) % 24;
  const period = eatH >= 12 ? 'PM' : 'AM';
  const displayH = eatH % 12 || 12;
  return `${displayH}:${m} ${period} EAT`;
}

export function MyApplicationsScreen() {
  const { user } = useAuthStore();
  const { applications, loadingApplications, loadApplications } = useTutorJobStore();

  useEffect(() => {
    if (user) withTimeout(loadApplications(user.id), 3500);
  }, [user?.id]);

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={profStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={profStyles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={profStyles.headerTitle}>My Applications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loadingApplications && applications.length === 0 ? (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={120} style={{ borderRadius: Radius.xl, marginBottom: Spacing.md }} />
          ))}
        </ScrollView>
      ) : applications.length === 0 ? (
        <EmptyState
          icon="clipboard-outline"
          title="No Applications Yet"
          subtitle="Apply for a tutor job to see your applications here."
          actionLabel="Browse Jobs"
          onAction={() => router.back()}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={loadingApplications} onRefresh={() => user && loadApplications(user.id)} tintColor={Colors.blue} />}>
          {applications.map((app) => {
            const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const job = app.job_post;
            return (
              <ScaleBounce
                key={app.id}
                style={profStyles.appCard}
                onPress={() => router.push({ pathname: '/application-detail', params: { applicationId: app.id } } as any)}
              >
                <View style={profStyles.appHeader}>
                  <View style={{ flex: 1 }}>
                    {job && (
                      <>
                        <Text style={profStyles.appTitle}>{job.place}</Text>
                        <Text style={profStyles.appSubtitle}>{job.grade} — {job.subjects?.slice(0, 3).join(', ')}{(job.subjects?.length || 0) > 3 ? '...' : ''}</Text>
                      </>
                    )}
                    {!job && <Text style={profStyles.appTitle}>Job Post</Text>}
                  </View>
                  <View style={[profStyles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[profStyles.statusText, { color: status.color }]}>
                      {status.icon} {status.label}
                    </Text>
                  </View>
                </View>

                {job && (
                  <View style={profStyles.appDetails}>
                    <Text style={profStyles.appDetailText}>💰 {job.hourly_rate} ETB/hr</Text>
                    <Text style={profStyles.appDetailText}>🕐 {toEATDisplay(job.start_time)}</Text>
                    <Text style={profStyles.appDetailText}>📅 {new Date(app.created_at).toLocaleDateString()}</Text>
                  </View>
                )}

                <View style={profStyles.appFooter}>
                  <Text style={profStyles.appFooterText}>Applied {new Date(app.created_at).toLocaleDateString()}</Text>
                  <Text style={profStyles.appArrow}>›</Text>
                </View>
              </ScaleBounce>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const profStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography['2xl'], color: Colors.blue },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  appCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  appHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  appTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  appSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  appDetails: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, flexWrap: 'wrap' },
  appDetailText: { fontSize: Typography.sm, color: Colors.textSecondary },
  appFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  appFooterText: { fontSize: Typography.xs, color: Colors.textSecondary },
  appArrow: { fontSize: Typography['2xl'], color: Colors.textSecondary },
});
