'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Award,
  ArrowRight,
  RotateCw,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Volume2,
  VolumeX,
  ShieldAlert,
  Scale,
  Compass,
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface QuestionFeedback {
  score: number;
  verdict?: 'Likely Award' | 'Competitive Contender' | 'Borderline / Needs Work' | 'Disqualification Risk';
  pillars?: {
    academicRigor: number;
    homeCountryImpact: number;
    leadershipEvidence: number;
    culturalAlignment: number;
  };
  redFlagWarning?: string | null;
  strengths: string;
  improvements: string;
  sampleAnswer: string;
  followUpQuestion?: string | null;
}

export default function MockInterviewPage() {
  const { user } = useAuthStore();
  const [scholarshipName, setScholarshipName] = useState('Turkiye Burslari / Stipendium Hungaricum');
  const [phase, setPhase] = useState<'intro' | 'interview' | 'done'>('intro');

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const [feedbackHistory, setFeedbackHistory] = useState<Record<number, QuestionFeedback>>({});
  const [answersHistory, setAnswersHistory] = useState<Record<number, string>>({});

  // Audio Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Follow-up defense state
  const [showFollowUpBox, setShowFollowUpBox] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  // Copy transcript state
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  const toggleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStartInterview = async () => {
    setLoadingQuestions(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_questions',
          scholarshipName,
          studentProfile: {
            full_name: user?.full_name,
            role: user?.role,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setFeedbackHistory({});
        setAnswersHistory({});
        setCurrentAnswer('');
        setPhase('interview');
      }
    } catch (err) {
      console.error(err);
      alert('Could not start mock interview. Please try again.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please type your response before submitting for evaluation.');
      return;
    }

    setLoadingFeedback(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_feedback',
          scholarshipName,
          question: questions[currentIndex],
          answer: currentAnswer,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate answer');
      const data: QuestionFeedback = await res.json();

      setFeedbackHistory((prev) => ({ ...prev, [currentIndex]: data }));
      setAnswersHistory((prev) => ({ ...prev, [currentIndex]: currentAnswer }));
      setShowFollowUpBox(false);
      setFollowUpAnswer('');
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate response. Please try again.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleDefendFollowUp = async () => {
    if (!followUpAnswer.trim()) return;
    setLoadingFollowUp(true);
    try {
      const combined = `${currentAnswer}\n\n[Committee Follow-Up Defense]: ${followUpAnswer.trim()}`;
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_feedback',
          scholarshipName,
          question: `${questions[currentIndex]} (Committee Follow-up Probe: ${currentFeedback?.followUpQuestion || ''})`,
          answer: combined,
        }),
      });

      if (!res.ok) throw new Error('Failed to evaluate follow up');
      const data: QuestionFeedback = await res.json();

      setFeedbackHistory((prev) => ({ ...prev, [currentIndex]: data }));
      setAnswersHistory((prev) => ({ ...prev, [currentIndex]: combined }));
      setCurrentAnswer(combined);
      setShowFollowUpBox(false);
      setFollowUpAnswer('');
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate committee follow-up response.');
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const handleNextQuestion = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentAnswer(answersHistory[nextIdx] || '');
      setShowFollowUpBox(false);
      setFollowUpAnswer('');
    } else {
      setPhase('done');
    }
  };

  const currentFeedback = feedbackHistory[currentIndex];
  const totalScores = Object.values(feedbackHistory).map((f) => f.score);
  const averageScore = totalScores.length > 0 ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(1) : '0';

  // Pillar calculations across all answered questions
  const answeredFeedbacks = Object.values(feedbackHistory);
  const avgAcademicRigor = answeredFeedbacks.length > 0
    ? (answeredFeedbacks.reduce((acc, f) => acc + (f.pillars?.academicRigor ?? f.score), 0) / answeredFeedbacks.length).toFixed(1)
    : '0';
  const avgHomeImpact = answeredFeedbacks.length > 0
    ? (answeredFeedbacks.reduce((acc, f) => acc + (f.pillars?.homeCountryImpact ?? f.score), 0) / answeredFeedbacks.length).toFixed(1)
    : '0';
  const avgLeadership = answeredFeedbacks.length > 0
    ? (answeredFeedbacks.reduce((acc, f) => acc + (f.pillars?.leadershipEvidence ?? f.score), 0) / answeredFeedbacks.length).toFixed(1)
    : '0';
  const avgCulturalFit = answeredFeedbacks.length > 0
    ? (answeredFeedbacks.reduce((acc, f) => acc + (f.pillars?.culturalAlignment ?? f.score), 0) / answeredFeedbacks.length).toFixed(1)
    : '0';

  const numericAverage = parseFloat(averageScore);
  const boardRecommendation =
    numericAverage >= 8.0
      ? {
          title: 'Unanimous Selection Board Endorsement',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          desc: 'Exceptional academic vision, structured evidence, and zero disqualifying red flags. Outstanding candidate for fully-funded award.',
        }
      : numericAverage >= 6.0
      ? {
          title: 'Competitive Interview Pool (Recommended with Reservations)',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          desc: 'Strong foundational intent. Strengthen specific research lab references and leadership metrics to guarantee full award.',
        }
      : {
          title: 'High Disqualification Risk (Remediation Required)',
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          desc: 'Lacks institutional depth, concrete return plan, or exhibited non-academic motivation. Immediate revision needed before real panel.',
        };

  const handleCopyTranscript = () => {
    const lines = [
      `============================================================`,
      `EAGLE PATHWAY - ADMISSIONS COMMITTEE MOCK EVALUATION REPORT`,
      `Target Scholarship: ${scholarshipName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Overall Board Score: ${averageScore} / 10`,
      `Board Recommendation: ${boardRecommendation.title}`,
      `------------------------------------------------------------`,
      `Pillar Breakdown:`,
      `- Academic Rigor: ${avgAcademicRigor} / 10`,
      `- Home-Country Impact: ${avgHomeImpact} / 10`,
      `- Leadership & Adversity: ${avgLeadership} / 10`,
      `- Cultural Fit & Alignment: ${avgCulturalFit} / 10`,
      `============================================================\n`,
    ];

    questions.forEach((q, idx) => {
      const fb = feedbackHistory[idx];
      lines.push(`[QUESTION ${idx + 1}] ${q}`);
      lines.push(`Candidate Response: ${answersHistory[idx] || 'N/A'}`);
      if (fb) {
        lines.push(`Score: ${fb.score}/10 (${fb.verdict || 'Assessed'})`);
        if (fb.redFlagWarning) lines.push(`⚠️ WARNING: ${fb.redFlagWarning}`);
        lines.push(`Strengths: ${fb.strengths}`);
        lines.push(`Ways to Improve: ${fb.improvements}`);
        lines.push(`Model Answer: "${fb.sampleAnswer}"`);
      }
      lines.push(`------------------------------------------------------------\n`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Award size={14} className="text-brand-gold" />
            <span>Autonomous Admissions Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Admissions Committee Mock Interview Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate high-stakes scholarship interviews with adaptive probing follow-ups, audio questions, and multi-pillar committee grading.
          </p>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs text-center max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare size={22} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Scholarship Board Simulation
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We generate 5 calibrated questions tailored to your scholarship, scoring your responses across 4 core committee dimensions: Academic Rigor, Home Impact, Leadership, and Cultural Fit.
            </p>
          </div>

          <div className="text-left space-y-1 max-w-md mx-auto">
            <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Select or Enter Target Scholarship
            </label>
            <input
              type="text"
              value={scholarshipName}
              onChange={(e) => setScholarshipName(e.target.value)}
              placeholder="e.g. Turkiye Burslari, DAAD Germany, Fulbright, Stipendium Hungaricum"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20 font-medium"
            />
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loadingQuestions || !scholarshipName.trim()}
            className="w-full max-w-md mx-auto py-2.5 px-5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loadingQuestions ? (
              <>
                <RotateCw size={14} className="animate-spin" />
                <span>Calibrating Committee Board...</span>
              </>
            ) : (
              <>
                <span>Enter Committee Room</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      )}

      {phase === 'interview' && (
        <div className="space-y-5">
          {/* Progress Bar & Header */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-blue text-white flex items-center justify-center text-[10px]">
                {currentIndex + 1}
              </span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>

            <div className="flex gap-1.5">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex
                      ? 'bg-brand-blue w-7'
                      : feedbackHistory[idx]
                      ? feedbackHistory[idx].score >= 7
                        ? 'bg-emerald-500'
                        : 'bg-amber-400'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Committee Interviewer &bull; {scholarshipName}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    {questions[currentIndex]}
                  </h3>
                </div>
              </div>

              {/* Audio Listen Button */}
              <button
                type="button"
                onClick={() => toggleSpeech(questions[currentIndex])}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors ${
                  isSpeaking
                    ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Audibly listen to interviewer question"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX size={14} />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={14} className="text-brand-blue" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Your Verbal or Written Response:
              </label>
              <textarea
                rows={5}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Formulate your response using the STAR framework (Situation, Task, Action, Result) with specific academic alignment..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </span>

              <button
                onClick={handleEvaluateAnswer}
                disabled={loadingFeedback || !currentAnswer.trim()}
                className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {loadingFeedback ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    <span>Evaluating Against Committee Rubric...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-brand-gold" />
                    <span>{currentFeedback ? 'Re-Evaluate Response' : 'Submit for Committee Scoring'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Committee Assessment Card */}
          {currentFeedback && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-4 animate-in fade-in">
              {/* Header with Verdict & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-brand-gold" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Committee Deliberation & Scoring
                  </h4>
                  {currentFeedback.verdict && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        currentFeedback.verdict === 'Likely Award'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : currentFeedback.verdict === 'Competitive Contender'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : currentFeedback.verdict === 'Borderline / Needs Work'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {currentFeedback.verdict}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 font-semibold text-xs text-slate-800">
                  <span>Overall Score:</span>
                  <span className="font-bold text-slate-900 text-sm">{currentFeedback.score} / 10</span>
                </div>
              </div>

              {/* Red Flag Alert */}
              {currentFeedback.redFlagWarning && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <ShieldAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Disqualification Risk Flagged by Board</span>
                    <p className="leading-relaxed text-[11px] text-rose-700">
                      {currentFeedback.redFlagWarning}
                    </p>
                  </div>
                </div>
              )}

              {/* 4-Pillar Scorecard Grid */}
              {currentFeedback.pillars && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Evaluation Matrix (4 Pillars)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>Academic Rigor</span>
                        <span className="text-blue-700 font-bold">{currentFeedback.pillars.academicRigor}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${currentFeedback.pillars.academicRigor * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>Home Impact</span>
                        <span className="text-emerald-700 font-bold">{currentFeedback.pillars.homeCountryImpact}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${currentFeedback.pillars.homeCountryImpact * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>Leadership</span>
                        <span className="text-purple-700 font-bold">{currentFeedback.pillars.leadershipEvidence}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all"
                          style={{ width: `${currentFeedback.pillars.leadershipEvidence * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>Cultural Fit</span>
                        <span className="text-amber-700 font-bold">{currentFeedback.pillars.culturalAlignment}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full transition-all"
                          style={{ width: `${currentFeedback.pillars.culturalAlignment * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-emerald-700 block mb-1 text-[11px] uppercase tracking-wider">
                    Observed Strengths:
                  </span>
                  <p className="text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 leading-relaxed">
                    {currentFeedback.strengths}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-amber-700 block mb-1 text-[11px] uppercase tracking-wider">
                    Strategic Improvements for Panel:
                  </span>
                  <p className="text-slate-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 leading-relaxed">
                    {currentFeedback.improvements}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-brand-blue block mb-1 text-[11px] uppercase tracking-wider">
                    Exemplary Model Answer:
                  </span>
                  <p className="text-slate-700 bg-blue-50/40 p-3 rounded-xl border border-blue-100 italic leading-relaxed">
                    &quot;{currentFeedback.sampleAnswer}&quot;
                  </p>
                </div>
              </div>

              {/* Adaptive Probing Follow-Up Question Card */}
              {currentFeedback.followUpQuestion && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                      <Compass size={15} className="text-indigo-600" />
                      <span>Adaptive Committee Follow-Up Probe</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSpeech(currentFeedback.followUpQuestion!)}
                      className="text-[11px] text-indigo-700 hover:text-indigo-900 flex items-center gap-1 font-medium"
                    >
                      <Volume2 size={13} />
                      <span>Listen to Probe</span>
                    </button>
                  </div>

                  <p className="text-xs text-indigo-950 font-medium italic bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                    &quot;{currentFeedback.followUpQuestion}&quot;
                  </p>

                  {!showFollowUpBox ? (
                    <button
                      onClick={() => setShowFollowUpBox(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
                    >
                      Answer Committee Follow-Up Probe
                    </button>
                  ) : (
                    <div className="space-y-2 pt-1 animate-in fade-in">
                      <textarea
                        rows={3}
                        value={followUpAnswer}
                        onChange={(e) => setFollowUpAnswer(e.target.value)}
                        placeholder="State your specific follow-up defense with concrete evidence..."
                        className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDefendFollowUp}
                          disabled={loadingFollowUp || !followUpAnswer.trim()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                        >
                          {loadingFollowUp ? <RotateCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          <span>Submit Follow-Up Defense</span>
                        </button>
                        <button
                          onClick={() => setShowFollowUpBox(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation to Next Question */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Committee Question' : 'View Final Board Summary'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 size={26} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Admissions Committee Deliberation Report
            </h2>
            <p className="text-xs text-slate-500">
              Completed interview simulation for <span className="font-semibold text-slate-800">{scholarshipName}</span>.
            </p>
          </div>

          {/* Board Recommendation Banner */}
          <div className={`p-4 rounded-xl border ${boardRecommendation.color} space-y-1`}>
            <div className="flex items-center gap-2">
              <Scale size={16} />
              <span className="font-bold text-xs uppercase tracking-wider">{boardRecommendation.title}</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {boardRecommendation.desc}
            </p>
          </div>

          {/* Score & Pillar Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="col-span-2 sm:col-span-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall</span>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                {averageScore}
                <span className="text-xs font-normal text-slate-400">/10</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Rigor</span>
              <div className="text-base font-bold text-blue-700 mt-1">{avgAcademicRigor}/10</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Impact</span>
              <div className="text-base font-bold text-emerald-700 mt-1">{avgHomeImpact}/10</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Leadership</span>
              <div className="text-base font-bold text-purple-700 mt-1">{avgLeadership}/10</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Fit</span>
              <div className="text-base font-bold text-amber-700 mt-1">{avgCulturalFit}/10</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleCopyTranscript}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              {copiedTranscript ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span className="text-emerald-600">Copied Deliberation Report!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Full Transcript & Advice</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPhase('intro')}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                Practice Another
              </button>
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-2xs text-center"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
