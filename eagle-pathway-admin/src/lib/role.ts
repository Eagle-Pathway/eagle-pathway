// Canonical single role for an account, resilient during the migration window
// (reads the new `role` column, falling back to legacy fields until they are
// dropped in phase 2). One identity per account.
export function roleOf(
  u: { role?: string | null; active_role?: string | null; roles?: string[] | null } | null | undefined,
): string {
  return u?.role || u?.active_role || u?.roles?.[0] || 'student';
}
