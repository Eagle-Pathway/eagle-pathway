import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

function heuristicSopEvaluation(sopContent: string, scholarshipName: string) {
  const wordCount = sopContent.trim().split(/\s+/).length;
  const textLower = sopContent.toLowerCase();

  const clichesFound = [];
  if (textLower.includes('ever since i was a child') || textLower.includes('from a young age')) {
    clichesFound.push({
      phrase: 'Ever since I was a child / from a young age',
      reason: 'Overused childhood trope that admissions boards encounter thousands of times.',
      recommended_fix: 'Open directly with the specific intellectual challenge or real-world problem that sparked your commitment.',
    });
  }
  if (textLower.includes('fast-paced world') || textLower.includes('in today\'s world') || textLower.includes('ever-evolving world')) {
    clichesFound.push({
      phrase: "In today's fast-paced / ever-evolving world",
      reason: 'Filler phrasing that consumes precious character count without saying anything personal.',
      recommended_fix: 'State the exact technological or socio-economic bottleneck your degree addresses.',
    });
  }
  if (textLower.includes('beacon of hope') || textLower.includes('dream come true')) {
    clichesFound.push({
      phrase: 'Beacon of hope / dream come true',
      reason: 'Overly emotional melodrama that signals lack of practical academic preparation.',
      recommended_fix: 'Replace emotional generalities with verifiable coursework, research tools, or technical projects.',
    });
  }

  const hasFacultyFocus = /\b(faculty|professor|laboratory|curriculum|module|coursework|research group|thesis|advisor)\b/i.test(sopContent);
  const hasImpactFocus = /\b(ethiopia|community|return|impact|development|infrastructure|policy|knowledge transfer|industry)\b/i.test(sopContent);

  const baseScore = Math.min(88, Math.max(50, Math.round(52 + (wordCount / 600) * 30)));
  const penalty = clichesFound.length * 4;
  const bonus = (hasFacultyFocus ? 5 : 0) + (hasImpactFocus ? 5 : 0);
  const score = Math.min(95, Math.max(45, baseScore - penalty + bonus));

  const verdict = score >= 82
    ? 'Likely Interview / Finalist'
    : score >= 68
    ? 'Competitive Pool (Borderline)'
    : 'Probable Board Rejection';

  return {
    score,
    verdict,
    rubrics: {
      academicAlignment: hasFacultyFocus ? Math.min(92, score + 4) : Math.max(48, score - 8),
      narrativeOriginality: Math.max(40, 85 - clichesFound.length * 15),
      homeCountryImpact: hasImpactFocus ? Math.min(94, score + 6) : Math.max(45, score - 10),
      structuralClarity: Math.min(90, Math.max(55, Math.round(score))),
    },
    feedback: `Your personal statement demonstrates authentic dedication toward ${scholarshipName || 'international study'}. To move from the competitive pool into the unanimous selection tier, anchor your narrative in specific faculty laboratories and quantify your past undergraduate accomplishments.`,
    committee_concerns: [
      hasFacultyFocus ? 'Verify that mentioned coursework aligns with degree prerequisites.' : 'Fails to name specific faculty advisors, courses, or labs at the destination university.',
      hasImpactFocus ? 'Strengthen post-graduation timeline: specify the exact ministry, NGO, or sector you will join.' : 'Weak knowledge transfer plan: does not explicitly detail how you will return value to your home community.',
      clichesFound.length > 0 ? 'Contains overused narrative formulas that dilute intellectual seriousness.' : 'Ensure accomplishments cite metrics (percentages, team sizes, project scale).',
    ],
    cliches_detected: clichesFound,
    strengths: [
      'Passionate articulation of your field and academic drive.',
      'Clear personal backstory contextualizing your educational trajectory.',
      'Good alignment with international scholarship objectives.',
    ],
    suggestions: [
      'Name 1-2 specific research faculty members at your host institution and how your thesis connects to their recent publications.',
      'Quantify your undergraduate impact with numbers, metrics, or tangible project outputs.',
      'Clarify your 5-year post-graduation career roadmap in your home nation.',
    ],
    inline_comments: [
      {
        quote: sopContent.slice(0, 90).trim() + '...',
        severity: 'suggestion',
        comment: 'Hook the admissions committee immediately with the core problem you want to solve rather than biographical background.',
        suggested_revision: 'Ground your opening paragraph in the specific engineering or research challenge you are passionate about.',
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    const { sopContent, scholarshipName, studentProfile } = await req.json();

    if (!sopContent || typeof sopContent !== 'string') {
      return NextResponse.json({ error: 'Please provide Statement of Purpose text to review.' }, { status: 400 });
    }

    const systemPrompt = `You are the Selection Committee Chair and Senior Admissions Evaluator for ${scholarshipName || 'Prestigious International Scholarship'}.
You are conducting a rigorous, exhaustive, committee-grade audit of an applicant's Statement of Purpose / Motivation Letter.
Candidate Profile: ${JSON.stringify(studentProfile || {})}

Scoring Rubric (0 - 100 Scale):
- 85 to 100: Likely Interview / Finalist. Compelling narrative, flawless institutional depth (names labs/faculty), concrete metrics, airtight home-country impact plan.
- 68 to 84: Competitive Pool (Borderline). Solid applicant, but lacks specific faculty alignment, relies on generic claims, or has mild committee fatigue cliches.
- Below 68: Probable Board Rejection. Vague, overly emotional, lacks academic rigor, reads like generic ChatGPT prose, or omits return-to-home-country plan.

Evaluation Dimensions (0-100 each):
- academicAlignment: Specificity regarding target curriculum, faculty research, and undergraduate coursework synergy.
- narrativeOriginality: Freedom from generic AI tropes and authentic voice.
- homeCountryImpact: Concrete knowledge transfer roadmap to their home country.
- structuralClarity: Flow, evidence-based claims, and persuasive rhetoric.

Rules:
1. "cliches_detected": Scan for formulaic AI tropes (e.g., "From a young age", "In today's fast-paced world", "A beacon of hope", "My passion knows no bounds"). If found, list exact phrase, why it causes committee fatigue, and a high-yield substitution.
2. "committee_concerns": List 2-3 blunt, honest skepticism points the selection board will debate when deciding whether to reject this file.
3. "inline_comments": Extract 2-4 exact quotes from the text, tag severity ("strength" | "suggestion" | "critical"), and provide an actionable, committee-grade "suggested_revision".

Respond strictly with valid JSON:
{
  "score": number,
  "verdict": "Likely Interview / Finalist" | "Competitive Pool (Borderline)" | "Probable Board Rejection",
  "rubrics": {
    "academicAlignment": number,
    "narrativeOriginality": number,
    "homeCountryImpact": number,
    "structuralClarity": number
  },
  "feedback": "2-3 sentences of overall executive board summary",
  "committee_concerns": ["string", "string"],
  "cliches_detected": [
    {
      "phrase": "exact phrase from text",
      "reason": "why committee flags this",
      "recommended_fix": "better academic phrasing"
    }
  ],
  "strengths": ["string", "string", "string"],
  "suggestions": ["string", "string", "string"],
  "inline_comments": [
    {
      "quote": "exact sentence from text",
      "severity": "strength" | "suggestion" | "critical",
      "comment": "diagnostic feedback",
      "suggested_revision": "concrete drop-in rewrite"
    }
  ]
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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Statement of Purpose text:\n\n${sopContent}` },
            ],
            temperature: 0.25,
            max_tokens: 1800,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const rawJson = data.choices?.[0]?.message?.content;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            if (typeof parsed.score === 'number') {
              const score = Math.min(100, Math.max(0, Math.round(parsed.score)));
              const verdict = parsed.verdict || (score >= 85 ? 'Likely Interview / Finalist' : score >= 68 ? 'Competitive Pool (Borderline)' : 'Probable Board Rejection');
              return NextResponse.json({
                score,
                verdict,
                rubrics: {
                  academicAlignment: parsed.rubrics?.academicAlignment ?? score,
                  narrativeOriginality: parsed.rubrics?.narrativeOriginality ?? score,
                  homeCountryImpact: parsed.rubrics?.homeCountryImpact ?? score,
                  structuralClarity: parsed.rubrics?.structuralClarity ?? score,
                },
                feedback: parsed.feedback || 'Statement evaluated.',
                committee_concerns: parsed.committee_concerns || [],
                cliches_detected: parsed.cliches_detected || [],
                strengths: parsed.strengths || [],
                suggestions: parsed.suggestions || [],
                inline_comments: parsed.inline_comments || [],
              });
            }
          }
        } else {
          console.error('Groq SOP Review API error:', groqRes.status, await groqRes.text());
        }
      } catch (apiErr) {
        console.error('Groq SOP Review API exception:', apiErr);
      }
    }

    // Heuristic fallback if AI service is temporarily unavailable
    return NextResponse.json(heuristicSopEvaluation(sopContent, scholarshipName || 'this scholarship'));
  } catch (err: any) {
    console.error('SOP review exception:', err);
    return NextResponse.json(
      { error: 'Failed to analyze Statement of Purpose. Please try again.' },
      { status: 500 }
    );
  }
}
