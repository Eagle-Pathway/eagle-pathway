import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export async function POST(req: Request) {
  try {
    const {
      documentType = 'sop',
      scholarshipName,
      country,
      degreeLevel,
      studentProfile,
      fieldOfStudy,
      keyAccomplishments,
      targetProfessorName,
      researchTopic,
    } = await req.json();

    let systemPrompt = '';
    let userPrompt = '';

    if (documentType === 'study_plan') {
      systemPrompt = `You are a distinguished academic research advisor and scholarship placement director.
Draft a highly structured, rigorous, graduate-level Study Plan & Research Proposal Outline for an applicant applying to:
Program / Scholarship: "${scholarshipName || 'International Research Scholarship'}"
Destination Country: "${country || 'Global'}"
Degree Level: "${degreeLevel || "Master's / PhD"}"
Field of Study: "${fieldOfStudy || 'STEM / Engineering / Economics'}"
Proposed Research Topic: "${researchTopic || 'Advanced Applied Research & Modernization'}"
Key Background: "${keyAccomplishments || 'Strong quantitative foundation, undergraduate thesis, practical projects'}"
Student: ${studentProfile?.full_name || 'Applicant'}

Structure required:
1. TITLE & EXECUTIVE SUMMARY (Concise research question and scope)
2. ACADEMIC BACKGROUND & PREPARATION (Synergy with past coursework)
3. PROPOSED METHODOLOGY & TIMELINE (Semester-by-semester milestone roadmap)
4. ALIGNMENT WITH HOST INSTITUTION & LAB (Why this specific university/faculty)
5. KNOWLEDGE TRANSFER & HOME-COUNTRY IMPACT (Direct developmental contribution to Ethiopia/home community upon completion)

Rules:
- Professional, scholarly, authoritative tone.
- Avoid generic filler. Cite practical engineering, socio-economic, or experimental methodologies.
- Format cleanly with markdown headers and bullet points.`;
      userPrompt = 'Please generate the complete Study Plan & Research Proposal Outline now.';
    } else if (documentType === 'recommendation_brief') {
      systemPrompt = `You are an elite academic advisor helping an ambitious Ethiopian scholar assemble a Recommendation Letter Request Packet for their university professors.
Scholarship / Target: "${scholarshipName || 'International Scholarship Program'}"
Field: "${fieldOfStudy || 'Undergraduate Major'}"
Degree Level: "${degreeLevel || "Master's Program"}"
Key Accomplishments & Coursework: "${keyAccomplishments || 'Top marks in department, capstone project leader, laboratory assistant'}"
Student Name: ${studentProfile?.full_name || 'The Student'}

Structure required:
1. FORMAL COVER EMAIL TO PROFESSOR (Polite, grateful request reminding the professor of courses taken, grades earned, and application deadlines).
2. CANDIDATE HIGHLIGHT CHEAT-SHEET (Bullet points summarizing projects, leadership, and analytical rigor the professor can reference in their letter).
3. SUGGESTED RECOMMENDATION LETTER DRAFT (A complete, glowing 3-paragraph letter of recommendation ready for the professor to adapt, sign, and print on department letterhead).

Rules:
- Tone must be deeply respectful and professional.
- Highlight specific academic integrity, problem-solving stamina, and potential as a global scholar.`;
      userPrompt = 'Please generate the complete Professor Recommendation Packet now.';
    } else if (documentType === 'professor_outreach') {
      systemPrompt = `You are a senior academic mentor guiding international students on cold email outreach to university professors and research lab directors.
Target Professor: "${targetProfessorName || 'Distinguished Professor / Lab Director'}"
Target University / Scholarship: "${scholarshipName || 'Target University Research Program'}"
Field: "${fieldOfStudy || 'Computer Science / Engineering'}"
Research Topic / Alignment: "${researchTopic || 'Applying advanced methods to real-world infrastructure'}"
Applicant Background: "${keyAccomplishments || 'Top undergraduate GPA, published capstone project, practical technical skills'}"
Student Name: ${studentProfile?.full_name || 'Applicant'}

Draft a compelling, high-conversion cold outreach email:
- Concise Subject Line (Clear, academic, specifies proposed term and funding status).
- Strong Hook (Demonstrating familiarity with the professor's recent publications/laboratory projects).
- Value Proposition (Specific skills the student brings to the lab: e.g. Python, data analysis, experimental rigor).
- Concrete Call to Action (Polite request for a 15-minute introductory Zoom meeting or agreement to supervise for the scholarship application).
- Clean follow-up note template in case the professor doesn't reply in 7 days.

Rules:
- High-yield, concise (under 250 words for the email). Avoid desperate or flattering language; read like an aspiring peer.`;
      userPrompt = 'Please generate the Cold Academic Outreach Email now.';
    } else {
      // Default: Statement of Purpose / Motivation Letter
      systemPrompt = `You are a world-renowned academic admissions advisor for Eagle Pathway.
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
      userPrompt = 'Please generate the Statement of Purpose draft now.';
    }

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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const draft = data.choices?.[0]?.message?.content;
          if (draft) {
            return NextResponse.json({ draft });
          }
        } else {
          console.error('Groq Magic Draft API error:', groqRes.status, await groqRes.text());
        }
      } catch (apiErr) {
        console.error('Groq Magic Draft API exception:', apiErr);
      }
    }

    // High quality heuristic fallbacks based on documentType
    if (documentType === 'study_plan') {
      return NextResponse.json({
        draft: `# STUDY PLAN & RESEARCH PROPOSAL OUTLINE
**Target Program**: ${scholarshipName || 'International Postgraduate Scholarship'}
**Candidate**: ${studentProfile?.full_name || 'Applicant'} | **Field**: ${fieldOfStudy || 'Applied Engineering & Technology'}
**Proposed Focus**: ${researchTopic || 'Modernizing Critical Infrastructure through Sustainable Engineering'}

---

### 1. Research Objectives & Executive Scope
The overarching objective of this proposed study plan is to investigate scalable, localized methodologies for ${fieldOfStudy || 'advanced systems'} that bridge the gap between academic theory and real-world deployment in developing nations. Specifically, my research will focus on optimizing operational efficiency, reducing systemic resource bottlenecks, and developing robust models adapted to regional socio-economic constraints.

### 2. Academic Background & Foundational Preparation
During my undergraduate studies in Ethiopia, I focused intensely on core analytical principles and practical engineering design. My capstone project, which involved ${keyAccomplishments || 'practical community optimization projects'}, demonstrated the critical necessity of rigorous empirical validation. This scholarship provides the cutting-edge laboratory infrastructure and mentorship essential to elevate this work to international publication standards.

### 3. Semester-by-Semester Milestones & Methodology
* **Semester 1 (Core Foundations)**: Complete advanced coursework in specialized methodologies, literature review of host faculty publications, and finalize experimental thesis parameters.
* **Semester 2 (Experimental Modeling)**: Implement computational simulations, test preliminary models against benchmark datasets, and participate in departmental research colloquiums.
* **Semester 3 (Field Testing & Analysis)**: Validate findings, synthesize empirical outcomes, and submit initial findings to peer-reviewed academic journals.
* **Semester 4 (Thesis Defense & Knowledge Transfer)**: Finalize thesis dissertation, conduct oral defense, and package findings into open-source frameworks for community deployment.

### 4. Institutional Synergy
${scholarshipName || 'This program'} offers unparalleled faculties in my chosen domain. In particular, the research laboratories and distinguished professors leading international initiatives provide the exact multidisciplinary environment required to achieve my project objectives.

### 5. Long-Term Impact for Ethiopia
Upon graduation, I will return to Ethiopia to integrate these advanced methodologies into university curricula and mentor emerging African researchers. By establishing research collaborations between the host institution and Ethiopian higher education, this project will cultivate lasting technological sovereignty and sustainable development.`,
      });
    }

    if (documentType === 'recommendation_brief') {
      return NextResponse.json({
        draft: `================================================================================
PART 1: EMAIL REQUEST TO PROFESSOR
================================================================================
Subject: Recommendation Letter Request - ${studentProfile?.full_name || 'Student Name'} - ${scholarshipName || 'International Scholarship'}

Dear Professor [Professor's Last Name],

I hope this email finds you well. 

I am currently preparing my application for the prestigious ${scholarshipName || 'International Scholarship Program'} to pursue graduate studies in ${fieldOfStudy || 'my academic field'}. Having thoroughly enjoyed your courses in [Course Name, e.g. Advanced Systems Analysis] where I achieved [Your Grade/Standing, e.g., an A grade and led our team project], your mentorship has been pivotal in shaping my academic trajectory.

Because you are familiar with my analytical stamina, classroom engagement, and capstone contributions, I would be deeply honored if you would consider writing a letter of recommendation on my behalf.

The deadline for submission is [Insert Date, e.g. 15 January]. To make this process as smooth and convenient as possible for you, I have attached a summary of my academic achievements, project highlights, and a suggested draft outline below.

Thank you very much for your time, support, and guidance throughout my studies.

With sincere respect,
${studentProfile?.full_name || 'Applicant'}
Student ID: [Your ID] | Phone: [Your Phone]

================================================================================
PART 2: CANDIDATE HIGHLIGHT SUMMARY (FOR PROFESSOR'S REFERENCE)
================================================================================
* Relevant Coursework: [Insert Courses Taken with Professor, e.g., Senior Capstone, Systems Engineering]
* Key Achievements: ${keyAccomplishments || 'Top 5% of class, active volunteer mentor, demonstrated exceptional problem-solving endurance'}
* Target Degree: ${degreeLevel || "Master's Degree"} in ${fieldOfStudy || 'Academic Discipline'}
* Selection Criteria: Scholarship committee seeks evidence of intellectual curiosity, character integrity, and commitment to public impact.

================================================================================
PART 3: SAMPLE RECOMMENDATION LETTER DRAFT (FOR DEPARTMENT LETTERHEAD)
================================================================================
To the Members of the Scholarship Selection Committee,

It is with great enthusiasm that I provide my highest recommendation for ${studentProfile?.full_name || 'this exceptional student'} in support of their application for the ${scholarshipName || 'International Scholarship Program'}. As their professor in the Department of ${fieldOfStudy || 'Academic Studies'}, I have known the candidate for over two years and can attest to their remarkable intellectual curiosity, analytical stamina, and moral integrity.

In my advanced classes, ${studentProfile?.full_name || 'the candidate'} consistently ranked among the top performers. Beyond high test scores, what distinguished them was their capacity to independently formulate complex hypotheses and lead collaborative peer teams through challenging laboratory assignments. Their work on ${keyAccomplishments || 'practical design initiatives'} demonstrated an exceptional ability to apply rigorous theory to tangible societal solutions.

Outside the classroom, ${studentProfile?.full_name || 'the candidate'} exemplifies the humility, leadership, and resilience that international scholarship boards seek in global ambassadors. I have no doubt that they will excel in rigorous graduate coursework and return substantial credit to your institution. I endorse their candidacy without reservation.

Sincerely,

[Professor's Full Name, PhD]
[Professor's Title & Department]
[University Name, Addis Ababa, Ethiopia]
[Email & Contact Information]`,
      });
    }

    if (documentType === 'professor_outreach') {
      return NextResponse.json({
        draft: `Subject: Prospective ${degreeLevel || "Master's"} Researcher - ${fieldOfStudy || 'Field'} - Inquiring regarding Lab Openings

Dear Professor ${targetProfessorName || '[Professor Last Name]'},

I hope this email finds you well.

My name is ${studentProfile?.full_name || '[Your Name]'}, and I am an aspiring ${degreeLevel || 'graduate'} scholar from Ethiopia specializing in ${fieldOfStudy || 'your discipline'}. I have closely followed your laboratory's groundbreaking work, particularly your recent publication on ${researchTopic || 'advanced methodologies in this domain'}. Your research framework directly inspired my undergraduate capstone on ${keyAccomplishments || 'practical engineering and computational optimization'}.

I am preparing an application for the fully funded ${scholarshipName || 'Government Scholarship Program'} to support my studies in ${country || 'your department'}. Because this scholarship provides complete independent funding covering my full tuition, research stipend, and living expenses, I am writing to inquire if you would be open to considering me as a prospective graduate student under your supervision for the upcoming academic year.

My background includes strong foundations in quantitative analysis, experimental modeling, and programming. I would welcome the opportunity to contribute directly to your ongoing laboratory projects while developing my thesis.

Attached is my CV and a concise one-page research abstract for your review. Would you be open to a brief 15-minute introductory conversation via Zoom in the coming weeks to discuss whether my profile aligns with your group?

Thank you sincerely for your time and consideration.

Respectfully,

${studentProfile?.full_name || '[Your Name]'}
[Your University / Degree] | Addis Ababa, Ethiopia
LinkedIn / Portfolio: [Insert Link]

--------------------------------------------------------------------------------
OPTIONAL: 7-DAY FOLLOW-UP EMAIL (IF NO RESPONSE)
--------------------------------------------------------------------------------
Subject: Re: Prospective ${degreeLevel || "Master's"} Researcher - ${fieldOfStudy || 'Field'}

Dear Professor ${targetProfessorName || '[Professor Last Name]'},

I hope you are having a productive week. I am following up briefly on my previous email regarding prospective graduate research under your mentorship for the ${scholarshipName || 'Scholarship Program'}.

I recognize how demanding your schedule is. If your laboratory is currently accepting funded scholars for the upcoming term, I would be grateful for the opportunity to briefly introduce my background. If your group is at full capacity, I completely understand and appreciate your time.

Kind regards,
${studentProfile?.full_name || '[Your Name]'}`,
      });
    }

    // Default: Statement of Purpose
    return NextResponse.json({
      draft: `Dear Members of the Scholarship Selection Committee,

I am writing to express my enthusiastic application for the ${scholarshipName || 'Global Excellence Scholarship'}. Having cultivated a profound dedication to ${fieldOfStudy || 'my academic discipline'} during my formative studies in Ethiopia, this scholarship represents the definitive catalyst required to advance my research capabilities and acquire world-class international training.

Throughout my academic journey, I have actively pursued opportunities that challenge conventional problem-solving frameworks. My work on practical community projects (${keyAccomplishments || 'undergraduate initiatives'}) taught me that theoretical mastery achieves its true value only when deployed to solve pressing societal challenges. The distinguished faculty and advanced research infrastructure of this program will grant me the rigorous analytical foundations necessary to expand upon this work.

The mission of ${scholarshipName || 'this program'} strongly resonates with my personal philosophy of cross-cultural collaboration and educational equity. Beyond rigorous classroom engagements, I look forward to contributing a distinctive African perspective to student dialogues, while building enduring professional bridges between our academic communities.

Upon the successful completion of my degree, my objective is to spearhead high-impact educational and development initiatives that modernize local systems and mentor the next generation of Ethiopian scholars. I thank you sincerely for reviewing my candidacy and for providing a platform that empowers ambitious scholars to achieve global excellence.

Sincerely,
${studentProfile?.full_name || 'Applicant'}`,
    });
  } catch (err: any) {
    console.error('Magic draft route exception:', err);
    return NextResponse.json({ error: 'Failed to generate application document' }, { status: 500 });
  }
}
