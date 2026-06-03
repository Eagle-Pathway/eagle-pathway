import { User, Scholarship } from '../types';

export type CriterionStatus = 'met' | 'unmet' | 'unknown';

export interface EligibilityAction {
  label: string;
  route: string;
}

export interface EligibilityCriterion {
  key: 'degree' | 'gpa' | 'ielts';
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
  msc: 'masters',
  ms: 'masters',
  ma: 'masters',
  mba: 'masters',
  master: 'masters',
  phd: 'phd',
  doctorate: 'phd',
};

function norm(s?: string | null): string {
  return (s || '').toLowerCase().trim();
}

/**
 * Compares a student's profile against a scholarship's hard requirements and
 * returns a per-criterion breakdown with actionable next steps for the gaps.
 * "unknown" means we lack the profile data to judge (prompt to complete profile)
 * — it never counts as a blocker, only unmet requirements do.
 */
export function analyzeEligibility(
  user: User | null | undefined,
  scholarship: Scholarship,
): EligibilityResult {
  const criteria: EligibilityCriterion[] = [];

  // 1. Degree level
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

  // 2. Minimum GPA
  if (scholarship.min_gpa != null) {
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

  // 3. IELTS / English proficiency — the gap that funnels to tutoring.
  if (scholarship.requires_ielts) {
    if (user?.has_ielts) {
      criteria.push({ key: 'ielts', label: 'IELTS / English proficiency', status: 'met', detail: 'You have IELTS — requirement met.' });
    } else if (scholarship.accepts_english_medium && user?.is_english_medium) {
      criteria.push({ key: 'ielts', label: 'English proficiency', status: 'met', detail: 'Your English-medium background is accepted.' });
    } else if (user && user.has_ielts === false) {
      criteria.push({
        key: 'ielts',
        label: 'IELTS required',
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
