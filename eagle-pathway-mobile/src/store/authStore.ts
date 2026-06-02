import { create } from 'zustand';
import { User, UserRole } from '../types';
import { authService } from '../services/auth';
import { notificationsService } from '../services/notifications';
import { supabase } from '../services/supabase';

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
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  uploadAvatar: (fileUri: string, fileName: string) => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
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

  signUp: async (email, password, fullName, phone, role) => {
    set({ isLoading: true });
    try {
      const data = await authService.signUp(email, password, fullName, phone, role);
      if (data.session) {
        set({ session: data.session, user: data.user as any, isAuthenticated: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.signIn(email, password);
      if (data.session) {
        set({ session: data.session });
        
        let profile;
        try {
          profile = await authService.getProfile(data.session.user.id);
          set({ user: profile, isAuthenticated: true });
        } catch (e) {
          // Profile doesn't exist, create it from metadata
          const metadata = data.session.user.user_metadata;
          if (metadata) {
            profile = await authService.createProfile(
              data.session.user.id,
              metadata.full_name || 'User',
              // Fall back to the auth user's phone (set for phone-auth signups)
              // before an empty string — '' collides on users.phone UNIQUE.
              metadata.phone || data.session.user.phone || '',
              metadata.role || 'student',
              data.session.user.email || ''
            );
            set({ user: profile, isAuthenticated: true });
          } else {
            throw new Error('User profile could not be initialized.');
          }
        }

        // Register push token in the background (non-blocking)
        const userId = data.session.user.id;
        notificationsService.requestPermission().then(granted => {
          if (granted) notificationsService.registerPushToken(userId);
        }).catch(e => console.log('Push registration skipped:', e));
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
            session.user.email || ''
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

  switchPersona: async (role) => {
    const { user } = get();
    if (!user) return;
    
    const previousUser = { ...user };
    
    // Optimistically switch in UI
    const updatedRoles = Array.from(new Set([...user.roles, role]));
    set({ user: { ...user, active_role: role, roles: updatedRoles } });
    
    try {
      // 1. Update active_role in users table
      const { data, error } = await supabase
        .from('users')
        .update({ 
          active_role: role,
          roles: updatedRoles 
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;

      // 2. Add role to user_roles table (source of truth for triggers)
      // This ensures lazy profile creation (e.g. creating tutors row) via DB trigger
      await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: role,
        }, { onConflict: 'user_id,role' });

      if (data) set({ user: data as User });
      
    } catch (e) {
      console.error('Failed to persist persona switch:', e);
      // Revert UI if failed
      set({ user: previousUser });
    }
  },

  signOut: async () => {
    if (!BYPASS_PHONE_VERIFY) {
      await authService.signOut();
    }
    set({ user: null, session: null, isAuthenticated: false, pendingSignup: null });
  },
}));