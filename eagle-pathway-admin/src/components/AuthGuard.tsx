'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

// Admin-ness has a single source of truth: the is_admin() RPC, which checks the
// user_roles table — the same function RLS policies use. Reading
// users.role / users.roles / users.active_role directly is what let those three
// sources drift apart and lock admins out, so AuthGuard no longer does that.
async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) {
    console.error('is_admin check failed:', error);
    return false;
  }
  return data === true;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setSession, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    const promoteOrReject = async (session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) => {
      if (await isCurrentUserAdmin()) {
        setSession(session);
        setUser({ id: session.user.id, email: session.user.email, role: 'admin' });
      } else {
        await supabase.auth.signOut();
        if (pathname !== '/login') router.push('/login');
      }
    };

    const checkAuth = async () => {
      // Already verified this session as admin — skip the round-trip.
      if (user?.role === 'admin') {
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await promoteOrReject(session);
      } else if (pathname !== '/login') {
        router.push('/login');
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setSession(null);
        if (pathname !== '/login') router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Only re-verify when the identity actually changes.
        if (user?.id !== session.user.id) {
          await promoteOrReject(session);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setSession, setUser, setLoading, pathname, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
