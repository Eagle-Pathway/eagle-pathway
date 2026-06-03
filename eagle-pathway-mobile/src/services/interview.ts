import { supabase } from './supabase';
import { Scholarship, User } from '../types';

const INTERVIEW_API_URL = process.env.EXPO_PUBLIC_EAGLE_INTERVIEW_API_URL;

export interface AnswerFeedback {
  score: number;
  feedback: string;
  tips: string[];
}

async function postInterviewAI<T>(body: Record<string, unknown>): Promise<T | null> {
  if (!INTERVIEW_API_URL) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch(INTERVIEW_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Interview AI request failed with ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Pure local fallback — used offline or before the AI URL is configured ─────

export function localInterviewQuestions(
  scholarship?: Partial<Scholarship> | null,
  student?: Partial<User> | null,
  count = 5,
): string[] {
  const org = scholarship?.organization || 'this scholarship';
  const field = student?.interested_subjects?.[0] || scholarship?.fields_of_study?.[0] || 'your field';
  const country = scholarship?.country || 'your destination country';
  const pool = [
    `Why are you a strong fit for ${org}?`,
    'Tell us about yourself and your academic journey so far.',
    `What are your career goals, and how does studying in ${country} advance them?`,
    'Describe a leadership experience and the impact you made.',
    `Why ${field}, and what problem do you most want to solve in it?`,
    'Tell us about a challenge you overcame and what you learned.',
    'How will you give back to your community after your studies?',
    'Why should we award this scholarship to you over other strong candidates?',
  ];
  return pool.slice(0, Math.max(3, Math.min(8, count)));
}

export function localAnswerFeedback(_question: string, answer: string): AnswerFeedback {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  const hasExample = /\b(for example|e\.g\.|once|when i|in 20\d\d|led|organ[is|iz]ed|founded|built|launched|volunteered)\b/i.test(answer);
  let score = 40;
  if (words >= 60) score += 25;
  else if (words >= 30) score += 12;
  if (hasExample) score += 20;
  if (/\b(i|my|we)\b/i.test(answer)) score += 5;
  score = Math.max(0, Math.min(100, score));

  const tips: string[] = [];
  if (words < 60) tips.push('Aim for 60–150 words — interviewers want depth, not one-liners.');
  if (!hasExample) tips.push('Anchor your answer in a specific example (STAR: Situation, Task, Action, Result).');
  tips.push('Tie your answer back to the scholarship’s mission and your future impact.');

  const feedback =
    score >= 75
      ? 'Strong, specific answer — keep this structure.'
      : score >= 55
      ? 'Decent answer. Add a concrete example and connect it to the scholarship.'
      : 'Too thin. Expand with a real example and a clear structure.';

  return { score, feedback, tips: tips.slice(0, 4) };
}

export const interviewService = {
  async getQuestions(scholarship?: Partial<Scholarship> | null, student?: Partial<User> | null, count = 5): Promise<string[]> {
    try {
      const remote = await postInterviewAI<{ questions: string[] }>({ action: 'questions', scholarship, student, count });
      if (remote?.questions?.length) return remote.questions;
    } catch {
      // fall through to local
    }
    return localInterviewQuestions(scholarship, student, count);
  },

  async getFeedback(params: {
    question: string;
    answer: string;
    scholarship?: Partial<Scholarship> | null;
    student?: Partial<User> | null;
  }): Promise<AnswerFeedback> {
    try {
      const remote = await postInterviewAI<AnswerFeedback>({ action: 'feedback', ...params });
      if (remote && typeof remote.score === 'number') return remote;
    } catch {
      // fall through to local
    }
    return localAnswerFeedback(params.question, params.answer);
  },
};
