import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, UserRole } from '@eagle-pathway/shared';

interface AuthState {
  user: User | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  initAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, isAuthenticated: !!session });
      if (session?.user?.id) {
        await get().loadProfile(session.user.id);
      }
    } catch (e) {
      console.warn('Init auth failed:', e);
    } finally {
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, isAuthenticated: !!session });
      if (session?.user?.id) {
        await get().loadProfile(session.user.id);
      } else {
        set({ user: null, isAuthenticated: false });
      }
    });
  },

  loadProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        set({ user: data as User, isAuthenticated: true });
      }
    } catch (e) {
      console.warn('Load profile error:', e);
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      set({ session: data.session, isAuthenticated: true });
      if (data.user?.id) {
        await get().loadProfile(data.user.id);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string, fullName: string, phone: string, role: UserRole) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        set({ session: data.session, isAuthenticated: true });
        if (data.user?.id) {
          await get().loadProfile(data.user.id);
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      set({ user: null, session: null, isAuthenticated: false });
    }
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) {
      throw new Error('You must be signed in to update your profile.');
    }

    // Clean payload: strip undefined, null, and NaN
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined && v !== null && !Number.isNaN(v))
    );

    let dataToUpdate: Record<string, any> = { ...cleanUpdates };

    // Self-healing loop: strip unknown columns if PostgREST schema cache complains
    let lastError: any = null;
    for (let attempts = 0; attempts < 4 && Object.keys(dataToUpdate).length > 0; attempts++) {
      const { data, error } = await supabase
        .from('users')
        .update(dataToUpdate)
        .eq('id', user.id)
        .select()
        .maybeSingle();

      if (!error) {
        // Sync clean updates to Auth User metadata so data is never lost across sessions
        await supabase.auth.updateUser({ data: cleanUpdates }).catch(() => {});

        if (data) {
          set({ user: data as User });
        } else {
          set({ user: { ...user, ...cleanUpdates } });
        }
        return;
      }

      lastError = error;
      const errLower = (error.message || '').toLowerCase();
      if (errLower.includes('column') || errLower.includes('schema cache') || errLower.includes('pgrst204')) {
        const match = error.message.match(/column ['"]([^'"]+)['"]/i) || error.message.match(/['"]([^'"]+)['"] column/i);
        if (match && match[1] && match[1] in dataToUpdate) {
          delete dataToUpdate[match[1]];
          continue;
        }
      }
      break;
    }

    if (lastError) throw lastError;

    // Fallback: sync to auth metadata and update store
    await supabase.auth.updateUser({ data: cleanUpdates }).catch(() => {});
    set({ user: { ...user, ...cleanUpdates } });
  },
}));

