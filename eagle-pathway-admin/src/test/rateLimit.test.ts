import { describe, it, expect, afterEach } from 'vitest';
import { enforceRateLimit, rateLimitHeaders } from '../lib/rateLimit';

describe('rateLimitHeaders', () => {
  it('exposes limit and remaining for an allowed result', () => {
    const headers = rateLimitHeaders({ allowed: true, limit: 10, remaining: 7, reset: 0 });
    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('7');
    expect(headers['Retry-After']).toBeUndefined();
    expect(headers['X-RateLimit-Reset']).toBeUndefined();
  });

  it('adds Retry-After and Reset when denied with a known reset', () => {
    const reset = Math.floor(Date.now() / 1000) + 42;
    const headers = rateLimitHeaders({ allowed: false, limit: 10, remaining: 0, reset });
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['X-RateLimit-Reset']).toBe(String(reset));
    expect(Number(headers['Retry-After'])).toBeGreaterThan(0);
    expect(Number(headers['Retry-After'])).toBeLessThanOrEqual(42);
  });

  it('omits Retry-After when reset is unknown', () => {
    const headers = rateLimitHeaders({ allowed: false, limit: 10, remaining: 0, reset: 0 });
    expect(headers['Retry-After']).toBeUndefined();
  });
});

describe('enforceRateLimit', () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = url;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anon;
    process.env.SUPABASE_SERVICE_ROLE_KEY = service;
  });

  it('fails open (allows) when the limiter backend is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await enforceRateLimit('test:user', 10, 60);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(10);
  });
});
