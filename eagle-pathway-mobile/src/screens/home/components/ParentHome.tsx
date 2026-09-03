import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, SectionTitle, Skeleton, ScaleBounce } from '@/components/common';
import { User, Application, Booking, Tutor } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { tutorsService } from '@/services/tutors';

interface ParentHomeProps {
  user: User;
  firstName: string;
  greeting: string;
  initials: string;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  linkedStudents: User[];
  linkedStudentApplications: Record<string, Application[]>;
  linkedStudentBookings: Record<string, Booking[]>;
  loading?: boolean;
}

const PARENT_GUIDES = [
  {
    id: 'parent-sat',
    title: "Parent's Guide to SAT & Exam Prep",
    sub: 'How to support your child for top university admissions',
    tag: 'Parent Guide',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'school-outline',
  },
  {
    id: 'parent-scholarship',
    title: 'Winning Scholarships from Ethiopia',
    sub: 'Deadlines, eligibility & fully funded programs',
    tag: 'Admissions',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'ribbon-outline',
  },
  {
    id: 'parent-tutoring',
    title: '1-on-1 Tutoring Best Practices',
    sub: 'Setting goals, tracking hours & maximizing results',
    tag: 'Tutoring',
    color: '#059669',
    bg: '#ECFDF5',
    icon: 'book-outline',
  },
];

export const ParentHome: React.FC<ParentHomeProps> = ({
  firstName,
  greeting,
  initials,
  unreadCount,
  refreshing,
  onRefresh,
  linkedStudents,
  linkedStudentApplications,
  linkedStudentBookings,
  loading,
}) => {
  const [featuredTutors, setFeaturedTutors] = useState<Tutor[]>([]);

  useEffect(() => {
    tutorsService.getTutors().then(data => {
      setFeaturedTutors(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} 👨‍👩‍👧</Text>
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

  const children = linkedStudents || [];
  const hasNoChildren = children.length === 0;

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Top Hero with Parent Quick Actions */}
        <View style={styles.hero}>
          <View style={styles.heroBg}>
            <View style={styles.heroOverlay1} />
            <View style={styles.heroOverlay2} />
          </View>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.greeting}>{greeting} 👨‍👩‍👧</Text>
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

          {/* 4 Clean Quick Action Cards */}
          <View style={styles.quickCards}>
            {[
              { label: 'Request Tutor', sub: 'Post in 60s', icon: 'create-outline' as const, route: '/request-tutor' },
              { label: 'Find Tutor', sub: 'Verified list', icon: 'school-outline' as const, route: '/(tabs)/tutors' },
              { label: 'Scholarships', sub: 'Global funds', icon: 'ribbon-outline' as const, route: '/(tabs)/scholarships' },
              { label: 'Link Child', sub: 'Track progress', icon: 'people-outline' as const, action: () => toast.info('Link Student', 'Ask your child to open Profile → Link Parent and enter your phone number.') },
            ].map(card => (
              <TouchableOpacity
                key={card.label}
                style={styles.quickCard}
                onPress={() => card.action ? card.action() : router.push(card.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.quickCardIcon}>
                  <Ionicons name={card.icon} size={16} color={Colors.white} />
                </View>
                <Text style={styles.quickCardLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {card.label}
                </Text>
                <Text style={styles.quickCardSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                  {card.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 1-Minute Tutor Request Banner for Parents */}
        <View style={styles.tutorRequestBanner}>
          <View style={styles.tutorRequestLeft}>
            <View style={styles.tutorRequestBadge}>
              <Text style={styles.tutorRequestBadgeText}>⚡ 1-ON-1 HOME &amp; ONLINE TUTORING</Text>
            </View>
            <Text style={styles.tutorRequestTitle}>Need a Tutor for Your Child?</Text>
            <Text style={styles.tutorRequestDesc}>
              Tell us your child's grade, desired subjects &amp; schedule — our admin team will match you with vetted, background-checked tutors.
            </Text>
            <TouchableOpacity 
              style={styles.tutorRequestBtn}
              onPress={() => router.push('/request-tutor')}
              activeOpacity={0.88}
            >
              <Text style={styles.tutorRequestBtnText}>Request Tutor for Child</Text>
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
                <Text style={styles.sectionSubHeading}>Top rated Grade 1–12, SAT &amp; National Exam tutors</Text>
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
                      <Text style={styles.tutorRatingText}>{(tutor.rating || 5.0).toFixed(1)}</Text>
                    </View>
                  </View>
                  <Text style={styles.tutorName} numberOfLines={1}>
                    {tutor.user?.full_name || 'Expert Tutor'}
                  </Text>
                  <Text style={styles.tutorSubjects} numberOfLines={1}>
                    {(tutor.subjects || ['Mathematics', 'Physics']).slice(0, 2).join(', ')}
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

        {/* My Children Section (Or Clean Link Prompt Card) */}
        <View style={{ marginTop: Spacing.xl }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>My Children</Text>
              <Text style={styles.sectionSubHeading}>Track applications, sessions &amp; progress</Text>
            </View>
          </View>

          {hasNoChildren ? (
            <TouchableOpacity 
              style={styles.linkChildCard}
              onPress={() => toast.info('Link Student', 'Ask your child to open Profile → Link Parent and enter your phone number.')}
              activeOpacity={0.85}
            >
              <View style={styles.linkChildIconWrap}>
                <Ionicons name="people" size={24} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkChildTitle}>Link Your Child's Account</Text>
                <Text style={styles.linkChildDesc}>
                  Ask your child to go to their app: <Text style={{ fontWeight: 'bold' }}>Profile → Link Parent</Text> and enter your registered phone number.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : (
            children.map(child => {
              const childApps = linkedStudentApplications[child.id] || [];
              const childBookings = linkedStudentBookings[child.id] || [];
              const activeApps = childApps.filter(a => !['accepted', 'rejected'].includes(a.status));
              const upcomingSessions = childBookings.filter(b => ['pending', 'confirmed'].includes(b.status));
              
              return (
                <ScaleBounce 
                  key={child.id} 
                  style={styles.sessionCard}
                  onPress={() => router.push({ pathname: '/children-sessions', params: { studentId: child.id, studentName: child.full_name } })}
                >
                  <Avatar 
                    initials={child.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'} 
                    size={44} 
                    color={Colors.gold} 
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.sessionName}>{child.full_name}</Text>
                    <Text style={styles.sessionSub}>
                      {activeApps.length} applications · {upcomingSessions.length} sessions
                    </Text>
                  </View>
                  <View style={styles.sessionTime}>
                    <Text style={styles.sessionTypeBadge}>View</Text>
                  </View>
                </ScaleBounce>
              );
            })
          )}
        </View>

        {/* Essential Parent Guides & Resources */}
        <View style={{ marginTop: Spacing.xl }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Parent Resources &amp; Guides</Text>
              <Text style={styles.sectionSubHeading}>Academic planning, exam advice &amp; scholarship tips</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/resources')} activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>Browse All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guidesContainer}>
            {PARENT_GUIDES.map(guide => (
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

        {/* Eagle AI Academic Advisor for Parents */}
        <TouchableOpacity 
          style={styles.aiBanner}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.9}
        >
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Eagle AI Academic Advisor</Text>
            <Text style={styles.aiSub}>
              Ask questions about tutoring rates, curriculum recommendations, or scholarship criteria.
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#2563EB" />
        </TouchableOpacity>

        {/* Recent Child Applications Activity (if any) */}
        {!hasNoChildren && (
          <View style={{ marginTop: Spacing.xl }}>
            <SectionTitle title="Recent Activity" />
            {(() => {
              const recentApps = (Object.values(linkedStudentApplications).flat() as Application[]).slice(0, 3);
              if (recentApps.length === 0) {
                return (
                  <View style={styles.emptyActivityCard}>
                    <Ionicons name="time-outline" size={22} color={Colors.textSecondary} />
                    <Text style={styles.emptyActivityText}>No recent activity</Text>
                  </View>
                );
              }
              return recentApps.map(app => (
                <ScaleBounce 
                  key={app.id} 
                  style={styles.sessionCard}
                  onPress={() => router.push('/progress')}
                >
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, padding: 4 }}>
                    {(() => {
                      const flag = getFlagEmoji(app.scholarship?.country_flag);
                      const isWord = /[a-zA-Z]/.test(flag);
                      return (
                        <Text 
                          numberOfLines={1} 
                          adjustsFontSizeToFit 
                          minimumFontScale={0.5} 
                          style={{ 
                            fontSize: isWord ? 9 : 22, 
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
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.sessionName}>{app.scholarship?.name}</Text>
                    <Text style={styles.sessionSub}>{app.status.replace(/_/g, ' ').toUpperCase()}</Text>
                  </View>
                </ScaleBounce>
              ));
            })()}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  notifBtn: {
    width: 38, height: 38,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.blueDark,
  },
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
  linkChildCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  linkChildIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkChildTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  linkChildDesc: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 17,
  },
  sessionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sessionTime: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.blueLight, borderRadius: 10 },
  sessionTypeBadge: { fontSize: 12, fontWeight: Typography.bold, color: Colors.blue },
  emptyActivityCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyActivityText: { fontSize: Typography.sm, color: Colors.textSecondary },
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
});
