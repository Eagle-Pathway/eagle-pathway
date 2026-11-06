import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

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
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
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
        }
      }

      return NextResponse.json({
        questions: [
          `Why have you chosen to apply specifically for ${scholarshipName || 'this scholarship'} rather than other global opportunities?`,
          "Describe a time when you encountered a major academic or personal setback. How did you handle it?",
          "How does this specific academic curriculum connect directly to your proposed graduation project or future research?",
          "If awarded this scholarship, how specifically will you contribute to knowledge transfer in your home community?",
          "Studying in a foreign culture can be isolating. What personal strategies will you use to adapt and succeed?",
        ],
      });
    }

    if (action === 'get_feedback') {
      if (!question || !answer) {
        return NextResponse.json({ error: 'Question and answer are required.' }, { status: 400 });
      }

      const systemPrompt = `You are an elite scholarship interview coach.
Evaluate this student's answer to the interview question:
Question: "${question}"
Candidate Answer: "${answer}"
Target Scholarship: "${scholarshipName || 'Global Scholarship'}"

Respond strictly with a JSON object:
{
  "score": number (1-10),
  "strengths": "1-2 sentences of praise for what worked well",
  "improvements": "1-2 sentences on how to elevate the response (e.g. STAR method, concrete evidence)",
  "sampleAnswer": "A 2-3 sentence exemplary model answer showing how a winning scholar would answer this question concisely"
}`;

      if (GROQ_API_KEY) {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.3,
            max_tokens: 600,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
          return NextResponse.json(parsed);
        }
      }

      return NextResponse.json({
        score: Math.min(9, Math.max(6, Math.round(5 + answer.length / 80))),
        strengths: "You spoke authentically and addressed the central premise of the question directly.",
        improvements: "Structure your response using the STAR method (Situation, Task, Action, Result) to make your achievements verifiable.",
        sampleAnswer: "When faced with this challenge, I first prioritized the core bottleneck, coordinated with my teammates to distribute the workload, and successfully achieved our deliverable ahead of schedule with high accuracy.",
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be get_questions or get_feedback.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process interview request' }, { status: 500 });
  }
}

