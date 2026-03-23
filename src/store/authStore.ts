import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authService } from '../services/auth';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSignup: { fullName: string; phone: string; role: UserRole; email?: string } | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setPendingSignup: (data: AuthState['pendingSignup']) => void;
  sendOtp: (phone: string) => Promise<void>;
  initiateSignup: (fullName: string, phone: string, role: UserRole, email?: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  pendingSignup: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setPendingSignup: (data) => set({ pendingSignup: data }),

  sendOtp: async (phone) => {
    set({ isLoading: true });
    try {
      await authService.sendOtp(phone);
    } finally {
      set({ isLoading: false });
    }
  },

  initiateSignup: async (fullName, phone, role, email) => {
    set({ isLoading: true });
    try {
      await authService.sendOtp(phone);
      set({ pendingSignup: { fullName, phone, role, email } });
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (phone, token) => {
    set({ isLoading: true });
    try {
      const data = await authService.verifyOtp(phone, token);
      if (!data.session) throw new Error('No session after OTP');

      set({ session: data.session });

      // Check if user profile exists
      try {
        const profile = await authService.getProfile(data.session.user.id);
        set({ user: profile, isAuthenticated: true });
      } catch {
        // New user — create profile from pending signup
        const pending = get().pendingSignup;
        if (pending) {
          const profile = await authService.createProfile(
            data.session.user.id,
            pending.fullName,
            pending.phone,
            pending.role,
            pending.email,
          );
          set({ user: profile, isAuthenticated: true, pendingSignup: null });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    const { session } = get();
    if (!session?.user?.id) return;
    set({ isLoading: true });
    try {
      const profile = await authService.getProfile(session.user.id);
      set({ user: profile, isAuthenticated: true });
    } catch (e) {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true });
    try {
      const updated = await authService.updateProfile(user.id, updates);
      set({ user: updated });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));
