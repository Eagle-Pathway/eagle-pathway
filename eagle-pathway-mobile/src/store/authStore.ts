import { create } from 'zustand';
import { User, UserRole } from '../types';
import { SignupAttribution, authService } from '../services/auth';
import { notificationsService } from '../services/notifications';
import { supabase } from '../services/supabase';
import { withTimeout } from '../utils/asyncUtils';

const BYPASS_PHONE_VERIFY =
  __DEV__ && process.env.EXPO_PUBLIC_BYPASS_PHONE_VERIFY === 'true';

import { googleAuthService } from '../services/googleAuthService';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSignup: { fullName: string; phone: string; role: UserRole; email: string } | null;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setPendingSignup: (data: AuthState['pendingSignup']) => void;
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole, attribution?: SignupAttribution) => Promise<void>;
  verifySignup: (email: string, token: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadAvatar: (fileUri: string, fileName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  // Start in the loading state: on cold start the root layout is still
  // restoring the persisted session, and the router's index gate must wait on
  // this. If it defaulted to false, a returning logged-in user would be routed
  // to the auth splash before the session resolves.
  isLoading: true,
  isAuthenticated: false,
  pendingSignup: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ isLoading: loading }),
  setPendingSignup: (data) => set({ pendingSignup: data }),

  signUp: async (email, password, fullName, phone, role, attribution) => {
    set({ isLoading: true });
    try {
      const data = await withTimeout(authService.signUp(email, password, fullName, phone, role, attribution));
      if (data.session) {
        set({ session: data.session, user: data.user as any, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  verifySignup: async (email, token) => {
    set({ isLoading: true });
    try {
      const data = await withTimeout(authService.verifySignupOtp(email, token));
      if (data.session) {
        set({ session: data.session });
        const u = data.session.user;

        let profile: User | null = null;
        try {
          profile = await authService.getProfile(u.id);
        } catch (e) {
          console.error('[verifySignup] getProfile failed, attempting fallback profile creation:', e);
          try {
            const metadata = u.user_metadata || {};
            profile = await authService.createProfile(
              u.id,
              metadata.full_name || 'User',
              metadata.phone || u.phone || '',
              metadata.role || 'student',
              u.email || '',
              {
                referral_code: metadata.referral_code,
                signup_source: metadata.signup_source,
                utm_source: metadata.utm_source,
                utm_medium: metadata.utm_medium,
                utm_campaign: metadata.utm_campaign,
                utm_content: metadata.utm_content,
                first_landing_url: metadata.first_landing_url,
              },
            );
          } catch (createErr) {
            console.error('[verifySignup] createProfile failed silently:', createErr);
          }
        }

        const finalUser: User = profile || {
          id: u.id,
          email: u.email || email,
          full_name: u.user_metadata?.full_name || 'User',
          phone: u.phone || '',
          role: u.user_metadata?.role || 'student',
          roles: [u.user_metadata?.role || 'student'],
          active_role: u.user_metadata?.role || 'student',
          created_at: new Date().toISOString(),
        };

        set({ user: finalUser, isAuthenticated: true });

        // Register push token in the background (non-blocking)
        const userId = u.id;
        notificationsService.requestPermission().then(granted => {
          if (granted) notificationsService.registerPushToken(userId);
        }).catch(e => console.error('Push registration skipped:', e));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await withTimeout(authService.signIn(email, password));
      if (data.session) {
        set({ session: data.session });
        
        let profile: User | null = null;
        try {
          profile = await authService.getProfile(data.session.user.id);
        } catch (e) {
          console.error('[signIn] getProfile failed, attempting fallback profile creation:', e);
          try {
            const metadata = data.session.user.user_metadata || {};
            profile = await authService.createProfile(
              data.session.user.id,
              metadata.full_name || 'User',
              metadata.phone || data.session.user.phone || '',
              metadata.role || 'student',
              data.session.user.email || '',
              {
                referral_code: metadata.referral_code,
                signup_source: metadata.signup_source,
                utm_source: metadata.utm_source,
                utm_medium: metadata.utm_medium,
                utm_campaign: metadata.utm_campaign,
                utm_content: metadata.utm_content,
                first_landing_url: metadata.first_landing_url,
              }
            );
          } catch (createErr) {
            console.error('[signIn] createProfile failed silently:', createErr);
          }
        }

        const finalUser: User = profile || {
          id: data.session.user.id,
          email: data.session.user.email || email,
          full_name: data.session.user.user_metadata?.full_name || 'User',
          phone: data.session.user.phone || '',
          role: data.session.user.user_metadata?.role || 'student',
          roles: [data.session.user.user_metadata?.role || 'student'],
          active_role: data.session.user.user_metadata?.role || 'student',
          created_at: new Date().toISOString(),
        };

        set({ user: finalUser, isAuthenticated: true });

        // Register push token in the background (non-blocking)
        const userId = data.session.user.id;
        notificationsService.requestPermission().then(granted => {
          if (granted) notificationsService.registerPushToken(userId);
        }).catch(e => console.error('Push registration skipped:', e));
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const res = await googleAuthService.signInWithGoogle();
      if (res.session) {
        set({ session: res.session });
        await get().loadProfile();
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
          } as unknown as User,
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
      // Profile missing - try to create from metadata
      const metadata = session.user.user_metadata;
      if (metadata) {
        try {
          const profile = await authService.createProfile(
            session.user.id,
            metadata.full_name || 'User',
            // Fall back to the auth user's phone (set for phone-auth signups)
            // before an empty string — '' collides on users.phone UNIQUE.
            metadata.phone || session.user.phone || '',
            metadata.role || 'student',
            session.user.email || '',
            {
              referral_code: metadata.referral_code,
              signup_source: metadata.signup_source,
              utm_source: metadata.utm_source,
              utm_medium: metadata.utm_medium,
              utm_campaign: metadata.utm_campaign,
              utm_content: metadata.utm_content,
              first_landing_url: metadata.first_landing_url,
            }
          );
          set({ user: profile, isAuthenticated: true });
        } catch {
          set({ isAuthenticated: false });
        }
      } else {
        set({ isAuthenticated: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    set({ isLoading: true });
    try {
      await authService.updateProfile(user.id, updates);
      let freshUser = user;
      try {
        freshUser = await authService.getProfile(user.id);
      } catch (e) {
        freshUser = { ...user, ...updates };
      }
      set({ user: freshUser });
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

  deleteAccount: async () => {
    await authService.deleteAccount();
    set({ user: null, session: null, isAuthenticated: false, pendingSignup: null });
  },
}));
