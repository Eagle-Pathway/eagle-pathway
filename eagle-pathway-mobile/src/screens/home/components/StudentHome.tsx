import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar, Avatar, SectionTitle } from '@/components/common';
import { openWhatsApp } from '@/utils/linking';
import { User, Application, Scholarship, Booking, StudentTask } from '@/types';

interface StudentHomeProps {
  user: User;
  firstName: string;
  greeting: string;
  initials: string;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  bookings: Booking[];
  applications: Application[];
  tasks: StudentTask[];
  recommendedScholarships: Scholarship[];
  toggleTask: (taskId: string, currentStatus: string) => Promise<void>;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  user,
  firstName,
  greeting,
  initials,
  unreadCount,
  refreshing,
  onRefresh,
  bookings,
  applications,
  tasks,
  recommendedScholarships,
  toggleTask,
}) => {
  const activeApplications = (applications || []).filter(a => !['accepted', 'rejected'].includes(a.status));
  
  const readinessScore = React.useMemo(() => {
    let score = 0;
    if (activeApplications.length > 0) score += 30;
    if ((bookings || []).length > 0) score += 20;
    if ((tasks || []).filter(t => t.status === 'completed').length > 0) score += 10;
    score += Math.min((applications || []).length * 10, 20);
    return Math.min(score + 20, 100);
  }, [activeApplications, bookings, applications, tasks]);

  const upcomingBookings = (bookings || [])
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .slice(0, 2);

  const pendingTasks = (tasks || [])
    .filter(t => t.status === 'pending' || t.status === 'overdue')
    .slice(0, 3);

  const premiumApp = applications.find(a => a.package_tier === 'premium' || a.package_tier === 'standard');
  const assignedConsultant = premiumApp?.consultant;

  const TASK_ICONS: Record<string, string> = {
    document: '📄', sop: '✍️', payment: '💰', session: '📅', other: '🎯'
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroBg}>
            <View style={styles.heroOverlay1} />
            <View style={styles.heroOverlay2} />
          </View>
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

        {(!user.gpa || !user.interested_subjects?.length) && (
          <TouchableOpacity 
            style={[styles.readinessBanner, { backgroundColor: Colors.blueDark, borderColor: 'rgba(255,255,255,0.1)' }]} 
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.9}
          >
            <View style={[styles.readinessIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={{ fontSize: 20 }}>🧠</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.readinessTitle, { color: Colors.white }]}>Personalize Your Feed</Text>
              <Text style={[styles.readinessSub, { color: 'rgba(255,255,255,0.6)' }]}>Add your GPA and interests to get 100% matched scholarships.</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.gold }} />
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {!assignedConsultant && user.gpa && (
          <TouchableOpacity style={styles.readinessBanner} onPress={() => router.push('/progress')} activeOpacity={0.9}>
            <View style={styles.readinessIconWrap}><Text style={{ fontSize: 20 }}>⭐</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.readinessTitle}>Scholarship Readiness: {readinessScore}%</Text>
              <Text style={styles.readinessSub}>Tap to view your progress and complete tasks</Text>
              <ProgressBar progress={readinessScore} color={Colors.gold} height={5} style={{ marginTop: 8 }} />
            </View>
          </TouchableOpacity>
        )}

        {recommendedScholarships.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
              <View>
                <Text style={{ fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text }}>Top Matches For You</Text>
                <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 }}>Based on your academic profile</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.blue }}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.lg, paddingBottom: 10 }}>
              {recommendedScholarships.map(s => (
                <TouchableOpacity 
                  key={s.id} 
                  style={styles.discoverCard}
                  onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
                  activeOpacity={0.9}
                >
                  <View style={styles.discoverCardTop}>
                    <View style={styles.discoverFlag}><Text style={{ fontSize: 28 }}>{s.country_flag}</Text></View>
                    {(s as any).match_score && (
                      <View style={styles.matchScoreBadge}>
                        <Text style={styles.matchScoreText}>{(s as any).match_score}%</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.discoverName} numberOfLines={1}>{s.name}</Text>
                    <Text style={styles.discoverOrg} numberOfLines={1}>{s.organization}</Text>
                  </View>
                  <View style={styles.discoverFooter}>
                    <View style={styles.discoverTag}>
                       <Text style={styles.discoverTagText}>{s.funding_type === 'fully_funded' ? 'Full' : 'Partial'}</Text>
                    </View>
                    {s.deadline && (
                      <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                        Ends {format(new Date(s.deadline), 'MMM d')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {upcomingBookings.length > 0 && (
          <>
            <SectionTitle title="Upcoming Sessions" />
            {upcomingBookings.map(booking => (
              <View key={booking.id} style={styles.sessionCard}>
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
              </View>
            ))}
          </>
        )}

        <View style={{ height: Spacing['4xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hero: { 
    backgroundColor: Colors.blueDark, 
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.lg, 
    paddingBottom: Spacing['2xl'],
    position: 'relative',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: Colors.blueDark,
  },
  heroOverlay1: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroOverlay2: { position: 'absolute', bottom: -60, right: 20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl, zIndex: 2 },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  notifBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.blueDark },
  notifCount: { fontSize: 8, color: Colors.white, fontWeight: Typography.bold },
  quickCards: { 
    flexDirection: 'row', 
    gap: Spacing.sm,
    zIndex: 2,
  },
  quickCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    borderRadius: Radius.xl, 
    padding: Spacing.md, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickCardIcon: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickCardLabel: { fontSize: 12, fontWeight: Typography.bold, color: Colors.white },
  quickCardSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  premiumCard: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg, marginBottom: Spacing.xl, borderRadius: Radius.xl, overflow: 'hidden', backgroundColor: Colors.white, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  premiumContent: { padding: Spacing.lg, backgroundColor: '#fff' },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  vipBadge: { backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  vipBadgeText: { color: Colors.white, fontSize: 10, fontWeight: Typography.bold },
  premiumTitle: { fontSize: 12, fontWeight: Typography.semibold, color: Colors.textSecondary },
  consultantRow: { flexDirection: 'row', alignItems: 'center' },
  consultantName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  consultantSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  waIcon: { width: 40, height: 40, backgroundColor: '#e8f5e9', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  readinessBanner: { marginHorizontal: Spacing.xl, padding: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl, marginTop: Spacing.lg },
  readinessIconWrap: { width: 44, height: 44, backgroundColor: '#fffbeb', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  readinessTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  readinessSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  discoverCard: { width: 220, backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  discoverCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  discoverFlag: { width: 50, height: 50, backgroundColor: '#f3f4f6', borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  matchScoreBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  matchScoreText: { fontSize: 12, fontWeight: Typography.bold, color: '#10b981' },
  discoverName: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  discoverOrg: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  discoverFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  discoverTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discoverTagText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.blue },
  taskContainer: { paddingHorizontal: Spacing.xl },
  taskCard: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  taskCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
  taskCheckDone: { backgroundColor: Colors.gold },
  taskTitle: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
  taskTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },
  taskSub: { fontSize: 10, color: Colors.textSecondary },
  sessionCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sessionName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sessionTime: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: Colors.blueLight, borderRadius: 10 },
  sessionTimeText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.blue },
});
