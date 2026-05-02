import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type SopAction = 'review' | 'draft';

interface SopRequestBody {
  action: SopAction;
  content?: string;
  student?: Record<string, unknown>;
  scholarship?: Record<string, unknown>;
}

interface SopReview {
  score: number;
  feedback: string;
  suggestions: string[];
}

const SYSTEM_PROMPT = `You are Eagle Pathway's scholarship writing reviewer.
Evaluate statements of purpose for clarity, scholarship fit, evidence, specificity, and credibility.
Return only valid JSON. For reviews use: {"score": number, "feedback": string, "suggestions": string[]}.
For drafts use: {"draft": string}. Keep advice practical and student-centered.`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

async function requireAuthenticatedUser(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('Authentication required.');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase API configuration is missing.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid or expired session.');
  return data.user;
}

async function callModel(prompt: string) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider returned ${response.status}`);
  }

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
    await requireAuthenticatedUser(req);
    const body = (await req.json()) as SopRequestBody;

    if (body.action === 'review') {
      if (!body.content?.trim()) {
        return json({ error: 'SOP content is required.' }, { status: 400 });
      }

      const prompt = [
        'Review this SOP for an Eagle Pathway student.',
        `Scholarship context: ${JSON.stringify(body.scholarship || {})}`,
        `Student context: ${JSON.stringify(body.student || {})}`,
        `SOP: ${body.content}`,
      ].join('\n\n');

      const review = parseJson<SopReview>(await callModel(prompt));
      return json({
        score: Math.max(0, Math.min(100, Number(review.score) || 0)),
        feedback: review.feedback || 'Review completed.',
        suggestions: Array.isArray(review.suggestions) ? review.suggestions.slice(0, 6) : [],
      });
    }

    if (body.action === 'draft') {
      const prompt = [
        'Draft a polished 500-700 word statement of purpose.',
        'Use only the supplied student and scholarship context. Do not invent awards, grades, or work experience.',
        `Scholarship context: ${JSON.stringify(body.scholarship || {})}`,
        `Student context: ${JSON.stringify(body.student || {})}`,
      ].join('\n\n');

      const result = parseJson<{ draft: string }>(await callModel(prompt));
      return json({ draft: result.draft || '' });
    }

    return json({ error: 'Unsupported SOP action.' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'SOP AI request failed.';
    const status = message.includes('Authentication') || message.includes('session') ? 401 : 500;
    return json({ error: message }, { status });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
