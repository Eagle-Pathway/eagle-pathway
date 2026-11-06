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
    // Load student's applications for dropdown
    async function loadApps() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('applications')
        .select('id, scholarship_name, scholarship:scholarships(name)')
        .eq('student_id', user.id);
      if (data) setApplications(data);
    }
    loadApps();

    // Load locally saved draft if available
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

      // If tied to an application, save to DB
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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-[#C9A84C]" size={26} />
            <span>AI Statement of Purpose (SOP) Reviewer</span>
          </h1>
          <p className="text-xs text-slate-500">
            Paste your personal statement or motivation letter for instant committee-grade feedback, scoring, and inline revisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Save size={14} />
            <span>{savedNotice ? 'Saved locally!' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handleReviewSop}
            disabled={isReviewing || wordCount < 50}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm disabled:opacity-50"
          >
            {isReviewing ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                <span>Analyzing Essay...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Review SOP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inputs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Scholarship or University
          </label>
          <input
            type="text"
            value={scholarshipName}
            onChange={(e) => setScholarshipName(e.target.value)}
            placeholder="e.g. Turkiye Burslari, DAAD, Fulbright, Oxford Rhodes"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Attach to Tracker Application (Optional)
          </label>
          <select
            value={targetApplicationId}
            onChange={(e) => setTargetApplicationId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Textarea Editor */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <FileText size={15} className="text-[#0B2A5B]" />
              <span>Essay Text</span>
            </span>
            <div className="flex items-center gap-3 text-slate-400 font-medium">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste or write your Statement of Purpose, Motivation Letter, or Personal Statement here (minimum 50 words)..."
            className="flex-1 w-full py-4 text-xs md:text-sm text-slate-800 leading-relaxed placeholder-slate-400 resize-none focus:outline-none"
          />
        </div>

        {/* Right: AI Score & Report */}
        <div className="lg:col-span-5 space-y-4">
          {report ? (
            <div className="space-y-4">
              {/* Score Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Award size={20} className="text-[#C9A84C]" />
                    <h3 className="font-bold text-sm text-slate-900">Evaluation Score</h3>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white font-black text-lg">
                    {report.score} <span className="text-xs font-normal text-white/70">/ 100</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  {report.feedback}
                </p>

                {/* Strengths */}
                {report.strengths && report.strengths.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      <span>Key Strengths</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {report.strengths.map((str, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvement Areas */}
                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb size={13} />
                      <span>Areas to Elevate</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {report.suggestions.map((sug, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
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
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                    Inline Committee Commentary
                  </h4>
                  <div className="space-y-3">
                    {report.inline_comments.map((comment, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5 text-xs"
                      >
                        <blockquote className="italic text-slate-500 border-l-2 border-[#0B2A5B] pl-2">
                          &quot;{comment.quote}&quot;
                        </blockquote>
                        <p className="text-slate-800 font-medium">{comment.comment}</p>
                        {comment.suggested_revision && (
                          <div className="bg-emerald-50 text-emerald-900 p-2 rounded-lg text-[11px] border border-emerald-200">
                            <span className="font-bold">Suggestion: </span>
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
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C]/15 text-[#9A7B2C] flex items-center justify-center mx-auto">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Ready to Review Your Essay
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste your draft into the editor and click &quot;Review SOP&quot;. Our AI evaluates your statement against successful scholarship templates, clarity of purpose, and structural criteria.
              </p>

              <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-xs text-slate-600 border border-slate-100">
                <div className="font-bold text-slate-800">What We Score:</div>
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

