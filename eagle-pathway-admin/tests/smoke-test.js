/**
 * Smoke Tests - Critical Journeys
 * Run with: node tests/smoke-test.js
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase env vars');
  process.exit(1);
}

const smokeTests = [
  {
    name: 'Users table accessible',
    test: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return res.ok;
    }
  },
  {
    name: 'Tutors table accessible',
    test: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tutors?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return res.ok;
    }
  },
  {
    name: 'Applications table accessible',
    test: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return res.ok;
    }
  },
  {
    name: 'Documents table accessible',
    test: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/documents?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return res.ok;
    }
  },
  {
    name: 'Student_tasks table accessible',
    test: async () => {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/student_tasks?select=id&limit=1`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return res.ok;
    }
  }
];

async function runTests() {
  console.log('🧪 Running Smoke Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of smokeTests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ ${test.name}: ${e.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();