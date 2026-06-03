import { create } from 'zustand';
import { financeService, PayoutRequest } from '../services/finance';

interface TutorBalance {
  earned: number;
  pledged: number;
  available: number;
}

interface FinanceState {
  tutorPayouts: PayoutRequest[];
  isLoadingPayouts: boolean;
  balance: TutorBalance | null;

  // Actions
  loadTutorPayouts: (userId: string) => Promise<void>;
  loadBalance: () => Promise<void>;
  submitPayoutRequest: (params: {
    tutorId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  tutorPayouts: [],
  isLoadingPayouts: false,
  balance: null,

  loadTutorPayouts: async (userId) => {
    set({ isLoadingPayouts: true });
    try {
      const tutorPayouts = await financeService.getTutorPayouts(userId);
      set({ tutorPayouts });
    } finally {
      set({ isLoadingPayouts: false });
    }
  },

  loadBalance: async () => {
    try {
      const balance = await financeService.getBalance();
      set({ balance });
    } catch {
      // Non-fatal; leave previous balance (UI falls back to 0).
    }
  },

  submitPayoutRequest: async (params) => {
    set({ isLoadingPayouts: true });
    try {
      const newPayout = await financeService.requestPayout(params);
      set(state => ({ tutorPayouts: [newPayout, ...state.tutorPayouts] }));
      await get().loadBalance(); // pledged just increased
    } finally {
      set({ isLoadingPayouts: false });
    }
  },
}));
