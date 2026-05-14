import { create } from 'zustand';
import { parentsService } from '../services/parents';
import { User, Application } from '../types';

interface ParentState {
  linkedStudents: User[];
  linkedStudentApplications: Record<string, Application[]>;

  // Actions
  loadLinkedStudents: (userId: string) => Promise<void>;
  loadLinkedStudentApplications: (userId: string) => Promise<void>;
  inviteParent: (studentId: string, parentPhone: string) => Promise<void>;
  linkStudent: (parentId: string, studentPhone: string) => Promise<void>;
  loadPendingLinks: (userId: string, role: 'parent' | 'student') => Promise<any[]>;
  verifyLink: (linkId: string) => Promise<void>;
  removeLink: (linkId: string) => Promise<void>;
}

export const useParentStore = create<ParentState>((set, get) => ({
  linkedStudents: [],
  linkedStudentApplications: {},

  loadLinkedStudents: async (userId) => {
    const linkedStudents = await parentsService.getLinkedStudents(userId);
    set({ linkedStudents });
  },

  loadLinkedStudentApplications: async (userId) => {
    const apps = await parentsService.getLinkedStudentApplications(userId);
    set({ linkedStudentApplications: apps });
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
  },

  removeLink: async (linkId) => {
    await parentsService.removeLink(linkId);
  },
}));
