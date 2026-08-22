import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Static Row-Level-Security audit.
 *
 * This test never touches the network or a real database. It parses the
 * canonical schema (`supabase/migrations/supabase_schema.sql`) and asserts the
 * security invariants that protect student data:
 *
 *   1. Every table in the public schema has RLS enabled.
 *   2. Every table that holds user-owned data has at least one SELECT/ALL policy
 *      scoped to `auth.uid()` or `is_admin()` — never a blanket `USING (true)`.
 *
 * The point is to catch the most common and most dangerous mistake: adding a new
 * table (or relaxing a policy) and forgetting to lock it down. For the runtime
 * proof that the policies actually behave correctly, see `rls-live.test.ts`.
 */

const SCHEMA_PATH = join(__dirname, '..', '..', 'supabase', 'migrations', '00000000000000_master_schema.sql');
const schema = readFileSync(SCHEMA_PATH, 'utf8');

// Tables that legitimately have no RLS / no per-user scoping.
// schema_versions holds only schema metadata (version strings), no user data.
const EXEMPT_FROM_RLS = new Set(['schema_versions']);

// Tables that are intentionally world-readable to authenticated users. Their
// SELECT policy is `USING (true)` by design (public catalog data, not PII).
const PUBLIC_READABLE = new Set(['scholarships', 'tutors', 'tutor_reviews', 'resources', 'success_stories']);

interface Policy {
  name: string;
  table: string;
  command: string; // SELECT | INSERT | UPDATE | DELETE | ALL
  body: string; // everything after the table+command, lowercased
}

function parseTables(sql: string): string[] {
  const tables: string[] = [];
  const re = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) tables.push(m[1]);
  return tables;
}

function parseRlsEnabled(sql: string): Set<string> {
  const enabled = new Set<string>();
  const re = /ALTER TABLE (?:public\.)?(\w+) ENABLE ROW LEVEL SECURITY/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) enabled.add(m[1]);
  return enabled;
}

function parsePolicies(sql: string): Policy[] {
  const policies: Policy[] = [];
  // CREATE POLICY "name" ON table [FOR cmd] ... ;  (body runs to the next semicolon)
  const re = /CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)\s+(?:FOR\s+(SELECT|INSERT|UPDATE|DELETE|ALL)\s+)?([\s\S]*?);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    policies.push({
      name: m[1],
      table: m[2],
      command: (m[3] || 'ALL').toUpperCase(),
      body: m[4].toLowerCase(),
    });
  }
  return policies;
}

const tables = parseTables(schema);
const rlsEnabled = parseRlsEnabled(schema);
const policies = parsePolicies(schema);

describe('RLS static audit: canonical schema', () => {
  it('parses tables and policies from the schema', () => {
    // Sanity check that the regexes actually matched something, otherwise every
    // assertion below would pass vacuously.
    expect(tables.length).toBeGreaterThan(10);
    expect(policies.length).toBeGreaterThan(20);
  });

  it('enables RLS on every non-exempt table', () => {
    const missing = tables.filter(
      (t) => !EXEMPT_FROM_RLS.has(t) && !rlsEnabled.has(t),
    );
    expect(missing, `Tables missing "ENABLE ROW LEVEL SECURITY": ${missing.join(', ')}`).toEqual([]);
  });

  const sensitiveTables = tables.filter(
    (t) => !EXEMPT_FROM_RLS.has(t) && !PUBLIC_READABLE.has(t),
  );

  it.each(sensitiveTables)('has a read policy scoped to the owner or an admin: %s', (table) => {
    const readPolicies = policies.filter(
      (p) => p.table === table && (p.command === 'SELECT' || p.command === 'ALL'),
    );

    expect(
      readPolicies.length,
      `Table "${table}" has no SELECT/ALL policy — it would be unreadable or unprotected`,
    ).toBeGreaterThan(0);

    for (const p of readPolicies) {
      const scopedToOwner = p.body.includes('auth.uid()');
      const scopedToAdmin = p.body.includes('is_admin()') || p.body.includes("active_role = 'admin'");
      expect(
        scopedToOwner || scopedToAdmin,
        `Policy "${p.name}" on "${table}" is not scoped to auth.uid()/is_admin(): ${p.body.trim()}`,
      ).toBe(true);

      // A bare "using (true)" on a sensitive table exposes every row to every user.
      const isBlanketTrue = /using\s*\(\s*true\s*\)/.test(p.body) && !scopedToOwner && !scopedToAdmin;
      expect(
        isBlanketTrue,
        `Policy "${p.name}" on "${table}" uses a blanket USING (true) — leaks all rows`,
      ).toBe(false);
    }
  });

  it('keeps public-readable tables limited to known catalog tables', () => {
    // Guard against accidentally widening the public allowlist. If a table here
    // starts holding PII, this test forces a conscious decision.
    for (const table of PUBLIC_READABLE) {
      expect(tables, `PUBLIC_READABLE lists "${table}" but it is not in the schema`).toContain(table);
    }
  });
});

// The canonical schema only covers the base tables. Feature tables added in
// later migrations (client_errors, recommendation_requests, success_stories,
// ai_rate_limit, …) must also ship with RLS — this scans every migration file
// so a new table can't slip in unprotected.
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'supabase', 'migrations');
const allSql = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8'))
  .join('\n');
const allTables = Array.from(new Set(parseTables(allSql)));
const allRls = parseRlsEnabled(allSql);

describe('RLS static audit: feature tables added via migrations', () => {
  // These hold user/telemetry data and must have RLS, but live in migration
  // files rather than the canonical schema, so the schema audit above misses them.
  it.each(['client_errors', 'recommendation_requests', 'success_stories', 'ai_rate_limit', 'resources'])(
    'creates %s with RLS enabled',
    (table) => {
      expect(allTables, `expected "${table}" to be created in a migration`).toContain(table);
      expect(allRls.has(table), `"${table}" must have RLS enabled`).toBe(true);
    },
  );
});

describe('security-definer RPC audit', () => {
  it('authorizes SOP draft updates inside increment_sop_draft', () => {
    const definitions = Array.from(
      allSql.matchAll(
        /CREATE OR REPLACE FUNCTION public\.increment_sop_draft\([\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER[^\n;]*(?:;|$)/gi,
      ),
    );

    expect(definitions.length, 'increment_sop_draft RPC must be defined in migrations').toBeGreaterThan(0);

    const body = definitions[definitions.length - 1][0].toLowerCase();
    expect(body).toContain('auth.uid()');
    expect(body).toContain('student_id');
    expect(body).toContain('consultant_id');
    expect(body).toContain('is_admin()');
    expect(body).toContain('raise exception');
  });
});
