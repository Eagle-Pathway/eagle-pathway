import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar, Avatar, SectionTitle, Skeleton, ScaleBounce } from '@/components/common';
import { openWhatsApp } from '@/utils/linking';
import { getApplicationDeadlines, deadlineUrgency, deadlineLabel } from '@/utils/deadlines';
import { User, Application, Scholarship, Booking, StudentTask } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';

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
  openScholarshipsCount?: number;
  availableTutorsCount?: number;
  loading?: boolean;
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
  openScholarshipsCount,
  availableTutorsCount,
  loading,
}) => {
  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
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
                <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
                  <Text style={styles.notifIcon}>🔔</Text>
                </TouchableOpacity>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </View>
            </View>

            <View style={styles.quickCards}>
              {[1, 2, 3].map(i => (
                <View key={i} style={[styles.quickCard, { opacity: 0.6 }]}>
                  <Skeleton width={32} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="50%" height={8} />
                </View>
              ))}
            </View>
          </View>

          {/* Top matches skeleton */}
          <View style={{ marginTop: Spacing.xl }}>
            <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
              <Skeleton width={180} height={18} style={{ marginBottom: 6 }} />
              <Skeleton width={120} height={10} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.lg }}>
              {[1, 2].map(i => (
                <View key={i} style={[styles.discoverCard, { width: 220 }]}>
                  <View style={styles.discoverCardTop}>
                    <Skeleton width={50} height={50} borderRadius={Radius.lg} />
                    <Skeleton width={40} height={20} borderRadius={8} />
                  </View>
                  <View style={{ marginTop: 12, gap: 6 }}>
                    <Skeleton width="90%" height={14} />
                    <Skeleton width="60%" height={10} />
                  </View>
                  <View style={[styles.discoverFooter, { marginTop: 12 }]}>
                    <Skeleton width={40} height={18} borderRadius={6} />
                    <Skeleton width={60} height={10} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Tasks skeleton */}
          <SectionTitle title="Action Items" />
          <View style={styles.taskContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.taskCard}>
                <Skeleton width={20} height={20} borderRadius={10} />
                <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="40%" height={10} />
                </View>
              </View>
            ))}
          </View>

          {/* Upcoming Sessions skeleton */}
          <SectionTitle title="Upcoming Sessions" />
          {[1, 2].map(i => (
            <View key={i} style={styles.sessionCard}>
              <Skeleton width={44} height={44} borderRadius={13} />
              <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={80} height={24} borderRadius={10} />
            </View>
          ))}

          <View style={{ height: Spacing['4xl'] }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activeApplications = (applications || []).filter(a => !['accepted', 'rejected'].includes(a.status));

  const closingSoon = React.useMemo(() => getApplicationDeadlines(applications), [applications]);

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
              { label: 'Find Tutor', sub: `${availableTutorsCount ?? 0} available`, emoji: '👨‍🏫', route: '/(tabs)/tutors' },
              { label: 'Scholarships', sub: `${openScholarshipsCount ?? 0} open now`, emoji: '🎓', route: '/(tabs)/scholarships' },
              { label: 'My Tracker', sub: `${activeApplications.length} active`, emoji: '📊', route: '/tracker' },
              { label: 'Resources', sub: 'Guides & tips', emoji: '📚', route: '/resources' },
            ].map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.quickCard}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.quickCardIcon}><Text style={{ fontSize: 16 }}>{card.emoji}</Text></View>
                <Text style={styles.quickCardLabel} numberOfLines={1}>{card.label}</Text>
                <Text style={styles.quickCardSub} numberOfLines={1}>{card.sub}</Text>
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

        {closingSoon.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <SectionTitle title="⏰ Closing Soon" />
            <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
              {closingSoon.map(item => {
                const urgency = deadlineUrgency(item.daysLeft);
                const tone =
                  urgency === 'critical'
                    ? { color: '#dc2626', bg: '#fef2f2' }
                    : urgency === 'soon'
                    ? { color: '#b45309', bg: '#fffbeb' }
                    : { color: Colors.blue, bg: Colors.blueLight };
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={styles.deadlineCard}
                    onPress={() => router.push('/tracker')}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.deadlineName} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.deadlineSub}>Deadline {format(new Date(item.deadline), 'MMM d, yyyy')}</Text>
                    </View>
                    <View style={[styles.deadlineChip, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.deadlineChipText, { color: tone.color }]}>{deadlineLabel(item.daysLeft)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
                 <ScaleBounce 
                  key={s.id} 
                  style={styles.discoverCard}
                  onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
                >
                  <View style={styles.discoverCardTop}>
                    <View style={[styles.discoverFlag, { padding: 4 }]}>
                      {(() => {
                        const flag = getFlagEmoji(s.country_flag);
                        const isWord = /[a-zA-Z]/.test(flag);
                        return (
                          <Text 
                            numberOfLines={1} 
                            adjustsFontSizeToFit 
                            minimumFontScale={0.5} 
                            style={{ 
                              fontSize: isWord ? 10 : 28, 
                              fontWeight: isWord ? 'bold' : 'normal', 
                              textAlign: 'center', 
                              color: Colors.text 
                            }}
                          >
                            {flag}
                          </Text>
                        );
                      })()}
                    </View>
                    {(s as any).matchScore != null && (
                      <View style={styles.matchScoreBadge}>
                        <Text style={styles.matchScoreText}>{(s as any).matchScore}%</Text>
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
                </ScaleBounce>
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
  discoverCard: { 
    width: 220, 
    backgroundColor: Colors.white, 
    borderRadius: Radius.xl, 
    padding: Spacing.md, 
    borderWidth: 1, 
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  discoverCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  discoverFlag: { width: 50, height: 50, backgroundColor: '#f3f4f6', borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  matchScoreBadge: { 
    backgroundColor: '#ecfdf5', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 1,
  },
  matchScoreText: { fontSize: 12, fontWeight: Typography.bold, color: '#10b981' },
  discoverName: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  discoverOrg: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  discoverFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  discoverTag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  discoverTagText: { fontSize: 10, fontWeight: Typography.bold, color: Colors.blue },
  deadlineCard: { backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  deadlineName: { fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.text },
  deadlineSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  deadlineChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginLeft: Spacing.md },
  deadlineChipText: { fontSize: 11, fontWeight: Typography.bold },
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
