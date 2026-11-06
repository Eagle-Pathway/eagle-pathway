import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const { messages, userRole = 'student' } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400 });
    }

    const systemPrompt = `You are Eagle AI, an expert academic counselor and admissions advisor for Eagle Pathway.
Eagle Pathway is an international education platform that connects African students (especially Ethiopian scholars) with:
1. Verified 1-on-1 expert tutors for STEM, English, SAT, IELTS, and National Exams.
2. Fully funded and partial global university scholarships (e.g., Stipendium Hungaricum, Turkiye Burslari, DAAD, Fulbright, Erasmus+, Japanese MEXT, Chinese CSC).
3. Professional admissions mentorship packages, statement of purpose (SOP) reviews, and embassy visa guidance.

Tone: Professional, encouraging, highly structured, clear, and actionable. Use bullet points and bold headers where appropriate.
Role Context: The current user is a ${userRole}. Tailor your advice specifically to their perspective.`;

    if (GROQ_API_KEY) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.6,
          max_tokens: 1024,
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content || 'I am here to assist your academic journey.';
        return NextResponse.json({ reply, content: reply });
      }
    }

    // Fallback response if Groq is not configured or rate-limited
    return NextResponse.json({
      reply:
        "Hello! I am Eagle AI. I can guide you through scholarship discovery, statement of purpose (SOP) structures, SAT/IELTS preparation tips, and connecting with verified 1-on-1 tutors. What would you like assistance with today?",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to process AI response' },
      { status: 500 }
    );
  }
}

