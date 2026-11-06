'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@eagle-pathway/shared';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  GraduationCap,
  BookOpen,
  HeartHandshake,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);

  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !phone || !password) {
      setErrorMsg('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, phone, role);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      if (msg.includes('already registered') || msg.includes('unique constraint') || msg.includes('user already exists')) {
        setErrorMsg('An account with this email address already exists. Please sign in instead.');
      } else {
        setErrorMsg('Could not complete registration. Please check your information and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    {
      id: 'student' as UserRole,
      title: 'Student',
      desc: 'Scholarships & tutoring',
      icon: GraduationCap,
    },
    {
      id: 'tutor' as UserRole,
      title: 'Tutor',
      desc: 'Teach & earn',
      icon: BookOpen,
    },
    {
      id: 'parent' as UserRole,
      title: 'Parent',
      desc: 'Track student progress',
      icon: HeartHandshake,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
          Create Account
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Join Eagle Pathway to explore scholarships, connect with tutors, and track your admissions.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-red-700 text-xs font-medium leading-relaxed">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
          I want to register as:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {roleCards.map((r) => {
            const isSelected = role === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-3 rounded-2xl border text-center transition-all ${isSelected
                  ? 'border-[#0B2A5B] bg-[#0B2A5B]/5 ring-2 ring-[#0B2A5B]/20 text-[#0B2A5B]'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
              >
                <Icon
                  size={20}
                  className={`mx-auto mb-1.5 ${isSelected ? 'text-[#0B2A5B]' : 'text-slate-400'}`}
                />
                <p className="text-xs font-bold">{r.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Abebe Kebede"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 234 5678"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password (min 6 characters)
          </label>
          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-sm font-bold shadow-lg shadow-[#0B2A5B]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-[#C9A84C]" />
          ) : (
            <>
              <span>Complete Registration</span>
              <ArrowRight size={16} className="text-[#C9A84C] group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link
            href="/login"
            className="font-bold text-[#0B2A5B] hover:text-[#C9A84C] transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

