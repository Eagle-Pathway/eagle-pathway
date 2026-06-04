import { supabase } from './supabase';

export interface NotificationPreferences {
  session_reminders: boolean;
  scholarship_alerts: boolean;
  document_updates: boolean;
  message_notifications: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  session_reminders: true,
  scholarship_alerts: true,
  document_updates: true,
  message_notifications: true,
};

export const notificationPrefsService = {
  async get(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('session_reminders, scholarship_alerts, document_updates, message_notifications')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return { ...DEFAULT_PREFERENCES };
    return {
      session_reminders: data.session_reminders,
      scholarship_alerts: data.scholarship_alerts,
      document_updates: data.document_updates,
      message_notifications: data.message_notifications,
    };
  },

  async save(userId: string, prefs: NotificationPreferences): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' });
    if (error) throw error;
  },
};
