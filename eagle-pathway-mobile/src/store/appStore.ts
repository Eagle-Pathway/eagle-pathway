import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { scholarshipsService } from '../services/scholarships';
import { tutorsService } from '../services/tutors';
import { notificationsService } from '../services/notifications';
import { tasksService } from '../services/tasks';
import { financeService, PayoutRequest } from '../services/finance';
import { parentsService } from '../services/parents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Scholarship,
  Application,
  Booking,
  BookingStatus,
  Document,
  Notification,
  StudentTask,
  PackageTier,
  DocumentType,
  Tutor,
  User,
} from '../types';

interface AppState {
  // Scholarships
  scholarships: Scholarship[];
  applications: Application[];
  savedScholarshipIds: string[];

  // Bookings
  bookings: Booking[];

  // Tutors
  tutorProfile: Tutor | null;

  // Documents
  documents: Document[];

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Linked children (for parents)
  linkedStudents: User[];
  linkedStudentApplications: Record<string, Application[]>;

  // Finance
  tutorPayouts: PayoutRequest[];

  // Tasks
  tasks: StudentTask[];
  recommendedScholarships: Scholarship[];

  // Loading
  isLoadingScholarships: boolean;
  isLoadingBookings: boolean;
  isLoadingNotifications: boolean;
  isLoadingTasks: boolean;
  isLoadingPayouts: boolean;
  isReviewingSOP: boolean;
  isGeneratingMagicSOP: boolean;

  // Actions — Scholarships
  loadScholarships: (filters?: any) => Promise<void>;
  loadRecommendations: (userId: string) => Promise<void>;
  loadApplications: (userId: string) => Promise<void>;
  createApplication: (userId: string, scholarshipId: string, packageTier: PackageTier, sopContent?: string) => Promise<Application>;
  updateSOP: (applicationId: string, content: string) => Promise<void>;
  reviewSOP: (content: string, scholarshipId?: string, studentId?: string) => Promise<{ score: number; feedback: string; suggestions: string[] }>;
  generateMagicSOP: (student: User, scholarship: Scholarship) => Promise<string>;
  toggleSaveScholarship: (id: string) => void;
  loadSavedScholarships: () => Promise<void>;

  // Actions — Bookings
  loadBookings: (userId: string) => Promise<void>;
  loadTutorBookings: (tutorId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;

  // Actions — Tutors
  loadTutorProfile: (userId: string) => Promise<void>;

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
  markNotificationRead: (notificationId: string) => Promise<void>;

  // Actions — Finance
  loadTutorPayouts: (userId: string) => Promise<void>;
  submitPayoutRequest: (params: {
    tutorId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<void>;

  // Actions — Tasks
  loadTasks: (userId: string) => Promise<void>;
  toggleTask: (taskId: string, currentStatus: string) => Promise<void>;

  // Actions — Parents
  loadLinkedStudents: (userId: string) => Promise<void>;
  loadLinkedStudentApplications: (userId: string) => Promise<void>;
  inviteParent: (studentId: string, parentPhone: string) => Promise<void>;
  linkStudent: (parentId: string, studentPhone: string) => Promise<void>;
  loadPendingLinks: (userId: string, role: 'parent' | 'student') => Promise<any[]>;
  verifyLink: (linkId: string) => Promise<void>;
  removeLink: (linkId: string) => Promise<void>;

  // Realtime
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  scholarships: [],
  applications: [],
  savedScholarshipIds: [],
  bookings: [],
  tutorProfile: null,
  documents: [],
  notifications: [],
  unreadCount: 0,
  tasks: [],
  recommendedScholarships: [],
  tutorPayouts: [],
  linkedStudents: [],
  linkedStudentApplications: {},
  isLoadingScholarships: false,
  isLoadingBookings: false,
  isLoadingNotifications: false,
  isLoadingTasks: false,
  isLoadingPayouts: false,
  isReviewingSOP: false,
  isGeneratingMagicSOP: false,

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

  reviewSOP: async (content, scholarshipId, studentId) => {
    set({ isReviewingSOP: true });
    try {
      return await scholarshipsService.getSOPFeedback(content, scholarshipId, studentId);
    } finally {
      set({ isReviewingSOP: false });
    }
  },

  generateMagicSOP: async (student, scholarship) => {
    set({ isGeneratingMagicSOP: true });
    try {
      return await scholarshipsService.generateMagicSOP(student, scholarship);
    } finally {
      set({ isGeneratingMagicSOP: false });
    }
  },

  toggleSaveScholarship: (id) => {
    set(state => {
      const saved = state.savedScholarshipIds.includes(id)
        ? state.savedScholarshipIds.filter(s => s !== id)
        : [...state.savedScholarshipIds, id];
        
      AsyncStorage.setItem('@eagle_saved_scholarships', JSON.stringify(saved)).catch(err => 
        console.error('Save failed:', err)
      );
      
      return { savedScholarshipIds: saved };
    });
  },

  loadSavedScholarships: async () => {
    try {
      const stored = await AsyncStorage.getItem('@eagle_saved_scholarships');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ savedScholarshipIds: parsed });
        }
      }
    } catch (e) {
      console.error('Failed to load saved scholarships from storage:', e);
      // Fallback: stay with current empty state or handle corruption
    }
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

  loadTutorBookings: async (userId) => {
    set({ isLoadingBookings: true });
    try {
      const bookings = await tutorsService.getTutorBookings(userId);
      set({ bookings });
      
      // Also load profile to get earnings context
      const { data: tutor } = await supabase.from('tutors').select('*, user:users(*)').eq('user_id', userId).single();
      if (tutor) set({ tutorProfile: tutor });
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

  loadTutorProfile: async (userId) => {
    try {
      const { data: tutor, error } = await supabase
        .from('tutors')
        .select('*, user:users(*)')
        .eq('user_id', userId)
        .single();
      if (!error && tutor) {
        set({ tutorProfile: tutor });
      } else {
        set({ tutorProfile: null });
      }
    } catch (e) {
      console.error('Error loading tutor profile:', e);
      set({ tutorProfile: null });
    }
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

  markNotificationRead: async (notificationId) => {
    await notificationsService.markRead(notificationId);
    set(state => {
      const isUnread = state.notifications.find(n => n.id === notificationId && !n.is_read);
      return {
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
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

  loadTutorPayouts: async (userId) => {
    set({ isLoadingPayouts: true });
    try {
      const payouts = await financeService.getTutorPayouts(userId);
      set({ tutorPayouts: payouts });
    } finally {
      set({ isLoadingPayouts: false });
    }
  },

  submitPayoutRequest: async (params) => {
    set({ isLoadingPayouts: true });
    try {
      const newPayout = await financeService.requestPayout(params);
      set(state => ({ tutorPayouts: [newPayout, ...state.tutorPayouts] }));
    } finally {
      set({ isLoadingPayouts: false });
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

  loadLinkedStudents: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('parent_student_links')
        .select('student:users!inner(*)')
        .eq('parent_id', userId)
        .eq('is_verified', true);
      if (error) throw error;
      const students = (data || []).map(d => d.student as User);
      set({ linkedStudents: students });
    } catch (e) {
      console.error('Error loading linked students:', e);
    }
  },

  loadLinkedStudentApplications: async (userId) => {
    try {
      const { linkedStudents } = get();
      if (linkedStudents.length === 0) return;
      
      const studentIds = linkedStudents.map(s => s.id);
      const { data, error } = await supabase
        .from('applications')
        .select('*, scholarship:scholarships(*), consultant:users!consultant_id(full_name)')
        .in('student_id', studentIds)
        .not('status', 'in', '(accepted,rejected)');
      if (error) throw error;
      
      const appsByStudent: Record<string, Application[]> = {};
      (data || []).forEach(app => {
        if (!appsByStudent[app.student_id]) {
          appsByStudent[app.student_id] = [];
        }
        appsByStudent[app.student_id].push(app);
      });
      set({ linkedStudentApplications: appsByStudent });
    } catch (e) {
      console.error('Error loading student applications:', e);
    }
  },

  inviteParent: async (studentId, parentPhone) => {
    await parentsService.inviteParent(studentId, parentPhone);
  },

  linkStudent: async (parentId, studentPhone) => {
    await parentsService.linkStudent(parentId, studentPhone);
  },

  loadPendingLinks: async (userId, role) => {
    return await parentsService.getPendingLinks(userId, role);
  },

  verifyLink: async (linkId) => {
    await parentsService.verifyLink(linkId);
    const { user } = useAuthStore.getState();
    if (user) {
      get().loadLinkedStudents(user.id);
      get().loadLinkedStudentApplications(user.id);
    }
  },

  removeLink: async (linkId) => {
    await parentsService.removeLink(linkId);
    const { user } = useAuthStore.getState();
    if (user) {
      get().loadLinkedStudents(user.id);
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
