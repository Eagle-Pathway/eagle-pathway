import Constants from 'expo-constants';
import { configureLogger, type LogEntry } from '@eagle-pathway/shared';
import { supabase } from './supabase';

/**
 * Wires the shared logger's Supabase sink for the mobile app. Call once at
 * startup. Only warn/error entries are persisted to keep the table small; all
 * levels still go to the console via the logger itself.
 */
let configured = false;

export function initErrorLogging(): void {
  if (configured) return;
  configured = true;

  const appVersion = Constants.expoConfig?.version ?? 'unknown';

  configureLogger({
    baseContext: { platform: 'mobile', appVersion },
    minLevel: __DEV__ ? 'debug' : 'info',
    sink: persistEntry,
  });
}

async function persistEntry(entry: LogEntry): Promise<void> {
  if (entry.level !== 'warn' && entry.level !== 'error') return;
  try {
    const { data } = await supabase.auth.getSession();
    await supabase.from('client_errors').insert({
      level: entry.level,
      message: entry.message.slice(0, 2000),
      context: entry.context,
      stack: entry.error?.stack ?? null,
      platform: 'mobile',
      app_version: typeof entry.context.appVersion === 'string' ? entry.context.appVersion : null,
      user_id: data.session?.user?.id ?? null,
    });
  } catch {
    // Never let telemetry failures surface to the user or recurse into the logger.
  }
}
