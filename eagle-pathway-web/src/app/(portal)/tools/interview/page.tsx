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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="text-[#C9A84C]" size={26} />
            <span>AI Scholarship Mock Interview</span>
          </h1>
          <p className="text-xs text-slate-500">
            Simulate realistic admissions committee interviews with instant real-time AI scoring and exemplar answers.
          </p>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0B2A5B]/10 text-[#0B2A5B] flex items-center justify-center mx-auto">
            <MessageSquare size={32} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Admissions Interview Simulator
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              We generate 5 targeted questions calibrated to your target scholarship, testing your academic drive, leadership, adversity management, and future vision.
            </p>
          </div>

          <div className="text-left space-y-1.5 max-w-md mx-auto">
            <label className="text-xs font-semibold text-slate-700">
              Select or Enter Target Scholarship
            </label>
            <input
              type="text"
              value={scholarshipName}
              onChange={(e) => setScholarshipName(e.target.value)}
              placeholder="e.g. Turkiye Burslari, DAAD Germany, Fulbright, Oxford Rhodes"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20 font-medium"
            />
          </div>

          <button
            onClick={handleStartInterview}
            disabled={loadingQuestions || !scholarshipName.trim()}
            className="w-full max-w-md mx-auto py-3 px-6 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loadingQuestions ? (
              <>
                <RotateCw size={15} className="animate-spin" />
                <span>Generating Customized Questions...</span>
              </>
            ) : (
              <>
                <span>Start Mock Interview</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      )}

      {phase === 'interview' && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0B2A5B] text-white flex items-center justify-center text-[11px]">
                {currentIndex + 1}
              </span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>

            <div className="flex gap-1.5">
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-2 rounded-full transition-all ${idx === currentIndex
                    ? 'bg-[#0B2A5B] w-8'
                    : feedbackHistory[idx]
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#C9A84C]/15 text-[#9A7B2C] flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Committee Interviewer
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                  {questions[currentIndex]}
                </h3>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Spoken or Written Response:
              </label>
              <textarea
                rows={5}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Formulate your response using the STAR framework (Situation, Task, Action, Result)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B2A5B]/20"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
              </span>

              <button
                onClick={handleEvaluateAnswer}
                disabled={loadingFeedback || !currentAnswer.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingFeedback ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    <span>Grading Answer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>{currentFeedback ? 'Re-Evaluate Answer' : 'Submit for AI Feedback'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Card */}
          {currentFeedback && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award size={16} className="text-[#C9A84C]" />
                  <span>Answer Assessment</span>
                </h4>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                  <span>Score:</span>
                  <span className="text-[#0B2A5B] font-black">{currentFeedback.score} / 10</span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-emerald-700 block mb-0.5">Strengths:</span>
                  <p className="text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    {currentFeedback.strengths}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-amber-700 block mb-0.5">Ways to Improve:</span>
                  <p className="text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                    {currentFeedback.improvements}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[#0B2A5B] block mb-0.5">Exemplary Model Answer:</span>
                  <p className="text-slate-700 bg-blue-50/40 p-3 rounded-xl border border-blue-100 italic leading-relaxed">
                    &quot;{currentFeedback.sampleAnswer}&quot;
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2A5B] to-[#1E4D9B] text-white text-xs font-bold hover:brightness-110 flex items-center gap-2"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Final Summary'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Mock Interview Completed!
            </h2>
            <p className="text-xs text-slate-500">
              You answered all 5 scholarship interview questions for {scholarshipName}.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 max-w-sm mx-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Overall Preparedness Score
            </span>
            <div className="text-4xl font-black text-[#0B2A5B]">
              {averageScore} <span className="text-sm font-semibold text-slate-400">/ 10</span>
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-2">
              Ready for real university interviews!
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setPhase('intro')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Practice Another Scholarship
            </button>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0B2A5B] text-white text-xs font-bold hover:bg-[#1E4D9B]"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

