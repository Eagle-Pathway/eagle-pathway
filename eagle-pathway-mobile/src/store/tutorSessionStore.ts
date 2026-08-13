import { create } from 'zustand';
import { tutorSessionsService, HoursLedgerMetrics } from '../services/tutorSessions';
import type { TutorAgreement, TutorSessionLog } from '../types';

interface TutorSessionState {
  activeSession: TutorSessionLog | null;
  agreement: TutorAgreement | null;
  metrics: HoursLedgerMetrics;
  isLoading: boolean;

  // Actions
  loadActiveSession: (userId: string, isTutor: boolean) => Promise<void>;
  loadMetrics: (userId: string, isTutor: boolean) => Promise<void>;
  loadAgreement: (bookingId: string) => Promise<void>;
  createAgreement: (params: {
    bookingId?: string;
    tutorId: string;
    studentId: string;
    responsibilities?: string;
    signedByTutor?: boolean;
    signedByParent?: boolean;
  }) => Promise<TutorAgreement>;
  signAgreement: (agreementId: string, role: 'tutor' | 'parent') => Promise<void>;
  startSession: (params: {
    bookingId?: string;
    tutorId: string;
    studentId: string;
    hourlyRate: number;
    notes?: string;
  }) => Promise<TutorSessionLog>;
  confirmStartSession: (sessionId: string) => Promise<void>;
  endSession: (params: { sessionId: string; notes?: string }) => Promise<TutorSessionLog>;
  confirmEndSession: (sessionId: string) => Promise<void>;
}

export const useTutorSessionStore = create<TutorSessionState>((set, get) => ({
  activeSession: null,
  agreement: null,
  metrics: { todayHours: 0, weekHours: 0, monthHours: 0, totalPayableAmount: 0 },
  isLoading: false,

  loadActiveSession: async (userId, isTutor) => {
    set({ isLoading: true });
    try {
      const active = await tutorSessionsService.getActiveSession(userId, isTutor);
      set({ activeSession: active });
    } catch (e) {
      console.error('Failed to load active session:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadMetrics: async (userId, isTutor) => {
    try {
      const metrics = await tutorSessionsService.getLedgerMetrics(userId, isTutor);
      set({ metrics });
    } catch (e) {
      console.error('Failed to load ledger metrics:', e);
    }
  },

  loadAgreement: async (bookingId) => {
    try {
      const agreement = await tutorSessionsService.getAgreementByBooking(bookingId);
      set({ agreement });
    } catch (e) {
      console.error('Failed to load agreement:', e);
    }
  },

  createAgreement: async (params) => {
    const agreement = await tutorSessionsService.createAgreement(params);
    set({ agreement });
    return agreement;
  },

  signAgreement: async (agreementId, role) => {
    const updated = await tutorSessionsService.signAgreement(agreementId, role);
    set({ agreement: updated });
  },

  startSession: async (params) => {
    const log = await tutorSessionsService.startSession(params);
    set({ activeSession: log });
    return log;
  },

  confirmStartSession: async (sessionId) => {
    const updated = await tutorSessionsService.confirmStartSession(sessionId);
    set({ activeSession: updated });
  },

  endSession: async (params) => {
    const updated = await tutorSessionsService.endSession(params);
    set({ activeSession: updated });
    return updated;
  },

  confirmEndSession: async (sessionId) => {
    const updated = await tutorSessionsService.confirmEndSession(sessionId);
    set({ activeSession: null });
  },
}));
