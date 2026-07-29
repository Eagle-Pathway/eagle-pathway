import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Skeleton } from '@/components/common';
import { tutorJobsService } from '@/services/tutorJobs';
import type { TutorJobApplication } from '@/types';

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  pending: { icon: '🟡', label: 'Pending Review', color: '#b45309', bg: '#fffbeb' },
  contacted: { icon: '🔵', label: 'Contacted', color: '#1d4ed8', bg: '#eff6ff' },
  hired: { icon: '🟢', label: 'Hired', color: '#15803d', bg: '#f0fdf4' },
  rejected: { icon: '🔴', label: 'Not Selected', color: '#dc2626', bg: '#fef2f2' },
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

export function ApplicationDetailScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const [app, setApp] = useState<TutorJobApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (applicationId) {
      tutorJobsService.getApplicationById(applicationId)
        .then(setApp)
        .catch(e => Alert.alert('Error', 'Failed to load application'))
        .finally(() => setLoading(false));
    }
  }, [applicationId]);

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={profStyles.header}>
          <Skeleton width={40} height={40} style={{ borderRadius: 20 }} />
          <Skeleton width={200} height={30} style={{ borderRadius: 8 }} />
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
          <Skeleton width="100%" height={80} style={{ borderRadius: Radius.xl, marginBottom: Spacing.lg }} />
          <View style={profStyles.section}>
            <Skeleton width={120} height={24} style={{ borderRadius: 4, marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={250} style={{ borderRadius: Radius.xl }} />
          </View>
          <View style={profStyles.section}>
            <Skeleton width={140} height={24} style={{ borderRadius: 4, marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={200} style={{ borderRadius: Radius.xl }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (!app) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <View style={profStyles.header}>
          <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
            <Text style={profStyles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={profStyles.headerTitle}>Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
  const job = app.job_post;

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={profStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={profStyles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={profStyles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={profStyles.headerTitle}>Application Details</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}>
        <View style={[profStyles.statusBanner, { backgroundColor: status.bg }]}>
          <Text style={profStyles.statusIcon}>{status.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[profStyles.statusLabel, { color: status.color }]}>{status.label}</Text>
            <Text style={profStyles.statusDate}>Applied {new Date(app.created_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {job && (
          <View style={profStyles.section}>
            <Text style={profStyles.sectionTitle}>Job Details</Text>
            <View style={profStyles.card}>
              <Row icon="📍" label="Place" value={job.place} />
              <Row icon="📚" label="Grade" value={job.grade} />
              <Row icon="📖" label="Subjects" value={job.subjects?.join(', ')} />
              <Row icon="⏱" label="Session" value={`${job.session_hours} hrs/day`} />
              <Row icon="📅" label="Days" value={`${job.days_per_week} days/week`} />
              <Row icon="🕐" label="Start" value={toEATDisplay(job.start_time)} />
              <Row icon="💰" label="Rate" value={`${job.hourly_rate} ETB/hr`} />
            </View>
          </View>
        )}

        <View style={profStyles.section}>
          <Text style={profStyles.sectionTitle}>Your Application</Text>
          <View style={profStyles.card}>
            <Row icon="🎓" label="Status" value={app.education_status || '-'} />
            <Row icon="📍" label="Address" value={app.living_address || '-'} />
            <Row icon="🏛" label="University" value={app.university_name || '-'} />
            <Row icon="📞" label="Phone" value={app.phone_number || '-'} />
            <Row icon="✈️" label="Telegram" value={app.telegram_username ? '@' + app.telegram_username : '-'} />
            <Row icon="📊" label="CGPA" value={app.cgpa || '-'} />
          </View>
        </View>

        {app.grade10_result_url || app.grade12_result_url || app.transcript_url ? (
          <View style={profStyles.section}>
            <Text style={profStyles.sectionTitle}>Documents</Text>
            <View style={profStyles.card}>
              {app.grade10_result_url && <DocRow label="Grade 10 Result" path={app.grade10_result_url} />}
              {app.grade12_result_url && <DocRow label="Grade 12 Result" path={app.grade12_result_url} />}
              {app.transcript_url && <DocRow label="Transcript" path={app.transcript_url} />}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={profStyles.row}>
      <Text style={profStyles.rowIcon}>{icon}</Text>
      <Text style={profStyles.rowLabel}>{label}</Text>
      <Text style={profStyles.rowValue}>{value}</Text>
    </View>
  );
}

function DocRow({ label, path }: { label: string; path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleView = async () => {
    setLoading(true);
    try {
      const signedUrl = await tutorJobsService.getDocumentSignedUrl(path);
      setUrl(signedUrl);
    } catch (e) {
      Alert.alert('Error', 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={profStyles.docRow}>
      <Text style={profStyles.rowLabel}>{label}</Text>
      <TouchableOpacity onPress={handleView} disabled={loading} style={profStyles.viewDocBtn}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.blue} />
        ) : (
          <Text style={profStyles.viewDocText}>View Document</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const profStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: Typography['2xl'], color: Colors.blue },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  statusIcon: { fontSize: 28 },
  statusLabel: { fontSize: Typography.lg, fontWeight: Typography.bold },
  statusDate: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, marginBottom: Spacing.sm },
  card: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 16, width: 28 },
  rowLabel: { fontSize: Typography.base, color: Colors.textSecondary, width: 85 },
  rowValue: { fontSize: Typography.base, color: Colors.text, flex: 1, textAlign: 'right' },
  docRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  viewDocBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.blueLight, borderRadius: Radius.md },
  viewDocText: { fontSize: Typography.xs, color: Colors.blue, fontWeight: Typography.semibold },
});
