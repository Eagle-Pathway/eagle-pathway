'use client';
import Image from 'next/image';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2 } from 'lucide-react';

interface AdminProfile {
  roles?: string[] | null;
  active_role?: string | null;
}

function hasAdminAccess(profile: AdminProfile | null) {
  return profile?.active_role === 'admin' || profile?.roles?.includes('admin');
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUser, setSession } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Verify admin role - check both RLS auth and legacy role column
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('roles, active_role, role')
          .eq('id', data.user.id)
          .single();

        // Check new multi-role format OR legacy single role
        const isAdmin = profile?.active_role === 'admin' || 
                       profile?.roles?.includes('admin') ||
                       profile?.role === 'admin';

        if (!profile || profileError || !isAdmin) {
          await supabase.auth.signOut();
          setError('Access denied. Admin privileges required. Please ensure your account has admin role.');
          setLoading(false);
          return;
        }

        setSession(data.session);
        setUser({ id: data.user.id, email: data.user.email, role: 'admin' });
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-blue rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-gold rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md p-8 sm:p-10 space-y-8 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 relative z-10 m-4">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Eagle Pathway"
            width={280}
            height={80}
            className="mx-auto h-20 w-auto mb-6 transform transition-transform hover:scale-105"
            priority
          />
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Portal</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">Eagle Pathway Management</p>
        </div>

        {error && (
          <div className="bg-red-50/80 border border-red-200 text-red-600 text-sm p-4 rounded-xl flex items-center">
             <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all sm:text-sm form-input"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white/50 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all sm:text-sm form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/20 text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-blue-800 hover:from-blue-800 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In securely'}
          </button>
        </form>
      </div>
    </div>
  );
}
