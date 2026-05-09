import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { EmptyState } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

export function NotificationsScreen() {
  const { user } = useAuthStore();
  const { notifications, unreadCount, loadNotifications, markAllNotificationsRead, markNotificationRead } = useAppStore();
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) loadNotifications(user.id);
  }, [user?.id]);

  const handleMarkRead = async (id: string) => {
    if (markingIds.has(id)) return;
    setMarkingIds(prev => new Set(prev).add(id));
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('[Notifications] Failed to mark read:', err);
    } finally {
      setMarkingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const NOTIF_ICONS: Record<string, string> = {
    session_reminder: '⏰', booking_confirmed: '📅', scholarship_alert: '🔔',
    document_approved: '✅', document_rejected: '❌', sop_reviewed: '🎓',
    application_update: '📋', offer_received: '🎉',
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={{ fontSize: 20, color: Colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => user && markAllNotificationsRead(user.id)} activeOpacity={0.8}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {(notifications || []).length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" subtitle="You'll see session reminders, scholarship alerts, and updates here" />
      ) : (
        <FlatList
          data={notifications || []}
          keyExtractor={n => n.id}
          renderItem={({ item: n }) => (
            <TouchableOpacity 
              style={[styles.item, !n.is_read && styles.itemUnread]}
              activeOpacity={0.8}
              onPress={() => {
                if (!n.is_read) {
                  handleMarkRead(n.id);
                }

                const data = n.data as any;
                switch (n.type) {
                  case 'application_update':
                  case 'sop_reviewed':
                  case 'offer_received':
                    if (data?.application_id) {
                      router.push({
                        pathname: '/tracker',
                        params: { applicationId: data.application_id }
                      });
                    } else {
                      router.push('/tracker');
                    }
                    break;
                  case 'document_approved':
                  case 'document_rejected':
                    router.push('/documents');
                    break;
                  case 'booking_confirmed':
                  case 'session_reminder':
                    router.push('/(tabs)/bookings');
                    break;
                  case 'scholarship_alert':
                    if (data?.scholarship_id) {
                      router.push({
                        pathname: '/scholarship/[scholarshipId]',
                        params: { scholarshipId: data.scholarship_id }
                      });
                    } else {
                      router.push('/(tabs)/scholarships');
                    }
                    break;
                  default:
                    break;
                }
              }}
            >
              <View style={styles.iconWrap}>
                <Text style={{ fontSize: 20 }}>{NOTIF_ICONS[n.type] || '📬'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{n.title}</Text>
                <Text style={styles.itemBody}>{n.body}</Text>
                <Text style={styles.itemTime}>{new Date(n.created_at).toLocaleDateString()}</Text>
              </View>
              {!n.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 36, height: 36, backgroundColor: Colors.grayLight, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  markAll: { fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.blue },
  item: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'flex-start' },
  itemUnread: { backgroundColor: Colors.blueLight },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.grayLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  itemBody: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  itemTime: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.blue, marginTop: 6, flexShrink: 0 },
});
