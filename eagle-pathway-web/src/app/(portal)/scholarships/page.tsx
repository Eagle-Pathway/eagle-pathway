'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Scholarship } from '@eagle-pathway/shared';
import {
  GraduationCap,
  Search,
  Filter,
  MapPin,
  Calendar,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatDate, differenceInDays } from '@/lib/date';

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedFunding, setSelectedFunding] = useState('all');

  useEffect(() => {
    async function fetchScholarships() {
      try {
        const { data, error } = await supabase
          .from('scholarships')
          .select('*')
          .order('deadline', { ascending: true });

        if (error) throw error;
        setScholarships((data as any) || []);
      } catch (err) {
        console.warn('Fetch scholarships error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchScholarships();
  }, []);

  // Filter options extraction
  const countries = useMemo(() => {
    const set = new Set<string>();
    scholarships.forEach((s) => {
      if (s.country) set.add(s.country);
    });
    return Array.from(set).sort();
  }, [scholarships]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    scholarships.forEach((s) => {
      (s.degree_levels || []).forEach((lvl) => set.add(lvl));
    });
    return Array.from(set).sort();
  }, [scholarships]);

  const filtered = useMemo(() => {
    return scholarships.filter((s) => {
      const title = s.name || (s as any).title || '';
      const org = s.organization || (s as any).host_institution || '';
      const matchesSearch =
        !searchQuery.trim() ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry =
        selectedCountry === 'all' || s.country?.toLowerCase() === selectedCountry.toLowerCase();

      const matchesLevel =
        selectedLevel === 'all' ||
        (s.degree_levels || []).some((lvl) => lvl.toLowerCase() === selectedLevel.toLowerCase());

      const matchesFunding =
        selectedFunding === 'all' ||
        s.funding_type?.toLowerCase().includes(selectedFunding.toLowerCase());

      return matchesSearch && matchesCountry && matchesLevel && matchesFunding;
    });
  }, [scholarships, searchQuery, selectedCountry, selectedLevel, selectedFunding]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
            International Scholarships Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover verified scholarships, fellowships, and university financial aid awards worldwide.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <GraduationCap size={16} />
          <span>{filtered.length} Opportunities Available</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scholarship title, university, country, or major..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 focus:border-[#0B2A5B] transition-all"
            />
          </div>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Degree Level Selector */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          >
            <option value="all">All Degree Levels</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          {/* Funding Selector */}
          <select
            value={selectedFunding}
            onChange={(e) => setSelectedFunding(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          >
            <option value="all">All Funding Types</option>
            <option value="fully">Fully Funded</option>
            <option value="partial">Partial</option>
            <option value="tuition">Tuition Waiver</option>
          </select>
        </div>
      </div>

      {/* Grid of Scholarships */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0B2A5B]/20 border-t-[#0B2A5B] rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading scholarship opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <GraduationCap size={40} className="mx-auto text-slate-300" />
          <h3 className="text-base font-bold text-slate-800">No Scholarships Match Your Filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or selecting &quot;All Countries&quot; to see all available programs.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCountry('all');
              setSelectedLevel('all');
              setSelectedFunding('all');
            }}
            className="px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((s) => {
            const daysLeft = s.deadline ? differenceInDays(new Date(s.deadline), new Date()) : null;
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-[#0B2A5B]/30 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.funding_type || 'Fully Funded'}
                    </span>
                    {daysLeft !== null && (
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${daysLeft <= 7
                          ? 'text-red-600'
                          : daysLeft <= 14
                            ? 'text-amber-600'
                            : 'text-slate-500'
                          }`}
                      >
                        <Calendar size={13} />
                        <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Deadline soon'}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Host */}
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0B2A5B] transition-colors line-clamp-2">
                      {s.name || (s as any).title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5 font-medium">
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{s.organization || (s as any).host_institution || s.country || 'Global Host'}</span>
                    </div>
                  </div>

                  {/* Description preview */}
                  {s.description && (
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {s.description}
                    </p>
                  )}

                  {/* Criteria tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.degree_levels?.[0] && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium capitalize">
                        {s.degree_levels[0]}
                      </span>
                    )}
                    {s.country && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {s.country}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {s.deadline ? formatDate(new Date(s.deadline), 'MMM d, yyyy') : 'Rolling Deadline'}
                  </div>
                  <Link
                    href={`/scholarships/${s.id}`}
                    className="px-4 py-2 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
