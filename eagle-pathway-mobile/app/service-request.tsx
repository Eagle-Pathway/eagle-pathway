import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius, CommonStyles } from '@/utils/theme';
import { Button } from '@/components/common/index';
import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { value: 'international_payment', label: 'Application Fee', icon: '📄' },
  { value: 'tuition_payment',       label: 'Tuition Fee',     icon: '🎓' },
  { value: 'bank_transfer',         label: 'Embassy Fee',     icon: '🏛️' },
  { value: 'other',                 label: "Other Int'l Fees", icon: '💳' },
];

const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'CAD'];

const COUNTRIES = [
  { code: 'ET', name: 'Ethiopia' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AU', name: 'Australia' },
  { code: 'KE', name: 'Kenya' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7', icon: '⏳' },
  reviewing: { label: 'Reviewing', color: '#1e40af', bg: '#dbeafe', icon: '🔍' },
  approved:  { label: 'Approved',  color: '#065f46', bg: '#d1fae5', icon: '✅' },
  rejected:  { label: 'Rejected',  color: '#991b1b', bg: '#fee2e2', icon: '❌' },
  completed: { label: 'Completed', color: '#4c1d95', bg: '#ede9fe', icon: '🎉' },
  cancelled: { label: 'Cancelled', color: '#374151', bg: '#f3f4f6', icon: '🚫' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string;
  service_type: string;
  from_currency: string;
  to_currency: string;
  amount: number;
  recipient_name: string;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

interface FormErrors {
  serviceType?: string;
  amount?: string;
  recipientName?: string;
  reason?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View style={errStyles.wrap}>
      <Text style={errStyles.icon}>⚠️</Text>
      <Text style={errStyles.text}>{message}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[badgeStyles.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.icon} {cfg.label}</Text>
    </View>
  );
}

// ─── History View ─────────────────────────────────────────────────────────────

function RequestHistory({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select('id, service_type, from_currency, to_currency, amount, recipient_name, reason, status, admin_note, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setRequests(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[CommonStyles.flex1, CommonStyles.center]}>
        <ActivityIndicator color={Colors.blue} size="large" />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={[CommonStyles.flex1, CommonStyles.center, { padding: Spacing.xl }]}>
        <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>📭</Text>
        <Text style={{ fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.text, textAlign: 'center' }}>
          No requests yet
        </Text>
        <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
          Submit a service request and it will appear here
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={r => r.id}
      contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: r }) => {
        const svc = SERVICE_TYPES.find(s => s.value === r.service_type);
        return (
          <View style={histStyles.card}>
            <View style={histStyles.cardTop}>
              <View style={histStyles.iconWrap}>
                <Text style={{ fontSize: 22 }}>{svc?.icon ?? '💳'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={histStyles.svcLabel}>{svc?.label ?? r.service_type}</Text>
                <Text style={histStyles.meta}>
                  {r.amount.toLocaleString()} {r.from_currency} → {r.to_currency}
                </Text>
                <Text style={histStyles.meta}>To: {r.recipient_name}</Text>
              </View>
              <StatusBadge status={r.status} />
            </View>

            {r.admin_note && (
              <View style={histStyles.noteBox}>
                <Text style={histStyles.noteLabel}>Admin note</Text>
                <Text style={histStyles.noteText}>{r.admin_note}</Text>
              </View>
            )}

            <Text style={histStyles.date}>
              Submitted {format(new Date(r.created_at), 'MMM d, yyyy · h:mm a')}
            </Text>
          </View>
        );
      }}
    />
  );
}

// ─── New Request Form ─────────────────────────────────────────────────────────

function NewRequestForm({
  userId,
  onSuccess,
}: {
  userId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [serviceType, setServiceType]         = useState('');
  const [fromCurrency, setFromCurrency]       = useState('ETB');
  const [toCurrency, setToCurrency]           = useState('USD');
  const [amount, setAmount]                   = useState('');
  const [countryFrom, setCountryFrom]         = useState('ET');
  const [countryTo, setCountryTo]             = useState('US');
  const [recipientName, setRecipientName]     = useState('');
  const [recipientBank, setRecipientBank]     = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [reason, setReason]                   = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!serviceType) e.serviceType = 'Please select a service type';
    if (!amount.trim()) {
      e.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      e.amount = 'Enter a valid amount greater than 0';
    }
    if (!recipientName.trim()) e.recipientName = 'Recipient name is required';
    if (!reason.trim()) e.reason = 'Please explain the purpose of this transfer';
    return e;
  };

  const errors: FormErrors = submitted ? validate() : {};

  const handleSubmit = async () => {
    setSubmitted(true);
    const errs = validate();
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    
    const timeoutId = setTimeout(() => {
      setLoading(false);
      Alert.alert('Timeout', 'Request timed out. Please check your connection and try again.');
    }, 15000);

    try {
      // Ensure we have a valid session before inserting
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearTimeout(timeoutId);
        setLoading(false);
        Alert.alert('Session Expired', 'Please log out and log back in, then try again.');
        return;
      }

      const insertData = {
        user_id: userId,
        service_type: serviceType,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: parseFloat(amount),
        country_from: countryFrom,
        country_to: countryTo,
        recipient_name: recipientName.trim(),
        recipient_bank: recipientBank.trim() || null,
        recipient_account: recipientAccount.trim() || null,
        reason: reason.trim(),
        additional_details: additionalDetails.trim() || null,
      };

      const { error } = await supabase
        .from('service_requests')
        .insert(insertData);

      clearTimeout(timeoutId);

      if (error) {
        // Map common DB errors to friendly messages
        let msg = error.message;
        if (error.code === '23503') msg = 'Your account profile is incomplete. Please update your profile and try again.';
        else if (error.code === '42501' || error.message?.includes('policy')) msg = 'Permission denied. Please log out and log back in, then try again.';
        else if (error.code === '23514') msg = 'Invalid data. Please check your entries and try again.';
        throw new Error(msg);
      }

      Alert.alert(
        'Request Submitted ✅',
        'We will review your request and contact you shortly. You can track the status in "My Requests".',
        [{ text: 'View My Requests', onPress: onSuccess }],
      );
    } catch (e: any) {
      clearTimeout(timeoutId);
      console.error('Submit error:', e);
      Alert.alert(
        'Submission Failed',
        e.message || 'Something went wrong. Please check the console for details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Service Type */}
      <Text style={styles.sectionTitle}>Service Type *</Text>
      <View style={styles.grid}>
        {SERVICE_TYPES.map(st => (
          <TouchableOpacity
            key={st.value}
            style={[
              styles.serviceCard,
              serviceType === st.value && styles.serviceCardSelected,
              errors.serviceType && !serviceType && styles.serviceCardError,
            ]}
            onPress={() => setServiceType(st.value)}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 24 }}>{st.icon}</Text>
            <Text style={[styles.serviceLabel, serviceType === st.value && { color: Colors.blue }]}>
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FieldError message={errors.serviceType} />

      {/* Amount & Currency */}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Amount & Currency *</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>From</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, fromCurrency === c && styles.chipSelected]}
                  onPress={() => setFromCurrency(c)}
                >
                  <Text style={[styles.chipText, fromCurrency === c && { color: Colors.blue }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <Text style={{ paddingHorizontal: 8, alignSelf: 'center', color: Colors.textSecondary }}>→</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>To</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.chip, toCurrency === c && styles.chipSelected]}
                  onPress={() => setToCurrency(c)}
                >
                  <Text style={[styles.chipText, toCurrency === c && { color: Colors.blue }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Amount *</Text>
        <TextInput
          style={[styles.input, errors.amount && styles.inputError]}
          value={amount}
          onChangeText={setAmount}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          placeholderTextColor={Colors.textSecondary}
        />
        <FieldError message={errors.amount} />
      </View>

      {/* Countries */}
      <Text style={styles.sectionTitle}>Countries</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>From Country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.chip, countryFrom === c.code && styles.chipSelected]}
                onPress={() => setCountryFrom(c.code)}
              >
                <Text style={[styles.chipText, countryFrom === c.code && { color: Colors.blue }]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>To Country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.chip, countryTo === c.code && styles.chipSelected]}
                onPress={() => setCountryTo(c.code)}
              >
                <Text style={[styles.chipText, countryTo === c.code && { color: Colors.blue }]}>{c.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Recipient */}
      <Text style={styles.sectionTitle}>Recipient Details *</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Recipient Name *</Text>
        <TextInput
          style={[styles.input, errors.recipientName && styles.inputError]}
          value={recipientName}
          onChangeText={setRecipientName}
          placeholder="Full name of recipient"
          placeholderTextColor={Colors.textSecondary}
        />
        <FieldError message={errors.recipientName} />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Bank Name (Optional)</Text>
        <TextInput
          style={styles.input}
          value={recipientBank}
          onChangeText={setRecipientBank}
          placeholder="e.g. Bank of America"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Account Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={recipientAccount}
          onChangeText={setRecipientAccount}
          placeholder="Account / IBAN number"
          keyboardType="numeric"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Purpose */}
      <Text style={styles.sectionTitle}>Purpose *</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Reason for Transfer *</Text>
        <TextInput
          style={[styles.input, { minHeight: 80 }, errors.reason && styles.inputError]}
          value={reason}
          onChangeText={setReason}
          placeholder="Explain the purpose of this transaction..."
          multiline
          textAlignVertical="top"
          placeholderTextColor={Colors.textSecondary}
        />
        <FieldError message={errors.reason} />
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputLabel}>Additional Details (Optional)</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
          placeholder="Any additional information..."
          multiline
          textAlignVertical="top"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <Button
        title="Submit Request"
        variant="primary"
        onPress={handleSubmit}
        loading={loading}
        style={{ marginTop: Spacing.xl, marginBottom: 60 }}
        fullWidth
      />
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ServiceRequestScreen({
  hideHeader = false,
  onSubmitSuccess,
}: {
  hideHeader?: boolean;
  onSubmitSuccess?: () => void;
}) {
  const { user } = useAuthStore();
  const [view, setView] = useState<'new' | 'history'>('new');

  if (!user) {
    return (
      <SafeAreaView style={CommonStyles.screenBg} edges={[]}>
        <View style={[CommonStyles.flex1, CommonStyles.center]}>
          <Text style={{ color: Colors.textSecondary }}>Please log in to use this feature.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={CommonStyles.screenBg} edges={[]}>
      {!hideHeader && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Payment Services</Text>
        </View>
      )}

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, view === 'new' && styles.tabBtnActive]}
          onPress={() => setView('new')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, view === 'new' && styles.tabTextActive]}>➕ New Request</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, view === 'history' && styles.tabBtnActive]}
          onPress={() => setView('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>📋 My Requests</Text>
        </TouchableOpacity>
      </View>

      {view === 'new'
        ? <NewRequestForm userId={user.id} onSuccess={() => setView('history')} />
        : <RequestHistory userId={user.id} />
      }
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const errStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  icon: { fontSize: 12 },
  text: { fontSize: Typography.xs, color: Colors.red, flex: 1 },
});

const badgeStyles = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  text: { fontSize: Typography.xs, fontWeight: Typography.bold },
});

const histStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.blueLight,
    alignItems: 'center', justifyContent: 'center',
  },
  svcLabel: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.text },
  meta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  noteBox: {
    marginTop: Spacing.md, backgroundColor: Colors.goldLight,
    borderRadius: Radius.md, padding: Spacing.md,
  },
  noteLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, color: Colors.goldDark, marginBottom: 2 },
  noteText: { fontSize: Typography.sm, color: Colors.text },
  date: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.md },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.xl, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: Colors.grayLight,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.text },
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  tabBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  tabBtnActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  tabText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  content: { padding: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.sm, fontWeight: Typography.bold,
    color: Colors.textSecondary, marginBottom: Spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  serviceCardSelected: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  serviceCardError: { borderColor: Colors.red },
  serviceLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, marginTop: 4, color: Colors.text },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  inputWrap: { marginBottom: Spacing.md },
  inputLabel: { fontSize: Typography.xs, fontWeight: Typography.semibold, color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    fontSize: Typography.base, color: Colors.text,
  },
  inputError: { borderColor: Colors.red, borderWidth: 1.5 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.lg,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  chipSelected: { borderColor: Colors.blue, backgroundColor: Colors.blueLight },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.text },
});
