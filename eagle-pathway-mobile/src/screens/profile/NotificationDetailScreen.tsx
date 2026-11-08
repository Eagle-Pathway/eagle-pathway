import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/utils/theme';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { resolveNotificationRoute } from '@/utils/deepLink';
import { supabase } from '@/services/supabase';
import { toast } from '@/utils/toast';
import { Notification } from '@/types';

function getNotificationCategory(type: string): {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
} {
  switch (type) {
    case 'session_reminder':
    case 'booking_confirmed':
      return { label: 'Tutoring Session', icon: 'calendar-outline', color: '#059669', bg: '#ECFDF5' };
    case 'scholarship_alert':
      return { label: 'Scholarship Opportunity', icon: 'ribbon-outline', color: '#D97706', bg: '#FEF3C7' };
    case 'document_approved':
    case 'document_rejected':
    case 'sop_reviewed':
      return { label: 'Document Review', icon: 'document-text-outline', color: '#7C3AED', bg: '#F5F3FF' };
    case 'application_update':
      return { label: 'Application Status', icon: 'school-outline', color: '#2563EB', bg: '#EFF6FF' };
    case 'new_resource':
      return { label: 'Academic Resource', icon: 'book-outline', color: '#0891B2', bg: '#ECFEFF' };
    case 'offer_received':
      return { label: 'Admission Offer', icon: 'trophy-outline', color: '#C9A84C', bg: '#FFFBEB' };
    default:
      return { label: 'System Alert', icon: 'notifications-outline', color: '#4B5563', bg: '#F3F4F6' };
  }
}

function formatDetailTime(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { notifications, markNotificationRead, deleteNotification } = useNotificationStore();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadItem() {
      if (!id) {
        setLoading(false);
        return;
      }

      // Check Zustand store first
      const cached = notifications.find((n) => n.id === id);
      if (cached) {
        setNotification(cached);
        if (!cached.is_read) {
          markNotificationRead(id).catch(() => {});
        }
        setLoading(false);
        return;
      }

      // Fallback query from Supabase
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          setNotification(data as Notification);
          if (!data.is_read) {
            markNotificationRead(id).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[NotificationDetail] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [id, notifications, markNotificationRead]);

  const handleDelete = () => {
    if (!id || deleting) return;
    Alert.alert(
      'Remove Notification',
      'Are you sure you want to dismiss this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteNotification(id);
              toast.success('Dismissed', 'Notification removed.');
              router.back();
            } catch (err) {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color={Colors.blue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.notFoundTitle}>Notification Not Found</Text>
          <Text style={styles.notFoundSub}>This notification may have been removed or expired.</Text>
          <TouchableOpacity style={styles.returnBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.returnBtnText}>Return to Notifications</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getNotificationCategory(notification.type);
  const targetRoute = resolveNotificationRoute(notification.data as any, notification.type);

  // Derive dynamic CTA button text
  let actionTitle = 'View Linked Content';
  if (targetRoute?.pathname) {
    const p = targetRoute.pathname.toLowerCase();
    if (p.includes('scholarship')) actionTitle = 'View Scholarship Details';
    else if (p.includes('tracker') || p.includes('application')) actionTitle = 'Open In Application Tracker';
    else if (p.includes('session') || p.includes('booking')) actionTitle = 'View Tutoring Session';
    else if (p.includes('resource') || p.includes('document')) actionTitle = 'Browse Academic Resources';
    else if (p.includes('tutor-job')) actionTitle = 'View Tutoring Request';
    else if (p.includes('chat')) actionTitle = 'Open Chat Conversation';
  } else {
    // Smart heuristic fallback
    const titleLower = notification.title.toLowerCase();
    const bodyLower = notification.body.toLowerCase();
    if (titleLower.includes('scholarship') || bodyLower.includes('scholarship')) {
      actionTitle = 'Browse Scholarships';
    } else if (titleLower.includes('resource') || bodyLower.includes('resource') || titleLower.includes('database')) {
      actionTitle = 'Browse Resources';
    } else if (titleLower.includes('session') || titleLower.includes('booking')) {
      actionTitle = 'View My Sessions';
    }
  }

  const handleActionPress = () => {
    if (targetRoute) {
      if (targetRoute.params) {
        router.push({
          pathname: targetRoute.pathname as any,
          params: targetRoute.params,
        });
      } else {
        router.push(targetRoute.pathname as any);
      }
    } else {
      // Fallback route navigation
      const titleLower = notification.title.toLowerCase();
      if (titleLower.includes('scholarship')) {
        router.push('/(tabs)/scholarships' as any);
      } else if (titleLower.includes('resource')) {
        router.push('/resources' as any);
      } else if (titleLower.includes('session') || titleLower.includes('booking')) {
        router.push('/(tabs)/sessions' as any);
      } else {
        router.back();
      }
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Notification</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8} disabled={deleting}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category & Status Bar */}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon} size={14} color={cat.color} />
            <Text style={[styles.categoryText, { color: cat.color }]}>{cat.label}</Text>
          </View>

          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.timeText}>{formatDetailTime(notification.created_at)}</Text>
          </View>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.notifTitle}>{notification.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.notifBody}>{notification.body}</Text>
        </View>

        {/* Primary Contextual Action Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={handleActionPress} activeOpacity={0.85}>
          <Text style={styles.actionBtnText}>{actionTitle}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Secondary Back Button */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Back to Notifications</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  notFoundTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  notFoundSub: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  returnBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.blue,
    borderRadius: Radius.md,
  },
  returnBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  notifTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    color: Colors.text,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  notifBody: {
    fontSize: Typography.base,
    color: '#334155',
    lineHeight: 22,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.blue,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    shadowColor: Colors.blue,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: Typography.base,
    color: '#FFFFFF',
    fontWeight: Typography.bold,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.semibold,
  },
});

