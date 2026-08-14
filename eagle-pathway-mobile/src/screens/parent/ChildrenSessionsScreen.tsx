import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState, Avatar, Skeleton } from '@/components/common';
import { useParentStore } from '@/store/parentStore';
import { Booking } from '@/types';

import { withTimeout } from '@/utils/asyncUtils';

export default function ChildrenSessionsScreen() {
  const { studentId, studentName } = useLocalSearchParams<{ studentId: string; studentName: string }>();
  const { linkedStudentBookings, isLoadingLinkedBookings, loadLinkedStudentBookings } = useParentStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    withTimeout(loadLinkedStudentBookings(studentId), 3500).catch(() => {});
  }, [studentId]);

  const allBookings: Booking[] = linkedStudentBookings[studentId || ''] || [];
  const filtered = allBookings.filter(b => {
    if (activeTab === 'upcoming') return ['pending', 'confirmed'].includes(b.status);
    return ['completed', 'cancelled'].includes(b.status);
  });

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{studentName || 'Sessions'}</Text>
          <Text style={styles.headerSub}>Tutoring Sessions</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(['upcoming', 'past'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoadingLinkedBookings ? (
        <View style={{ paddingBottom: 40 }}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.card}>
              <View style={styles.cardTop}>
                <Skeleton width={40} height={40} borderRadius={12} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Skeleton width={120} height={20} borderRadius={4} style={{ marginBottom: 6 }} />
                  <Skeleton width={150} height={16} borderRadius={4} />
                </View>
                <Skeleton width={60} height={24} borderRadius={6} />
              </View>
              <Skeleton width={200} height={16} borderRadius={4} style={{ marginTop: 8 }} />
              <Skeleton width={150} height={16} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="calendar-outline" title={`No ${activeTab} sessions`} subtitle="No tutoring sessions found in this category." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          renderItem={({ item: b }) => {
            const tutorName = b.tutor?.user?.full_name || 'Tutor';
            const initials = tutorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Avatar initials={initials} size={40} borderRadius={12} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.tutorName}>{tutorName}</Text>
                    <Text style={styles.sessionSub}>{b.subject} · {b.session_type === 'online' ? 'Online' : 'In-Person'}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: b.status === 'confirmed' ? Colors.blueLight : b.status === 'pending' ? Colors.goldLight : Colors.grayLight }]}>
                    <Text style={[styles.statusText, { color: b.status === 'confirmed' ? Colors.blue : b.status === 'pending' ? Colors.goldDark : Colors.textSecondary }]}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detail}>📅 {format(new Date(b.session_date), 'MMM d, yyyy')} · {b.session_time}</Text>
                <Text style={styles.detail}>🕐 {b.duration_hours}h · ETB {b.total_amount}</Text>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => router.push({ pathname: '/packages', params: { amount: b.total_amount, type: 'tutor_booking' } })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.payBtnText}>💳 Pay Session (ETB {b.total_amount})</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoadingLinkedBookings} onRefresh={() => loadLinkedStudentBookings(studentId)} tintColor={Colors.blue} />}
          initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: Colors.text },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  headerSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, padding: Spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.blue },
  tabText: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.blue },
  card: { marginHorizontal: Spacing.xl, marginTop: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius['2xl'], padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tutorName: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  detail: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  payBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  payBtnText: {
    color: Colors.white,
    fontWeight: Typography.bold,
    fontSize: Typography.xs,
  },
});
