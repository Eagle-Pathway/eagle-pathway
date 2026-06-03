import * as Notifications from 'expo-notifications';
import { logger } from '@eagle-pathway/shared';
import { DeadlineItem } from '../utils/deadlines';

// Remind the student this many days before each application deadline.
const REMINDER_OFFSETS_DAYS = [7, 3, 1];
const REMINDER_TAG = 'deadline_reminder';
const MS_PER_DAY = 86_400_000;

/**
 * Schedule local notifications ahead of each upcoming application deadline.
 * Idempotent: cancels previously-scheduled deadline reminders first, then
 * re-schedules from the current set, so it can be called on every data refresh.
 * Best-effort — never throws (a reminder failure must not affect the UI).
 */
export async function syncDeadlineReminders(items: DeadlineItem[]): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content?.data as { type?: string } | undefined)?.type === REMINDER_TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );

    const now = Date.now();
    for (const item of items) {
      const deadlineMs = new Date(item.deadline).getTime();
      if (Number.isNaN(deadlineMs)) continue;

      for (const offset of REMINDER_OFFSETS_DAYS) {
        const fireAt = deadlineMs - offset * MS_PER_DAY;
        if (fireAt <= now) continue; // only future reminders

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ ${offset} day${offset > 1 ? 's' : ''} left: ${item.title}`,
            body: `Your ${item.title} deadline is approaching. Tap to finish your application.`,
            data: { type: REMINDER_TAG, key: item.key },
            sound: true,
          },
          // Date trigger; cast keeps us version-tolerant across expo-notifications.
          trigger: { type: 'date', date: new Date(fireAt) } as unknown as Notifications.NotificationTriggerInput,
        });
      }
    }
  } catch (e) {
    logger.warn('Failed to sync deadline reminders', { error: String(e) });
  }
}
