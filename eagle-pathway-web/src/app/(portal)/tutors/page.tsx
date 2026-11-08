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
import { TutorCardSkeleton } from '@/components/ui/Skeletons';

function getTutorSubjects(tData: any): string[] {
  if (Array.isArray(tData?.subjects) && tData.subjects.length > 0) {
    return tData.subjects;
  }
  if (Array.isArray(tData?.user?.interested_subjects) && tData.user.interested_subjects.length > 0) {
    return tData.user.interested_subjects;
  }
  return ['Mathematics', 'Physics', 'English'];
}

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
      getTutorSubjects(t).forEach((s) => set.add(s));
    });
    return Array.from(set).sort();
  }, [tutors]);

  const filtered = useMemo(() => {
    return tutors.filter((t) => {
      const name = t.user?.full_name?.toLowerCase() || '';
      const bio = t.bio?.toLowerCase() || '';
      const tutorSubs = getTutorSubjects(t);

      const matchesSearch =
        !searchQuery.trim() ||
        name.includes(searchQuery.toLowerCase()) ||
        bio.includes(searchQuery.toLowerCase()) ||
        tutorSubs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSubject =
        selectedSubject === 'all' ||
        tutorSubs.some((s) => s.toLowerCase() === selectedSubject.toLowerCase());

      const isOnline = t.is_online !== false;
      const isInPerson = Boolean(t.is_in_person || (t as any).delivery_mode === 'in-person' || (t as any).delivery_mode === 'both');
      const matchesMode =
        selectedMode === 'all' ||
        (selectedMode === 'online' && isOnline) ||
        (selectedMode === 'in_person' && isInPerson);

      return matchesSearch && matchesSubject && matchesMode;
    });
  }, [tutors, searchQuery, selectedSubject, selectedMode]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Users size={14} />
            <span>Faculty Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            1-on-1 Expert Tutors Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Book certified educators for STEM subjects, SAT/IELTS prep, and university essay coaching.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/60 self-start sm:self-auto">
          <Star size={13} className="fill-amber-500 text-amber-500" />
          <span>{loading ? 'Finding verified faculty...' : `${filtered.length} Verified Instructors`}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tutor name, subject (e.g. SAT Math, Chemistry), or bio..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="all">All Delivery Modes</option>
            <option value="online">Online Only (Google Meet / Zoom)</option>
            <option value="in_person">In-Person (Addis Ababa)</option>
          </select>
        </div>
      </div>

      {/* Tutors Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TutorCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <Users size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Tutors Match Your Criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your subject or delivery mode to see other top-rated instructors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3.5">
                {/* Tutor Profile Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {t.user?.avatar_url ? (
                      <img
                        src={t.user.avatar_url}
                        alt={t.user.full_name || 'Tutor'}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      (t.user?.full_name || 'T').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-brand-blue transition-colors truncate">
                        {t.user?.full_name || 'Verified Tutor'}
                      </h3>
                      <CheckCircle2 size={14} className="text-brand-blue flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <div className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
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
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Subjects Taught
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getTutorSubjects(t).map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delivery Mode Pills */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  {t.is_online && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-brand-blue text-[10px] font-semibold border border-blue-200/60">
                      <Globe size={11} />
                      <span>Online</span>
                    </span>
                  )}
                  {t.is_in_person && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200/60">
                      <Home size={11} />
                      <span>Addis Ababa</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Rate & Book Session Action */}
              <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    {t.hourly_rate ? `${t.hourly_rate} ETB` : 'Flexible'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium"> / hr</span>
                </div>

                <Link
                  href={`/tutors/${t.id}`}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Book Session</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
