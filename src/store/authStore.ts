import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authService } from '../services/auth';

const BYPASS_PHONE_VERIFY =
  __DEV__ && process.env.EXPO_PUBLIC_BYPASS_PHONE_VERIFY === 'true';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSignup: { fullName: string; phone: string; role: UserRole; email: string } | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setPendingSignup: (data: AuthState['pendingSignup']) => void;
  sendOtp: (phone: string) => Promise<void>;
  initiateSignup: (fullName: string, phone: string, role: UserRole, email: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadAvatar: (fileUri: string, fileName: string) => Promise<void>;
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
    if (BYPASS_PHONE_VERIFY) return;
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
      if (!email?.trim()) throw new Error('Email is required');
      set({ pendingSignup: { fullName, phone, role, email: email.trim() } });

      if (BYPASS_PHONE_VERIFY) return;

      await authService.sendOtp(phone);
    } finally {
      set({ isLoading: false });
    }
  },

  verifyOtp: async (phone, token) => {
    set({ isLoading: true });
    try {
      if (BYPASS_PHONE_VERIFY) {
        const pending = get().pendingSignup;
        const email = pending?.email?.trim() || 'dev@test.com';

        set({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            full_name: pending?.fullName ?? 'Dev User',
            phone: pending?.phone ?? phone,
            role: pending?.role ?? ('STUDENT' as UserRole),
            email,
          } as User,
          session: null,
          isAuthenticated: true,
          pendingSignup: null,
        });
        return;
      }

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
        if (!pending) throw new Error('Missing signup data');
        if (!pending.email?.trim()) throw new Error('Email is required');

        const profile = await authService.createProfile(
          data.session.user.id,
          pending.fullName,
          pending.phone,
          pending.role,
          pending.email.trim()
        );
        set({ user: profile, isAuthenticated: true, pendingSignup: null });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  loadProfile: async () => {
    const { session, user } = get();

    // Dev bypass: don’t let “no session” kick you out
    if (BYPASS_PHONE_VERIFY) {
      if (!user) {
        set({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            full_name: 'Dev User',
            phone: '+10000000000',
            role: 'STUDENT' as UserRole,
            email: 'dev@test.com',
          } as User,
          isAuthenticated: true,
        });
      }
      return;
    }

    if (!session?.user?.id) return;

    set({ isLoading: true });
    try {
      const profile = await authService.getProfile(session.user.id);
      set({ user: profile, isAuthenticated: true });
    } catch {
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

  uploadAvatar: async (fileUri, fileName) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true });
    try {
      const publicUrl = await authService.uploadAvatar(user.id, fileUri, fileName);
      set({ user: { ...user, avatar_url: publicUrl } });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    if (!BYPASS_PHONE_VERIFY) {
      await authService.signOut();
    }
    set({ user: null, session: null, isAuthenticated: false, pendingSignup: null });
  },
}));