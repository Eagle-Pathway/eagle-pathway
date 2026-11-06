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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <GraduationCap size={14} />
            <span>Opportunities Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            International Scholarships Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Discover verified scholarships, fellowships, and university financial aid awards worldwide.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-50 text-brand-blue text-[11px] font-semibold border border-blue-200/60 self-start sm:self-auto">
          <GraduationCap size={14} />
          <span>{filtered.length} Opportunities Available</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by scholarship title, university, country, or major..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
          <div className="w-8 h-8 border-3 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading scholarship opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200/80 p-8 space-y-3 shadow-xs">
          <GraduationCap size={36} className="mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">No Scholarships Match Your Filter</h3>
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
            className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors shadow-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const daysLeft = s.deadline ? differenceInDays(s.deadline) : null;
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {s.country || 'Global'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                      {s.funding_type || 'Full Funding'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-blue transition-colors line-clamp-2 leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{s.organization}</p>

                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                    {s.description || 'Verified international scholarship program open to eligible applicants.'}
                  </p>

                  {s.degree_levels && s.degree_levels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {s.degree_levels.map((lvl) => (
                        <span
                          key={lvl}
                          className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-50 border border-slate-100 text-slate-600 rounded"
                        >
                          {lvl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    {daysLeft !== null && daysLeft >= 0 ? (
                      <span className={`font-semibold ${daysLeft <= 14 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {daysLeft} days left
                      </span>
                    ) : (
                      <span>Rolling deadline</span>
                    )}
                  </div>

                  <Link
                    href={`/scholarships/${s.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 transition-colors shadow-xs"
                  >
                    <span>View Details</span>
                    <ArrowRight size={13} />
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
