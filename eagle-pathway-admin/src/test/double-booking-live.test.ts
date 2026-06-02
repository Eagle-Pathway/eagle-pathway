// @vitest-environment node
// Supabase auth-js needs Node's native fetch; opt into the node environment.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Live test for the tutor double-booking guard
 * (supabase_migration_prevent_double_booking.sql).
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
  console.warn('[double-booking] SKIPPED — set RLS_TEST_LIVE=1 + service-role key to run.');
}

const RUN_ID = `dblbook-test-${Date.now()}`;
const SLOT = { session_date: '2099-02-02', session_time: '14:00' };

describe.runIf(LIVE)('tutor double-booking guard', () => {
  let admin: SupabaseClient;
  let studentId: string;
  let tutorId: string;
  let firstBookingId: string;
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

  function booking(status: string) {
    return {
      student_id: studentId,
      tutor_id: tutorId,
      subject: 'Physics',
      ...SLOT,
      duration_hours: 1,
      session_type: 'online',
      status,
      total_amount: 440,
      platform_fee: 40,
    };
  }

  beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    studentId = await makeUser('student');
    const tutorUserId = await makeUser('tutor');
    const { data: tutor, error } = await admin
      .from('tutors')
      .insert({ user_id: tutorUserId, hourly_rate: 400, is_verified: true })
      .select('id')
      .single();
    if (error || !tutor) throw new Error(`tutor insert failed: ${error?.message}`);
    tutorId = tutor.id;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    for (const id of createdAuthIds) {
      await admin.auth.admin.deleteUser(id).catch(() => {});
    }
  }, 60_000);

  it('rejects a second active booking for the same tutor + slot', async () => {
    const first = await admin.from('bookings').insert(booking('pending')).select('id').single();
    expect(first.error).toBeNull();
    firstBookingId = first.data!.id;

    const second = await admin.from('bookings').insert(booking('confirmed')).select('id');
    expect(second.error, 'duplicate active slot booking should have been rejected').not.toBeNull();
  });

  it('frees the slot once the holding booking is cancelled', async () => {
    // Cancel the booking that holds the slot, then a fresh active booking fits.
    const cancel = await admin.from('bookings').update({ status: 'cancelled' }).eq('id', firstBookingId);
    expect(cancel.error).toBeNull();

    const rebook = await admin.from('bookings').insert(booking('pending')).select('id');
    expect(rebook.error, 'a freed slot should be re-bookable').toBeNull();
  });
});
