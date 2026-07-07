import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Avatar, SectionTitle, Skeleton } from '@/components/common';
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
  if (loading) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={['top']}>
        <ScrollView>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.greeting}>{greeting} Tutor 👋</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
                  <Text style={styles.notifIcon}>🔔</Text>
                </TouchableOpacity>
                <Avatar initials={initials} size={38} borderRadius={11} />
              </View>
            </View>
          </View>

          {/* Earnings Card Skeleton */}
          <View style={[styles.sessionCard, { padding: Spacing.lg }]}>
            <View style={{ gap: 6, flex: 1 }}>
              <Skeleton width={120} height={12} />
              <Skeleton width={180} height={28} />
            </View>
            <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ gap: 4, flex: 1 }}>
                <Skeleton width={60} height={10} />
                <Skeleton width={80} height={14} />
              </View>
              <View style={{ gap: 4, flex: 1, alignItems: 'flex-end' }}>
                <Skeleton width={60} height={10} />
                <Skeleton width={80} height={14} />
              </View>
            </View>
          </View>

          {/* Today's Sessions Skeleton */}
          <SectionTitle title="Today's Sessions" />
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <View style={[styles.sessionCard, { marginHorizontal: 0 }]}>
              <Skeleton width={44} height={44} borderRadius={13} />
              <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={60} height={20} borderRadius={8} />
            </View>
          </View>

          {/* Pending Bookings Skeleton */}
          <SectionTitle title="Pending Requests" />
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <View style={[styles.sessionCard, { marginHorizontal: 0 }]}>
              <Skeleton width={44} height={44} borderRadius={13} />
              <View style={{ flex: 1, marginLeft: Spacing.md, gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </View>
              <Skeleton width={60} height={20} borderRadius={8} />
            </View>
          </View>

          {/* Payout History Skeleton */}
          <SectionTitle title="Recent Payouts" />
          <View style={{ paddingHorizontal: Spacing.xl, gap: Spacing.sm }}>
            {[1, 2].map(i => (
              <View key={i} style={[styles.sessionCard, { marginHorizontal: 0, justifyContent: 'space-between' }]}>
                <View style={{ gap: 6 }}>
                  <Skeleton width={100} height={14} />
                  <Skeleton width={80} height={10} />
                </View>
                <Skeleton width={60} height={16} borderRadius={8} />
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  const [isPayoutModalVisible, setIsPayoutModalVisible] = React.useState(false);
  const [payoutForm, setPayoutForm] = React.useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const todaySessions = (bookings || []).filter(b => b.status === 'confirmed');
  const pendingSessions = (bookings || []).filter(b => b.status === 'pending');

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
    } catch (e) {
      Alert.alert('Error', 'Failed to submit request');
    }
  };

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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={styles.quickCardLabel}>Available Balance</Text>
                  <Text style={[styles.userName, { fontSize: 22 }]}>ETB {availableBalance.toLocaleString()}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.withdrawBtn} 
                  onPress={() => setIsPayoutModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.withdrawBtnText}>Withdraw</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4 }}>
                From completed & paid sessions, after platform fee
              </Text>
            </View>
            <View style={styles.quickCard}>
              <Text style={styles.quickCardLabel}>Rating</Text>
              <Text style={[styles.userName, { fontSize: 24 }]}>{tutorProfile?.rating || '5.0'} ⭐</Text>
            </View>
          </View>
        </View>

        {/* Tutor Jobs Banner */}
        <TouchableOpacity
          style={styles.jobsBanner}
          onPress={() => router.push('/(tabs)/tutor-jobs')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.jobsBannerTitle}>📌 Tutor Job Board</Text>
            <Text style={styles.jobsBannerSub}>Browse open jobs and apply now</Text>
          </View>
          <Text style={{ fontSize: 20, color: Colors.white }}>→</Text>
        </TouchableOpacity>

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

        {tutorPayouts.length > 0 && (
          <>
            <SectionTitle title="Recent Payouts" />
            {tutorPayouts.slice(0, 3).map(p => (
              <View key={p.id} style={styles.payoutCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutTitle}>ETB {p.amount.toLocaleString()}</Text>
                  <Text style={styles.payoutSub}>{p.bank_name} · {format(new Date(p.created_at), 'MMM d, yyyy')}</Text>
                </View>
                <View style={[styles.statusBadge, 
                  p.status === 'completed' ? styles.statusBadgeDone : 
                  p.status === 'rejected' ? styles.statusBadgeErr : 
                  styles.statusBadgePending
                ]}>
                  <Text style={[styles.statusText, 
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

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={isPayoutModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsPayoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setIsPayoutModalVisible(false)}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Amount to Withdraw (ETB)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="e.g. 5000" value={payoutForm.amount} onChangeText={t => setPayoutForm(f => ({ ...f, amount: t }))} />
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 16 }}>Maximum available: ETB {availableBalance.toLocaleString()}</Text>
            <Text style={styles.modalLabel}>Bank Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Commercial Bank of Ethiopia" value={payoutForm.bankName} onChangeText={t => setPayoutForm(f => ({ ...f, bankName: t }))} />
            <Text style={styles.modalLabel}>Account Holder Name</Text>
            <TextInput style={styles.modalInput} placeholder="Name as it appears on account" value={payoutForm.accountName} onChangeText={t => setPayoutForm(f => ({ ...f, accountName: t }))} />
            <Text style={styles.modalLabel}>Account Number</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="Enter account number" value={payoutForm.accountNumber} onChangeText={t => setPayoutForm(f => ({ ...f, accountNumber: t }))} />
            <TouchableOpacity style={[styles.submitBtn, isLoadingPayouts && { opacity: 0.7 }]} onPress={handlePayoutRequest} disabled={isLoadingPayouts}>
              {isLoadingPayouts ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing['2xl'] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.6)' },
  userName: { fontSize: Typography['4xl'], fontWeight: Typography.bold, color: Colors.white, marginTop: 2 },
  heroActions: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  notifBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.blueDark },
  notifCount: { fontSize: 8, color: Colors.white, fontWeight: Typography.bold },
  quickCards: { flexDirection: 'row', gap: Spacing.sm },
  quickCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  quickCardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  withdrawBtn: { backgroundColor: Colors.gold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  withdrawBtnText: { color: Colors.white, fontSize: 10, fontWeight: Typography.bold },
  sessionCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  sessionName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  sessionSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sessionTime: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: Colors.blueLight, borderRadius: 10 },
  sessionTypeBadge: { fontSize: 12, fontWeight: Typography.bold, color: Colors.blue },
  payoutCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  payoutTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  payoutSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgePending: { backgroundColor: Colors.goldLight },
  statusBadgeDone: { backgroundColor: Colors.greenLight },
  statusBadgeErr: { backgroundColor: Colors.redLight },
  statusText: { fontSize: 10, fontWeight: Typography.bold },
  statusTextPending: { color: Colors.gold },
  statusTextDone: { color: Colors.green },
  statusTextErr: { color: Colors.red },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  modalLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 8 },
  modalInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  submitBtn: { backgroundColor: Colors.blueDark, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: Typography.bold },
  jobsBanner: {
    backgroundColor: Colors.blue, marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    borderRadius: Radius.xl, padding: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  jobsBannerTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.white },
  jobsBannerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});
