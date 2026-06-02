/**
 * Platform-agnostic structured logger shared by the admin and mobile apps.
 *
 * Goals (deliberately lightweight — no third-party APM):
 *   - Always write a consistent, structured line to the console.
 *   - Optionally forward entries to a "sink" the app registers (e.g. a Supabase
 *     table) so errors are queryable after the fact.
 *
 * The logger never throws and never lets a failing sink break the app: sink
 * errors are swallowed (logging must not be able to crash the thing it logs).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
  timestamp: string;
}

export type LogSink = (entry: LogEntry) => void | Promise<void>;

interface LoggerConfig {
  /** Forwarding target for entries (e.g. insert into a Supabase table). */
  sink?: LogSink;
  /** Context merged into every entry (e.g. { platform: 'mobile', appVersion }). */
  baseContext?: Record<string, unknown>;
  /** Entries below this level are dropped. Defaults to 'debug'. */
  minLevel?: LogLevel;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let config: LoggerConfig = {};

/** Merge new configuration into the active logger config. */
export function configureLogger(next: LoggerConfig): void {
  config = { ...config, ...next };
}

/** Reset configuration. Primarily for tests. */
export function resetLogger(): void {
  config = {};
}

function serializeError(err: unknown): LogEntry['error'] {
  if (err == null) return undefined;
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { name: 'NonError', message: String(err) };
}

function emit(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown,
): LogEntry | undefined {
  const min = config.minLevel ?? 'debug';
  if (LEVEL_ORDER[level] < LEVEL_ORDER[min]) return undefined;

  const entry: LogEntry = {
    level,
    message,
    context: { ...config.baseContext, ...context },
    error: serializeError(error),
    timestamp: new Date().toISOString(),
  };

  // 1. Console — always.
  const consoleFn =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  const hasContext = Object.keys(entry.context).length > 0;
  consoleFn(
    `[${entry.timestamp}] ${level.toUpperCase()} ${message}`,
    hasContext ? entry.context : '',
    entry.error ?? '',
  );

  // 2. Sink — best effort, never throws, never recurses into the logger.
  if (config.sink) {
    try {
      const result = config.sink(entry);
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch(() => {});
      }
    } catch {
      // Intentionally swallowed: a broken sink must not break the caller.
    }
  }

  return entry;
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  /**
   * Log an error. The second argument is the thrown value (Error or anything),
   * the third is extra structured context.
   */
  error: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    emit('error', message, context, error),
};
