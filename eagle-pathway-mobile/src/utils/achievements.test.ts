import { describe, it, expect } from 'vitest';
import { computeAchievements, earnedCount } from './achievements';
import type { User, Application, Document, Booking } from '../types';

const completeUser = { gpa: 3.5, interested_subjects: ['stem'], target_degree_level: 'masters' } as unknown as User;

describe('computeAchievements', () => {
  it('earns nothing for a brand-new empty student', () => {
    const a = computeAchievements({ user: null, applications: [], documents: [], bookings: [] });
    expect(earnedCount(a)).toBe(0);
    expect(a).toHaveLength(9);
  });

  it('earns profile when the profile is complete', () => {
    const a = computeAchievements({ user: completeUser });
    expect(a.find(x => x.key === 'profile')!.earned).toBe(true);
  });

  it('earns app/submitted/prolific from applications', () => {
    const apps = [
      { id: '1', status: 'submitted', sop_content: 'My essay…' },
      { id: '2', status: 'documents' },
      { id: '3', status: 'personal_info' },
    ] as unknown as Application[];
    const a = computeAchievements({ applications: apps });
    const by = (k: string) => a.find(x => x.key === k)!.earned;
    expect(by('first_app')).toBe(true);
    expect(by('submitted')).toBe(true);
    expect(by('sop')).toBe(true);
    expect(by('prolific')).toBe(true); // 3 apps
    expect(by('accepted')).toBe(false);
  });

  it('earns doc + verified + session + winner', () => {
    const a = computeAchievements({
      documents: [{ status: 'approved' } as Document, { status: 'pending' } as Document],
      bookings: [{ status: 'pending' } as Booking],
      applications: [{ id: '1', status: 'accepted' } as unknown as Application],
    });
    const by = (k: string) => a.find(x => x.key === k)!.earned;
    expect(by('doc_upload')).toBe(true);
    expect(by('doc_verified')).toBe(true);
    expect(by('session')).toBe(true);
    expect(by('accepted')).toBe(true);
  });
});
