import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState } from '@/components/common';
import { ListSkeleton } from '@/components/LoadingSkeleton';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import { useFinanceStore } from '@/store/financeStore';

import { withTimeout } from '@/utils/asyncUtils';

/**
 * Tutor "Earnings" tab: available balance, payout request, and the full payout
 * history. The dashboard (TutorHome) shows a summary + the 3 most recent; this
 * is the dedicated, complete view.
 */
export default function TutorEarningsScreen() {
  const { user } = useAuthStore();
  const { tutorProfile, loadTutorBookings } = useBookingStore();
  const { tutorPayouts, isLoadingPayouts, loadTutorPayouts, submitPayoutRequest, balance, loadBalance } = useFinanceStore();

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountName: '' });

  useEffect(() => {
    if (!user) return;
    withTimeout(Promise.all([loadTutorBookings(user.id), loadTutorPayouts(user.id), loadBalance()]), 3500).finally(() => setLoading(false));
  }, [user?.id]);

  // Authoritative balance from the server (same definition the payout trigger
  // enforces), so what's shown is what can actually be withdrawn.
  const availableBalance = balance?.available ?? 0;

  const totalWithdrawn = (tutorPayouts || [])
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const handleSubmit = async () => {
    const amt = parseInt(form.amount, 10);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Please enter a valid amount');
    if (amt > availableBalance) return Alert.alert('Error', 'Amount exceeds available balance');
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      return Alert.alert('Error', 'Please fill all bank details');
    }
    try {
      await submitPayoutRequest({
        tutorId: tutorProfile?.id || '',
        amount: amt,
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
      });
      setModalVisible(false);
      setForm({ amount: '', bankName: '', accountNumber: '', accountName: '' });
      Alert.alert('Success', 'Payout request submitted successfully');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit request');
    }
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={styles.hero}>
        <Text style={styles.heading}>Earnings</Text>
        <View style={styles.balanceCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceValue}>ETB {availableBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.withdrawBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
              <Text style={styles.withdrawBtnText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceHint}>From completed & paid sessions, after platform fee · ETB {totalWithdrawn.toLocaleString()} withdrawn to date</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Payout History</Text>
      {loading ? (
        <View style={{ paddingHorizontal: Spacing.xl }}><ListSkeleton count={4} /></View>
      ) : (tutorPayouts || []).length === 0 ? (
        <EmptyState icon="wallet-outline" title="No payouts yet" subtitle="When you request a withdrawal it will appear here." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {tutorPayouts.map(p => (
            <View key={p.id} style={styles.payoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutTitle}>ETB {p.amount.toLocaleString()}</Text>
                <Text style={styles.payoutSub}>{p.bank_name} · {format(new Date(p.created_at), 'MMM d, yyyy')}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                p.status === 'completed' ? styles.badgeDone : p.status === 'rejected' ? styles.badgeErr : styles.badgePending,
              ]}>
                <Text style={[
                  styles.statusText,
                  p.status === 'completed' ? styles.textDone : p.status === 'rejected' ? styles.textErr : styles.textPending,
                ]}>{p.status.toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Payout</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={20} color={Colors.text} /></TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Amount to Withdraw (ETB)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="e.g. 5000" value={form.amount} onChangeText={t => setForm(f => ({ ...f, amount: t }))} />
            <Text style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: 16 }}>Maximum available: ETB {availableBalance.toLocaleString()}</Text>
            <Text style={styles.modalLabel}>Bank Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Commercial Bank of Ethiopia" value={form.bankName} onChangeText={t => setForm(f => ({ ...f, bankName: t }))} />
            <Text style={styles.modalLabel}>Account Holder Name</Text>
            <TextInput style={styles.modalInput} placeholder="Name as it appears on account" value={form.accountName} onChangeText={t => setForm(f => ({ ...f, accountName: t }))} />
            <Text style={styles.modalLabel}>Account Number</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" placeholder="Enter account number" value={form.accountNumber} onChangeText={t => setForm(f => ({ ...f, accountNumber: t }))} />
            <TouchableOpacity style={[styles.submitBtn, isLoadingPayouts && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLoadingPayouts}>
              {isLoadingPayouts ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: Colors.blueDark, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  heading: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.white, marginBottom: Spacing.md },
  balanceCard: { backgroundColor: '#1e3a8a', borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  balanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  balanceValue: { fontSize: 26, fontWeight: Typography.bold, color: Colors.white },
  balanceHint: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 8 },
  withdrawBtn: { backgroundColor: Colors.gold, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  withdrawBtnText: { color: Colors.white, fontSize: 12, fontWeight: Typography.bold },
  sectionTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  payoutCard: { backgroundColor: Colors.white, marginHorizontal: Spacing.xl, marginBottom: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  payoutTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text },
  payoutSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgePending: { backgroundColor: Colors.goldLight },
  badgeDone: { backgroundColor: Colors.greenLight },
  badgeErr: { backgroundColor: Colors.redLight },
  statusText: { fontSize: 10, fontWeight: Typography.bold },
  textPending: { color: Colors.gold },
  textDone: { color: Colors.green },
  textErr: { color: Colors.red },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  modalLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 8 },
  modalInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  submitBtn: { backgroundColor: Colors.blueDark, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: Typography.bold },
});
