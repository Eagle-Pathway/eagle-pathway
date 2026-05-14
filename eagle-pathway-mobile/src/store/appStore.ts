import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useScholarshipStore } from './scholarshipStore';
import { useNotificationStore } from './notificationStore';
import { useTaskStore } from './taskStore';

interface AppState {
  // Realtime
  activeSubscription: RealtimeChannel | null;

  // Realtime Actions
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeSubscription: null,

  subscribeToUpdates: (userId: string) => {
    // Unsubscribe if already subscribed
    get().unsubscribeFromUpdates();

    // Access domain stores for refresh actions
    const scholarshipStore = useScholarshipStore.getState();
    const notificationStore = useNotificationStore.getState();
    const taskStore = useTaskStore.getState();

    const channel = supabase
      .channel(`user_updates:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_tasks', filter: `student_id=eq.${userId}` },
        () => taskStore.loadTasks(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `student_id=eq.${userId}` },
        () => scholarshipStore.loadApplications(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => notificationStore.loadNotifications(userId)
      )
      .subscribe();

    set({ activeSubscription: channel });
  },

  unsubscribeFromUpdates: () => {
    const channel = get().activeSubscription;
    if (channel) {
      supabase.removeChannel(channel);
      set({ activeSubscription: null });
    }
  },
}));
