import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar, Avatar, SectionTitle } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { format } from 'date-fns';
import { openWhatsApp } from '@/utils/linking';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { 
    bookings, applications, unreadCount, tasks, recommendedScholarships,
    loadBookings, loadTutorBookings, loadApplications, loadNotifications, loadTasks, toggleTask,
    updateBookingStatus, loadRecommendations
  } = useAppStore();
  const [refreshing, setRefreshing] = React.useState(false);

  // 1. All Hooks Must Be At The Top
  const isTutor = user?.role?.toLowerCase() === 'tutor';

  const activeApplications = React.useMemo(() => 
    applications.filter(a => !['accepted', 'rejected'].includes(a.status)),
    [applications]
  );

  const readinessScore = React.useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (activeApplications.length > 0) score += 30;
    if (bookings.length > 0) score += 20;
    if (tasks.filter(t => t.status === 'completed').length > 0) score += 10;
    score += Math.min(applications.length * 10, 20);
    return Math.min(score + 20, 100);
  }, [user, activeApplications, bookings, applications, tasks]);

  const load = async () => {
    if (!user) return;
    const tasks = [loadNotifications(user.id)];
    if (isTutor) {
      tasks.push(loadTutorBookings(user.id));
    } else {
      tasks.push(loadBookings(user.id));
      tasks.push(loadApplications(user.id));
      tasks.push(loadTasks(user.id));
      tasks.push(loadRecommendations(user.id));
    }
    await Promise.all(tasks);
  };

  useEffect(() => { load(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!user) return null; // Early return for unauthenticated state is okay as long as all hooks were called above

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EP';
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const TASK_ICONS: Record<string, string> = {
    document: '📄', sop: '✍️', payment: '💰', session: '📅', other: '🎯'
  };

  if (isTutor) {
    const todaySessions = bookings.filter(b => b.status === 'confirmed');
    const pendingSessions = bookings.filter(b => b.status === 'pending');

    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} Tutor 👋</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/notifications')} activeOpacity={0.8}>
                   <Text style={styles.notifIcon}>🔔</Text>
                   {unreadCount > 0 && <View style={styles.notifDot}><Text style={styles.notifCount}>{unreadCount}</Text></View>}
                </TouchableOpacity>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </View>
            </View>
            <View style={styles.quickCards}>
              <View style={[styles.quickCard, { backgroundColor: '#1e3a8a' }]}>
                <Text style={styles.quickCardLabel}>Total Earnings</Text>
                <Text style={[styles.userName, { fontSize: 24 }]}>ETB 14,200</Text>
              </View>
              <View style={styles.quickCard}>
                <Text style={styles.quickCardLabel}>Rating</Text>
                <Text style={[styles.userName, { fontSize: 24 }]}>4.9 ⭐</Text>
              </View>
            </View>
          </View>

          <SectionTitle title="Today's Sessions" />
          {todaySessions.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: Colors.textSecondary }}>No sessions scheduled for today.</Text></View>
          ) : (
            todaySessions.map(b => (
              <View key={b.id} style={styles.sessionCard}>
                 <Avatar initials={b.student?.full_name?.[0] || 'S'} size={40} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sessionName}>{b.student?.full_name}</Text>
                  <Text style={styles.sessionSub}>
                    {b.subject} · {(() => {
                      try {
                        if (!b.session_time) return 'TBD';
                        return format(new Date(`2000-01-01T${b.session_time}`), 'h:mm a');
                      } catch (e) {
                         return b.session_time;
                      }
                    })()}
                  </Text>
                </View>
                 <TouchableOpacity style={styles.sessionTime} onPress={() => updateBookingStatus(b.id, 'completed' as any)}>
                   <Text style={styles.sessionTypeBadge}>Complete</Text>
                 </TouchableOpacity>
              </View>
            ))
          )}

          <SectionTitle title="Pending Requests" />
          {pendingSessions.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: Colors.textSecondary }}>All caught up!</Text></View>
          ) : (
            pendingSessions.map(b => (
              <View key={b.id} style={styles.sessionCard}>
                 <View style={{ flex: 1 }}>
                   <Text style={styles.sessionName}>{b.student?.full_name}</Text>
                   <Text style={styles.sessionSub}>
                     {b.subject} · {(() => {
                       try {
                         if (!b.session_date) return 'TBD';
                         return format(new Date(`${b.session_date}T00:00:00`), 'MMM d');
                       } catch (e) {
                         return b.session_date;
                       }
                     })()}
                   </Text>
                 </View>
                 <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[styles.sessionTime, { backgroundColor: Colors.greenLight }]} onPress={() => updateBookingStatus(b.id, 'confirmed' as any)}>
                      <Text style={{ color: Colors.green }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sessionTime, { backgroundColor: Colors.redLight }]} onPress={() => updateBookingStatus(b.id, 'cancelled' as any)}>
                      <Text style={{ color: Colors.red }}>Decline</Text>
                    </TouchableOpacity>
                 </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .slice(0, 2);

  const pendingTasks = tasks
    .filter(t => t.status === 'pending' || t.status === 'overdue')
    .slice(0, 3);

  const premiumApp = applications.find(a => a.package_tier === 'premium' || a.package_tier === 'standard');
  const assignedConsultant = premiumApp?.consultant;

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

        {/* Premium Consultant Card */}
        {assignedConsultant && (
          <TouchableOpacity 
            style={styles.premiumCard} 
            onPress={() => openWhatsApp(assignedConsultant.phone || '', `Hi ${assignedConsultant.full_name}, I'm your premium student ${firstName}. I have a question about my ${premiumApp?.scholarship?.name} application.`)}
            activeOpacity={0.9}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumHeader}>
                <View style={styles.vipBadge}><Text style={styles.vipBadgeText}>VIP CONSULTANT</Text></View>
                <Text style={styles.premiumTitle}>Direct Support Active</Text>
              </View>
              <View style={styles.consultantRow}>
                <Avatar initials={assignedConsultant.full_name[0]} imageUri={assignedConsultant.avatar_url} size={50} borderRadius={15} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.consultantName}>{assignedConsultant.full_name}</Text>
                  <Text style={styles.consultantSub}>Senior Scholarship Consultant</Text>
                </View>
                <View style={styles.waIcon}><Text style={{ fontSize: 20 }}>💬</Text></View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Readiness banner */}
        {!assignedConsultant && (
          <TouchableOpacity style={styles.readinessBanner} onPress={() => router.push('/progress')} activeOpacity={0.9}>
            <View style={styles.readinessIconWrap}><Text style={{ fontSize: 20 }}>⭐</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readinessTitle}>Scholarship Readiness: {readinessScore}%</Text>
              <Text style={styles.readinessSub}>Tap to view your progress and complete tasks</Text>
              <ProgressBar progress={readinessScore} color={Colors.gold} height={5} style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        )}

        {/* Recommended Scholarships */}
        {recommendedScholarships.length > 0 && (
          <>
            <SectionTitle title="Recommended for You" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}>
              {recommendedScholarships.map(s => (
                <TouchableOpacity 
                  key={s.id} 
                  style={styles.recCard}
                  onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
                  activeOpacity={0.9}
                >
                  <View style={styles.recFlag}><Text style={{ fontSize: 24 }}>{s.country_flag}</Text></View>
                  <Text style={styles.recName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.recOrg} numberOfLines={1}>{s.organization}</Text>
                  <View style={styles.recPill}>
                    <Text style={styles.recPillText}>{s.funding_type === 'fully_funded' ? 'Fully Funded' : 'Partial'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Action Items */}
        {pendingTasks.length > 0 && (
          <>
            <SectionTitle title="Action Items" />
            <View style={styles.taskContainer}>
              {pendingTasks.map(task => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => toggleTask(task.id, task.status)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.taskCheck, task.status === 'completed' && styles.taskCheckDone]}>
                    <Text style={{ color: Colors.white, fontSize: 10 }}>{task.status === 'completed' ? '✓' : ''}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTextDone]}>{task.title}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 12 }}>{TASK_ICONS[task.type] || '🎯'}</Text>
                      <Text style={styles.taskSub}>
                        {task.due_date ? `Due ${format(new Date(task.due_date), 'MMM d')}` : task.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              ))}
              {tasks.length > 3 && (
                <TouchableOpacity style={styles.viewAllTasks} onPress={() => router.push('/progress')}>
                  <Text style={styles.viewAllTasksText}>View all {tasks.length} tasks</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

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
                    {(() => {
                      try {
                        if (!booking.session_date || !booking.session_time) return 'TBD';
                        return format(new Date(`${booking.session_date}T${booking.session_time}`), 'MMM d, h:mm a');
                      } catch (e) {
                        return 'Invalid Date';
                      }
                    })()}
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
  premiumCard: {
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: '#0f172a', borderRadius: Radius['2xl'],
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  premiumContent: { gap: Spacing.md },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vipBadge: { backgroundColor: Colors.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  vipBadgeText: { fontSize: 9, fontWeight: 'bold', color: Colors.blueDark },
  premiumTitle: { fontSize: 13, fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
  consultantRow: { flexDirection: 'row', alignItems: 'center' },
  consultantName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
  consultantSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  waIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
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
  sessionTypeBadge: { fontSize: 10, fontWeight: 'bold', color: Colors.blue },
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
  taskContainer: { paddingHorizontal: Spacing.xl },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskCheck: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckDone: {
    backgroundColor: Colors.blue,
    borderColor: Colors.blue,
  },
  taskTitle: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.text },
  taskTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  taskSub: { fontSize: Typography.xs, color: Colors.textSecondary },
  viewAllTasks: { alignItems: 'center', paddingVertical: Spacing.sm },
  viewAllTasksText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.blue },
  recCard: { width: 160, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  recFlag: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.text },
  recOrg: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  recPill: { marginTop: 8, backgroundColor: Colors.blueLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  recPillText: { fontSize: 9, fontWeight: 'bold', color: Colors.blue },
});
