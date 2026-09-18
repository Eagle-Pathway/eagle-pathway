import { User, Scholarship, ScholarshipMatchReport, MatchCriterionResult, SoftMatchFactor } from '../types';
import { isCountryEligible } from '../constants/geography';
import { calculateFieldAlignmentScore } from '../constants/taxonomy';

const DEGREE_ALIASES: Record<string, string> = {
  bsc: 'undergraduate',
  bachelors: 'undergraduate',
  undergrad: 'undergraduate',
  'high school': 'high_school',
  'high school student': 'high_school',
  'high school diploma': 'high_school',
  'undergraduate student': 'undergraduate',
  "bachelor's degree holder": 'undergraduate',
  bed: 'undergraduate',
  llb: 'undergraduate',
  md: 'undergraduate',
  msc: 'masters',
  ms: 'masters',
  ma: 'masters',
  mba: 'masters',
  mph: 'masters',
  llm: 'masters',
  master: 'masters',
  "master's student": 'masters',
  "master's degree holder": 'masters',
  phd: 'phd',
  doctorate: 'phd',
  'phd student': 'phd',
  "phd degree holder": 'phd',
  'postdoctoral research': 'phd',
};

function norm(s?: string | null): string {
  return (s || '').toLowerCase().trim();
}

/**
 * Stage 1: Hard Eligibility Rule Filter
 */
export function evaluateHardEligibility(
  user: User | null | undefined,
  scholarship: Scholarship
): { criteria: MatchCriterionResult[]; blockers: number; gaps: number; isEligible: boolean } {
  const criteria: MatchCriterionResult[] = [];

  // 1. Nationality / Geographic Eligibility
  const natMode = scholarship.eligible_nationalities_mode || 'all';
  if (natMode !== 'all') {
    const userNat = (user as any)?.nationality || (user as any)?.country || 'Ethiopia';
    if (!user) {
      criteria.push({
        criterion: 'nationality',
        label: 'Nationality Eligibility',
        status: 'unknown',
        detail: 'Add your nationality to verify geographic eligibility.',
        isBlocker: false,
        actionRoute: '/profile/edit',
      });
    } else {
      const eligible = isCountryEligible(userNat, natMode, scholarship.eligible_countries, scholarship.eligible_regions);
      criteria.push({
        criterion: 'nationality',
        label: `Nationality: ${userNat}`,
        status: eligible ? 'met' : 'unmet',
        detail: eligible
          ? `Citizens of ${userNat} are eligible.`
          : `This program is not open to applicants from ${userNat}.`,
        isBlocker: !eligible,
      });
    }
  }

  // 2. Degree Level
  const levels = (scholarship.degree_levels || []).map(l => String(l).toLowerCase());
  if (levels.length > 0 && !levels.includes('all')) {
    const userLevel = norm(user?.grade_level);
    const rawTarget = norm(user?.target_degree_level);
    const userTarget = DEGREE_ALIASES[rawTarget] || rawTarget;
    const levelLabel = `Degree Level (${levels.join(', ')})`;

    if (!user || (!userLevel && !userTarget)) {
      criteria.push({
        criterion: 'degree_level',
        label: levelLabel,
        status: 'unknown',
        detail: 'Specify your current or target degree level.',
        isBlocker: false,
        actionRoute: '/profile/edit',
      });
    } else {
      const met = levels.includes(userLevel) || levels.includes(userTarget);
      criteria.push({
        criterion: 'degree_level',
        label: levelLabel,
        status: met ? 'met' : 'unmet',
        detail: met ? 'Your degree level matches the intake requirement.' : `Requires ${levels.join(' or ')} level.`,
        isBlocker: !met,
      });
    }
  }

  // 3. Minimum GPA
  if (scholarship.min_gpa != null && scholarship.gpa_requirement_type !== 'none') {
    const maxGpa = scholarship.min_gpa_max || 4.0;
    const label = `Minimum GPA ${scholarship.min_gpa} / ${maxGpa}`;

    if (user?.gpa == null) {
      criteria.push({
        criterion: 'gpa',
        label,
        status: 'unknown',
        detail: 'Add your GPA to check academic eligibility.',
        isBlocker: false,
        actionRoute: '/profile/edit',
      });
    } else {
      const userScale = (user as any).gpa_max || (user.gpa > 5 ? 100 : 4.0);
      const normalizedUserGpa = userScale > 5 ? (user.gpa / userScale) * maxGpa : user.gpa;
      const met = normalizedUserGpa >= scholarship.min_gpa;
      criteria.push({
        criterion: 'gpa',
        label,
        status: met ? 'met' : 'unmet',
        detail: met
          ? `Your GPA (${user.gpa}) meets or exceeds the required minimum.`
          : `Your GPA (${user.gpa}) is below the required ${scholarship.min_gpa} threshold.`,
        isBlocker: !met,
      });
    }
  }

  // 4. Work Experience
  if (scholarship.work_exp_required === 'yes' && (scholarship.work_exp_min_years || 0) > 0) {
    const minYears = scholarship.work_exp_min_years!;
    const label = `Work Experience (${minYears}+ Years Required)`;
    const userExp = (user as any)?.years_experience;

    if (userExp == null) {
      criteria.push({
        criterion: 'work_experience',
        label,
        status: 'unknown',
        detail: 'Add your years of professional experience to check eligibility.',
        isBlocker: false,
        actionRoute: '/profile/edit',
      });
    } else {
      const met = Number(userExp) >= minYears;
      criteria.push({
        criterion: 'work_experience',
        label,
        status: met ? 'met' : 'unmet',
        detail: met
          ? `You have ${userExp} years of verified experience (${minYears} yrs required).`
          : `Requires at least ${minYears} years of experience (you reported ${userExp}).`,
        isBlocker: !met,
      });
    }
  }

  // 5. English Language & Proficiency
  if (scholarship.english_test_required || scholarship.requires_ielts) {
    const label = 'English Language Proficiency';
    const minIelts = scholarship.ielts_min || 6.5;

    if (user?.has_ielts) {
      const ieltsScore = (user as any)?.ielts_score;
      const met = ieltsScore ? ieltsScore >= minIelts : true;
      criteria.push({
        criterion: 'language',
        label: `IELTS Required (${minIelts} Min)`,
        status: met ? 'met' : 'unmet',
        detail: met ? `IELTS requirement met (${ieltsScore || 'Valid score reported'}).` : `IELTS score (${ieltsScore}) is below ${minIelts} required.`,
        isBlocker: !met,
      });
    } else if (scholarship.accepts_english_medium && (user?.is_english_medium || scholarship.english_medium_accepted === 'yes')) {
      criteria.push({
        criterion: 'language',
        label: 'English-Medium Background Accepted',
        status: 'met',
        detail: 'Your English-medium degree certificate is accepted in place of IELTS.',
        isBlocker: false,
      });
    } else if (user && user.has_ielts === false) {
      criteria.push({
        criterion: 'language',
        label: `IELTS / English Test Required (${minIelts} Min)`,
        status: 'unmet',
        detail: 'This scholarship requires an official language score. Prepare with a tutor to qualify.',
        isBlocker: true,
        actionRoute: '/(tabs)/tutors',
      });
    } else {
      criteria.push({
        criterion: 'language',
        label: 'English Proficiency',
        status: 'unknown',
        detail: 'Indicate your IELTS/TOEFL score or English-medium status.',
        isBlocker: false,
        actionRoute: '/profile/edit',
      });
    }
  }

  const blockers = criteria.filter(c => c.status === 'unmet').length;
  const gaps = criteria.filter(c => c.status === 'unknown').length;

  return {
    criteria,
    blockers,
    gaps,
    isEligible: blockers === 0,
  };
}

/**
 * Stage 2: Soft Compatibility & Semantic Scoring
 */
export function evaluateSoftCompatibility(
  user: User | null | undefined,
  scholarship: Scholarship
): SoftMatchFactor[] {
  const factors: SoftMatchFactor[] = [];

  // Factor 1: Academic Field Alignment (Weight: 35%)
  const userSubjects = user?.interested_subjects || ((user as any)?.target_fields as string[]) || [];
  let bestFieldScore = 0;
  let bestFieldNote = 'General field overview';

  if (userSubjects.length > 0) {
    for (const subj of userSubjects) {
      const res = calculateFieldAlignmentScore(subj, scholarship);
      if (res.score > bestFieldScore) {
        bestFieldScore = res.score;
        bestFieldNote = res.matchType === 'exact'
          ? `Exact specialization match with "${subj}"`
          : res.matchType === 'related'
          ? `Accepted related field for "${subj}"`
          : `Broad domain match with "${subj}"`;
      }
    }
  } else if (scholarship.fields_of_study?.includes('any') || scholarship.broad_field) {
    bestFieldScore = 0.7;
    bestFieldNote = 'Broadly open to multiple academic backgrounds.';
  }

  factors.push({
    factor: 'field_alignment',
    name: 'Academic Field Fit',
    score: Math.round(bestFieldScore * 100),
    weight: 35,
    note: bestFieldNote,
  });

  // Factor 2: Destination Preference (Weight: 20%)
  const userCountries = user?.target_countries || [];
  let destScore = 50;
  let destNote = `Study destination: ${scholarship.country}`;

  if (userCountries.length > 0 && scholarship.country) {
    const isTarget = userCountries.some(c => c.toLowerCase() === scholarship.country.toLowerCase());
    destScore = isTarget ? 100 : 30;
    destNote = isTarget
      ? `Located in your preferred country (${scholarship.country}).`
      : `Located in ${scholarship.country} (outside your listed preferences).`;
  }

  factors.push({
    factor: 'destination',
    name: 'Study Destination Fit',
    score: destScore,
    weight: 20,
    note: destNote,
  });

  // Factor 3: Funding & Benefit Fit (Weight: 25%)
  let fundingScore = 60;
  let fundingNote = scholarship.funding_details || 'Financial assistance provided.';
  if (scholarship.funding_type === 'fully_funded' || scholarship.tuition_coverage === 'full') {
    fundingScore = 100;
    fundingNote = 'Comprehensive full-ride funding (Tuition + support).';
  } else if (scholarship.stipend_provided) {
    fundingScore = 85;
    fundingNote = 'Includes monthly living stipend.';
  }

  factors.push({
    factor: 'funding_fit',
    name: 'Funding Fit',
    score: fundingScore,
    weight: 25,
    note: fundingNote,
  });

  // Factor 4: Document & Profile Readiness (Weight: 20%)
  factors.push({
    factor: 'document_readiness',
    name: 'Application Readiness',
    score: user ? 85 : 40,
    weight: 20,
    note: user ? 'Profile credentials ready for fast submission.' : 'Complete profile to boost readiness.',
  });

  return factors;
}

/**
 * End-to-End Matching Engine
 */
export function generateScholarshipMatchReport(
  user: User | null | undefined,
  scholarship: Scholarship
): ScholarshipMatchReport {
  const hard = evaluateHardEligibility(user, scholarship);
  const soft = evaluateSoftCompatibility(user, scholarship);

  let weightedSoftScore = 0;
  let totalWeight = 0;
  for (const f of soft) {
    weightedSoftScore += f.score * (f.weight / 100);
    totalWeight += f.weight;
  }
  const baseSoftScore = totalWeight > 0 ? Math.round(weightedSoftScore) : 70;

  let overallScore = baseSoftScore;
  let eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible' = 'eligible';

  if (hard.blockers > 0) {
    eligibilityStatus = 'not_eligible';
    overallScore = Math.min(baseSoftScore, 35); // Cap score if hard blockers exist
  } else if (hard.gaps > 0) {
    eligibilityStatus = 'potentially_eligible';
    overallScore = Math.min(baseSoftScore, 75);
  }

  // Summary badges for student UI
  const badges: { text: string; type: 'success' | 'warning' | 'error' | 'info' }[] = [];

  for (const c of hard.criteria) {
    if (c.status === 'met') {
      badges.push({ text: `✅ ${c.label}`, type: 'success' });
    } else if (c.status === 'unmet') {
      badges.push({ text: `❌ ${c.label}`, type: 'error' });
    } else {
      badges.push({ text: `ℹ️ ${c.label}`, type: 'info' });
    }
  }

  const fieldFactor = soft.find(s => s.factor === 'field_alignment');
  if (fieldFactor && fieldFactor.score >= 75) {
    badges.push({ text: `🎯 Strong Field Match (${fieldFactor.score}%)`, type: 'success' });
  }

  return {
    scholarshipId: scholarship.id,
    eligibilityStatus,
    overallScore,
    hardCriteria: hard.criteria,
    softFactors: soft,
    summaryBadges: badges,
    blockerCount: hard.blockers,
    gapCount: hard.gaps,
  };
}
