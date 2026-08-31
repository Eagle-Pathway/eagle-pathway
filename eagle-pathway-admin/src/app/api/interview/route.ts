import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '../sop-review/route';
import { enforceRateLimit, rateLimitHeaders } from '../../../lib/rateLimit';

// Mock interviews are interactive (several calls per session), so they get a
// moderate cap. Override via env.
const INTERVIEW_RATE_LIMIT = Number(process.env.AI_INTERVIEW_RATE_LIMIT ?? 20);
const RATE_WINDOW_SECONDS = Number(process.env.AI_RATE_WINDOW_SECONDS ?? 60);

type InterviewAction = 'questions' | 'feedback';

interface InterviewBody {
  action: InterviewAction;
  scholarship?: Record<string, unknown>;
  student?: Record<string, unknown>;
  count?: number;
  question?: string;
  answer?: string;
}

const SYSTEM_PROMPT = `You are Eagle Pathway's scholarship interview coach for African (often Ethiopian) students.
You prepare students for real scholarship interviews (e.g. Chevening, Mastercard Foundation, DAAD).
Be encouraging, specific, and realistic. Return ONLY valid JSON, no prose outside it.
For questions use: {"questions": string[]}.
For feedback use: {"score": number (0-100), "feedback": string, "tips": string[]}.`;

import { getCorsHeaders } from '../../../lib/cors';

function json(data: unknown, init?: ResponseInit, req?: Request) {
  const corsHeaders = getCorsHeaders(req);
  return NextResponse.json(data, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers || {}) },
  });
}

async function callModel(prompt: string): Promise<string | undefined> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not configured.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content as string | undefined;
}

function parseJson<T>(content: string | undefined): T {
  if (!content) throw new Error('AI provider returned an empty response.');
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI provider returned invalid JSON.');
  return JSON.parse(match[0]) as T;
}

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedUser(req);

    const rate = await enforceRateLimit(`interview:${user.id}`, INTERVIEW_RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.allowed) {
      return json(
        { error: 'Too many AI requests. Please wait a moment and try again.' },
        { status: 429, headers: rateLimitHeaders(rate) },
      );
    }

    const body = (await req.json()) as InterviewBody;

    if (body.action === 'questions') {
      const count = Math.max(3, Math.min(8, Number(body.count) || 5));
      const prompt = [
        `Generate ${count} mock interview questions for this scholarship.`,
        'Mix motivation, scholarship fit, leadership/impact, and one field-specific question.',
        'Keep each question a single clear sentence.',
        `Scholarship context: ${JSON.stringify(body.scholarship || {})}`,
        `Student context: ${JSON.stringify(body.student || {})}`,
      ].join('\n\n');

      const result = parseJson<{ questions: string[] }>(await callModel(prompt));
      const questions = Array.isArray(result.questions) ? result.questions.slice(0, count) : [];
      return json({ questions });
    }

    if (body.action === 'feedback') {
      if (!body.answer?.trim()) {
        return json({ error: 'An answer is required for feedback.' }, { status: 400 });
      }
      const prompt = [
        'Evaluate this scholarship interview answer. Be constructive and specific.',
        `Scholarship context: ${JSON.stringify(body.scholarship || {})}`,
        `Student context: ${JSON.stringify(body.student || {})}`,
        `Question: ${body.question || ''}`,
        `Answer: ${body.answer}`,
      ].join('\n\n');

      const fb = parseJson<{ score: number; feedback: string; tips: string[] }>(await callModel(prompt));
      return json({
        score: Math.max(0, Math.min(100, Number(fb.score) || 0)),
        feedback: fb.feedback || 'Answer reviewed.',
        tips: Array.isArray(fb.tips) ? fb.tips.slice(0, 5) : [],
      });
    }

    return json({ error: 'Unsupported interview action.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Interview AI request failed.';
    const status = message.includes('Authentication') || message.includes('session') ? 401 : 500;
    return json({ error: message }, { status });
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}
