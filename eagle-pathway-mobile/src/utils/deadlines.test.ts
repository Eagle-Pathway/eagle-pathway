import { describe, it, expect } from 'vitest';
import {
  daysUntil,
  deadlineUrgency,
  deadlineLabel,
  getApplicationDeadlines,
} from './deadlines';
import type { Application } from '../types';

const NOW = new Date(2026, 0, 1); // 2026-01-01 local

function app(over: Partial<Application> & { id: string; status: string; deadline?: string; name?: string }): Application {
  return {
    id: over.id,
    status: over.status,
    scholarship: over.deadline ? { name: over.name ?? 'S', deadline: over.deadline } : undefined,
  } as unknown as Application;
}

describe('daysUntil', () => {
  it('reads a same-day deadline as 0 regardless of clock time', () => {
    expect(daysUntil('2026-01-01', new Date(2026, 0, 1, 23, 59))).toBe(0);
  });
  it('counts whole days forward and backward', () => {
    expect(daysUntil('2026-01-08', NOW)).toBe(7);
    expect(daysUntil('2025-12-30', NOW)).toBe(-2);
  });
  it('returns NaN for an invalid date', () => {
    expect(Number.isNaN(daysUntil('not-a-date', NOW))).toBe(true);
  });
});

describe('deadlineUrgency', () => {
  it('buckets by days left', () => {
    expect(deadlineUrgency(-1)).toBe('overdue');
    expect(deadlineUrgency(0)).toBe('critical');
    expect(deadlineUrgency(7)).toBe('critical');
    expect(deadlineUrgency(8)).toBe('soon');
    expect(deadlineUrgency(14)).toBe('soon');
    expect(deadlineUrgency(15)).toBe('upcoming');
  });
});

describe('deadlineLabel', () => {
  it('phrases the countdown', () => {
    expect(deadlineLabel(-3)).toBe('Closed');
    expect(deadlineLabel(0)).toBe('Due today');
    expect(deadlineLabel(1)).toBe('1 day left');
    expect(deadlineLabel(5)).toBe('5 days left');
  });
});

describe('getApplicationDeadlines', () => {
  it('keeps active apps with a deadline in [0, withinDays], soonest first', () => {
    const apps = [
      app({ id: 'a', status: 'submitted', deadline: '2026-01-20', name: 'Far' }),
      app({ id: 'b', status: 'documents', deadline: '2026-01-03', name: 'Near' }),
    ];
    const result = getApplicationDeadlines(apps, 30, NOW);
    expect(result.map((r) => r.key)).toEqual(['b', 'a']);
    expect(result[0]).toMatchObject({ title: 'Near', daysLeft: 2 });
  });

  it('excludes accepted/rejected, missing-deadline, overdue, and out-of-window apps', () => {
    const apps = [
      app({ id: 'accepted', status: 'accepted', deadline: '2026-01-05' }),
      app({ id: 'rejected', status: 'rejected', deadline: '2026-01-05' }),
      app({ id: 'nodate', status: 'submitted' }),
      app({ id: 'overdue', status: 'submitted', deadline: '2025-12-25' }),
      app({ id: 'faraway', status: 'submitted', deadline: '2026-06-01' }),
      app({ id: 'keep', status: 'submitted', deadline: '2026-01-10' }),
    ];
    const result = getApplicationDeadlines(apps, 30, NOW);
    expect(result.map((r) => r.key)).toEqual(['keep']);
  });

  it('handles undefined input', () => {
    expect(getApplicationDeadlines(undefined, 30, NOW)).toEqual([]);
  });
});
