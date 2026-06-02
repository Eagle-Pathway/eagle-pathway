import { vi } from 'vitest';

// Browser-only shims. Guarded so tests that opt into the `node` environment
// (e.g. the live RLS integration test, which needs Node's real fetch) are not
// affected — there `window` is undefined and global.fetch must stay native.
if (typeof window !== 'undefined') {
  global.fetch = vi.fn();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}