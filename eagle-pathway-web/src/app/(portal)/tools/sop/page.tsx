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
        .select('id, scholarship_name, scholarship:scholarships(name)')
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
      alert('Please enter at least 50 words to analyze your Statement of Purpose thoroughly.');
      return;
    }

    setIsReviewing(true);
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
      alert('Could not complete SOP review. Please try again.');
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
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

      {/* Inputs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Target Scholarship or University
          </label>
          <input
            type="text"
            value={scholarshipName}
            onChange={(e) => setScholarshipName(e.target.value)}
            placeholder="e.g. Turkiye Burslari, DAAD, Fulbright, Oxford Rhodes"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
            Attach to Tracker Application (Optional)
          </label>
          <select
            value={targetApplicationId}
            onChange={(e) => setTargetApplicationId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          >
            <option value="">-- No specific application attached --</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.scholarship?.name || app.scholarship_name || 'Application'} ({app.id.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor & Analysis Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Textarea Editor */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText size={15} className="text-brand-blue" />
              <span>Essay Text</span>
            </span>
            <div className="flex items-center gap-3 text-slate-400 font-medium text-[11px]">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or write your Statement of Purpose, Motivation Letter, or Personal Statement here (minimum 50 words)..."
            className="flex-1 w-full py-3 text-xs md:text-sm text-slate-800 leading-relaxed placeholder-slate-400 resize-none focus:outline-none"
          />
        </div>

        {/* Right: AI Score & Report */}
        <div className="lg:col-span-5 space-y-4">
          {report ? (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-brand-gold" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Evaluation Score</h3>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-brand-blue text-white font-bold text-base shadow-xs">
                    {report.score} <span className="text-[11px] font-normal text-white/80">/ 100</span>
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
