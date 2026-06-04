import { Application } from '../types';

export type DeadlineUrgency = 'overdue' | 'critical' | 'soon' | 'upcoming';

export interface DeadlineItem {
  /** Stable key (the application id) for dedupe + reminder scheduling. */
  key: string;
  title: string;
  deadline: string; // ISO date (YYYY-MM-DD)
  daysLeft: number;
}

/** Whole calendar days from `now` to `deadline`, using local midnight on both
 *  ends so a deadline "today" reads 0 (not -1 because of clock time). */
export function daysUntil(deadline: string, now: Date = new Date()): number {
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return NaN;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function deadlineUrgency(daysLeft: number): DeadlineUrgency {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= 7) return 'critical';
  if (daysLeft <= 14) return 'soon';
  return 'upcoming';
}

const FINAL_STATUSES = ['accepted', 'rejected'];

/**
 * Upcoming deadlines for the student's in-progress applications, sorted soonest
 * first. Only applications that are still active and whose joined scholarship
 * deadline falls within [0, withinDays] are included.
 */
export function getApplicationDeadlines(
  applications: Application[] | undefined,
  withinDays = 30,
  now: Date = new Date(),
): DeadlineItem[] {
  const items: DeadlineItem[] = [];
  for (const app of applications || []) {
    if (FINAL_STATUSES.includes(app.status)) continue;
    const deadline = app.scholarship?.deadline;
    if (!deadline) continue;
    const daysLeft = daysUntil(deadline, now);
    if (Number.isNaN(daysLeft) || daysLeft < 0 || daysLeft > withinDays) continue;
    items.push({
      key: app.id,
      title: app.scholarship?.name ?? 'Scholarship',
      deadline,
      daysLeft,
    });
  }
  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Human label for a countdown chip. */
export function deadlineLabel(daysLeft: number): string {
  if (daysLeft < 0) return 'Closed';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}
