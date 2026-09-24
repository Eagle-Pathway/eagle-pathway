import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { EmptyState, ErrorState } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { resolveNotificationRoute } from '@/utils/deepLink';
import { toast } from '@/utils/toast';
import { showError } from '@/utils/errorHandler';

function getNotificationIcon(type: string): { name: keyof typeof Ionicons.glyphMap; color: string; bg: string } {
  switch (type) {
    case 'session_reminder':
      return { name: 'time-outline', color: '#1E4D9B', bg: '#EFF6FF' };
    case 'booking_confirmed':
      return { name: 'calendar-outline', color: '#059669', bg: '#ECFDF5' };
    case 'scholarship_alert':
      return { name: 'ribbon-outline', color: '#D97706', bg: '#FEF3C7' };
    case 'document_approved':
      return { name: 'checkmark-circle-outline', color: '#059669', bg: '#ECFDF5' };
    case 'document_rejected':
      return { name: 'close-circle-outline', color: '#DC2626', bg: '#FEE2E2' };
    case 'sop_reviewed':
      return { name: 'school-outline', color: '#7C3AED', bg: '#F5F3FF' };
    case 'application_update':
      return { name: 'document-text-outline', color: '#2563EB', bg: '#EFF6FF' };
    case 'offer_received':
      return { name: 'trophy-outline', color: '#C9A84C', bg: '#FFFBEB' };
    case 'new_resource':
      return { name: 'book-outline', color: '#0891B2', bg: '#ECFEFF' };
    default:
      return { name: 'notifications-outline', color: '#4B5563', bg: '#F3F4F6' };
  }
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NotificationsScreen() {
  const { user } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    loadNotifications, 
    markAllNotificationsRead, 
    markNotificationRead,
    deleteNotification 
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setError(false);
    try { 
      await loadNotifications(user.id); 
    } catch { 
      setError(true); 
    }
  }, [user?.id, loadNotifications]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user?.id]);

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

  const handleDelete = (id: string) => {
    Alert.alert(
      'Remove Notification',
      'Are you sure you want to dismiss this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            setDeletingIds(prev => new Set(prev).add(id));
            try {
              await deleteNotification(id);
              toast.success('Dismissed', 'Notification removed.');
            } catch (err) {
              showError(err, 'Failed to dismiss notification');
            } finally {
              setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
            }
          }
        }
      ]
    );
  };

  const filteredNotifications = (notifications || []).filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} 
          activeOpacity={0.8} 
          accessibilityRole="button" 
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity 
            onPress={() => user && markAllNotificationsRead(user.id)} 
            activeOpacity={0.8}
            style={styles.markAllBtn}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={Colors.blue} />
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unread' && styles.tabActive]}
          onPress={() => setActiveTab('unread')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.tabTextActive]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {error && (notifications || []).length === 0 ? (
        <ErrorState subtitle="We couldn't load your notifications. Check your connection and retry." onRetry={load} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState 
          icon={activeTab === 'unread' ? "checkmark-circle-outline" : "notifications-outline"} 
          title={activeTab === 'unread' ? "All caught up!" : "No notifications yet"} 
          subtitle={activeTab === 'unread' 
            ? "You have read all your notifications." 
            : "You'll see session reminders, scholarship alerts, and updates here"
          } 
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={n => n.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.blue} />
          }
          renderItem={({ item: n }) => {
            const iconCfg = getNotificationIcon(n.type);
            const isDeleting = deletingIds.has(n.id);

            return (
              <TouchableOpacity 
                style={[styles.item, !n.is_read && styles.itemUnread, isDeleting && { opacity: 0.4 }]}
                activeOpacity={0.8}
                onPress={() => {
                  if (!n.is_read) {
                    handleMarkRead(n.id);
                  }

                  const targetRoute = resolveNotificationRoute(n.data as any, n.type);
                  if (targetRoute) {
                    if (targetRoute.params) {
                      router.push({
                        pathname: targetRoute.pathname as any,
                        params: targetRoute.params,
                      });
                    } else {
                      router.push(targetRoute.pathname as any);
                    }
                  }
                }}
              >
                <View style={[styles.iconWrap, { backgroundColor: iconCfg.bg }]}>
                  <Ionicons name={iconCfg.name} size={20} color={iconCfg.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{n.title}</Text>
                  <Text style={styles.itemBody}>{n.body}</Text>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemTime}>{formatRelativeTime(n.created_at)}</Text>
                    {!n.is_read && <View style={styles.unreadDot} />}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel="Dismiss notification"
                >
                  <Ionicons name="close" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.md, 
    padding: Spacing.xl, 
    backgroundColor: Colors.card, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border 
  },
  backBtn: { 
    width: 36, 
    height: 36, 
    backgroundColor: Colors.grayLight, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.bold, color: Colors.text, flex: 1 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  markAll: { fontSize: Typography.sm, fontWeight: Typography.semibold, color: Colors.blue },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.grayLight,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.blue,
  },
  tabText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  unreadCountBadge: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.blue,
  },
  item: { 
    flexDirection: 'row', 
    gap: Spacing.md, 
    padding: Spacing.lg, 
    borderBottomWidth: 1, 
    borderBottomColor: Colors.border, 
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
  },
  itemUnread: { backgroundColor: '#F0F7FF' },
  iconWrap: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  itemTitle: { fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.text },
  itemBody: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: 3, lineHeight: 20 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  itemTime: { fontSize: Typography.xs, color: Colors.textSecondary },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.blue },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
