'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      try {
        // 1. If code is in URL search params (PKCE flow), exchange it
        if (typeof window !== 'undefined' && window.location.search) {
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const error = urlParams.get('error_description') || urlParams.get('error');

          if (error) {
            throw new Error(error);
          }

          if (code) {
            try {
              const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              if (!exchangeError && data?.session?.user) {
                await useAuthStore.getState().loadProfile(data.session.user.id);
                if (isMounted) {
                  router.replace('/dashboard');
                }
                return;
              }
            } catch (exchangeErr) {
              console.warn('[AuthCallback] Code exchange warning:', exchangeErr);
            }
          }
        }

        // 2. Check if session already exists or was set
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          await useAuthStore.getState().loadProfile(session.user.id);
          if (isMounted) {
            router.replace('/dashboard');
          }
          return;
        }

        // 3. Listen for incoming auth state change if exchange is in flight
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (newSession?.user) {
            await useAuthStore.getState().loadProfile(newSession.user.id);
            if (isMounted) {
              authListener.subscription.unsubscribe();
              router.replace('/dashboard');
            }
          }
        });

        // 4. Timeout fallback
        setTimeout(() => {
          if (isMounted && !useAuthStore.getState().isAuthenticated) {
            setErrorMsg('Sign-in took longer than expected. Please try signing in again.');
          }
        }, 7000);

      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err?.message || 'Could not complete Google sign-in. Please try again.');
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 text-center space-y-4">
        {errorMsg ? (
          <>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sign-In Failed</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{errorMsg}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-bold transition-all shadow-xs"
              >
                Back to Sign In
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0B2A5B] flex items-center justify-center mx-auto">
              <Loader2 size={24} className="animate-spin text-[#0B2A5B]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Completing Sign-In</h2>
            <p className="text-xs text-slate-500">
              Verifying your Google credentials and preparing your Eagle Pathway portal...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
