import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { ProgressBar, Avatar, SectionTitle, Skeleton, ScaleBounce } from '@/components/common';
import { openWhatsApp } from '@/utils/linking';
import { getApplicationDeadlines, deadlineUrgency, deadlineLabel } from '@/utils/deadlines';
import { User, Application, Scholarship, Booking, StudentTask, Tutor } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { useScholarshipStore } from '@/store/scholarshipStore';
import { tutorsService } from '@/services/tutors';
import { HomeActiveSessionBanner } from '@/components/tutors/HomeActiveSessionBanner';

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

const STATIC_GUIDES = [
  {
    id: 'sat-prep',
    title: 'SAT Exam Mastery Guide',
    sub: 'Math, Reading & Writing strategies',
    tag: 'Exam Prep',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'book-outline',
  },
  {
    id: 'essay-sop',
    title: 'Scholarship Essay & SOP Guide',
    sub: 'Templates & winning sample essays',
    tag: 'Admissions',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'create-outline',
  },
  {
    id: 'national-exam',
    title: 'National Exam Cheat Sheets',
    sub: 'Grade 10 & 12 curriculum summaries',
    tag: 'Study Resource',
    color: '#059669',
    bg: '#ECFDF5',
    icon: 'school-outline',
  },
];

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
  loading = false,
}) => {
  const [featuredTutors, setFeaturedTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    tutorsService.getTutors().then(data => {
      setFeaturedTutors(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const activeApplications = React.useMemo(
    () => (applications || []).filter(a => !['accepted', 'rejected'].includes(a.status)),
    [applications]
  );

  const closingSoon = React.useMemo(() => getApplicationDeadlines(applications), [applications]);

  const readinessScore = React.useMemo(() => {
    let score = 0;
    if (activeApplications.length > 0) score += 30;
    if ((bookings || []).length > 0) score += 20;
    if ((tasks || []).filter(t => t.status === 'completed').length > 0) score += 10;
    score += Math.min((applications || []).length * 10, 20);
    return Math.min(score + 20, 100);
  }, [activeApplications, bookings, applications, tasks]);

  const upcomingBookings = React.useMemo(
    () => (bookings || []).filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 2),
    [bookings]
  );

  const pendingTasks = React.useMemo(
    () => (tasks || []).filter(t => t.status === 'pending' || t.status === 'overdue').slice(0, 3),
    [tasks]
  );

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
                  <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                </TouchableOpacity>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </View>
            </View>

            <View style={styles.quickCards}>
              {[1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.quickCard, { opacity: 0.6 }]}>
                  <Skeleton width={32} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width="80%" height={12} style={{ marginBottom: 6 }} />
                  <Skeleton width="50%" height={8} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const premiumApp = applications.find(a => a.package_tier === 'premium' || a.package_tier === 'standard');
  const assignedConsultant = premiumApp?.consultant;

  const TASK_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    document: 'document-text-outline', sop: 'create-outline', payment: 'cash-outline', session: 'calendar-outline', other: 'flag-outline'
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Top Header Hero */}
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
                <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                {unreadCount > 0 && <View style={styles.notifDot}><Text style={styles.notifCount}>{unreadCount}</Text></View>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.9}>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Action Cards with Non-Truncated Clean Labels */}
          <View style={styles.quickCards}>
            {[
              { label: 'Find Tutor', sub: `${availableTutorsCount ?? 0} available`, icon: 'school-outline' as const, route: '/(tabs)/tutors' },
              { label: 'Scholarships', sub: `${Math.max(openScholarshipsCount ?? 0, recommendedScholarships?.length ?? 0)} open now`, icon: 'ribbon-outline' as const, route: '/(tabs)/scholarships' },
              { label: 'Tracker', sub: `${activeApplications.length} active`, icon: 'bar-chart-outline' as const, route: '/tracker' },
              { label: 'Resources', sub: 'Study guides', icon: 'library-outline' as const, route: '/resources' },
            ].map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.quickCard}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.quickCardIcon}>
                  <Ionicons name={card.icon} size={16} color={Colors.white} />
                </View>
                <Text style={styles.quickCardLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  {card.label}
                </Text>
                <Text style={styles.quickCardSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {card.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Active Session & Scheduled Today Banner */}
        <HomeActiveSessionBanner />

        {/* VIP Consultant Card (if active) */}
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
                <View style={styles.waIcon}><Ionicons name="chatbubble-outline" size={20} color={Colors.green} /></View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Profile Personalization Prompt */}
        {(!user.gpa || !user.interested_subjects?.length) && (
          <TouchableOpacity 
            style={[styles.readinessBanner, { backgroundColor: Colors.blueDark, borderColor: 'rgba(255,255,255,0.1)' }]} 
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.9}
          >
            <View style={[styles.readinessIconWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="bulb-outline" size={20} color={Colors.white} />
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

        {/* Scholarship Readiness Score */}
        {!assignedConsultant && user.gpa && (
          <TouchableOpacity 
            style={styles.readinessBanner} 
            onPress={() => router.push('/progress')} 
            activeOpacity={0.88}
          >
            <View style={styles.readinessIconWrap}>
              <Ionicons name="trophy" size={22} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.readinessHeaderRow}>
                <Text style={styles.readinessTitle}>Scholarship Readiness</Text>
                <View style={styles.readinessScorePill}>
                  <Text style={styles.readinessScorePillText}>{readinessScore}%</Text>
                </View>
              </View>
              <Text style={styles.readinessSub}>Tap to view your progress &amp; complete tasks</Text>
              <ProgressBar progress={readinessScore} color="#2563EB" height={6} style={{ marginTop: 8 }} />
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}

        {/* Top Matches Scholarships */}
        {recommendedScholarships.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Top Matches For You</Text>
                <Text style={styles.sectionSubHeading}>Curated based on your academic profile</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {recommendedScholarships.map(s => {
                const flag = getFlagEmoji(s.country_flag);
                const isWord = /[a-zA-Z]/.test(flag);
                const countryDisplay = isWord ? (s.country || 'Global') : `${flag} ${s.country || ''}`.trim();
                const matchScore = (s as any).matchScore ?? 95;

                return (
                  <ScaleBounce 
                    key={s.id} 
                    style={styles.discoverCard}
                    onPress={() => router.push({ pathname: '/scholarship-detail', params: { scholarshipId: s.id } })}
                  >
                    <View style={styles.discoverCardTop}>
                      <View style={styles.countryPill}>
                        <Ionicons name="globe-outline" size={12} color="#2563EB" />
                        <Text style={styles.countryPillText} numberOfLines={1}>
                          {countryDisplay || 'Global'}
                        </Text>
                      </View>
                      <View style={styles.matchScoreBadge}>
                        <Ionicons name="sparkles" size={10} color="#059669" />
                        <Text style={styles.matchScoreText}>{matchScore}% Match</Text>
                      </View>
                    </View>

                    <View style={{ marginTop: 10, flex: 1, justifyContent: 'space-between' }}>
                      <View>
                        <Text style={styles.discoverName} numberOfLines={2}>{s.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Ionicons name="business-outline" size={12} color="#64748B" />
                          <Text style={styles.discoverOrg} numberOfLines={1}>{s.organization || 'University Fund'}</Text>
                        </View>
                      </View>

                      <View style={styles.discoverFooter}>
                        <View style={[styles.discoverTag, s.funding_type === 'fully_funded' ? styles.tagFull : styles.tagPartial]}>
                          <Text style={[styles.discoverTagText, s.funding_type === 'fully_funded' ? styles.tagFullText : styles.tagPartialText]}>
                            {s.funding_type === 'fully_funded' ? '✨ Full Fund' : 'Partial'}
                          </Text>
                        </View>
                        {s.deadline && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Ionicons name="calendar-outline" size={11} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: Typography.medium }}>
                              {format(new Date(s.deadline), 'MMM d')}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </ScaleBounce>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 1-Minute Tutor Request Banner */}
        <View style={styles.tutorRequestBanner}>
          <View style={styles.tutorRequestLeft}>
            <View style={styles.tutorRequestBadge}>
              <Text style={styles.tutorRequestBadgeText}>⚡ 1-ON-1 TUTORING</Text>
            </View>
            <Text style={styles.tutorRequestTitle}>Need a Home or Online Tutor?</Text>
            <Text style={styles.tutorRequestDesc}>
              Post your subjects &amp; schedule in 60 seconds — we match you with verified expert tutors.
            </Text>
            <TouchableOpacity 
              style={styles.tutorRequestBtn}
              onPress={() => router.push('/request-tutor')}
              activeOpacity={0.88}
            >
              <Text style={styles.tutorRequestBtnText}>Request Tutor</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Verified Tutors Carousel */}
        {featuredTutors.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionHeading}>Featured Verified Tutors</Text>
                <Text style={styles.sectionSubHeading}>Top rated 1-on-1 tutors in Addis &amp; Online</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/tutors')} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredTutors.map(tutor => (
                <ScaleBounce 
                  key={tutor.id} 
                  style={styles.tutorCard}
                  onPress={() => router.push({ pathname: '/tutor-profile', params: { tutorId: tutor.id } })}
                >
                  <View style={styles.tutorCardTop}>
                    <Avatar 
                      initials={(tutor.user?.full_name || 'Tutor').split(' ').map(n => n[0]).join('').slice(0, 2)}
                      imageUri={tutor.user?.avatar_url}
                      size={46}
                      borderRadius={14}
                    />
                    <View style={styles.tutorRatingBadge}>
                      <Ionicons name="star" size={12} color="#FBBF24" />
                      <Text style={styles.tutorRatingText}>{(tutor.rating || 4.9).toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.tutorName} numberOfLines={1}>
                    {tutor.user?.full_name || 'Expert Tutor'}
                  </Text>
                  <Text style={styles.tutorSubjects} numberOfLines={1}>
                    {(tutor.subjects || ['Math', 'Physics']).slice(0, 2).join(', ')}
                  </Text>
                  <View style={styles.tutorFooter}>
                    <Text style={styles.tutorRate}>
                      {tutor.hourly_rate ? `${tutor.hourly_rate} ETB/hr` : 'Verified'}
                    </Text>
                    <View style={styles.bookPill}>
                      <Text style={styles.bookPillText}>View</Text>
                    </View>
                  </View>
                </ScaleBounce>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Essential Study Guides & Resources */}
        <View style={{ marginTop: Spacing.xl }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Study Guides &amp; Exam Prep</Text>
              <Text style={styles.sectionSubHeading}>Handbooks, cheat sheets &amp; essay templates</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/resources')} activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>Browse All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guidesContainer}>
            {STATIC_GUIDES.map(guide => (
              <TouchableOpacity
                key={guide.id}
                style={styles.guideCard}
                onPress={() => router.push('/resources')}
                activeOpacity={0.82}
              >
                <View style={[styles.guideIconWrap, { backgroundColor: guide.bg }]}>
                  <Ionicons name={guide.icon as any} size={22} color={guide.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.guideTagRow}>
                    <Text style={[styles.guideTag, { color: guide.color }]}>{guide.tag}</Text>
                  </View>
                  <Text style={styles.guideTitle}>{guide.title}</Text>
                  <Text style={styles.guideSub}>{guide.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Eagle AI Assistant Interactive Launcher */}
        <TouchableOpacity 
          style={styles.aiBanner}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.9}
        >
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Eagle AI Study Assistant</Text>
            <Text style={styles.aiSub}>
              Brainstorm essay drafts, practice mock interviews, or get instant exam help.
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#2563EB" />
        </TouchableOpacity>

        {/* Pending Action Items (if any) */}
        {pendingTasks.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
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
                      <Ionicons name={TASK_ICONS[task.type] ?? 'flag-outline'} size={12} color={Colors.textSecondary} />
                      <Text style={styles.taskSub}>
                        {task.due_date ? `Due ${format(new Date(task.due_date), 'MMM d')}` : task.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Closing Soon Deadlines (if any) */}
        {closingSoon.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <SectionTitle title="Closing Soon" />
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

        {/* Upcoming Sessions (if any) */}
        {upcomingBookings.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
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
          </View>
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
    padding: Spacing.sm, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  quickCardIcon: { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickCardLabel: { fontSize: 11, fontWeight: Typography.bold, color: Colors.white, textAlign: 'center' },
  quickCardSub: { fontSize: 9, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.xl, 
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: Typography['2xl'], 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  sectionSubHeading: {
    fontSize: Typography.xs, 
    color: '#64748B', 
    marginTop: 2,
  },
  seeAllLink: {
    fontSize: Typography.sm, 
    fontWeight: Typography.bold, 
    color: Colors.blue,
  },
  horizontalScroll: {
    paddingHorizontal: Spacing.xl, 
    gap: Spacing.md, 
    paddingBottom: 10,
  },
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
  readinessBanner: { 
    marginHorizontal: Spacing.xl, 
    padding: Spacing.lg, 
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius['2xl'], 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    marginBottom: Spacing.xl, 
    marginTop: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  readinessIconWrap: { 
    width: 48, 
    height: 48, 
    backgroundColor: '#FEF3C7', 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  readinessHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  readinessTitle: { 
    fontSize: Typography.base, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
  },
  readinessScorePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  readinessScorePillText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#2563EB',
  },
  readinessSub: { 
    fontSize: Typography.xs, 
    color: '#64748B', 
    marginTop: 2,
  },
  discoverCard: { 
    width: 245, 
    backgroundColor: '#FFFFFF', 
    borderRadius: Radius['2xl'], 
    padding: Spacing.lg, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 180,
  },
  discoverCardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
    maxWidth: 130,
  },
  countryPillText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#1E40AF',
  },
  matchScoreBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 3,
  },
  matchScoreText: { 
    fontSize: 11, 
    fontWeight: Typography.bold, 
    color: '#059669',
  },
  discoverName: { 
    fontSize: 15, 
    fontWeight: Typography.bold, 
    color: '#0F172A',
    lineHeight: 20,
  },
  discoverOrg: { 
    fontSize: Typography.xs, 
    color: '#64748B',
  },
  discoverFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  discoverTag: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
  },
  tagFull: {
    backgroundColor: '#EFF6FF',
  },
  tagFullText: {
    color: '#2563EB',
    fontWeight: Typography.bold,
    fontSize: 10,
  },
  tagPartial: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagPartialText: {
    color: '#475569',
    fontWeight: Typography.semibold,
    fontSize: 10,
  },
  discoverTagText: { 
    fontSize: 10, 
    fontWeight: Typography.bold, 
    color: Colors.blue,
  },
  tutorRequestBanner: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: '#0D2051',
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    shadowColor: '#0D2051',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  tutorRequestLeft: {
    gap: 6,
  },
  tutorRequestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tutorRequestBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  tutorRequestTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  tutorRequestDesc: {
    fontSize: Typography.xs,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
  },
  tutorRequestBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tutorRequestBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#FFFFFF',
  },
  tutorCard: {
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tutorCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tutorRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  tutorRatingText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: '#92400E',
  },
  tutorName: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  tutorSubjects: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tutorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tutorRate: {
    fontSize: 10,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
  bookPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookPillText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: '#334155',
  },
  guidesContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: Spacing.md,
  },
  guideIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTagRow: {
    marginBottom: 2,
  },
  guideTag: {
    fontSize: 10,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
  },
  guideTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  guideSub: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 1,
  },
  aiBanner: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius['2xl'],
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  aiSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
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
