import { create } from 'zustand';
import { parentsService } from '../services/parents';
import { User, Application, Booking } from '../types';
import { useAuthStore } from './authStore';

interface ParentState {
  linkedStudents: User[];
  linkedStudentApplications: Record<string, Application[]>;
  linkedStudentBookings: Record<string, Booking[]>;
  isLoadingLinkedBookings: boolean;

  // Actions
  loadLinkedStudents: (userId: string) => Promise<void>;
  loadLinkedStudentApplications: (userId: string) => Promise<void>;
  loadLinkedStudentBookings: (userId: string) => Promise<void>;
  inviteParent: (studentId: string, parentPhone: string) => Promise<void>;
  linkStudent: (parentId: string, studentPhone: string) => Promise<void>;
  loadPendingLinks: (userId: string, role: 'parent' | 'student') => Promise<any[]>;
  verifyLink: (linkId: string) => Promise<void>;
  removeLink: (linkId: string) => Promise<void>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  linkedStudents: [],
  linkedStudentApplications: {},
  linkedStudentBookings: {},
  isLoadingLinkedBookings: false,

  loadLinkedStudents: async (userId) => {
    const linkedStudents = await parentsService.getLinkedStudents(userId);
    set({ linkedStudents });
  },

  loadLinkedStudentApplications: async (userId) => {
    const apps = await parentsService.getLinkedStudentApplications(userId);
    set({ linkedStudentApplications: apps });
  },

  loadLinkedStudentBookings: async (userId) => {
    set({ isLoadingLinkedBookings: true });
    try {
      const bookings = await parentsService.getLinkedStudentBookings(userId);
      set({ linkedStudentBookings: bookings });
    } finally {
      set({ isLoadingLinkedBookings: false });
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
}));
