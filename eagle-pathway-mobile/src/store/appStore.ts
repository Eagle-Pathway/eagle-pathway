/**
 * @deprecated 
 * The appStore has been decomposed into specialized domain stores to improve performance 
 * and maintainability. Please use the following specialized stores instead:
 * 
 * - useScholarshipStore: Scholarship and application state
 * - useBookingStore: Tutor bookings and tutor profile
 * - useNotificationStore: User notifications
 * - useDocumentStore: User documents
 * - useParentStore: Linked student management
 * - useFinanceStore: Tutor payouts
 * - useTaskStore: Student tasks
 * - useRealtimeStore: Supabase Realtime subscriptions
 * 
 * This file remains for backward compatibility during the transition but contains no logic.
 */

import { create } from 'zustand';

export const useAppStore = create(() => ({
  // Empty state - all logic moved to domain stores
}));

console.warn('useAppStore is deprecated. Please migrate to specialized domain stores.');
