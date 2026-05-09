import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';

export function SettingsScreen() {
  const [sessionReminders, setSessionReminders] = useState(true);
  const [scholarshipAlerts, setScholarshipAlerts] = useState(true);
  const [documentUpdates, setDocumentUpdates] = useState(true);
  const [messages, setMessages] = useState(false);

  const SECTIONS = [
    {
      title: 'Notifications',
      items: [
        { icon: '🔔', label: 'Session Reminders', type: 'toggle', value: sessionReminders, onChange: setSessionReminders },
        { icon: '🎓', label: 'Scholarship Alerts', type: 'toggle', value: scholarshipAlerts, onChange: setScholarshipAlerts },
        { icon: '📄', label: 'Document Updates', type: 'toggle', value: documentUpdates, onChange: setDocumentUpdates },
        { icon: '💬', label: 'Message Notifications', type: 'toggle', value: messages, onChange: setMessages },
      ],
    },
    {
      title: 'App',
      items: [
        { icon: '🌐', label: 'Language', type: 'nav', value: 'English', route: null },
        { icon: '🎨', label: 'Theme', type: 'nav', value: 'Light', route: null },
        { icon: '💳', label: 'Payment Methods', type: 'nav', route: null },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '🔒', label: 'Change Password', type: 'nav', route: null },
        { icon: '🛡️', label: 'Privacy & Data', type: 'nav', route: null },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help Center', type: 'nav', route: null },
        { icon: '⭐', label: 'Rate Eagle Pathway', type: 'nav', route: null },
        { icon: '🗑️', label: 'Delete Account', type: 'danger', route: null },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {SECTIONS.map(section => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, i) => (
                <View key={item.label} style={[styles.item, i === section.items.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.icon, { backgroundColor: Colors.grayLight }]}><Text style={{ fontSize: 16 }}>{item.icon}</Text></View>
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
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
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
