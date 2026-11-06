'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg('Could not process password reset. Please verify your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B2A5B] hover:text-[#C9A84C] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to Login</span>
      </Link>

      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#0B2A5B] tracking-tight">
          Reset Password
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Enter your registered email address, and we will send you a secure link to reset your password.
        </p>
      </div>

      {success ? (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Check Your Inbox</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            We have sent password reset instructions to <span className="font-semibold">{email}</span>. Please click the link in that email to proceed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-xs font-medium">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-sm font-bold shadow-lg shadow-[#0B2A5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-[#C9A84C]" />
            ) : (
              <span>Send Reset Link</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

