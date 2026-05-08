import { vi } from 'vitest';

const mockAlert = vi.fn();
vi.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: mockAlert,
}));

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

global.setImmediate = global.setImmediate || ((...args: unknown[]) => setTimeout(...args)) as typeof setImmediate;