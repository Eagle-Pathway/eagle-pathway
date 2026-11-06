'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  ArrowRight,
  RotateCw,
  FileText,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function MagicDraftPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [scholarshipName, setScholarshipName] = useState('Turkiye Burslari / Stipendium Hungaricum');
  const [country, setCountry] = useState('Turkey / Hungary / Europe');
  const [degreeLevel, setDegreeLevel] = useState('Undergraduate (Bachelor)');
  const [fieldOfStudy, setFieldOfStudy] = useState('Computer Science & Software Engineering');
  const [keyAccomplishments, setKeyAccomplishments] = useState(
    'Top 5% in high school national exams, volunteer tutor in local community, built small coding project'
  );

  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/magic-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scholarshipName,
          country,
          degreeLevel,
          fieldOfStudy,
          keyAccomplishments,
          studentProfile: {
            full_name: user?.full_name,
            email: user?.email,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate draft');
      const data = await res.json();
      setDraft(data.draft || '');
    } catch (err) {
      console.error(err);
      alert('Could not generate magic draft. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInReviewer = () => {
    localStorage.setItem('eagle_sop_draft', draft);
    router.push('/tools/sop');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Wand2 size={14} className="text-brand-gold" />
            <span>AI Draft Generator</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Eagle AI Magic Draft
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Transform your academic background and aspirations into a bespoke, committee-grade Statement of Purpose draft in seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Input Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-brand-blue" />
            <span>Application Parameters</span>
          </h2>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Target Scholarship Name *
              </label>
              <input
                type="text"
                value={scholarshipName}
                onChange={(e) => setScholarshipName(e.target.value)}
                placeholder="e.g. Turkiye Burslari, DAAD, Stipendium Hungaricum"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Destination Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Germany, UK"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Degree Level
                </label>
                <select
                  value={degreeLevel}
                  onChange={(e) => setDegreeLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="Undergraduate (Bachelor)">Undergraduate (Bachelor)</option>
                  <option value="Master's Degree (MSc/MA)">Master&apos;s Degree (MSc/MA)</option>
                  <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                  <option value="Short Course / Fellowship">Fellowship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Proposed Field of Study / Major *
              </label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g. Biomedical Engineering, Economics, Public Health"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Key Background Highlights &amp; Accomplishments
              </label>
              <textarea
                rows={4}
                value={keyAccomplishments}
                onChange={(e) => setKeyAccomplishments(e.target.value)}
                placeholder="Mention grades, extracurricular activities, personal adversity overcome, or community projects..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Drafting Essay...</span>
                </>
              ) : (
                <>
                  <Wand2 size={14} className="text-brand-gold" />
                  <span>Generate Magic Draft</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Generated Draft */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                <FileText size={15} className="text-brand-blue" />
                <span>Generated Statement of Purpose</span>
              </span>

              {draft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleOpenInReviewer}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-200/60 hover:bg-blue-100 transition-colors"
                  >
                    <span>Analyze in Reviewer</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {draft ? (
              <div className="text-xs md:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {draft}
              </div>
            ) : (
              <div className="py-20 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center mx-auto">
                  <Wand2 size={20} />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Your Draft Will Appear Here</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Fill in your scholarship parameters on the left and click &quot;Generate Magic Draft&quot;.
                </p>
              </div>
            )}
          </div>

          {draft && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Eagle AI Admissions Generator</span>
              <span>Always review and personalize your final submission.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
