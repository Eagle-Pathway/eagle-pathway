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
  signInWithGoogle: (role?: UserRole) => Promise<void>;
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
        // Sync Google avatar if profile has none
        const { session } = get();
        const googleAvatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture;
        if (googleAvatar && !data.avatar_url) {
          try {
            await supabase.from('users').update({ avatar_url: googleAvatar }).eq('id', userId);
          } catch {}
          data.avatar_url = googleAvatar;
        }
        set({ user: data as User, isAuthenticated: true });
        return;
      }

      // If user profile is missing in public.users, initialize from session user metadata (Google OAuth sign-in)
      const currentSession = get().session || (await supabase.auth.getSession()).data.session;
      if (currentSession?.user) {
        const u = currentSession.user;
        const metadata = u.user_metadata || {};

        let storedRole: UserRole = 'student';
        if (typeof window !== 'undefined') {
          try {
            const r = localStorage.getItem('eagle_oauth_role') as UserRole;
            if (r) {
              storedRole = r;
              localStorage.removeItem('eagle_oauth_role');
            }
          } catch {}
        }

        const role: UserRole = (metadata.role as UserRole) || storedRole || 'student';
        const fullName = metadata.full_name || metadata.name || u.email?.split('@')[0] || 'Eagle User';
        const avatarUrl = metadata.avatar_url || metadata.picture || null;

        const newProfile = {
          id: userId,
          full_name: fullName,
          email: u.email || '',
          phone: metadata.phone || null,
          role,
          roles: [role],
          active_role: role,
          avatar_url: avatarUrl,
          signup_source: 'google_oauth',
        };

        const { data: created, error: createError } = await supabase
          .from('users')
          .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: true })
          .select()
          .maybeSingle();

        if (!createError && created) {
          // Record in user_roles as well
          try {
            await supabase.from('user_roles').upsert(
              { user_id: userId, role },
              { onConflict: 'user_id,role', ignoreDuplicates: true }
            );
          } catch {}

          set({ user: created as User, isAuthenticated: true });
        } else {
          set({ user: newProfile as unknown as User, isAuthenticated: true });
        }
      }
    } catch (e) {
      console.warn('Load profile error:', e);
    }
  },

  signInWithGoogle: async (role?: UserRole) => {
    set({ isLoading: true });
    try {
      if (typeof window !== 'undefined' && role) {
        try {
          localStorage.setItem('eagle_oauth_role', role);
        } catch {}
      }
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : undefined;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
      if (data?.url && typeof window !== 'undefined') {
        window.location.href = data.url;
      }
    } finally {
      set({ isLoading: false });
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

