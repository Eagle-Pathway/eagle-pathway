import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '../../utils/theme';
import { ProgressBar, Avatar, SectionTitle } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { format } from 'date-fns';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { bookings, applications, unreadCount, loadBookings, loadApplications, loadNotifications } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .slice(0, 2);

  const activeApplications = applications.filter(
    a => !['accepted', 'rejected'].includes(a.status)
  );

  const readinessScore = React.useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (activeApplications.length > 0) score += 30;
    if (bookings.length > 0) score += 20;
    score += Math.min(applications.length * 10, 30);
    return Math.min(score + 20, 100);
  }, [user, activeApplications, bookings, applications]);

  const load = async () => {
    if (!user) return;
    await Promise.all([
      loadBookings(user.id),
      loadApplications(user.id),
      loadNotifications(user.id),
    ]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay1} />
          <View style={styles.heroOverlay2} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')} activeOpacity={0.8}>
                <Text style={styles.notifIcon}>🔔</Text>
                {unreadCount > 0 && <View style={styles.notifDot}><Text style={styles.notifCount}>{unreadCount}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.9}>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick action cards */}
          <View style={styles.quickCards}>
            {[
              { label: 'Find Tutor', sub: '48 available', emoji: '👨‍🏫', route: '/(tabs)/tutors' },
              { label: 'Scholarships', sub: '23 open now', emoji: '🎓', route: '/(tabs)/scholarships' },
              { label: 'My Tracker', sub: `${activeApplications.length} active`, emoji: '📊', route: '/tracker' },
            ].map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.quickCard}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.quickCardIcon}><Text style={{ fontSize: 16 }}>{card.emoji}</Text></View>
                <Text style={styles.quickCardLabel}>{card.label}</Text>
                <Text style={styles.quickCardSub}>{card.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Readiness banner */}
        <TouchableOpacity style={styles.readinessBanner} onPress={() => router.push('/progress')} activeOpacity={0.9}>
          <View style={styles.readinessIconWrap}><Text style={{ fontSize: 20 }}>⭐</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.readinessTitle}>Scholarship Readiness: {readinessScore}%</Text>
            <Text style={styles.readinessSub}>Tap to view your progress and complete tasks</Text>
            <ProgressBar progress={readinessScore} color={Colors.gold} height={5} style={{ marginTop: 8 }} />
          </View>
        </TouchableOpacity>

        {/* Upcoming sessions */}
        {upcomingBookings.length > 0 && (
          <>
            <SectionTitle title="Upcoming Sessions" />
            {upcomingBookings.map(booking => (
              <TouchableOpacity
                key={booking.id}
                style={styles.sessionCard}
                onPress={() => router.push('/(tabs)/bookings')}
                activeOpacity={0.9}
              >
                <Avatar
                  initials={(booking.tutor?.user?.full_name || 'T').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  size={44}
                  borderRadius={13}
                />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.sessionName}>{booking.tutor?.user?.full_name || 'Tutor'}</Text>
                  <Text style={styles.sessionSub}>{booking.subject} · {booking.session_type === 'online' ? 'Online' : 'In-Person'}</Text>
                </View>
                <View style={styles.sessionTime}>
                  <Text style={styles.sessionTimeText}>
                    {format(new Date(`${booking.session_date}T${booking.session_time}`), 'MMM d, h:mm a')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Stats */}
        <SectionTitle title="Your Stats" />
        <View style={styles.statsRow}>
          {[
            { num: bookings.filter(b => b.status === 'completed').length, label: 'Sessions Done' },
            { num: applications.length, label: 'Applications' },
            { num: activeApplications.length, label: 'Active' },
          ].map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={styles.statNum}>{stat.num}</Text>
              <Text style={styles.statLbl}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Active applications */}
        {activeApplications.length > 0 && (
          <>
            <SectionTitle title="Active Applications" />
            {activeApplications.slice(0, 2).map(app => (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                onPress={() => router.push('/tracker')}
                activeOpacity={0.9}
              >
                <Text style={styles.appFlag}>{app.scholarship?.country_flag || '🌍'}</Text>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.appName}>{app.scholarship?.name || 'Scholarship'}</Text>
                  <Text style={styles.appStatus}>{app.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: app.status === 'submitted' ? Colors.green : Colors.gold }]} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.blueDark,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    overflow: 'hidden',
  },
  heroOverlay1: {
    position: 'absolute', top: -40, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroOverlay2: {
    position: 'absolute', bottom: -60, right: 20,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  notifBtn: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.blueDark,
  },
  notifCount: { fontSize: 8, color: Colors.white, fontWeight: Typography.bold },
  quickCards: { flexDirection: 'row', gap: Spacing.sm },
  quickCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickCardIcon: {
    width: 32, height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10, marginBottom: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  quickCardLabel: { fontSize: 11, fontWeight: Typography.semibold, color: 'rgba(255,255,255,0.9)' },
  quickCardSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  readinessBanner: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: Colors.goldLight,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1, borderColor: '#e8d5a0',
    flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start',
  },
  readinessIconWrap: {
    width: 36, height: 36, backgroundColor: Colors.white,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  readinessTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: '#7a5c1e' },
  readinessSub: { fontSize: Typography.sm, color: '#9a7230', marginTop: 2 },
  sessionCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  sessionName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sessionTime: { backgroundColor: Colors.blueLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  sessionTimeText: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.blue },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginHorizontal: Spacing.xl, marginBottom: Spacing.md },
  statBox: {
    flex: 1, backgroundColor: Colors.card,
    borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statNum: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.blue },
  statLbl: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  appCard: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center',
  },
  appFlag: { fontSize: 28 },
  appName: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  appStatus: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
