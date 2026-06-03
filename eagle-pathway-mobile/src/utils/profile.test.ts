import { describe, it, expect } from 'vitest';
import { isProfileIncomplete } from './profile';
import type { User } from '../types';

const complete = {
  gpa: 3.5,
  interested_subjects: ['stem'],
  target_degree_level: 'masters',
} as unknown as User;

describe('isProfileIncomplete', () => {
  it('is false for a complete profile', () => {
    expect(isProfileIncomplete(complete)).toBe(false);
  });

  it('accepts grade_level in place of target_degree_level', () => {
    expect(isProfileIncomplete({ ...complete, target_degree_level: undefined, grade_level: 'undergraduate' } as User)).toBe(false);
  });

  it.each([
    ['missing gpa', { ...complete, gpa: undefined }],
    ['missing interests', { ...complete, interested_subjects: [] }],
    ['missing level', { ...complete, target_degree_level: undefined, grade_level: undefined }],
  ])('is true when %s', (_label, u) => {
    expect(isProfileIncomplete(u as User)).toBe(true);
  });

  it('does not force onboarding when there is no user', () => {
    expect(isProfileIncomplete(null)).toBe(false);
    expect(isProfileIncomplete(undefined)).toBe(false);
  });
});
