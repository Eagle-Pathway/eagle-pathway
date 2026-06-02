import { configureLogger, type LogEntry } from '@eagle-pathway/shared';
import { supabase } from './supabase';

/**
 * Wires the shared logger's Supabase sink for the admin app. Idempotent — safe
 * to call from the root layout init and from the error boundaries (which may
 * render before the layout init runs). Only warn/error are persisted; all
 * levels still reach the console.
 */
let configured = false;

export function initErrorLogging(): void {
  if (configured) return;
  configured = true;

  configureLogger({
    baseContext: { platform: 'admin' },
    minLevel: 'info',
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
      platform: 'admin',
      user_id: data.session?.user?.id ?? null,
    });
  } catch {
    // Telemetry failures must never surface to the user or recurse into the logger.
  }
}
