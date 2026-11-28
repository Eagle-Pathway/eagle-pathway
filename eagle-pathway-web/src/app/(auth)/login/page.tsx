'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
        setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setErrorMsg('Unable to connect. Please check your internet connection and try again.');
      } else {
        setErrorMsg('Could not sign you in. Please check your details or reset your password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
          Welcome Back
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Sign in to your Eagle Pathway student, tutor, or parent portal.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-xs font-medium leading-relaxed">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Continue with Google */}
      <div className="mb-6 space-y-4">
        <button
          type="button"
          onClick={async () => {
            if (isGoogleLoading || loading) return;
            setIsGoogleLoading(true);
            setErrorMsg(null);
            try {
              await signInWithGoogle();
            } catch (err: any) {
              const msg = err?.message || '';
              if (!/cancelled|closed/i.test(msg)) {
                setErrorMsg('Could not connect to Google. Please try again or sign in with email.');
              }
              setIsGoogleLoading(false);
            }
          }}
          disabled={isGoogleLoading || loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 size={18} className="animate-spin text-slate-500" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            OR SIGN IN WITH EMAIL
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#1E4D9B] hover:text-[#0B2A5B] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-sm font-bold shadow-lg shadow-[#0B2A5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-[#C9A84C]" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} className="text-[#C9A84C] group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link
            href="/register"
            className="font-bold text-[#0B2A5B] hover:text-[#C9A84C] transition-colors"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}

