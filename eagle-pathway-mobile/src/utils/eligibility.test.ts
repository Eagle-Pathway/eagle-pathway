import { describe, it, expect } from 'vitest';
import { analyzeEligibility } from './eligibility';
import type { User, Scholarship } from '../types';

function sch(over: Partial<Scholarship>): Scholarship {
  return {
    id: 's1',
    degree_levels: ['masters'],
    ...over,
  } as unknown as Scholarship;
}
function usr(over: Partial<User> & Record<string, any>): User {
  return { id: 'u1', ...over } as unknown as User;
}

describe('analyzeEligibility', () => {
  it('marks a fully-qualified student eligible', () => {
    const r = analyzeEligibility(
      usr({ grade_level: 'masters', gpa: 3.6, has_ielts: true }),
      sch({ degree_levels: ['masters'], min_gpa: 3.0, requires_ielts: true }),
    );
    expect(r.eligible).toBe(true);
    expect(r.blockers).toBe(0);
    expect(r.metCount).toBe(3);
    expect(r.total).toBe(3);
  });

  it('flags a missing IELTS as a blocker and funnels to a tutor', () => {
    const r = analyzeEligibility(
      usr({ grade_level: 'masters', gpa: 3.6, has_ielts: false }),
      sch({ degree_levels: ['masters'], min_gpa: 3.0, requires_ielts: true }),
    );
    expect(r.eligible).toBe(false);
    expect(r.blockers).toBe(1);
    const ielts = r.criteria.find((c) => c.key === 'ielts')!;
    expect(ielts.status).toBe('unmet');
    expect(ielts.action).toEqual({ label: 'Book an IELTS tutor', route: '/(tabs)/tutors' });
  });

  it('accepts an English-medium student when the scholarship allows it', () => {
    const r = analyzeEligibility(
      usr({ grade_level: 'masters', gpa: 3.6, has_ielts: false, is_english_medium: true }),
      sch({ degree_levels: ['masters'], requires_ielts: true, accepts_english_medium: true }),
    );
    expect(r.criteria.find((c) => c.key === 'ielts')!.status).toBe('met');
    expect(r.eligible).toBe(true);
  });

  it('treats a GPA below the minimum as a blocker', () => {
    const r = analyzeEligibility(
      usr({ grade_level: 'masters', gpa: 2.4 }),
      sch({ degree_levels: ['masters'], min_gpa: 3.0 }),
    );
    expect(r.criteria.find((c) => c.key === 'gpa')!.status).toBe('unmet');
    expect(r.eligible).toBe(false);
  });

  it('reports unknowns (not blockers) and prompts profile completion when data is missing', () => {
    const r = analyzeEligibility(
      usr({}),
      sch({ degree_levels: ['masters'], min_gpa: 3.0, requires_ielts: true }),
    );
    expect(r.blockers).toBe(0);
    expect(r.unknowns).toBe(3);
    expect(r.eligible).toBe(true); // unknowns don't block, they prompt
    expect(r.hasProfileGaps).toBe(true);
    expect(r.criteria.every((c) => c.action?.route === '/profile/edit')).toBe(true);
  });

  it('maps target-degree shorthand (msc) to the scholarship vocabulary', () => {
    const r = analyzeEligibility(
      usr({ target_degree_level: 'msc' }),
      sch({ degree_levels: ['masters'] }),
    );
    expect(r.criteria.find((c) => c.key === 'degree')!.status).toBe('met');
  });

  it("honours an 'all' degree level", () => {
    const r = analyzeEligibility(
      usr({ grade_level: 'undergraduate' }),
      sch({ degree_levels: ['all'] }),
    );
    expect(r.criteria.find((c) => c.key === 'degree')!.status).toBe('met');
  });

  it('checks nationality eligibility for developing countries', () => {
    const rEligible = analyzeEligibility(
      usr({ country: 'Ethiopia' }),
      sch({ degree_levels: ['masters'], eligible_nationalities_mode: 'developing_countries' }),
    );
    expect(rEligible.criteria.find((c) => c.key === 'nationality')!.status).toBe('met');

    const rIneligible = analyzeEligibility(
      usr({ country: 'United States' }),
      sch({ degree_levels: ['masters'], eligible_nationalities_mode: 'developing_countries' }),
    );
    expect(rIneligible.criteria.find((c) => c.key === 'nationality')!.status).toBe('unmet');
    expect(rIneligible.eligible).toBe(false);
  });

  it('checks mandatory work experience rules', () => {
    const rMet = analyzeEligibility(
      usr({ years_of_experience: 3 }),
      sch({ degree_levels: ['masters'], work_exp_required: 'yes', work_exp_min_years: 2 }),
    );
    expect(rMet.criteria.find((c) => c.key === 'work_experience')!.status).toBe('met');

    const rUnmet = analyzeEligibility(
      usr({ years_of_experience: 1 }),
      sch({ degree_levels: ['masters'], work_exp_required: 'yes', work_exp_min_years: 2 }),
    );
    expect(rUnmet.criteria.find((c) => c.key === 'work_experience')!.status).toBe('unmet');
    expect(rUnmet.eligible).toBe(false);
  });
});
