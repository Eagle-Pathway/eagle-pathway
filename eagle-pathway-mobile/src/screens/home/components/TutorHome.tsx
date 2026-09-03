import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, StyleSheet
} from 'react-native';
import { toast } from '@/utils/toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, Skeleton, ScaleBounce } from '@/components/common';
import { User, Booking, Tutor, PayoutRequest, BookingStatus, Scholarship } from '@/types';
import { getFlagEmoji } from '@eagle-pathway/shared';
import { scholarshipsService } from '@/services/scholarships';
import { HomeActiveSessionBanner } from '@/components/tutors/HomeActiveSessionBanner';

interface TutorHomeProps {
  user: User;
  firstName: string;
  greeting: string;
  initials: string;
  unreadCount: number;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  bookings: Booking[];
  tutorProfile: Tutor | null;
  tutorPayouts: PayoutRequest[];
  isLoadingPayouts: boolean;
  availableBalance: number;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  submitPayoutRequest: (params: {
    tutorId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<void>;
  loading?: boolean;
}

const TUTOR_GUIDES = [
  {
    id: 'tutor-scholarship',
    title: 'Graduate & Master’s Scholarship Guide',
    sub: 'Full funding, GRE/IELTS waivers & university search',
    tag: 'Scholarships',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'ribbon-outline',
  },
  {
    id: 'tutor-pedagogy',
    title: 'Effective Tutoring & Student Retention',
    sub: 'How to structure 1-on-1 sessions & set milestones',
    tag: 'Teaching',
    color: '#059669',
    bg: '#ECFDF5',
    icon: 'school-outline',
  },
  {
    id: 'tutor-sop',
    title: 'Motivation Letter & SOP Writing Guide',
    sub: 'Winning personal statement templates for graduate school',
    tag: 'Admissions',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'create-outline',
  },
];

export const TutorHome: React.FC<TutorHomeProps> = ({
  firstName,
  greeting,
  initials,
  unreadCount,
  refreshing,
  onRefresh,
  bookings,
  tutorProfile,
  tutorPayouts,
  isLoadingPayouts,
  availableBalance,
  updateBookingStatus,
  submitPayoutRequest,
  loading,
}) => {
  const [isPayoutModalVisible, setIsPayoutModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [topScholarships, setTopScholarships] = useState<Scholarship[]>([]);
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    scholarshipsService.getScholarships().then(data => {
      setTopScholarships(data.slice(0, 6));
    }).catch(() => { });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} 👋</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
                  <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                </TouchableOpacity>
                <Avatar initials={initials} size={40} borderRadius={12} />
              </View>
            </View>
          </View>

          <View style={styles.mainBalanceWrapper}>
            <Skeleton width="100%" height={150} borderRadius={Radius['2xl']} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const todaySessions = (bookings || []).filter(b => b.status === 'confirmed');
  const pendingSessions = (bookings || []).filter(b => b.status === 'pending');
  const completedCount = (bookings || []).filter(b => b.status === 'completed').length;

  const realRating = tutorProfile?.rating ? tutorProfile.rating.toFixed(1) : (completedCount > 0 ? '5.0' : 'New');
  const realTotalSessions = tutorProfile?.total_sessions ?? completedCount;
  const realReviewsCount = tutorProfile?.total_reviews ?? 0;

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      setUpdatingId(id);
      await updateBookingStatus(id, status);
      toast.success('Status Updated', `Session status updated to ${status}.`);
    } catch {
      toast.error('Error', 'Could not update session status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePayoutRequest = async () => {
    const amt = parseInt(payoutForm.amount);
    if (!amt || amt <= 0) return toast.warning('Invalid Amount', 'Please enter a valid amount');
    if (amt > availableBalance) return toast.warning('Balance Exceeded', 'Amount exceeds available balance');
    if (!payoutForm.bankName || !payoutForm.accountNumber || !payoutForm.accountName) {
      return toast.warning('Incomplete Details', 'Please fill all bank details');
    }

    try {
      await submitPayoutRequest({
        tutorId: tutorProfile?.id || '',
        amount: amt,
        bankName: payoutForm.bankName,
        accountNumber: payoutForm.accountNumber,
        accountName: payoutForm.accountName,
      });
      setIsPayoutModalVisible(false);
      setPayoutForm({ amount: '', bankName: '', accountNumber: '', accountName: '' });
      toast.success('Payout Requested', 'Payout request submitted successfully');
    } catch {
      toast.error('Error', 'Failed to submit request');
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.white} />}
      >
        {/* Top Hero Section */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting} 👨‍🏫</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={18} color={Colors.white} />
                {unreadCount > 0 && (
                  <View style={styles.notifDot}>
                    <Text style={styles.notifCount}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Avatar initials={initials} size={40} borderRadius={12} />
            </View>
          </View>

          {/* 4 Quick Action Cards in Hero */}
          <View style={styles.quickCards}>
            {[
              { label: 'Job Board', sub: 'Student requests', icon: 'briefcase-outline' as const, route: '/(tabs)/explore' },
              { label: 'Scholarships', sub: 'Master’s & PhD', icon: 'ribbon-outline' as const, route: '/(tabs)/scholarships' },
              { label: 'Earnings', sub: 'Payouts & stats', icon: 'wallet-outline' as const, route: '/(tabs)/activity' },
              { label: 'Resources', sub: 'Teaching guides', icon: 'library-outline' as const, route: '/resources' },
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

        {/* Balance & Real Stats Hero Card */}
        <View style={styles.mainBalanceWrapper}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <View>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currencyCode}>ETB</Text>
                  <Text style={styles.balanceAmount}>{availableBalance.toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => setIsPayoutModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="wallet-outline" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceNote}>
              Earnings ready for payout after platform fee deduction
            </Text>

            {/* Real Stats Grid */}
            <View style={styles.statsChipContainer}>
              <View style={styles.statChip}>
                <View style={styles.statIconRow}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={styles.statChipValue}>{realRating}</Text>
                </View>
                <Text style={styles.statChipLabel}>
                  {realReviewsCount > 0 ? `${realReviewsCount} reviews` : 'Rating'}
                </Text>
              </View>
              <View style={styles.statChipDivider} />
              <View style={styles.statChip}>
                <Text style={styles.statChipValue}>{realTotalSessions}</Text>
                <Text style={styles.statChipLabel}>Sessions</Text>
              </View>
              <View style={styles.statChipDivider} />
              <View style={styles.statChip}>
                <Text style={[styles.statChipValue, { color: pendingSessions.length > 0 ? Colors.goldDark : Colors.text }]}>
                  {pendingSessions.length}
                </Text>
                <Text style={styles.statChipLabel}>Pending</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Active Session & Scheduled Today Banner */}
        <HomeActiveSessionBanner />

        {/* Tutor Jobs Board Banner */}
        <TouchableOpacity
          style={styles.jobsBanner}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.88}
        >
          <View style={styles.jobsIconBg}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.blueDark} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.jobsBannerTitle}>Tutor Job Board</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.jobsBannerSub}>Explore student tutoring requests &amp; apply now</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Today's Sessions Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithBadge}>
            <Text style={styles.sectionTitleText}>Today's Sessions</Text>
            {todaySessions.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{todaySessions.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/bookings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.viewAllText}>Full Schedule ›</Text>
          </TouchableOpacity>
        </View>

        {todaySessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={22} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No sessions scheduled for today</Text>
            <Text style={styles.emptySub}>Confirmed student bookings for today will show up here</Text>
          </View>
        ) : (
          todaySessions.map(b => (
            <View key={b.id} style={styles.sessionCard}>
              <Avatar initials={b.student?.full_name?.[0] || 'S'} size={42} borderRadius={12} />
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionName} numberOfLines={1}>
                  {b.student?.full_name || 'Student'}
                </Text>
                <View style={styles.sessionMetaRow}>
                  <Text style={styles.sessionSubject} numberOfLines={1}>
                    {b.subject}
                  </Text>
                  <Text style={styles.bulletDot}>•</Text>
                  <View style={styles.timeTagInline}>
                    <Ionicons name="time-outline" size={11} color={Colors.blue} />
                    <Text style={styles.timeTagText}>
                      {(() => {
                        try {
                          if (!b.session_time) return 'TBD';
                          return format(new Date(`2000-01-01T${b.session_time}`), 'h:mm a');
                        } catch {
                          return b.session_time;
                        }
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.completeActionBtn}
                onPress={() => handleUpdateStatus(b.id, 'completed' as any)}
                disabled={updatingId === b.id}
                activeOpacity={0.8}
              >
                {updatingId === b.id ? (
                  <ActivityIndicator size="small" color={Colors.blue} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={13} color={Colors.blue} />
                    <Text style={styles.completeActionText}>Complete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Pending Requests Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWithBadge}>
            <Text style={styles.sectionTitleText}>Pending Requests</Text>
            {pendingSessions.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: Colors.goldLight }]}>
                <Text style={[styles.countBadgeText, { color: Colors.goldDark }]}>{pendingSessions.length}</Text>
              </View>
            )}
          </View>
        </View>

        {pendingSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: Colors.greenLight }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.green} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No pending student booking requests</Text>
          </View>
        ) : (
          pendingSessions.map(b => (
            <View key={b.id} style={styles.pendingCard}>
              <View style={styles.pendingTopInfo}>
                <Avatar initials={b.student?.full_name?.[0] || 'S'} size={40} borderRadius={11} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sessionName} numberOfLines={1}>
                    {b.student?.full_name || 'Student'}
                  </Text>
                  <Text style={styles.sessionSubject} numberOfLines={1}>
                    {b.subject}
                    {b.session_date ? ` • ${(() => {
                      try {
                        return format(new Date(`${b.session_date}T00:00:00`), 'MMM d');
                      } catch {
                        return b.session_date;
                      }
                    })()}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.pendingActionRow}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleUpdateStatus(b.id, 'confirmed' as any)}
                  disabled={updatingId === b.id}
                  activeOpacity={0.8}
                >
                  {updatingId === b.id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-sharp" size={14} color={Colors.white} />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={() => handleUpdateStatus(b.id, 'cancelled' as any)}
                  disabled={updatingId === b.id}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-sharp" size={14} color={Colors.red} />
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Global Scholarships for Tutors & Graduates */}
        {topScholarships.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitleText}>Scholarships</Text>
                <Text style={styles.sectionSubHeading}>Master’s, PhD &amp; Global Exchange Opportunities</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/scholarships')} activeOpacity={0.7}>
                <Text style={styles.viewAllText}>See All ›</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {topScholarships.map(s => {
                const flag = getFlagEmoji(s.country_flag);
                const isWord = /[a-zA-Z]/.test(flag);
                const countryDisplay = isWord ? (s.country || 'Global') : `${flag} ${s.country || ''}`.trim();

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
                        <Text style={styles.matchScoreText}>Graduate</Text>
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
                        <View style={styles.tagFull}>
                          <Text style={styles.tagFullText}>
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

        {/* Teaching & Academic Guides Section */}
        <View style={{ marginTop: Spacing.xl }}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitleText}>Teaching &amp; Academic Guides</Text>
              <Text style={styles.sectionSubHeading}>GRE prep, graduate SOPs &amp; tutoring best practices</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/resources')} activeOpacity={0.7}>
              <Text style={styles.viewAllText}>Browse All ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guidesContainer}>
            {TUTOR_GUIDES.map(guide => (
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

        {/* Eagle AI Tutor Assistant Launcher */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.9}
        >
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiTitle}>Eagle AI Tutor Assistant</Text>
            <Text style={styles.aiSub}>
              Brainstorm lesson plans, generate practice problem sets, or draft graduate scholarship SOPs.
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#2563EB" />
        </TouchableOpacity>

        {/* Recent Payouts Section */}
        {tutorPayouts.length > 0 && (
          <View style={{ marginTop: Spacing.xl }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleText}>Recent Payouts</Text>
            </View>
            {tutorPayouts.slice(0, 3).map(p => (
              <View key={p.id} style={styles.payoutCard}>
                <View style={styles.payoutIconBg}>
                  <Ionicons name="receipt-outline" size={18} color={Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutTitle}>ETB {p.amount.toLocaleString()}</Text>
                  <Text style={styles.payoutSub} numberOfLines={1}>
                    {p.bank_name} • {format(new Date(p.created_at), 'MMM d, yyyy')}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  p.status === 'completed' ? styles.statusBadgeDone :
                    p.status === 'rejected' ? styles.statusBadgeErr :
                      styles.statusBadgePending
                ]}>
                  <Text style={[
                    styles.statusText,
                    p.status === 'completed' ? styles.statusTextDone :
                      p.status === 'rejected' ? styles.statusTextErr :
                        styles.statusTextPending
                  ]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Request Payout Modal */}
      <Modal
        visible={isPayoutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPayoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Payout</Text>
                <Text style={styles.modalSub}>Transfer earnings directly to your bank account</Text>
              </View>
              <TouchableOpacity onPress={() => setIsPayoutModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceInfoBox}>
              <Text style={styles.balanceInfoLabel}>Available to withdraw:</Text>
              <Text style={styles.balanceInfoValue}>ETB {availableBalance.toLocaleString()}</Text>
            </View>

            <Text style={styles.modalLabel}>Withdrawal Amount (ETB)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="e.g. 2000"
              value={payoutForm.amount}
              onChangeText={t => setPayoutForm(f => ({ ...f, amount: t }))}
            />

            <Text style={styles.modalLabel}>Bank Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Commercial Bank of Ethiopia"
              value={payoutForm.bankName}
              onChangeText={t => setPayoutForm(f => ({ ...f, bankName: t }))}
            />

            <Text style={styles.modalLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Name as it appears on account"
              value={payoutForm.accountName}
              onChangeText={t => setPayoutForm(f => ({ ...f, accountName: t }))}
            />

            <Text style={styles.modalLabel}>Account Number</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              placeholder="Enter account number"
              value={payoutForm.accountNumber}
              onChangeText={t => setPayoutForm(f => ({ ...f, accountNumber: t }))}
            />

            <TouchableOpacity
              style={[styles.submitBtn, isLoadingPayouts && { opacity: 0.7 }]}
              onPress={handlePayoutRequest}
              disabled={isLoadingPayouts}
              activeOpacity={0.8}
            >
              {isLoadingPayouts ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Payout Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroHeader: {
    backgroundColor: Colors.blueDark,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: Typography.medium,
  },
  userName: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.white,
    marginTop: 2
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center'
  },
  notifBtn: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.blueDark,
    paddingHorizontal: 2,
  },
  notifCount: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: Typography.bold
  },
  quickCards: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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

  // Main Balance Hero Card
  mainBalanceWrapper: {
    paddingHorizontal: Spacing.xl,
    marginTop: -Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: Colors.blueDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  currencyCode: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  balanceAmount: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  balanceNote: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  withdrawBtn: {
    backgroundColor: Colors.gold,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
  },
  withdrawBtnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  statsChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChipValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  statChipLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statChipDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },

  // Jobs Banner
  jobsBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: '#0D2051',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
  },
  jobsIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobsBannerTitle: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  jobsBannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.xs,
    marginTop: 1,
  },
  newBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: Typography.bold,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  sectionSubHeading: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  viewAllText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },

  // Empty Cards
  emptyCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  emptySub: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },

  // Sessions Card
  sessionCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  sessionName: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sessionSubject: {
    fontSize: Typography.xs,
    color: '#64748B',
  },
  bulletDot: {
    color: Colors.border,
    fontSize: 10,
  },
  timeTagInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeTagText: {
    fontSize: 11,
    color: Colors.blue,
    fontWeight: Typography.medium,
  },
  completeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  completeActionText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },

  // Pending Card
  pendingCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pendingTopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pendingActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: Spacing.sm,
  },
  acceptBtn: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  acceptBtnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  declineBtn: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  declineBtnText: {
    color: '#DC2626',
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },

  // Horizontal Scholarships Slider
  horizontalScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 10,
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
  tagFull: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagFullText: {
    color: '#2563EB',
    fontWeight: Typography.bold,
    fontSize: 10,
  },

  // Guides
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

  // AI Banner
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

  // Payout Card
  payoutCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.md,
  },
  payoutIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  payoutSub: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeDone: { backgroundColor: '#DCFCE7' },
  statusBadgeErr: { backgroundColor: '#FEE2E2' },
  statusBadgePending: { backgroundColor: '#FEF3C7' },
  statusText: { fontSize: 10, fontWeight: Typography.bold },
  statusTextDone: { color: '#16A34A' },
  statusTextErr: { color: '#DC2626' },
  statusTextPending: { color: '#D97706' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: '#0F172A',
  },
  modalSub: {
    fontSize: Typography.xs,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  balanceInfoBox: {
    backgroundColor: '#EFF6FF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  balanceInfoLabel: {
    fontSize: Typography.sm,
    color: '#1E40AF',
  },
  balanceInfoValue: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: '#1E40AF',
  },
  modalLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: '#334155',
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.sm,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: Colors.blue,
    borderRadius: Radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
