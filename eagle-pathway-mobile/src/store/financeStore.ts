import { create } from 'zustand';
import { financeService, PayoutRequest } from '../services/finance';

interface FinanceState {
  tutorPayouts: PayoutRequest[];
  isLoadingPayouts: boolean;

  // Actions
  loadTutorPayouts: (userId: string) => Promise<void>;
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

  loadTutorPayouts: async (userId) => {
    set({ isLoadingPayouts: true });
    try {
      const tutorPayouts = await financeService.getTutorPayouts(userId);
      set({ tutorPayouts });
    } finally {
      set({ isLoadingPayouts: false });
    }
  },

  submitPayoutRequest: async (params) => {
    set({ isLoadingPayouts: true });
    try {
      await financeService.requestPayout(params);
      // Payouts list will be refreshed by the caller or a reload
    } finally {
      set({ isLoadingPayouts: false });
    }
  },
}));
