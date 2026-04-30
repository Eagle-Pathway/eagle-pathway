import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `
You are the Eagle Pathway AI Assistant. Your role is to help users understand and navigate the Eagle Pathway platform.
The platform consists of a Web Landing page, an Admin Dashboard, and a Mobile App.
Key features include:
1. Scholarship Tracking: A Kanban board (To Do, In Progress, Submitted, Won, Lost) to track scholarship applications.
2. Tutoring Pipeline: A system to schedule and track tutoring sessions.
3. Mentorship: Connecting students with mentors for guidance.

Be helpful, concise, and friendly. Provide clear instructions or explanations about these features when asked.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Groq API Error Details:', errorData);
      throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    // Proxy the stream directly to the client
    return new Response(response.body, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error: any) {
    console.error('Error in AI Assistant API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect to AI Assistant.' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
