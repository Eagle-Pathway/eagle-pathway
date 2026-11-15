'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Save,
  RotateCw,
  Lightbulb,
  Award,
  BookOpen,
  X,
  ShieldAlert,
  Scale,
  Wand2,
  Check,
} from 'lucide-react';

interface InlineComment {
  quote: string;
  severity: 'strength' | 'suggestion' | 'critical';
  comment: string;
  suggested_revision?: string;
}

interface ClicheItem {
  phrase: string;
  reason: string;
  recommended_fix: string;
}

interface SopReport {
  score: number;
  verdict?: 'Likely Interview / Finalist' | 'Competitive Pool (Borderline)' | 'Probable Board Rejection';
  rubrics?: {
    academicAlignment: number;
    narrativeOriginality: number;
    homeCountryImpact: number;
    structuralClarity: number;
  };
  feedback: string;
  committee_concerns?: string[];
  cliches_detected?: ClicheItem[];
  strengths: string[];
  suggestions: string[];
  inline_comments: InlineComment[];
}

function SopReviewerInner() {
  const searchParams = useSearchParams();
  const queryScholarship = searchParams.get('scholarshipName') || searchParams.get('name');
  const queryAppId = searchParams.get('appId');

  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [scholarshipName, setScholarshipName] = useState(
    queryScholarship || 'Turkiye Burslari / Stipendium Hungaricum'
  );
  const [isReviewing, setIsReviewing] = useState(false);
  const [report, setReport] = useState<SopReport | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [sopNotice, setSopNotice] = useState<string | null>(null);
  const [targetApplicationId, setTargetApplicationId] = useState(queryAppId || '');
  const [applications, setApplications] = useState<any[]>([]);
  const [appliedQuotes, setAppliedQuotes] = useState<Set<string>>(new Set());

  // Word & Char counter
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  useEffect(() => {
    if (queryScholarship) setScholarshipName(queryScholarship);
    if (queryAppId) setTargetApplicationId(queryAppId);
  }, [queryScholarship, queryAppId]);

  useEffect(() => {
    async function loadApps() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('applications')
        .select('id, scholarship:scholarships(name)')
        .eq('student_id', user.id);
      if (data) setApplications(data);
    }
    loadApps();

    const saved = localStorage.getItem('eagle_sop_draft');
    if (saved) setContent(saved);
  }, [user?.id]);

  const handleSaveDraft = () => {
    localStorage.setItem('eagle_sop_draft', content);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleApplyRevision = (quote: string, suggestedRevision?: string) => {
    if (!suggestedRevision) return;
    const cleanQuote = quote.replace(/\.\.\.$/, '').trim();
    if (content.includes(cleanQuote)) {
      const updated = content.replace(cleanQuote, suggestedRevision);
      setContent(updated);
      setAppliedQuotes((prev) => new Set(prev).add(quote));
      setSopNotice(`Applied committee revision to your draft!`);
      setTimeout(() => setSopNotice(null), 3000);
    } else {
      setSopNotice('Could not match exact original passage in draft (it may have been modified).');
      setTimeout(() => setSopNotice(null), 4000);
    }
  };

  const handleReviewSop = async () => {
    if (!content.trim() || wordCount < 50) {
      setSopNotice('Please enter at least 50 words to analyze your Statement of Purpose thoroughly.');
      setTimeout(() => setSopNotice(null), 5000);
      return;
    }

    setIsReviewing(true);
    setSopNotice(null);
    setAppliedQuotes(new Set());
    try {
      const res = await fetch('/api/sop-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopContent: content,
          scholarshipName,
          studentProfile: {
            full_name: user?.full_name,
            role: user?.role,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to review SOP');
      const data: SopReport = await res.json();
      setReport(data);

      if (targetApplicationId) {
        await supabase
          .from('applications')
          .update({ sop_content: content, sop_score: data.score })
          .eq('id', targetApplicationId);
      }
    } catch (err) {
      console.error(err);
      setSopNotice('Could not complete SOP review. Please check your network and try again.');
      setTimeout(() => setSopNotice(null), 5000);
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Sparkles size={14} className="text-brand-gold" />
            <span>Autonomous Admissions Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admissions Board SOP Red-Teamer &amp; Auditor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate an authentic university selection committee audit: projected decisions, cliche fatigue detection, and 1-click in-context revisions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Save size={14} />
            <span>{savedNotice ? 'Saved locally!' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handleReviewSop}
            disabled={isReviewing || wordCount < 50}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isReviewing ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                <span>Auditing Against Board Rubric...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-brand-gold" />
                <span>Red-Team SOP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {sopNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-brand-blue shrink-0" />
            <span>{sopNotice}</span>
          </div>
          <button
            onClick={() => setSopNotice(null)}
            className="text-blue-700 hover:text-blue-900 text-xs underline font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Scoring Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editor & Options */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Target Scholarship / Program
                </label>
                <input
                  type="text"
                  value={scholarshipName}
                  onChange={(e) => setScholarshipName(e.target.value)}
                  placeholder="e.g. DAAD Germany, Chevening, Fulbright, Turkiye Burslari"
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              {applications.length > 0 && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Link to Active Application
                  </label>
                  <select
                    value={targetApplicationId}
                    onChange={(e) => setTargetApplicationId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
                  >
                    <option value="">Do not link (Draft only)</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.scholarship?.name || 'Scholarship Application'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Essay Text Area */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or write your Statement of Purpose draft here (minimum 50 words)..."
                rows={16}
                className="w-full p-4 bg-slate-50/40 border border-slate-200/90 rounded-xl text-xs md:text-sm text-slate-900 leading-relaxed font-serif focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 transition-all resize-y"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <div className="flex items-center gap-3">
                  <span>
                    Words: <strong className="text-slate-700">{wordCount}</strong>
                  </span>
                  <span>
                    Characters: <strong className="text-slate-700">{charCount}</strong>
                  </span>
                </div>
                {wordCount < 50 && (
                  <span className="text-amber-600 font-medium">
                    (Need {50 - wordCount} more words to review)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Scoring & Committee Deliberation Panel */}
        <div className="lg:col-span-5 space-y-4">
          {report ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Score & Verdict Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Admissions Committee Verdict
                    </span>
                    <div className="mt-1">
                      {report.verdict && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            report.verdict === 'Likely Interview / Finalist'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : report.verdict === 'Competitive Pool (Borderline)'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <Scale size={12} />
                          <span>{report.verdict}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl shadow-xs">
                    <span className="text-2xl font-black">{report.score}</span>
                    <span className="text-[10px] font-semibold text-white/70">/ 100</span>
                  </div>
                </div>

                {/* 4 Rubric Breakdown Bars */}
                {report.rubrics && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dimensional Scoring Rubric
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-0.5">
                          <span>Academic &amp; Faculty Alignment</span>
                          <span className="font-bold text-blue-700">{report.rubrics.academicAlignment}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${report.rubrics.academicAlignment}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-0.5">
                          <span>Narrative Originality</span>
                          <span className="font-bold text-purple-700">{report.rubrics.narrativeOriginality}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${report.rubrics.narrativeOriginality}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-0.5">
                          <span>Home-Country Impact Plan</span>
                          <span className="font-bold text-emerald-700">{report.rubrics.homeCountryImpact}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${report.rubrics.homeCountryImpact}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-0.5">
                          <span>Structural Evidence &amp; Proof</span>
                          <span className="font-bold text-amber-700">{report.rubrics.structuralClarity}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-600 h-full rounded-full transition-all" style={{ width: `${report.rubrics.structuralClarity}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  {report.feedback}
                </p>

                {/* Committee Concerns / Skepticism Points */}
                {report.committee_concerns && report.committee_concerns.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                      <ShieldAlert size={14} className="text-amber-600" />
                      <span>Selection Committee Skepticism Points</span>
                    </div>
                    <ul className="space-y-1 text-xs text-amber-950">
                      {report.committee_concerns.map((concern, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Detected Cliches & Fatigue Alerts */}
                {report.cliches_detected && report.cliches_detected.length > 0 && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                      <AlertCircle size={14} className="text-rose-600" />
                      <span>Formulaic Cliches Detected ({report.cliches_detected.length})</span>
                    </div>
                    <div className="space-y-2">
                      {report.cliches_detected.map((cliche, idx) => (
                        <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-rose-100 text-xs space-y-1">
                          <span className="font-bold text-rose-800 line-through block">
                            &quot;{cliche.phrase}&quot;
                          </span>
                          <p className="text-[11px] text-slate-600 leading-tight">
                            <strong>Why it hurts:</strong> {cliche.reason}
                          </p>
                          <p className="text-[11px] text-emerald-800 bg-emerald-50/80 p-1.5 rounded border border-emerald-100">
                            <strong>Fix:</strong> {cliche.recommended_fix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {report.strengths && report.strengths.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Observed Strengths</span>
                    </h4>
                    <ul className="space-y-1">
                      {report.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Areas to Elevate */}
                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-brand-blue uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb size={13} />
                      <span>Board Strategic Recommendations</span>
                    </h4>
                    <ul className="space-y-1">
                      {report.suggestions.map((sug, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Inline Comments with 1-Click Apply Revision */}
              {report.inline_comments && report.inline_comments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                      Interactive Sentence Revisions
                    </h4>
                    <span className="text-[10px] text-slate-400">1-Click Drop-In</span>
                  </div>

                  <div className="space-y-3">
                    {report.inline_comments.map((comment, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-2 text-xs"
                      >
                        <blockquote className="italic text-slate-600 border-l-2 border-brand-blue pl-2 text-[11px]">
                          &quot;{comment.quote}&quot;
                        </blockquote>
                        <p className="text-slate-800 font-medium">{comment.comment}</p>
                        {comment.suggested_revision && (
                          <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-lg border border-emerald-200/70 space-y-2">
                            <div>
                              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                                Committee Model Rewrite:
                              </span>
                              <p className="text-xs leading-relaxed italic">
                                &quot;{comment.suggested_revision}&quot;
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleApplyRevision(comment.quote, comment.suggested_revision)}
                              disabled={appliedQuotes.has(comment.quote)}
                              className="px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              {appliedQuotes.has(comment.quote) ? (
                                <>
                                  <Check size={12} />
                                  <span>Applied to Draft</span>
                                </>
                              ) : (
                                <>
                                  <Wand2 size={12} />
                                  <span>Apply Revision to Draft</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 p-6 text-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles size={22} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Admissions Board Red-Teamer
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Paste your personal statement or motivation letter and click &quot;Red-Team SOP&quot;. The AI will simulate an authentic scholarship selection committee deliberation.
              </p>

              <div className="bg-slate-50/70 rounded-xl p-3.5 text-left space-y-2 text-xs text-slate-600 border border-slate-200/80">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">What the Board Audits:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-blue-600" />
                  <span>Academic &amp; Faculty Research Alignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-purple-600" />
                  <span>AI Cliche &amp; Formulaic Trope Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Home-Country Knowledge Transfer Strategy</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-600" />
                  <span>1-Click In-Context Sentence Transformer</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SopReviewerPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-500">
          Loading Admissions Board Red-Teamer...
        </div>
      }
    >
      <SopReviewerInner />
    </Suspense>
  );
}
