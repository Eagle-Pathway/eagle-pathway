import { describe, it, expect, vi } from 'vitest';

vi.mock('./supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));

import { localInterviewQuestions, localAnswerFeedback } from './interview';

describe('localInterviewQuestions', () => {
  it('returns the requested count, clamped to 3..8', () => {
    expect(localInterviewQuestions(null, null, 5)).toHaveLength(5);
    expect(localInterviewQuestions(null, null, 1)).toHaveLength(3);
    expect(localInterviewQuestions(null, null, 99)).toHaveLength(8);
  });

  it('personalizes with scholarship + student context', () => {
    const qs = localInterviewQuestions(
      { organization: 'Chevening', country: 'the UK', fields_of_study: ['Engineering'] } as never,
      { interested_subjects: ['Robotics'] } as never,
      5,
    );
    expect(qs.join(' ')).toContain('Chevening');
    expect(qs.join(' ')).toContain('the UK');
    expect(qs.join(' ')).toContain('Robotics');
  });
});

describe('localAnswerFeedback', () => {
  it('scores a thin answer low and advises depth', () => {
    const fb = localAnswerFeedback('Why you?', 'I am good.');
    expect(fb.score).toBeLessThan(55);
    expect(fb.tips.some((t) => /\d+.*words/.test(t))).toBe(true);
  });

  it('rewards a longer answer with a concrete example', () => {
    const answer =
      'When I led my university robotics club in 2023, I organized a city-wide competition. ' +
      'I recruited 40 students, raised sponsorship, and we built three robots. The experience taught ' +
      'me how to delegate and keep a team motivated under deadline pressure, and it shaped my goals.';
    const fb = localAnswerFeedback('Tell us about leadership.', answer);
    expect(fb.score).toBeGreaterThanOrEqual(75);
    expect(fb.feedback).toMatch(/strong/i);
  });

  it('always returns at most 4 tips and a 0..100 score', () => {
    const fb = localAnswerFeedback('Q', 'short');
    expect(fb.tips.length).toBeLessThanOrEqual(4);
    expect(fb.score).toBeGreaterThanOrEqual(0);
    expect(fb.score).toBeLessThanOrEqual(100);
  });
});
