/**
 * Wraps a promise with a timeout safety net.
 * If the target promise doesn't settle within `ms` milliseconds, it rejects with a timeout error.
 */
export const withTimeout = <T>(promise: Promise<T>, ms = 15000): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!));
};
