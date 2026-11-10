import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function evaluateHeuristically(question: string, answer: string, scholarshipName: string) {
  const text = (answer || '').toLowerCase();
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const redFlags = [
    'girlfriend',
    'girl friend',
    'boyfriend',
    'dating',
    'lover',
    'marry',
    'party',
    'vacation',
    'holiday',
    'cheap',
    'dont have money',
    "don't have money",
    "don't know",
    'dont know',
    'dunno',
    'idk',
    'kinda',
    'wanna',
  ];
  const hasRedFlag = redFlags.some((w) => text.includes(w));
  const hasAcademicFocus = /\b(academic|degree|research|faculty|university|studies|career|impact|development|technology|engineering|science|health|community|scholarship)\b/i.test(answer);

  if (hasRedFlag || (!hasAcademicFocus && wordCount < 35)) {
    return {
      score: hasRedFlag ? 2 : 3,
      strengths: 'You expressed an informal personal thought, but this answer lacks academic intent.',
      improvements:
        'Scholarship selection committees strictly evaluate academic merit, leadership, and public impact. Citing personal relationships, travel desires, or casual reasons results in immediate disqualification. Reframe your answer around your field of study, research goals, and how this destination advances your long-term contribution to your community.',
      sampleAnswer: `I selected ${scholarshipName || 'this scholarship'} because its advanced academic curriculum and renowned research faculties in my discipline directly complement my undergraduate studies, allowing me to gain specialized knowledge that I plan to bring back to solve critical developmental challenges in my home country.`,
    };
  }

  const score = Math.min(8, Math.max(4, Math.round(4 + wordCount / 40)));
  return {
    score,
    strengths: 'You articulated a perspective on the question and provided initial context.',
    improvements:
      'Structure your response using the STAR method (Situation, Task, Action, Result). Anchor your reasoning in specific faculty research, course modules, or developmental goals in your home country.',
    sampleAnswer: `I chose ${scholarshipName || 'this scholarship'} because of its unique focus on high-impact practical research, which directly aligns with my goal of modernizing key infrastructure and mentoring young scholars in my home nation.`,
  };
}

export async function POST(req: Request) {
  try {
    const { action, scholarshipName, studentProfile, question, answer } = await req.json();

    if (action === 'get_questions') {
      const systemPrompt = `You are a senior scholarship interviewer for the scholarship "${scholarshipName || 'Global Academic Scholarship'}".
Generate 5 realistic, challenging, high-yield interview questions for an applicant with profile: ${JSON.stringify(studentProfile || {})}.
Questions should test:
1. Academic motivation & why this country/institution
2. Overcoming significant hardship or leadership experience
3. Specific research or field interest
4. Long-term career impact in their home country
5. Handling cultural shock and representing their nation abroad.

Respond strictly with a JSON object:
{
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}`;

      if (GROQ_API_KEY) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              response_format: { type: 'json_object' },
              messages: [{ role: 'system', content: systemPrompt }],
              temperature: 0.5,
              max_tokens: 600,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
            if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              return NextResponse.json({ questions: parsed.questions });
            }
          } else {
            console.error('Groq interview get_questions error:', groqRes.status, await groqRes.text());
          }
        } catch (apiErr) {
          console.error('Groq interview get_questions exception:', apiErr);
        }
      }

      return NextResponse.json({
        questions: [
          `Why have you chosen to apply specifically for ${scholarshipName || 'this scholarship'} rather than other global opportunities?`,
          'Describe a time when you encountered a major academic or personal setback. How did you handle it?',
          'How does this specific academic curriculum connect directly to your proposed graduation project or future research?',
          'If awarded this scholarship, how specifically will you contribute to knowledge transfer in your home community?',
          'Studying in a foreign culture can be isolating. What personal strategies will you use to adapt and succeed?',
        ],
      });
    }

    if (action === 'get_feedback') {
      if (!question || !answer) {
        return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 });
      }

      const systemPrompt = `You are the Selection Committee Chair and Senior Interview Evaluator for the scholarship "${scholarshipName || 'International Scholarship'}".
You are evaluating a candidate's verbal or written interview response with extreme academic rigor, just like an authentic scholarship board.

Question: "${question}"
Candidate Answer: "${answer}"
Target Scholarship: "${scholarshipName || 'International Scholarship'}"

Scoring Rubric (Strict 1-10 Scale):
- 1 to 2 / 10: Unacceptable, inappropriate, casual slang, purely personal or trivial motivations (e.g. romantic interests, meeting friends, vacation, wanting money without academic cause, refusing to address the prompt).
- 3 to 4 / 10: Very weak, superficial, lacks academic focus, or fails to answer the specific question asked.
- 5 to 6 / 10: Average or generic answer. Has some relevance but lacks concrete personal evidence, institutional depth, or leadership impact.
- 7 to 8 / 10: Strong candidate answer. Clear academic drive, relevant examples, good alignment with the scholarship.
- 9 to 10 / 10: Exceptional. Compelling narrative, verifiable impact, explicit academic vision, and flawless representation.

Rules:
1. If the candidate's answer is casual, romantic, frivolous, or non-academic, you MUST award a score of 1 or 2. Do NOT be polite or overly flattering.
2. "strengths": Be honest. If the answer was weak or off-topic, state clearly that no substantive academic strength was demonstrated.
3. "improvements": Provide direct, actionable critique explaining why an international scholarship panel would reject or accept this answer, and how to redirect it academically.
4. "sampleAnswer": Provide a 2-3 sentence, highly tailored model answer addressing THIS EXACT QUESTION for THIS SPECIFIC SCHOLARSHIP.

Respond strictly with valid JSON:
{
  "score": number,
  "strengths": "1-2 concise sentences",
  "improvements": "1-2 concise sentences",
  "sampleAnswer": "2-3 concise sentences"
}`;

      if (GROQ_API_KEY) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              response_format: { type: 'json_object' },
              messages: [{ role: 'system', content: systemPrompt }],
              temperature: 0.3,
              max_tokens: 600,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
            if (typeof parsed.score === 'number') {
              return NextResponse.json({
                score: Math.min(10, Math.max(1, Math.round(parsed.score))),
                strengths: parsed.strengths || 'Answer reviewed.',
                improvements: parsed.improvements || 'Focus on academic alignment.',
                sampleAnswer: parsed.sampleAnswer || 'Provide a structured, evidence-based answer.',
              });
            }
          } else {
            console.error('Groq interview get_feedback error:', groqRes.status, await groqRes.text());
          }
        } catch (apiErr) {
          console.error('Groq interview get_feedback exception:', apiErr);
        }
      }

      // Context-aware heuristic fallback if Groq API is temporarily unreachable
      return NextResponse.json(evaluateHeuristically(question, answer, scholarshipName || 'this scholarship'));
    }

    return NextResponse.json({ error: 'Invalid action. Must be get_questions or get_feedback.' }, { status: 400 });
  } catch (err: any) {
    console.error('Interview route exception:', err);
    return NextResponse.json({ error: 'Failed to process interview request' }, { status: 500 });
  }
}
