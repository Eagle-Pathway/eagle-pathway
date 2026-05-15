import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Notification } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationsService = {
  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Eagle Pathway',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E4D9B',
      });
    }

    return true;
  },

  async registerPushToken(userId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await supabase
        .from('push_tokens')
        .upsert({ user_id: userId, token: token.data });
    } catch (e) {
      console.log('Push token registration failed:', e);
    }
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Notification[];
  },

  async markAllRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async markRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
    return count || 0;
  },


  async sendMatchNotification(scholarshipName: string, matchScore: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 ' + matchScore + '% Match Found!',
        body: 'A new scholarship "' + scholarshipName + '" matches your profile. Tap to apply now!',
        data: { type: 'scholarship_match' },
        sound: true,
      },
      trigger: null, // Immediate
    });
  },

  async checkAndNotifyMatches(userId: string, scholarships: any[]): Promise<void> {
    const highMatches = scholarships.filter((s: any) => (s.matchScore || 0) >= 85);
    for (const match of highMatches.slice(0, 2)) {
      await this.sendMatchNotification(match.name, match.matchScore);
      // Store notification in DB
      await supabase.from('notifications').insert({
        user_id: userId,
        title: '🎯 ' + match.matchScore + '% Match: ' + match.name,
        body: 'This scholarship from ' + match.organization + ' is a near-perfect fit for your profile!',
        type: 'scholarship_match',
        is_read: false,
      }).select();
    }
  },
  addNotificationListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler);
  },

  addResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};
