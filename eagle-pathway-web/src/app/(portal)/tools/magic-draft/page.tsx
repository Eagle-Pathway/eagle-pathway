'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  ArrowRight,
  RotateCw,
  FileText,
  Download,
  BookOpen,
  Microscope,
  Mail,
  Send,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

type DocumentType = 'sop' | 'study_plan' | 'recommendation_brief' | 'professor_outreach';

const DOCUMENT_TYPES: { id: DocumentType; title: string; subtitle: string; icon: any }[] = [
  {
    id: 'sop',
    title: 'Statement of Purpose',
    subtitle: 'Bespoke motivation letter tailored to selection board criteria',
    icon: FileText,
  },
  {
    id: 'study_plan',
    title: 'Study Plan & Research Proposal',
    subtitle: 'Methodology, semester milestones, and home-country impact',
    icon: Microscope,
  },
  {
    id: 'recommendation_brief',
    title: 'Professor Recommendation Packet',
    subtitle: 'Request email, student cheat-sheet, and model letter for professors',
    icon: Mail,
  },
  {
    id: 'professor_outreach',
    title: 'Cold Academic Outreach Email',
    subtitle: 'Contact foreign lab professors to secure funded research supervision',
    icon: Send,
  },
];

function MagicDraftInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const qType = searchParams.get('type') as DocumentType | null;
  const qName = searchParams.get('scholarshipName') || searchParams.get('name');
  const qCountry = searchParams.get('country');
  const qDegree = searchParams.get('degree') || searchParams.get('degreeLevel');
  const qField = searchParams.get('field') || searchParams.get('fieldOfStudy');

  const [documentType, setDocumentType] = useState<DocumentType>(
    qType && ['sop', 'study_plan', 'recommendation_brief', 'professor_outreach'].includes(qType)
      ? qType
      : 'sop'
  );
  const [scholarshipName, setScholarshipName] = useState(
    qName || 'Turkiye Burslari / Stipendium Hungaricum'
  );
  const [country, setCountry] = useState(qCountry || 'Turkey / Hungary / Europe');
  const [degreeLevel, setDegreeLevel] = useState(qDegree || "Master's Degree (MSc/MA)");
  const [fieldOfStudy, setFieldOfStudy] = useState(qField || 'Computer Science & Software Engineering');

  useEffect(() => {
    if (qType && ['sop', 'study_plan', 'recommendation_brief', 'professor_outreach'].includes(qType)) {
      setDocumentType(qType);
    }
    if (qName) setScholarshipName(qName);
    if (qCountry) setCountry(qCountry);
    if (qDegree) setDegreeLevel(qDegree);
    if (qField) setFieldOfStudy(qField);
  }, [qType, qName, qCountry, qDegree, qField]);
  const [researchTopic, setResearchTopic] = useState('Distributed Machine Learning for Rural Healthcare Logistics');
  const [targetProfessorName, setTargetProfessorName] = useState('Prof. Dr. Michael Weber');
  const [keyAccomplishments, setKeyAccomplishments] = useState(
    'Top 5% in department, led undergraduate capstone project on localized telemedicine, volunteer STEM mentor in Addis Ababa'
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
          documentType,
          scholarshipName,
          country,
          degreeLevel,
          fieldOfStudy,
          researchTopic,
          targetProfessorName,
          keyAccomplishments,
          studentProfile: {
            full_name: user?.full_name || 'Ambitious Scholar',
            email: user?.email,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate document');
      const data = await res.json();
      setDraft(data.draft || '');
    } catch (err) {
      console.error(err);
      alert('Could not generate document. Please try again.');
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

  const handleDownload = () => {
    if (!draft) return;
    const blob = new Blob([draft], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentType}_${scholarshipName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInReviewer = () => {
    localStorage.setItem('eagle_sop_draft', draft);
    router.push('/tools/sop');
  };

  const wordCount = draft ? draft.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Wand2 size={14} className="text-brand-gold" />
            <span>Autonomous Admissions Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Multi-Document Application Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Synthesize committee-grade Statements of Purpose, research study plans, professor recommendation packets, and lab outreach emails in seconds.
          </p>
        </div>
      </div>

      {/* Document Type Selector Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {DOCUMENT_TYPES.map((type) => {
          const IconComponent = type.icon;
          const isSelected = documentType === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setDocumentType(type.id);
                setDraft('');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 border-brand-blue shadow-xs ring-1 ring-brand-blue/20'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <IconComponent size={16} />
              </div>
              <div>
                <span
                  className={`text-xs font-bold block leading-snug ${
                    isSelected ? 'text-brand-blue' : 'text-slate-900'
                  }`}
                >
                  {type.title}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5 line-clamp-2">
                  {type.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Dynamic Input Form */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-brand-gold" />
              <span>Document Parameters</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded-md">
              {DOCUMENT_TYPES.find((d) => d.id === documentType)?.title}
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Target Scholarship / Program *
              </label>
              <input
                type="text"
                value={scholarshipName}
                onChange={(e) => setScholarshipName(e.target.value)}
                placeholder="e.g. Turkiye Burslari, DAAD, Stipendium Hungaricum, CSC"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 font-medium"
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
                  placeholder="e.g. Germany, Turkey, Canada"
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
                  <option value="Undergraduate (Bachelor)">Bachelor&apos;s</option>
                  <option value="Master's Degree (MSc/MA)">Master&apos;s</option>
                  <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                  <option value="Postdoctoral / Fellowship">Fellowship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Field of Study / Major *
              </label>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="e.g. Computer Science, Public Health, Economics"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Dynamic Inputs based on document type */}
            {(documentType === 'study_plan' || documentType === 'professor_outreach') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Proposed Research Topic / Thesis Angle *
                </label>
                <input
                  type="text"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  placeholder="e.g. Scalable Solar Microgrid Architectures in Sub-Saharan Africa"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>
            )}

            {documentType === 'professor_outreach' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Target Professor Name &amp; Lab
                </label>
                <input
                  type="text"
                  value={targetProfessorName}
                  onChange={(e) => setTargetProfessorName(e.target.value)}
                  placeholder="e.g. Prof. Dr. Michael Weber, Power Systems Institute"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Key Background Highlights &amp; Achievements
              </label>
              <textarea
                rows={4}
                value={keyAccomplishments}
                onChange={(e) => setKeyAccomplishments(e.target.value)}
                placeholder="State your GPA standing, capstone projects, lab skills, leadership, or personal adversity overcome..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
            >
              {generating ? (
                <>
                  <RotateCw size={14} className="animate-spin" />
                  <span>Synthesizing Document...</span>
                </>
              ) : (
                <>
                  <Wand2 size={14} className="text-amber-300" />
                  <span>Generate {DOCUMENT_TYPES.find((d) => d.id === documentType)?.title}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Generated Document Studio Output */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                <FileText size={15} className="text-brand-blue" />
                <span>Generated Application Document</span>
                {draft && <span className="text-[10px] text-slate-400 font-mono">({wordCount} words)</span>}
              </span>

              {draft && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                    title="Download as Markdown file"
                  >
                    <Download size={12} />
                    <span>Export</span>
                  </button>

                  {documentType === 'sop' && (
                    <button
                      onClick={handleOpenInReviewer}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-brand-blue border border-blue-200/60 hover:bg-blue-100 transition-colors shadow-2xs"
                    >
                      <span>Audit in SOP Red-Teamer</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {draft ? (
              <div className="p-4 bg-slate-50/60 border border-slate-200/70 rounded-xl text-xs md:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-line max-h-[520px] overflow-y-auto">
                {draft}
              </div>
            ) : (
              <div className="py-24 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center mx-auto shadow-2xs">
                  <Wand2 size={22} />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Your Document Will Appear Here</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Select your document type above, fill in your background metrics on the left, and click &quot;Generate&quot;.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-100">✓ SOP &amp; Motivation Letters</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">✓ Study Plans &amp; Research</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">✓ Professor Recommendation Packets</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100">✓ Cold Outreach Emails</span>
                </div>
              </div>
            )}
          </div>

          {draft && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
              <span>Eagle AI Admissions Studio</span>
              <span>Always verify and personalize dates, course names, and personal references.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MagicDraftPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-500">
          Loading Multi-Document Application Studio...
        </div>
      }
    >
      <MagicDraftInner />
    </Suspense>
  );
}
