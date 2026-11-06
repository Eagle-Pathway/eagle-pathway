'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Tutor } from '@eagle-pathway/shared';
import {
  Users,
  Search,
  Star,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Globe,
  Home,
} from 'lucide-react';

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');

  useEffect(() => {
    async function fetchTutors() {
      try {
        const { data, error } = await supabase
          .from('tutors')
          .select('*, user:users(*)')
          .eq('is_verified', true)
          .order('rating', { ascending: false });

        if (error) throw error;
        setTutors((data as any) || []);
      } catch (err) {
        console.warn('Fetch tutors error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTutors();
  }, []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    tutors.forEach((t) => {
      (t.subjects || []).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [tutors]);

  const filtered = useMemo(() => {
    return tutors.filter((t) => {
      const name = t.user?.full_name?.toLowerCase() || '';
      const bio = t.bio?.toLowerCase() || '';
      const matchesSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        bio.includes(searchQuery.toLowerCase()) ||
        (t.subjects || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject =
        selectedSubject === 'all' ||
        (t.subjects || []).some((s) => s.toLowerCase() === selectedSubject.toLowerCase());

      const matchesMode =
        selectedMode === 'all' ||
        (selectedMode === 'online' && t.is_online) ||
        (selectedMode === 'in_person' && t.is_in_person);

      return matchesSearch && matchesSubject && matchesMode;
    });
  }, [tutors, searchQuery, selectedSubject, selectedMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            1-on-1 Expert Tutors Marketplace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Book certified educators for STEM subjects, SAT/IELTS prep, and university essay coaching.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <Star size={15} className="fill-amber-500 text-amber-500" />
          <span>{filtered.length} Verified Instructors</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tutor name, subject (e.g. SAT Math, Chemistry), or bio..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          >
            <option value="all">All Academic Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          >
            <option value="all">All Delivery Modes</option>
            <option value="online">Online Only (Google Meet / Zoom)</option>
            <option value="in_person">In-Person (Addis Ababa)</option>
          </select>
        </div>
      </div>

      {/* Tutors Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading verified tutors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <Users size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Tutors Match Your Criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your subject or delivery mode to see other top-rated instructors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-[#C9A84C]/40 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Tutor Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B2A5B] text-white flex items-center justify-center font-bold text-lg shadow-sm overflow-hidden flex-shrink-0">
                    {t.user?.avatar_url ? (
                      <img
                        src={t.user.avatar_url}
                        alt={t.user.full_name || 'Tutor'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (t.user?.full_name || 'Tutor').slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0B2A5B] truncate">
                        {t.user?.full_name || 'Verified Tutor'}
                      </h3>
                      <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{(t.rating || 4.9).toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{t.total_sessions || 15}+ sessions</span>
                    </div>
                  </div>
                </div>

                {/* Bio preview */}
                {t.bio && (
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {t.bio}
                  </p>
                )}

                {/* Subjects tags */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Subjects Taught
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(t.subjects || ['Math', 'Physics']).map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delivery Mode Pills */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  {t.is_online && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                      <Globe size={12} />
                      <span>Online</span>
                    </span>
                  )}
                  {t.is_in_person && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-semibold">
                      <Home size={12} />
                      <span>Addis Ababa</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Rate & Book Session Action */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-extrabold text-[#0B2A5B]">
                    {t.hourly_rate ? `${t.hourly_rate} ETB` : 'Flexible'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium"> / hr</span>
                </div>

                <Link
                  href={`/tutors/${t.id}`}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] hover:bg-[#1E4D9B] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <span>Book Session</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

