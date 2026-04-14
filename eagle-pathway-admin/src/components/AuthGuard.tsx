'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setSession, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Verify admin role in database
        const { data: profile, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          setSession(session);
          setUser({ id: session.user.id, email: session.user.email, role: 'admin' });
        } else {
          // Log out if not an admin
          await supabase.auth.signOut();
          if (pathname !== '/login') router.push('/login');
        }
      } else {
        if (pathname !== '/login') router.push('/login');
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login');
      } else if (session) {
        // Double check role on state changes too
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role !== 'admin' && pathname !== '/login') {
          await supabase.auth.signOut();
          router.push('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setSession, setUser, setLoading, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-brand-blue border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
