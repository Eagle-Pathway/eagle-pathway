import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { EmptyState, ErrorState, Skeleton } from '@/components/common';
import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
import { openWhatsApp } from '@/utils/linking';
import { useAuthStore } from '@/store/authStore';
import { recommendationsService, type RecommendationRequest, type RecommendationStatus } from '@/services/recommendations';

const STATUS_TONE: Record<RecommendationStatus, { label: string; color: string; bg: string }> = {
  requested: { label: 'Requested', color: Colors.goldDark, bg: Colors.goldLight },
  received: { label: 'Received', color: Colors.green, bg: Colors.greenLight },
  declined: { label: 'Declined', color: Colors.red, bg: Colors.redLight },
};

export function RecommendationsScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<RecommendationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ refereeName: '', relationship: '', refereeEmail: '', refereePhone: '' });
  const [error, setError] = useState(false);

  const load = () => {
    if (!user) return;
    setError(false);
    recommendationsService.list(user.id).then(setItems).catch(() => setError(true)).finally(() => setLoading(false));
  };
  useEffect(load, [user?.id]);

  const received = items.filter(i => i.status === 'received').length;

  const handleAdd = async () => {
    if (!user || !form.refereeName.trim()) return Alert.alert('Name required', "Enter the referee's name.");
    if (!form.refereeEmail.trim() && !form.refereePhone.trim()) {
      return Alert.alert('Contact required', 'Add an email or phone so you can send a reminder.');
    }
    setSaving(true);
    try {
      const created = await recommendationsService.create({
        studentId: user.id,
        refereeName: form.refereeName,
        relationship: form.relationship,
        refereeEmail: form.refereeEmail,
        refereePhone: form.refereePhone,
      });
      setItems(prev => [created, ...prev]);
      setForm({ refereeName: '', relationship: '', refereeEmail: '', refereePhone: '' });
      setModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not add the request.');
    } finally {
      setSaving(false);
    }
  };

  const remind = (item: RecommendationRequest) => {
    const studentName = user?.full_name || 'a student';
    const msg = `Hello ${item.referee_name}, this is ${studentName}. I'd be grateful for your help with my recommendation letter for my scholarship application. Thank you so much!`;
    if (item.referee_phone) {
      openWhatsApp(item.referee_phone, msg);
    } else if (item.referee_email) {
      const subject = encodeURIComponent('Recommendation letter request');
      Linking.openURL(`mailto:${item.referee_email}?subject=${subject}&body=${encodeURIComponent(msg)}`)
        .catch(() => Alert.alert('Error', 'Could not open your email app.'));
    }
  };

  const setStatus = async (item: RecommendationRequest, status: RecommendationStatus) => {
    try {
      await recommendationsService.updateStatus(item.id, status);
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, status, received_at: status === 'received' ? new Date().toISOString() : null } : i)));
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update status.');
    }
  };

  const confirmDelete = (item: RecommendationRequest) => {
    Alert.alert('Remove request?', `${item.referee_name}'s recommendation request`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await recommendationsService.remove(item.id);
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not remove.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Recommendation Letters</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ paddingTop: Spacing.lg }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[s.card, { padding: Spacing.lg }]}>
              <View style={s.cardTop}>
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="50%" height={18} style={{ borderRadius: 4 }} />
                  <Skeleton width="30%" height={14} style={{ borderRadius: 4 }} />
                </View>
                <Skeleton width={60} height={24} style={{ borderRadius: 12 }} />
              </View>
              <View style={[s.actions, { gap: 8 }]}>
                <Skeleton width={80} height={32} style={{ borderRadius: 10 }} />
                <Skeleton width={100} height={32} style={{ borderRadius: 10 }} />
              </View>
            </View>
          ))}
        </View>
      ) : error && items.length === 0 ? (
        <ErrorState subtitle="We couldn't load your requests. Check your connection and retry." onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No recommendation requests yet"
          subtitle="Track who you've asked for a letter and whether it's arrived. Tap + to add a referee."
          actionLabel="Add a referee"
          onAction={() => setModal(true)}
        />
      ) : (
        <KeyboardAwareScreen contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={s.summary}>{received} of {items.length} received</Text>
          {items.map(item => {
            const tone = STATUS_TONE[item.status];
            return (
              <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.9} onLongPress={() => confirmDelete(item)}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.referee_name}</Text>
                    <Text style={s.sub}>
                      {item.relationship || 'Referee'}
                      {item.received_at ? ` · received ${format(new Date(item.received_at), 'MMM d')}` : ''}
                    </Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[s.statusText, { color: tone.color }]}>{tone.label}</Text>
                  </View>
                </View>
                <View style={s.actions}>
                  {item.status !== 'received' && (item.referee_phone || item.referee_email) && (
                    <TouchableOpacity style={s.btnPrimary} onPress={() => remind(item)} activeOpacity={0.85}>
                      <Text style={s.btnPrimaryText}>{item.referee_phone ? '💬 Remind' : '✉️ Remind'}</Text>
                    </TouchableOpacity>
                  )}
                  {item.status !== 'received' && (
                    <TouchableOpacity style={s.btnGreen} onPress={() => setStatus(item, 'received')} activeOpacity={0.85}>
                      <Text style={s.btnGreenText}>Mark received</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'received' && (
                    <TouchableOpacity style={s.btnGhost} onPress={() => setStatus(item, 'requested')} activeOpacity={0.85}>
                      <Text style={s.btnGhostText}>Undo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          <Text style={s.hint}>Long-press a request to remove it.</Text>
        </KeyboardAwareScreen>
      )}

      <Modal visible={modal} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Request a Letter</Text>
              <TouchableOpacity onPress={() => setModal(false)}><Text style={{ fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <Text style={s.label}>Referee name *</Text>
            <TextInput style={s.input} placeholder="e.g. Dr. Alemu Bekele" value={form.refereeName} onChangeText={t => setForm(f => ({ ...f, refereeName: t }))} placeholderTextColor={Colors.textSecondary} />
            <Text style={s.label}>Relationship</Text>
            <TextInput style={s.input} placeholder="e.g. Professor, Manager" value={form.relationship} onChangeText={t => setForm(f => ({ ...f, relationship: t }))} placeholderTextColor={Colors.textSecondary} />
            <Text style={s.label}>Phone (for WhatsApp reminders)</Text>
            <TextInput style={s.input} placeholder="+2519…" keyboardType="phone-pad" value={form.refereePhone} onChangeText={t => setForm(f => ({ ...f, refereePhone: t }))} placeholderTextColor={Colors.textSecondary} />
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} placeholder="referee@email.com" keyboardType="email-address" autoCapitalize="none" value={form.refereeEmail} onChangeText={t => setForm(f => ({ ...f, refereeEmail: t }))} placeholderTextColor={Colors.textSecondary} />
            <TouchableOpacity style={[s.submit, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving} activeOpacity={0.85}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={s.submitText}>Add Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 44, height: 44, backgroundColor: Colors.grayLight, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  addBtn: { width: 44, height: 44, backgroundColor: Colors.blue, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { fontSize: 24, color: Colors.white, fontWeight: '300' },
  summary: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semibold, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  card: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.text },
  sub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btnPrimary: { backgroundColor: Colors.blue, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  btnPrimaryText: { color: Colors.white, fontWeight: Typography.semibold, fontSize: Typography.sm },
  btnGreen: { backgroundColor: Colors.greenLight, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  btnGreenText: { color: Colors.green, fontWeight: Typography.semibold, fontSize: Typography.sm },
  btnGhost: { backgroundColor: Colors.grayLight, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  btnGhostText: { color: Colors.textSecondary, fontWeight: Typography.semibold, fontSize: Typography.sm },
  hint: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: Spacing.xl, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.text },
  label: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text, marginBottom: 6 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 15 },
  submit: { backgroundColor: Colors.blueDark, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: Typography.bold },
});
