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
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

interface QuestionFeedback {
  score: number;
  strengths: string;
  improvements: string;
  sampleAnswer: string;
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

  const handleStartInterview = async () => {
    setLoadingQuestions(true);
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
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate response. Please try again.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentAnswer(answersHistory[nextIdx] || '');
    } else {
      setPhase('done');
    }
  };

  const currentFeedback = feedbackHistory[currentIndex];
  const totalScores = Object.values(feedbackHistory).map((f) => f.score);
  const averageScore = totalScores.length > 0 ? (totalScores.reduce((a, b) => a + b, 0) / totalScores.length).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue mb-1">
            <Award size={14} className="text-brand-gold" />
            <span>AI Simulation Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Scholarship Mock Interview Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate realistic admissions committee interviews with instant real-time AI scoring and exemplar answers.
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
              Admissions Interview Simulator
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We generate 5 targeted questions calibrated to your target scholarship, testing your academic drive, leadership, adversity management, and future vision.
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
              placeholder="e.g. Turkiye Burslari, DAAD Germany, Fulbright, Oxford Rhodes"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 font-medium"
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
                <span>Generating Customized Questions...</span>
              </>
            ) : (
              <>
                <span>Start Mock Interview</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      )}

      {phase === 'interview' && (
        <div className="space-y-5">
          {/* Progress Bar */}
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
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 md:p-6 shadow-xs space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle size={16} />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Committee Interviewer
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                  {questions[currentIndex]}
                </h3>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Your Spoken or Written Response:
              </label>
              <textarea
                rows={5}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Formulate your response using the STAR framework (Situation, Task, Action, Result)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
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
                    <span>Grading Answer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-brand-gold" />
                    <span>{currentFeedback ? 'Re-Evaluate Answer' : 'Submit for AI Feedback'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Card */}
          {currentFeedback && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-brand-gold" />
                  <span>Answer Assessment</span>
                </h4>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200/60 font-semibold text-xs">
                  <span>Score:</span>
                  <span className="font-bold">{currentFeedback.score} / 10</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-semibold text-emerald-700 block mb-0.5 text-[11px] uppercase tracking-wider">Strengths:</span>
                  <p className="text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 leading-relaxed">
                    {currentFeedback.strengths}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-amber-700 block mb-0.5 text-[11px] uppercase tracking-wider">Ways to Improve:</span>
                  <p className="text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 leading-relaxed">
                    {currentFeedback.improvements}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-brand-blue block mb-0.5 text-[11px] uppercase tracking-wider">Exemplary Model Answer:</span>
                  <p className="text-slate-700 bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 italic leading-relaxed">
                    &quot;{currentFeedback.sampleAnswer}&quot;
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Final Summary'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs text-center max-w-xl mx-auto space-y-5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Mock Interview Completed!
            </h2>
            <p className="text-xs text-slate-500">
              You answered all 5 scholarship interview questions for {scholarshipName}.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 max-w-sm mx-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Overall Preparedness Score
            </span>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">
              {averageScore} <span className="text-xs font-normal text-slate-400">/ 10</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              Ready for real university interviews!
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              onClick={() => setPhase('intro')}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              Practice Another Scholarship
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue/90 shadow-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
