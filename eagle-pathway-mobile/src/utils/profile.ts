import { User } from '../types';

/**
 * Whether a student still needs onboarding — i.e. is missing the profile fields
 * the matching + eligibility features depend on (study level, GPA, interests).
 * Returns false when there is no user (don't force onboarding before login).
 */
export function isProfileIncomplete(user?: Partial<User> | null): boolean {
  if (!user) return false;
  const hasGpa = user.gpa != null;
  const hasInterests = Array.isArray(user.interested_subjects) && user.interested_subjects.length > 0;
  const hasLevel = Boolean(user.target_degree_level || user.grade_level);
  return !(hasGpa && hasInterests && hasLevel);
}
