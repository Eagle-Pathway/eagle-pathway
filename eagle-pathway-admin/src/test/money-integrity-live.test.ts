// @vitest-environment node
// Supabase auth-js needs Node's native fetch; opt into the node environment.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Live integration test for server-authoritative money handling. Proves the DB
 * triggers, not the client, decide booking prices and payout ceilings:
 *   - supabase_migration_enforce_booking_amounts.sql
 *   - supabase_migration_enforce_payout_balance.sql
 *
 * Opt-in (RLS_TEST_LIVE=1 + service-role key); skips in CI. Self-cleans.
 */

function loadEnvFallback() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  try {
    const raw = readFileSync(join(__dirname, '..', '..', '.env.local'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env.local — stay in skip mode */
  }
}

loadEnvFallback();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPTED_IN = process.env.RLS_TEST_LIVE === '1' || process.env.RLS_TEST_LIVE === 'true';
const LIVE = OPTED_IN && Boolean(SUPABASE_URL && SERVICE_KEY);

if (!LIVE) {
  console.warn('[money-integrity] SKIPPED — set RLS_TEST_LIVE=1 + service-role key to run.');
}

const RUN_ID = `money-test-${Date.now()}`;
const HOURLY_RATE = 400;
// Trigger formula: fee = round(rate * duration * 0.10); total = round(rate*duration) + fee.
const EXPECTED_FEE = Math.round(HOURLY_RATE * 1 * 0.1); // 40
const EXPECTED_TOTAL = Math.round(HOURLY_RATE * 1) + EXPECTED_FEE; // 440
const TUTOR_SHARE = EXPECTED_TOTAL - EXPECTED_FEE; // 400

describe.runIf(LIVE)('money integrity (server-authoritative)', () => {
  let admin: SupabaseClient;
  let studentId: string;
  let tutorUserId: string;
  let tutorId: string;
  const createdAuthIds: string[] = [];

  async function makeUser(role: 'student' | 'tutor'): Promise<string> {
    const email = `${RUN_ID}-${role}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    const phone = `+25190${Math.floor(1000000 + Math.random() * 8999999)}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: `Pw!${Math.random().toString(36).slice(2)}Aa1`,
      email_confirm: true,
      user_metadata: { full_name: `${RUN_ID} ${role}`, phone, role },
    });
    if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
    createdAuthIds.push(data.user.id);
    const { error: pErr } = await admin.from('users').upsert({
      id: data.user.id,
      full_name: `${RUN_ID} ${role}`,
      phone,
      email,
      role,
      roles: [role],
      active_role: role,
    });
    if (pErr) throw new Error(`profile upsert failed: ${pErr.message}`);
    return data.user.id;
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    studentId = await makeUser('student');
    tutorUserId = await makeUser('tutor');

    const { data: tutor, error: tErr } = await admin
      .from('tutors')
      .insert({ user_id: tutorUserId, hourly_rate: HOURLY_RATE, is_verified: true })
      .select('id')
      .single();
    if (tErr || !tutor) throw new Error(`tutor insert failed: ${tErr?.message}`);
    tutorId = tutor.id;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const id of createdAuthIds) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 60_000);

  async function insertBooking(status = 'pending') {
    const { data, error } = await admin
      .from('bookings')
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        subject: 'Math',
        session_date: '2099-01-01',
        session_time: '10:00',
        duration_hours: 1,
        session_type: 'online',
        status,
        // Deliberately wrong — the trigger must overwrite these.
        total_amount: 0,
        platform_fee: 0,
      })
      .select('id, total_amount, platform_fee')
      .single();
    if (error) throw error;
    return data;
  }

  it('recomputes booking amounts server-side, ignoring client values', async () => {
    const booking = await insertBooking();
    expect(booking.platform_fee).toBe(EXPECTED_FEE);
    expect(booking.total_amount).toBe(EXPECTED_TOTAL);
  });

  it('rejects a payout above the withdrawable balance', async () => {
    // No completed+paid bookings yet → available is 0.
    const { error } = await admin.from('tutor_payouts').insert({
      tutor_id: tutorId,
      amount: 5000,
      bank_name: 'CBE',
      account_number: '1000',
      account_name: 'T',
    });
    expect(error, 'over-balance payout should have been rejected').not.toBeNull();
  });

  it('rejects a non-positive payout', async () => {
    const { error } = await admin.from('tutor_payouts').insert({
      tutor_id: tutorId,
      amount: 0,
      bank_name: 'CBE',
      account_number: '1000',
      account_name: 'T',
    });
    expect(error).not.toBeNull();
  });

  // Runs last: this one pledges the whole balance.
  it('allows a payout within the balance once a session is completed + paid', async () => {
    const booking = await insertBooking('completed');
    const { error: payErr } = await admin.from('payments').insert({
      user_id: studentId,
      reference_id: booking.id,
      payment_type: 'tutor_booking',
      method: 'telebirr',
      amount: EXPECTED_TOTAL,
      transaction_id: `${RUN_ID}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'approved',
    });
    if (payErr) throw payErr;

    // Exactly the tutor's share should be withdrawable.
    const { error: okErr } = await admin.from('tutor_payouts').insert({
      tutor_id: tutorId,
      amount: TUTOR_SHARE,
      bank_name: 'CBE',
      account_number: '1000',
      account_name: 'T',
    });
    expect(okErr, 'in-balance payout should have been accepted').toBeNull();

    // A further payout now exceeds the (now zero) balance.
    const { error: overErr } = await admin.from('tutor_payouts').insert({
      tutor_id: tutorId,
      amount: 1,
      bank_name: 'CBE',
      account_number: '1000',
      account_name: 'T',
    });
    expect(overErr).not.toBeNull();
  });
});
