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

  incrementUnread: () => set(state => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () => set(state => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
