import { isProfileIncomplete } from './profile';
import { User, Application, Document, Booking } from '../types';

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

/**
 * Derives the student's milestone badges from data the app already has — no new
 * tables, no extra tracking. Pure so it can be unit-tested and memoized.
 */
export function computeAchievements(input: {
  user?: Partial<User> | null;
  applications?: Application[];
  documents?: Document[];
  bookings?: Booking[];
}): Achievement[] {
  const apps = input.applications || [];
  const docs = input.documents || [];
  const bookings = input.bookings || [];

  const make = (key: string, title: string, description: string, icon: string, earned: boolean): Achievement => ({
    key, title, description, icon, earned,
  });

  return [
    make('profile', 'Profile Pro', 'Complete your academic profile', '🧑‍🎓', !!input.user && !isProfileIncomplete(input.user)),
    make('first_app', 'First Step', 'Start your first application', '🎯', apps.length >= 1),
    make('doc_upload', 'Paperwork Started', 'Upload your first document', '📄', docs.length >= 1),
    make('doc_verified', 'Verified', 'Get a document approved', '✅', docs.some(d => d.status === 'approved')),
    make('sop', 'Storyteller', 'Draft a statement of purpose', '✍️', apps.some(a => ((a.sop_content || '') as string).trim().length > 0)),
    make('session', 'Coached', 'Book a tutoring session', '👨‍🏫', bookings.length >= 1),
    make('submitted', 'Submitted', 'Submit an application', '🚀', apps.some(a => ['submitted', 'interview', 'accepted'].includes(a.status))),
    make('prolific', 'Go-Getter', 'Have 3+ applications going', '🔥', apps.length >= 3),
    make('accepted', 'Winner', 'Receive a scholarship offer', '🏆', apps.some(a => a.status === 'accepted')),
  ];
}

export function earnedCount(achievements: Achievement[]): number {
  return achievements.filter(a => a.earned).length;
}
