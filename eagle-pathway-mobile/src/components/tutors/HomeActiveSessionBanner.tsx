import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { useTutorSessionStore } from '@/store/tutorSessionStore';
import { useBookingStore } from '@/store/bookingStore';
import { ActiveSessionTracker } from './ActiveSessionTracker';
import { getUserRole } from '@/utils/role';
import { format } from 'date-fns';

export function HomeActiveSessionBanner() {
  const { user } = useAuthStore();
  const { activeSession, loadActiveSession } = useTutorSessionStore();
  const { bookings, loadBookings, loadTutorBookings } = useBookingStore();

  const isTutor = getUserRole(user).toLowerCase() === 'tutor';

  useEffect(() => {
    if (!user) return;
    loadActiveSession(user.id, isTutor);
    if (isTutor) {
      loadTutorBookings(user.id);
    } else {
      loadBookings(user.id);
    }
  }, [user?.id, isTutor]);

  if (!user) return null;

  // Check if there is an active session running right now
  if (activeSession) {
    return (
      <View style={styles.container}>
        <ActiveSessionTracker
          session={activeSession}
          userId={user.id}
          isTutor={isTutor}
          onSessionUpdated={() => loadActiveSession(user.id, isTutor)}
        />
      </View>
    );
  }

  // Check if there is a scheduled session today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayBooking = (bookings || []).find(
    b => b.session_date === todayStr && ['confirmed', 'pending'].includes(b.status)
  );

  if (!todayBooking) return null;

  const partnerName = isTutor ? todayBooking.student?.full_name : todayBooking.tutor?.user?.full_name;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bannerCard}
        onPress={() => router.push('/(tabs)/bookings')}
        activeOpacity={0.85}
      >
        <View style={styles.iconCircle}>
          <Ionicons name="time" size={22} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.bannerTag}>SESSION TODAY</Text>
            <Text style={styles.timeTag}>{todayBooking.session_time}</Text>
          </View>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {todayBooking.subject} with {partnerName || 'User'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/bookings')}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>{isTutor ? 'Clock In' : 'View'}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.blue,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    shadowColor: '#1E4D9B',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTag: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  timeTag: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bannerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  actionBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
});
