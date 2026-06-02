import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, configureLogger, resetLogger, type LogEntry } from '../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    resetLogger();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards entries to the configured sink with merged base context', () => {
    const entries: LogEntry[] = [];
    configureLogger({ sink: (e) => entries.push(e), baseContext: { platform: 'test' } });

    logger.info('hello', { foo: 1 });

    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe('info');
    expect(entries[0].message).toBe('hello');
    expect(entries[0].context).toEqual({ platform: 'test', foo: 1 });
  });

  it('serializes Error objects on logger.error', () => {
    const entries: LogEntry[] = [];
    configureLogger({ sink: (e) => entries.push(e) });

    logger.error('boom', new Error('kaboom'), { route: '/overview' });

    expect(entries[0].error?.name).toBe('Error');
    expect(entries[0].error?.message).toBe('kaboom');
    expect(entries[0].error?.stack).toBeTypeOf('string');
    expect(entries[0].context).toEqual({ route: '/overview' });
  });

  it('drops entries below the configured minimum level', () => {
    const sink = vi.fn();
    configureLogger({ sink, minLevel: 'warn' });

    logger.debug('nope');
    logger.info('nope');
    logger.warn('yes');
    logger.error('yes');

    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('never throws when the sink throws synchronously', () => {
    configureLogger({
      sink: () => {
        throw new Error('sink exploded');
      },
    });

    expect(() => logger.error('still fine')).not.toThrow();
  });

  it('swallows rejected async sink promises', async () => {
    configureLogger({ sink: () => Promise.reject(new Error('async fail')) });

    expect(() => logger.info('fire and forget')).not.toThrow();
    // Give the microtask queue a tick; an unhandled rejection would surface here.
    await Promise.resolve();
  });

  it('still writes to the console when no sink is configured', () => {
    const spy = vi.spyOn(console, 'error');
    logger.error('no sink');
    expect(spy).toHaveBeenCalled();
  });
});
