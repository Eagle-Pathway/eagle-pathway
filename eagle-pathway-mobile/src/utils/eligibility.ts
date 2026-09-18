import { User, Scholarship } from '../types';
import { isCountryEligible } from '@eagle-pathway/shared';

export type CriterionStatus = 'met' | 'unmet' | 'unknown';

export interface EligibilityAction {
  label: string;
  route: string;
}

export interface EligibilityCriterion {
  key: 'degree' | 'gpa' | 'ielts' | 'nationality' | 'work_experience' | 'age';
  label: string;
  status: CriterionStatus;
  detail: string;
  action?: EligibilityAction;
}

export interface EligibilityResult {
  criteria: EligibilityCriterion[];
  metCount: number;
  total: number;
  blockers: number; // unmet hard requirements
  unknowns: number; // requirements we can't check (missing profile data)
  eligible: boolean; // no unmet hard requirements
  hasProfileGaps: boolean;
}

const ROUTE_PROFILE = '/profile/edit';
const ROUTE_TUTORS = '/(tabs)/tutors';

// Maps a user's target-degree shorthand to scholarship degree_level vocabulary.
const DEGREE_ALIASES: Record<string, string> = {
  bsc: 'undergraduate',
  bachelors: 'undergraduate',
  undergrad: 'undergraduate',
  'high school': 'high school',
  'high school student': 'high school',
  'high school diploma': 'high school',
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
 * Compares a student's profile against a scholarship's hard requirements and
 * returns a per-criterion breakdown with actionable next steps for the gaps.
 */
export function analyzeEligibility(
  user: User | null | undefined,
  scholarship: Scholarship,
): EligibilityResult {
  const criteria: EligibilityCriterion[] = [];

  // 1. Nationality / Geographic Eligibility
  const natMode = scholarship.eligible_nationalities_mode;
  if (natMode && natMode !== 'all') {
    const userNat = (user as any)?.nationality || (user as any)?.country || 'Ethiopia';
    if (!user) {
      criteria.push({
        key: 'nationality',
        label: 'Eligible Nationality',
        status: 'unknown',
        detail: 'Add your nationality to verify eligibility.',
        action: { label: 'Complete profile', route: ROUTE_PROFILE },
      });
    } else {
      const eligible = isCountryEligible(userNat, natMode, scholarship.eligible_countries, scholarship.eligible_regions);
      criteria.push({
        key: 'nationality',
        label: `Nationality: ${userNat}`,
        status: eligible ? 'met' : 'unmet',
        detail: eligible
          ? `Citizens of ${userNat} qualify for this program.`
          : `This program is not open to applicants from ${userNat}.`,
      });
    }
  }

  // 2. Degree level
  const levels = (scholarship.degree_levels || []).map((l) => String(l).toLowerCase());
  if (levels.length > 0) {
    const acceptsAll = levels.includes('all');
    const userLevel = norm(user?.grade_level);
    const rawTarget = norm(user?.target_degree_level);
    const userTarget = DEGREE_ALIASES[rawTarget] || rawTarget;
    const levelLabel = `Degree level: ${levels.join(', ')}`;

    if (!user || (!userLevel && !userTarget)) {
      criteria.push({
        key: 'degree',
        label: levelLabel,
        status: 'unknown',
        detail: 'Add your study level so we can check this.',
        action: { label: 'Complete profile', route: ROUTE_PROFILE },
      });
    } else {
      const met = acceptsAll || levels.includes(userLevel) || levels.includes(userTarget);
      criteria.push({
        key: 'degree',
        label: levelLabel,
        status: met ? 'met' : 'unmet',
        detail: met ? 'Your study level qualifies.' : `Open to ${levels.join(', ')} applicants.`,
      });
    }
  }

  // 3. Minimum GPA
  if (scholarship.min_gpa != null && scholarship.gpa_requirement_type !== 'none') {
    const label = `Minimum GPA ${scholarship.min_gpa}${scholarship.min_gpa_max ? ` / ${scholarship.min_gpa_max}` : ''}`;
    if (user?.gpa == null) {
      criteria.push({
        key: 'gpa',
        label,
        status: 'unknown',
        detail: 'Add your GPA so we can check this.',
        action: { label: 'Complete profile', route: ROUTE_PROFILE },
      });
    } else {
      const met = user.gpa >= scholarship.min_gpa;
      criteria.push({
        key: 'gpa',
        label,
        status: met ? 'met' : 'unmet',
        detail: met
          ? `Your ${user.gpa} GPA meets the minimum.`
          : `Your GPA (${user.gpa}) is below the ${scholarship.min_gpa} minimum.`,
      });
    }
  }

  // 4. Work Experience
  if (scholarship.work_exp_required === 'yes' && (scholarship.work_exp_min_years || 0) > 0) {
    const minYears = scholarship.work_exp_min_years!;
    const label = `Work Experience: ${minYears}+ Years`;
    const userExp = (user as any)?.years_experience ?? (user as any)?.years_of_experience;

    if (userExp == null) {
      criteria.push({
        key: 'work_experience',
        label,
        status: 'unknown',
        detail: 'Add your work experience history.',
        action: { label: 'Complete profile', route: ROUTE_PROFILE },
      });
    } else {
      const met = Number(userExp) >= minYears;
      criteria.push({
        key: 'work_experience',
        label,
        status: met ? 'met' : 'unmet',
        detail: met
          ? `Your ${userExp} years experience meets the minimum.`
          : `Requires ${minYears} years of experience (you reported ${userExp}).`,
      });
    }
  }

  // 5. IELTS / English proficiency
  if (scholarship.requires_ielts || scholarship.english_test_required) {
    const minScore = scholarship.ielts_min || 6.5;
    if (user?.has_ielts) {
      criteria.push({ key: 'ielts', label: `IELTS / English (Min ${minScore})`, status: 'met', detail: 'You have IELTS — requirement met.' });
    } else if ((scholarship.accepts_english_medium || scholarship.english_medium_accepted === 'yes') && user?.is_english_medium) {
      criteria.push({ key: 'ielts', label: 'English proficiency', status: 'met', detail: 'Your English-medium background is accepted.' });
    } else if (user && user.has_ielts === false) {
      criteria.push({
        key: 'ielts',
        label: `IELTS required (Min ${minScore})`,
        status: 'unmet',
        detail: 'This scholarship needs IELTS. Prepare with a tutor to qualify.',
        action: { label: 'Book an IELTS tutor', route: ROUTE_TUTORS },
      });
    } else {
      criteria.push({
        key: 'ielts',
        label: 'IELTS required',
        status: 'unknown',
        detail: 'Tell us about your English proficiency.',
        action: { label: 'Complete profile', route: ROUTE_PROFILE },
      });
    }
  }

  const metCount = criteria.filter((c) => c.status === 'met').length;
  const blockers = criteria.filter((c) => c.status === 'unmet').length;
  const unknowns = criteria.filter((c) => c.status === 'unknown').length;

  return {
    criteria,
    metCount,
    total: criteria.length,
    blockers,
    unknowns,
    eligible: blockers === 0,
    hasProfileGaps: unknowns > 0,
  };
}
