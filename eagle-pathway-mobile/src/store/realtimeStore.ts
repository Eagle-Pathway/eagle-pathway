import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useScholarshipStore } from './scholarshipStore';
import { useTaskStore } from './taskStore';
import { useNotificationStore } from './notificationStore';
import { useAuthStore } from './authStore';

interface RealtimeState {
  activeSubscription: RealtimeChannel | null;
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useRealtimeStore = create<RealtimeState>((set, get) => ({
  activeSubscription: null,

  subscribeToUpdates: (userId: string) => {
    // Unsubscribe if already subscribed
    get().unsubscribeFromUpdates();

    const channel = supabase
      .channel(`student_updates:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_tasks', filter: `student_id=eq.${userId}` },
        () => useTaskStore.getState().loadTasks(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `student_id=eq.${userId}` },
        () => useScholarshipStore.getState().loadApplications(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => useNotificationStore.getState().loadNotifications(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        () => useAuthStore.getState().loadProfile()
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
