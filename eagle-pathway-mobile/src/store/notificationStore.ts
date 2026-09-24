import { create } from 'zustand';
import { notificationsService } from '../services/notifications';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoadingNotifications: boolean;

  // Actions
  loadNotifications: (userId: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: (userId: string) => Promise<void>;
  incrementUnread: () => void;
  decrementUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoadingNotifications: false,

  loadNotifications: async (userId) => {
    set({ isLoadingNotifications: true });
    try {
      const [notifications, unreadCount] = await Promise.all([
        notificationsService.getNotifications(userId),
        notificationsService.getUnreadCount(userId),
      ]);
      set({ notifications, unreadCount });
    } finally {
      set({ isLoadingNotifications: false });
    }
  },

  markAllNotificationsRead: async (userId) => {
    await notificationsService.markAllRead(userId);
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  markNotificationRead: async (notificationId) => {
    await notificationsService.markRead(notificationId);
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  deleteNotification: async (notificationId) => {
    const target = get().notifications.find(n => n.id === notificationId);
    await notificationsService.deleteNotification(notificationId);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== notificationId),
      unreadCount: target && !target.is_read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
    }));
  },

  clearAllNotifications: async (userId) => {
    await notificationsService.clearAll(userId);
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  incrementUnread: () => set(state => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () => set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
