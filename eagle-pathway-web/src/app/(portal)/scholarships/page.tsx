'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Target,
  Compass,
  Check,
  RotateCw,
  X,
  Shield,
  Rocket,
  FileCheck,
} from 'lucide-react';
import { formatDate, differenceInDays, getDeadlineStatus } from '@/lib/date';
import { ScholarshipCardSkeleton } from '@/components/ui/Skeletons';

interface MatchItem {
  id: string;
  name: string;
  country: string;
  funding_type: string;
  matchScore: number;
  strategicRationale: string;
}

interface StrategyResult {
  strategicOverview: string;
  reach: MatchItem[];
  target: MatchItem[];
  safety: MatchItem[];
  actionPlan: string[];
}

function ScholarshipsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || searchParams.get('query') || '';

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedFunding, setSelectedFunding] = useState('all');

  // AI Strategist Matcher State
  const [showStrategistModal, setShowStrategistModal] = useState(false);
  const [gpa, setGpa] = useState('3.7');
  const [field, setField] = useState('Computer Science & Engineering');
  const [degreeLevel, setDegreeLevel] = useState("Master's");
  const [englishLevel, setEnglishLevel] = useState('Proficient / English Medium');
  const [researchGoals, setResearchGoals] = useState('Applying machine learning to improve regional agricultural and healthcare supply chains in Ethiopia.');
  const [isMatching, setIsMatching] = useState(false);
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [strategistError, setStrategistError] = useState<string | null>(null);

  // Keep search in sync with URL query param from TopBar
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

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
    const list = scholarships.filter((s) => {
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

    const isClosed = (s: Scholarship) => {
      if ((s as any).application_status === 'closed') return true;
      if (!s.deadline) return false;
      const status = getDeadlineStatus(s.deadline);
      return Boolean(status?.isPassed);
    };

    return list.sort((a, b) => {
      const aClosed = isClosed(a);
      const bClosed = isClosed(b);

      if (aClosed !== bClosed) {
        return aClosed ? 1 : -1; // Open scholarships first, closed scholarships below
      }

      const aTime = a.deadline ? new Date(a.deadline).getTime() : NaN;
      const bTime = b.deadline ? new Date(b.deadline).getTime() : NaN;

      if (!aClosed) {
        // Both open: soonest upcoming deadline first, rolling (no deadline) last
        if (!isNaN(aTime) && !isNaN(bTime)) return aTime - bTime;
        if (!isNaN(aTime)) return -1;
        if (!isNaN(bTime)) return 1;
        return (a.name || '').localeCompare(b.name || '');
      } else {
        // Both closed: most recently expired first
        if (!isNaN(aTime) && !isNaN(bTime)) return bTime - aTime;
        if (!isNaN(aTime)) return -1;
        if (!isNaN(bTime)) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [scholarships, searchQuery, selectedCountry, selectedLevel, selectedFunding]);

  const handleRunStrategyMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMatching(true);
    setStrategyResult(null);
    setStrategistError(null);
    try {
      const res = await fetch('/api/scholarships/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfile: {
            gpa,
            field,
            degreeLevel,
            englishLevel,
            researchGoals,
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to generate match');
      const data: StrategyResult = await res.json();
      setStrategyResult(data);
    } catch (err) {
      console.error(err);
      setStrategistError('Could not generate strategy match right now. Please check your inputs and try again.');
    } finally {
      setIsMatching(false);
    }
  };

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

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowStrategistModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Run AI Strategy Match</span>
          </button>

          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-blue-50 text-brand-blue text-[11px] font-semibold border border-blue-200/60">
            <GraduationCap size={14} />
            <span>{loading ? 'Finding opportunities...' : `${filtered.length} Opportunities`}</span>
          </div>
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* Country Selector */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ScholarshipCardSkeleton key={i} />
          ))}
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
            const deadlineStatus = s.deadline ? getDeadlineStatus(s.deadline) : null;
            const isClosedCard = (s as any).application_status === 'closed' || Boolean(deadlineStatus?.isPassed);
            return (
              <div
                key={s.id}
                className={`bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group ${
                  isClosedCard ? 'opacity-70 bg-slate-50/50' : ''
                }`}
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
                    {isClosedCard ? (
                      <span className="font-semibold text-rose-600">Closed</span>
                    ) : deadlineStatus ? (
                      <span className={`font-semibold ${
                        deadlineStatus.urgency === 'critical'
                          ? 'text-rose-600'
                          : deadlineStatus.urgency === 'soon'
                          ? 'text-amber-600'
                          : 'text-slate-600'
                      }`}>
                        {deadlineStatus.label}
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

      {/* Autonomous Admissions Strategist Modal */}
      {showStrategistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto my-6">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Autonomous Admissions Strategist</h3>
                  <p className="text-[11px] text-slate-500">
                    Match your academic profile into Reach, Target, and Safety tiers with an action plan.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowStrategistModal(false);
                  setStrategyResult(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!strategyResult ? (
                /* Profile Input Form */
                <form onSubmit={handleRunStrategyMatch} className="space-y-4">
                  {strategistError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                      {strategistError}
                    </div>
                  )}
                  <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-blue-900">
                    Confirm your academic metrics below to simulate admissions committee matching algorithms.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cumulative GPA / Academic Standing
                      </label>
                      <input
                        type="text"
                        value={gpa}
                        onChange={(e) => setGpa(e.target.value)}
                        placeholder="e.g. 3.7 / 4.0 or 88%"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Field of Study / Major
                      </label>
                      <input
                        type="text"
                        value={field}
                        onChange={(e) => setField(e.target.value)}
                        placeholder="e.g. Computer Science, Public Health, Economics"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 text-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Degree Level
                      </label>
                      <select
                        value={degreeLevel}
                        onChange={(e) => setDegreeLevel(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 text-slate-900"
                      >
                        <option value="Bachelor's">Bachelor&apos;s (Undergraduate)</option>
                        <option value="Master's">Master&apos;s (Graduate)</option>
                        <option value="PhD">PhD / Doctorate</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        English Language Proficiency
                      </label>
                      <select
                        value={englishLevel}
                        onChange={(e) => setEnglishLevel(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 text-slate-900"
                      >
                        <option value="Proficient / English Medium">English Medium Instruction / Waiver</option>
                        <option value="IELTS 7.0+ / TOEFL 100+">IELTS 7.0+ / TOEFL 100+</option>
                        <option value="IELTS 6.0 - 6.5 / Duolingo 110+">IELTS 6.0 - 6.5 / Duolingo 110+</option>
                        <option value="Will take test / Need Waiver">Need Waiver or Plan to Take Test</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proposed Research / Career Mission in Ethiopia (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={researchGoals}
                      onChange={(e) => setResearchGoals(e.target.value)}
                      placeholder="Brief 1-2 sentences on what problem you wish to solve with your degree..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 text-slate-900 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isMatching}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isMatching ? (
                        <>
                          <RotateCw size={14} className="animate-spin" />
                          <span>Generating Strategic Dossier...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-amber-300" />
                          <span>Generate Admissions Strategy Dossier</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Strategy Dossier Result */
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Strategic Overview Card */}
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                      <Compass size={14} className="text-indigo-600" />
                      <span>Executive Admissions Positioning</span>
                    </div>
                    <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                      {strategyResult.strategicOverview}
                    </p>
                  </div>

                  {/* Reach Tier */}
                  {strategyResult.reach && strategyResult.reach.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Rocket size={15} className="text-purple-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Reach Programs &bull; Prestige &amp; High Reward
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {strategyResult.reach.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200/70 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                                {item.matchScore}% Match
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex gap-2">
                              <span>📍 {item.country}</span>
                              <span>•</span>
                              <span>💰 {item.funding_type}</span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed italic bg-white/70 p-2 rounded-lg border border-purple-100">
                              {item.strategicRationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Target Tier */}
                  {strategyResult.target && strategyResult.target.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Target size={15} className="text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Target Programs &bull; High Probability Profile Fit
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {strategyResult.target.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200/70 space-y-1.5 text-xs flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-slate-900 line-clamp-1">{item.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] shrink-0">
                                  {item.matchScore}% Match
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex gap-2 mb-1.5">
                                <span>📍 {item.country}</span>
                                <span>•</span>
                                <span>💰 {item.funding_type}</span>
                              </div>
                              <p className="text-slate-700 text-[11px] leading-relaxed italic bg-white/70 p-2 rounded-lg border border-blue-100">
                                {item.strategicRationale}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Tier */}
                  {strategyResult.safety && strategyResult.safety.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Shield size={15} className="text-emerald-600" />
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Safety Programs &bull; Guaranteed High-Odds Funding
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        {strategyResult.safety.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/70 space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                {item.matchScore}% Match
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex gap-2">
                              <span>📍 {item.country}</span>
                              <span>•</span>
                              <span>💰 {item.funding_type}</span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed italic bg-white/70 p-2 rounded-lg border border-emerald-100">
                              {item.strategicRationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 30-Day Action Checklist */}
                  {strategyResult.actionPlan && strategyResult.actionPlan.length > 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                        <FileCheck size={15} className="text-emerald-600" />
                        <span>High-Priority Next 30-Day Admissions Checklist</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-700">
                        {strategyResult.actionPlan.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reset Button */}
                  <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                    <button
                      onClick={() => setStrategyResult(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                    >
                      ← Re-calibrate Academic Metrics
                    </button>

                    <button
                      onClick={() => {
                        setShowStrategistModal(false);
                        setStrategyResult(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                    >
                      Close Strategy Dossier
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScholarshipsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ScholarshipCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <ScholarshipsContent />
    </Suspense>
  );
}
