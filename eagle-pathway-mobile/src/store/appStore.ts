import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { scholarshipsService } from '../services/scholarships';
import { tutorsService } from '../services/tutors';
import { notificationsService } from '../services/notifications';
import { tasksService } from '../services/tasks';
import { Scholarship, Application, Booking, BookingStatus, Document, Notification, StudentTask, PackageTier, DocumentType } from '../types';

interface AppState {
  // Scholarships
  scholarships: Scholarship[];
  applications: Application[];
  savedScholarshipIds: string[];

  // Bookings
  bookings: Booking[];

  // Documents
  documents: Document[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Tasks
  tasks: StudentTask[];
  recommendedScholarships: Scholarship[];

  // Loading
  isLoadingScholarships: boolean;
  isLoadingBookings: boolean;
  isLoadingNotifications: boolean;
  isLoadingTasks: boolean;
  isReviewingSOP: boolean;

  // Actions — Scholarships
  loadScholarships: (filters?: any) => Promise<void>;
  loadRecommendations: (userId: string) => Promise<void>;
  loadApplications: (userId: string) => Promise<void>;
  createApplication: (userId: string, scholarshipId: string, packageTier: PackageTier, sopContent?: string) => Promise<Application>;
  updateSOP: (applicationId: string, content: string) => Promise<void>;
  reviewSOP: (content: string) => Promise<{ score: number; feedback: string; suggestions: string[] }>;
  toggleSaveScholarship: (id: string) => void;

  // Actions — Bookings
  loadBookings: (userId: string) => Promise<void>;
  loadTutorBookings: (tutorId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;

  // Actions — Documents
  loadDocuments: (userId: string) => Promise<void>;
  uploadDocument: (params: {
    userId: string;
    applicationId?: string;
    documentType: DocumentType;
    fileUri: string;
    fileName: string;
  }) => Promise<Document>;

  // Actions — Notifications
  loadNotifications: (userId: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;

  // Actions — Tasks
  loadTasks: (userId: string) => Promise<void>;
  toggleTask: (taskId: string, currentStatus: string) => Promise<void>;

  // Realtime
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  scholarships: [],
  applications: [],
  savedScholarshipIds: [],
  bookings: [],
  documents: [],
  notifications: [],
  unreadCount: 0,
  tasks: [],
  recommendedScholarships: [],
  isLoadingScholarships: false,
  isLoadingBookings: false,
  isLoadingNotifications: false,
  isLoadingTasks: false,
  isReviewingSOP: false,

  loadScholarships: async (filters) => {
    set({ isLoadingScholarships: true });
    try {
      const scholarships = await scholarshipsService.getScholarships(filters);
      set({ scholarships });
    } finally {
      set({ isLoadingScholarships: false });
    }
  },

  loadRecommendations: async (userId) => {
    try {
      const recommended = await scholarshipsService.getRecommendedScholarships(userId);
      set({ recommendedScholarships: recommended });
    } catch (e) {
      console.error('Error loading recommendations:', e);
    }
  },

  loadApplications: async (userId) => {
    const applications = await scholarshipsService.getStudentApplications(userId);
    set({ applications });
  },

  createApplication: async (userId, scholarshipId, packageTier, sopContent) => {
    const application = await scholarshipsService.createApplication({
      studentId: userId,
      scholarshipId,
      packageTier,
      sopContent,
    });
    set(state => ({ applications: [application, ...state.applications] }));
    return application;
  },

  updateSOP: async (applicationId, content) => {
    await scholarshipsService.updateSOPContent(applicationId, content);
    set(state => ({
      applications: state.applications.map(a => 
        a.id === applicationId ? { ...a, sop_content: content } : a
      )
    }));
  },

  reviewSOP: async (content) => {
    set({ isReviewingSOP: true });
    try {
      return await scholarshipsService.getSOPFeedback(content);
    } finally {
      set({ isReviewingSOP: false });
    }
  },

  toggleSaveScholarship: (id) => {
    set(state => {
      const saved = state.savedScholarshipIds.includes(id)
        ? state.savedScholarshipIds.filter(s => s !== id)
        : [...state.savedScholarshipIds, id];
      return { savedScholarshipIds: saved };
    });
  },

  loadBookings: async (userId) => {
    set({ isLoadingBookings: true });
    try {
      const bookings = await tutorsService.getStudentBookings(userId);
      set({ bookings });
    } finally {
      set({ isLoadingBookings: false });
    }
  },

  loadTutorBookings: async (tutorId) => {
    set({ isLoadingBookings: true });
    try {
      const bookings = await tutorsService.getTutorBookings(tutorId);
      set({ bookings });
    } finally {
      set({ isLoadingBookings: false });
    }
  },

  cancelBooking: async (bookingId) => {
    await tutorsService.cancelBooking(bookingId);
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ),
    }));
  },

  updateBookingStatus: async (bookingId, status) => {
    await tutorsService.updateBookingStatus(bookingId, status);
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status } : b
      ),
    }));
  },

  loadDocuments: async (userId) => {
    const documents = await scholarshipsService.getUserDocuments(userId);
    set({ documents });
  },

  uploadDocument: async (params) => {
    const doc = await scholarshipsService.uploadDocument(params);
    set(state => ({ documents: [doc, ...state.documents] }));
    return doc;
  },

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

  loadTasks: async (userId) => {
    set({ isLoadingTasks: true });
    try {
      const tasks = await tasksService.getStudentTasks(userId);
      set({ tasks });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  toggleTask: async (taskId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await tasksService.updateTaskStatus(taskId, nextStatus as any);
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, status: nextStatus as any } : t
        ),
      }));
    } catch (e) {
      console.error('Error toggling task:', e);
    }
  },

  subscribeToUpdates: (userId) => {
    // Unsubscribe if already subscribed
    get().unsubscribeFromUpdates();

    const channel = supabase
      .channel(`student_updates:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_tasks', filter: `student_id=eq.${userId}` },
        () => get().loadTasks(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications', filter: `student_id=eq.${userId}` },
        () => get().loadApplications(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => get().loadNotifications(userId)
      )
      .subscribe();

    (global as any).supabaseSubscription = channel;
  },

  unsubscribeFromUpdates: () => {
    const channel = (global as any).supabaseSubscription;
    if (channel) {
      supabase.removeChannel(channel);
      (global as any).supabaseSubscription = null;
    }
  },
}));
