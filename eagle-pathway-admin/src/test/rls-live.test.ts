// @vitest-environment node
// Supabase auth-js needs Node's native fetch; the project-default jsdom
// environment leaves fetch undefined here, so this file opts into node.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Live Row-Level-Security integration test.
 *
 * This is the runtime proof that the policies audited statically in the mobile
 * workspace (`rls-policies.test.ts`) actually behave: it provisions throwaway
 * users against a REAL Supabase project and asserts that one student cannot read
 * or mutate another student's data, while owners and admins can.
 *
 * It is opt-in. It runs only when a URL + anon key + SERVICE ROLE key are
 * available, so it skips silently in CI (no secrets) and in normal unit runs.
 *
 * To run locally (PowerShell), with admin/.env.local populated:
 *   $env:RLS_TEST_LIVE = "1"; npx vitest run src/test/rls-live.test.ts
 *
 * Every record it creates is namespaced with an `rls-test` marker and a run id,
 * and all auth users are deleted in afterAll (cascading their rows away).
 */

// ── Resolve credentials ──────────────────────────────────────────────────────
// Convenience only: vitest does not load .env.local the way Next.js does, so if
// the vars are not already in the environment we read them out of admin/.env.local.
// This only READS the file; it never writes to any .env file.
function loadEnvFallback() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const raw = readFileSync(join(__dirname, '..', '..', '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '');
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // No .env.local — fine, we just stay in skip mode unless env is set elsewhere.
  }
}

loadEnvFallback();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Opt-in flag is required on top of credentials: this test writes to a real
// database, so it must never run by accident during a normal `vitest` run.
const OPTED_IN = process.env.RLS_TEST_LIVE === '1' || process.env.RLS_TEST_LIVE === 'true';
const LIVE = OPTED_IN && Boolean(SUPABASE_URL && ANON_KEY && SERVICE_KEY);

if (!LIVE) {
  // Make the skip visible rather than silent so nobody assumes RLS is "tested".
  console.warn(
    OPTED_IN
      ? '[rls-live] SKIPPED — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY.'
      : '[rls-live] SKIPPED — set RLS_TEST_LIVE=1 to run the live cross-tenant checks against a real database.',
  );
}

const RUN_ID = `rls-test-${Date.now()}`;

interface TestUser {
  id: string;
  email: string;
  client: SupabaseClient;
}

describe.runIf(LIVE)('RLS live: cross-tenant isolation', () => {
  let admin: SupabaseClient; // service-role client (bypasses RLS) — used for setup/teardown
  let studentA: TestUser;
  let studentB: TestUser;
  let adminUser: TestUser;
  let scholarshipId: string;
  let appAId: string;
  let docAId: string;

  const createdAuthIds: string[] = [];

  async function makeUser(role: 'student' | 'admin'): Promise<TestUser> {
    const email = `${RUN_ID}-${role}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const password = `Pw!${Math.random().toString(36).slice(2)}Aa1`;
    const phone = `+25190${Math.floor(1000000 + Math.random() * 8999999)}`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${RUN_ID} ${role}`, phone, role },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    const userId = data.user.id;
    createdAuthIds.push(userId);

    // The handle_new_user trigger normally creates the public.users + user_roles
    // rows, but we don't depend on it being installed — create them explicitly
    // via the service client (which bypasses RLS) so the test is self-contained.
    const { error: profileErr } = await admin.from('users').upsert({
      id: userId,
      full_name: `${RUN_ID} ${role}`,
      phone,
      email,
      role,
      roles: [role],
      active_role: role,
    });
    if (profileErr) throw new Error(`profile upsert failed for ${role}: ${profileErr.message}`);

    const { error: roleErr } = await admin.from('user_roles').upsert(
      { user_id: userId, role },
      { onConflict: 'user_id,role' },
    );
    if (roleErr) throw new Error(`role upsert failed for ${role}: ${roleErr.message}`);

    const client = createClient(SUPABASE_URL!, ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`signIn failed for ${role}: ${signInError.message}`);

    return { id: data.user.id, email, client };
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    studentA = await makeUser('student');
    studentB = await makeUser('student');
    adminUser = await makeUser('admin');

    // Need a scholarship to attach an application to.
    const { data: sch, error: schErr } = await admin
      .from('scholarships')
      .select('id')
      .limit(1)
      .single();
    if (schErr || !sch) throw new Error(`no scholarship available to seed: ${schErr?.message}`);
    scholarshipId = sch.id;

    // Seed student A's private data via the service client.
    const { data: app, error: appErr } = await admin
      .from('applications')
      .insert({ student_id: studentA.id, scholarship_id: scholarshipId, status: 'personal_info' })
      .select('id')
      .single();
    if (appErr || !app) throw new Error(`seed application failed: ${appErr?.message}`);
    appAId = app.id;

    const { data: doc, error: docErr } = await admin
      .from('documents')
      .insert({
        user_id: studentA.id,
        application_id: appAId,
        document_type: 'transcript',
        file_name: `${RUN_ID}.pdf`,
        file_url: 'https://example.com/private.pdf',
      })
      .select('id')
      .single();
    if (docErr || !doc) throw new Error(`seed document failed: ${docErr?.message}`);
    docAId = doc.id;

    await admin.from('notifications').insert({
      user_id: studentA.id,
      type: 'application_update',
      title: `${RUN_ID} private`,
      body: 'secret',
    });

    await admin.from('payments').insert({
      user_id: studentA.id,
      payment_type: 'scholarship_package',
      method: 'telebirr',
      amount: 5000,
      transaction_id: `${RUN_ID}-txn`,
      status: 'pending',
    });
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const id of createdAuthIds) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 60_000);

  // ── The core invariant: B is blind to A ────────────────────────────────────
  it("student B cannot read student A's application", async () => {
    const { data } = await studentB.client.from('applications').select('id').eq('id', appAId);
    expect(data ?? []).toHaveLength(0);
  });

  it("student B cannot read student A's document", async () => {
    const { data } = await studentB.client.from('documents').select('id').eq('id', docAId);
    expect(data ?? []).toHaveLength(0);
  });

  it("student B cannot read student A's payments", async () => {
    const { data } = await studentB.client.from('payments').select('id').eq('user_id', studentA.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("student B cannot read student A's notifications", async () => {
    const { data } = await studentB.client
      .from('notifications')
      .select('id')
      .eq('user_id', studentA.id);
    expect(data ?? []).toHaveLength(0);
  });

  it("student B cannot update student A's application", async () => {
    const { data } = await studentB.client
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', appAId)
      .select('id');
    // RLS makes the row invisible to the UPDATE, so zero rows are affected.
    expect(data ?? []).toHaveLength(0);

    // Confirm via the service client that the status was NOT changed.
    const { data: after } = await admin.from('applications').select('status').eq('id', appAId).single();
    expect(after?.status).toBe('personal_info');
  });

  // ── Positive controls: owners and admins still have access ──────────────────
  it('student A can read their own application', async () => {
    const { data } = await studentA.client.from('applications').select('id').eq('id', appAId);
    expect(data ?? []).toHaveLength(1);
  });

  it("an admin can read student A's application", async () => {
    const { data } = await adminUser.client.from('applications').select('id').eq('id', appAId);
    expect(data ?? []).toHaveLength(1);
  });
});
