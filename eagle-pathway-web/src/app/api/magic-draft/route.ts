import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
  try {
    const { scholarshipName, country, degreeLevel, studentProfile, fieldOfStudy, keyAccomplishments } = await req.json();

    const systemPrompt = `You are a world-renowned academic admissions advisor for Eagle Pathway.
Draft a compelling, original, authentic 4-paragraph Statement of Purpose / Motivation Letter for a student applying to:
Scholarship: "${scholarshipName || 'International Excellence Scholarship'}"
Country: "${country || 'Global'}"
Degree Level: "${degreeLevel || 'Bachelor / Master'}"
Field of Study: "${fieldOfStudy || studentProfile?.target_major || 'Computer Science / Engineering / Health'}"
Key Accomplishments/Background: "${keyAccomplishments || 'High academic standing, community service, leadership'}"
Student Details: ${JSON.stringify(studentProfile || {})}

Rules:
1. Ground the essay in genuine intellectual curiosity, overcoming challenges, and future vision.
2. Avoid generic cliches ("Since childhood I have dreamed of...").
3. Connect the scholarship's unique mission to the student's personal commitment to driving progress in Ethiopia and Africa.
4. Output cleanly in formatted markdown paragraphs.`;

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
            { role: 'user', content: 'Please generate the Statement of Purpose draft now.' },
          ],
          temperature: 0.6,
          max_tokens: 1200,
        }),
      });

      if (groqRes.ok) {
        const data = await groqRes.json();
        const draft = data.choices?.[0]?.message?.content;
        if (draft) {
          return NextResponse.json({ draft });
        }
      }
    }

    return NextResponse.json({
      draft: `Dear Members of the Scholarship Selection Committee,

I am writing to express my enthusiastic application for the ${scholarshipName || 'Global Excellence Scholarship'}. Having cultivated a profound dedication to ${fieldOfStudy || 'my academic discipline'} during my formative studies in Ethiopia, this scholarship represents the definitive catalyst required to advance my research capabilities and acquire world-class international training.

Throughout my academic journey, I have actively pursued opportunities that challenge conventional problem-solving frameworks. My work on practical community projects taught me that theoretical mastery achieves its true value only when deployed to solve pressing societal challenges. The distinguished faculty and advanced research infrastructure of this program will grant me the rigorous analytical foundations necessary to expand upon this work.

The mission of ${scholarshipName || 'this program'} strongly resonates with my personal philosophy of cross-cultural collaboration and educational equity. Beyond rigorous classroom engagements, I look forward to contributing a distinctive African perspective to student dialogues, while building enduring professional bridges between our academic communities.

Upon the successful completion of my degree, my objective is to spearhead high-impact educational and development initiatives that modernize local systems and mentor the next generation of Ethiopian scholars. I thank you sincerely for reviewing my candidacy and for providing a platform that empowers ambitious scholars to achieve global excellence.

Sincerely,
${studentProfile?.full_name || 'Applicant'}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate magic draft' }, { status: 500 });
  }
}

