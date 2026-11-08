'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface InlineComment {
  quote: string;
  severity: 'strength' | 'suggestion' | 'critical';
  comment: string;
  suggested_revision?: string;
}

interface SopReport {
  score: number;
  feedback: string;
  strengths: string[];
  suggestions: string[];
  inline_comments: InlineComment[];
}

export default function SopReviewerPage() {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [scholarshipName, setScholarshipName] = useState('Turkiye Burslari / Stipendium Hungaricum');
  const [isReviewing, setIsReviewing] = useState(false);
  const [report, setReport] = useState<SopReport | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [sopNotice, setSopNotice] = useState<string | null>(null);
  const [targetApplicationId, setTargetApplicationId] = useState('');
  const [applications, setApplications] = useState<any[]>([]);

  // Word & Char counter
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

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

  const handleReviewSop = async () => {
    if (!content.trim() || wordCount < 50) {
      setSopNotice('Please enter at least 50 words to analyze your Statement of Purpose thoroughly.');
      setTimeout(() => setSopNotice(null), 5000);
      return;
    }

    setIsReviewing(true);
    setSopNotice(null);
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
            <span>AI Editorial Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Statement of Purpose (SOP) Reviewer
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Paste your personal statement or motivation letter for instant committee-grade feedback, scoring, and inline revisions.
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
                <span>Analyzing Essay...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-brand-gold" />
                <span>Review SOP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {sopNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>{sopNotice}</span>
          </div>
          <button
            onClick={() => setSopNotice(null)}
            className="text-amber-600 hover:text-amber-800 text-xs underline font-bold"
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
                  placeholder="e.g. DAAD Germany, Chevening, Fulbright"
                  className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
                    className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
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
                className="w-full p-4 bg-slate-50/40 border border-slate-200/90 rounded-xl text-xs md:text-sm text-slate-900 leading-relaxed font-serif focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-y"
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

        {/* Right Column: AI Scoring & Rubric */}
        <div className="lg:col-span-5 space-y-4">
          {report ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Score Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Admissions Rubric Score
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                      Committee Evaluation
                    </h3>
                  </div>

                  <div className="flex items-baseline gap-1 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs">
                    <span className="text-2xl font-black">{report.score}</span>
                    <span className="text-[10px] font-semibold text-white/80">/ 100</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50/70 p-3 rounded-lg border border-slate-100">
                  {report.feedback}
                </p>

                {/* Strengths */}
                {report.strengths && report.strengths.length > 0 && (
                  <div className="space-y-1.5 mb-3.5">
                    <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Key Strengths</span>
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

                {/* Improvement Areas */}
                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb size={13} />
                      <span>Areas to Elevate</span>
                    </h4>
                    <ul className="space-y-1">
                      {report.suggestions.map((sug, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Inline Comments */}
              {report.inline_comments && report.inline_comments.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Inline Committee Commentary
                  </h4>
                  <div className="space-y-2.5">
                    {report.inline_comments.map((comment, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 space-y-1 text-xs"
                      >
                        <blockquote className="italic text-slate-500 border-l-2 border-brand-blue pl-2 text-[11px]">
                          &quot;{comment.quote}&quot;
                        </blockquote>
                        <p className="text-slate-800 font-medium">{comment.comment}</p>
                        {comment.suggested_revision && (
                          <div className="bg-emerald-50 text-emerald-900 p-2 rounded text-[11px] border border-emerald-200/60 mt-1">
                            <span className="font-semibold">Suggestion: </span>
                            {comment.suggested_revision}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-center space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center mx-auto">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Ready to Review Your Essay
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste your draft into the editor and click &quot;Review SOP&quot;. Our AI evaluates your statement against successful scholarship templates, clarity of purpose, and structural criteria.
              </p>

              <div className="bg-slate-50/60 rounded-lg p-3 text-left space-y-1.5 text-xs text-slate-600 border border-slate-100">
                <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Evaluation Dimensions:</div>
                <div>✓ Academic hook &amp; intellectual motivation</div>
                <div>✓ Fit with host university / degree program</div>
                <div>✓ Concrete evidence &amp; overcoming hardships</div>
                <div>✓ Return impact for Ethiopia &amp; community</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
