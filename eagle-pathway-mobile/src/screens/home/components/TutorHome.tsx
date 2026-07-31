import React, { useState } from 'react';
import { 
  View, Text, ScrollView, RefreshControl, TouchableOpacity, 
  Alert, Modal, TextInput, ActivityIndicator, StyleSheet 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, Skeleton } from '@/components/common';
import { User, Booking, Tutor, PayoutRequest, BookingStatus } from '@/types';

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
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

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

          {/* Skeleton Hero Balance */}
          <View style={styles.mainBalanceWrapper}>
            <Skeleton width="100%" height={150} borderRadius={Radius['2xl']} />
          </View>

          {/* Today's Sessions Skeleton */}
          <View style={styles.sectionHeaderRow}>
            <Skeleton width={140} height={20} />
            <Skeleton width={80} height={16} />
          </View>
          <View style={{ paddingHorizontal: Spacing.xl, marginBottom: Spacing.md }}>
            <Skeleton width="100%" height={80} borderRadius={Radius.xl} />
          </View>

          {/* Pending Requests Skeleton */}
          <View style={styles.sectionHeaderRow}>
            <Skeleton width={140} height={20} />
          </View>
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <Skeleton width="100%" height={100} borderRadius={Radius.xl} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const todaySessions = (bookings || []).filter(b => b.status === 'confirmed');
  const pendingSessions = (bookings || []).filter(b => b.status === 'pending');
  const completedCount = (bookings || []).filter(b => b.status === 'completed').length;
  
  // Real Tutor Stats
  const realRating = tutorProfile?.rating ? tutorProfile.rating.toFixed(1) : (completedCount > 0 ? '5.0' : 'New');
  const realTotalSessions = tutorProfile?.total_sessions ?? completedCount;
  const realReviewsCount = tutorProfile?.total_reviews ?? 0;

  const handleUpdateStatus = async (id: string, status: BookingStatus) => {
    try {
      setUpdatingId(id);
      await updateBookingStatus(id, status);
    } catch {
      Alert.alert('Error', 'Could not update session status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePayoutRequest = async () => {
    const amt = parseInt(payoutForm.amount);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Please enter a valid amount');
    if (amt > availableBalance) return Alert.alert('Error', 'Amount exceeds available balance');
    if (!payoutForm.bankName || !payoutForm.accountNumber || !payoutForm.accountName) {
      return Alert.alert('Error', 'Please fill all bank details');
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
      Alert.alert('Success', 'Payout request submitted successfully');
    } catch {
      Alert.alert('Error', 'Failed to submit request');
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
              <Text style={styles.greeting}>{greeting} 👋</Text>
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

        {/* Tutor Jobs Board Banner */}
        <TouchableOpacity
          style={styles.jobsBanner}
          onPress={() => router.push('/(tabs)/tutor-jobs')}
          activeOpacity={0.88}
        >
          <View style={styles.jobsIconBg}>
            <Ionicons name="briefcase-outline" size={20} color={Colors.blueDark} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.jobsBannerTitle}>Tutor Job Board</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>JOBS</Text>
              </View>
            </View>
            <Text style={styles.jobsBannerSub}>Explore student tutoring requests & apply now</Text>
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

              {/* Action Buttons styled compactly to avoid overlap */}
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

        {/* Recent Payouts Section */}
        {tutorPayouts.length > 0 && (
          <>
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
          </>
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
    borderWidth: 1,
    borderColor: Colors.border,
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
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
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
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  withdrawBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  withdrawBtnDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.7,
  },
  withdrawBtnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  balanceNote: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  statsChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChipValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  statChipLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  statChipDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },

  // Job Board Banner
  jobsBanner: {
    backgroundColor: Colors.blueDark,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  jobsIconBg: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobsBannerTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  newBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  jobsBannerSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },

  // Section Headers & Titles
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitleText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  countBadge: {
    backgroundColor: Colors.blueLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  viewAllText: {
    fontSize: Typography.xs,
    color: Colors.blue,
    fontWeight: Typography.semibold,
  },

  // Session Cards
  sessionCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sessionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionName: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sessionSubject: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bulletDot: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  timeTagInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: Typography.semibold,
    color: Colors.blue,
  },
  completeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.blueLight,
    borderRadius: Radius.md,
  },
  completeActionText: {
    fontSize: 11,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },

  // Pending Cards
  pendingCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pendingTopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pendingActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.green,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  acceptBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: Typography.bold,
  },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.redLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  declineBtnText: {
    color: Colors.red,
    fontSize: 11,
    fontWeight: Typography.bold,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  emptySub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Payout Cards
  payoutCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  payoutIconBg: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  payoutSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  statusBadgePending: { backgroundColor: Colors.goldLight },
  statusBadgeDone: { backgroundColor: Colors.greenLight },
  statusBadgeErr: { backgroundColor: Colors.redLight },
  statusText: { fontSize: 9, fontWeight: Typography.bold },
  statusTextPending: { color: Colors.goldDark },
  statusTextDone: { color: Colors.green },
  statusTextErr: { color: Colors.red },

  // Modal
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: Colors.white, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: Spacing.xl, 
    paddingBottom: 36 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.lg 
  },
  modalTitle: { 
    fontSize: Typography.lg, 
    fontWeight: Typography.bold, 
    color: Colors.text 
  },
  modalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.blueLight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  balanceInfoLabel: {
    fontSize: 11,
    color: Colors.blue,
    fontWeight: Typography.medium,
  },
  balanceInfoValue: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  modalLabel: { 
    fontSize: 11, 
    fontWeight: Typography.bold, 
    color: Colors.text, 
    marginBottom: 4 
  },
  modalInput: { 
    backgroundColor: Colors.bg, 
    borderWidth: 1, 
    borderColor: Colors.border, 
    borderRadius: Radius.md, 
    padding: 10, 
    marginBottom: Spacing.sm, 
    fontSize: Typography.sm,
    color: Colors.text,
  },
  submitBtn: { 
    backgroundColor: Colors.blueDark, 
    borderRadius: Radius.lg, 
    padding: Spacing.md, 
    alignItems: 'center', 
    marginTop: Spacing.sm 
  },
  submitBtnText: { 
    color: Colors.white, 
    fontSize: Typography.sm, 
    fontWeight: Typography.bold 
  },
});
