import type { User, UserRole } from '../types';

/**
 * Canonical single role for an account. Reads the new `role` column, falling
 * back to the legacy multi-persona fields during the migration window (before
 * `roles`/`active_role` are dropped in phase 2). One identity per account.
 */
export function getUserRole(
  user?: Pick<User, 'role' | 'active_role' | 'roles'> | null,
): UserRole {
  return (user?.role || user?.active_role || user?.roles?.[0] || 'student') as UserRole;
}
