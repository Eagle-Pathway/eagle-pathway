import { create } from 'zustand';
import { Scholarship, Application, Booking, Document, Notification, PackageTier, DocumentType } from '../types';
import { scholarshipsService } from '../services/scholarships';
import { tutorsService } from '../services/tutors';
import { notificationsService } from '../services/notifications';

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

  // Loading
  isLoadingScholarships: boolean;
  isLoadingBookings: boolean;
  isLoadingNotifications: boolean;

  // Actions — Scholarships
  loadScholarships: (filters?: any) => Promise<void>;
  loadApplications: (userId: string) => Promise<void>;
  createApplication: (userId: string, scholarshipId: string, packageTier: PackageTier) => Promise<Application>;
  toggleSaveScholarship: (id: string) => void;

  // Actions — Bookings
  loadBookings: (userId: string) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;

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
}

export const useAppStore = create<AppState>((set, get) => ({
  scholarships: [],
  applications: [],
  savedScholarshipIds: [],
  bookings: [],
  documents: [],
  notifications: [],
  unreadCount: 0,
  isLoadingScholarships: false,
  isLoadingBookings: false,
  isLoadingNotifications: false,

  loadScholarships: async (filters) => {
    set({ isLoadingScholarships: true });
    try {
      const scholarships = await scholarshipsService.getScholarships(filters);
      set({ scholarships });
    } finally {
      set({ isLoadingScholarships: false });
    }
  },

  loadApplications: async (userId) => {
    const applications = await scholarshipsService.getStudentApplications(userId);
    set({ applications });
  },

  createApplication: async (userId, scholarshipId, packageTier) => {
    const application = await scholarshipsService.createApplication({
      studentId: userId,
      scholarshipId,
      packageTier,
    });
    set(state => ({ applications: [application, ...state.applications] }));
    return application;
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

  cancelBooking: async (bookingId) => {
    await tutorsService.cancelBooking(bookingId);
    set(state => ({
      bookings: state.bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
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
}));
