import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { notificationPrefsService, DEFAULT_PREFERENCES, type NotificationPreferences } from '@/services/notificationPrefs';
import { CustomModal } from '@/components/common';
import { Ionicons } from '@expo/vector-icons';
import { showError } from '@/utils/errorHandler';

// Public privacy policy — must be published here before Play submission.
const PRIVACY_POLICY_URL = 'https://www.eaglespathway.com/privacy';
const ANDROID_PACKAGE = 'com.eaglepathway.app';

export function SettingsScreen() {
  const { user, deleteAccount } = useAuthStore();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [deleting, setDeleting] = useState(false);

  // Modal State
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);

  useEffect(() => {
    if (user) notificationPrefsService.get(user.id).then(setPrefs).catch(() => {});
  }, [user?.id]);

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteAccountVisible(false);
      router.replace('/(auth)/splash');
    } catch (e: any) {
      setDeleting(false);
      setDeleteAccountVisible(false);
      showError(e, 'Account Deletion Failed');
    }
  };

  const confirmChangePassword = () => {
    setChangePasswordVisible(false);
    router.push({ pathname: '/(auth)/forgot-password', params: { email: user?.email } });
  };

  const handlePrivacy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => showError('Could not open the privacy policy.', 'Notice'));
  };

  const handleRate = () => {
    Linking.openURL(`market://details?id=${ANDROID_PACKAGE}`).catch(() =>
      Linking.openURL(`https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`).catch(() => {}),
    );
  };

  // Optimistic toggle, then persist (preferences are user-owned in the DB).
  const setPref = (key: keyof NotificationPreferences, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    if (user) notificationPrefsService.save(user.id, next).catch(() => {});
  };

  const SECTIONS = [
    {
      title: 'Notifications',
      items: [
        { icon: 'notifications-outline', label: 'Session Reminders', type: 'toggle', value: prefs.session_reminders, onChange: (v: boolean) => setPref('session_reminders', v) },
        { icon: 'school-outline', label: 'Scholarship Alerts', type: 'toggle', value: prefs.scholarship_alerts, onChange: (v: boolean) => setPref('scholarship_alerts', v) },
        { icon: 'document-text-outline', label: 'Document Updates', type: 'toggle', value: prefs.document_updates, onChange: (v: boolean) => setPref('document_updates', v) },
        { icon: 'chatbubble-outline', label: 'Message Notifications', type: 'toggle', value: prefs.message_notifications, onChange: (v: boolean) => setPref('message_notifications', v) },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'lock-closed-outline', label: 'Change Password', type: 'nav', onPress: () => setChangePasswordVisible(true) },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Data', type: 'nav', onPress: handlePrivacy },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'star-outline', label: 'Rate Eagle Pathway', type: 'nav', onPress: handleRate },
        { icon: 'trash-outline', label: deleting ? 'Deleting…' : 'Delete Account', type: 'danger', route: null, onPress: () => setDeleteAccountVisible(true) },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {SECTIONS.map(section => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => {
                const onPress = (item as any).onPress as (() => void) | undefined;
                const RowContainer: any = onPress ? TouchableOpacity : View;
                return (
                <RowContainer
                  key={item.label}
                  style={[styles.item, i === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
                >
                  <View style={[styles.icon, { backgroundColor: Colors.grayLight }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.type === 'danger' ? Colors.red : Colors.textSecondary} />
                  </View>
                  <Text style={[styles.label, item.type === 'danger' && { color: Colors.red }]}>{item.label}</Text>
                  {item.type === 'toggle' && (
                    <Switch
                      value={(item as any).value}
                      onValueChange={(item as any).onChange}
                      trackColor={{ false: Colors.border, true: Colors.blue }}
                      thumbColor={Colors.white}
                    />
                  )}
                  {item.type === 'nav' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      {(item as any).value && <Text style={styles.navValue}>{(item as any).value}</Text>}
                      <Text style={styles.arrow}>›</Text>
                    </View>
                  )}
                </RowContainer>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Styled Custom Modals */}
      <CustomModal
        visible={changePasswordVisible}
        title="Change Password"
        message={`We'll email a 6-digit code to ${user?.email || 'your email'} to verify it's you.`}
        icon="key-outline"
        iconColor={Colors.blue}
        iconBg="#EFF6FF"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={confirmChangePassword}
        onCancel={() => setChangePasswordVisible(false)}
      />

      <CustomModal
        visible={deleteAccountVisible}
        title="Delete Account"
        message="This permanently deletes your account and all your data (applications, documents, bookings, and messages). This action cannot be undone."
        icon="trash-outline"
        iconColor={Colors.red}
        iconBg="#FEE2E2"
        confirmText="Delete Forever"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteAccountVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text },
  sectionLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.textSecondary, letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  sectionCard: { backgroundColor: Colors.card, marginHorizontal: Spacing.xl, borderRadius: Radius['2xl'], borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.text, flex: 1 },
  navValue: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  arrow: { fontSize: Typography.xl, color: Colors.textSecondary },
});

