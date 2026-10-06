import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { rateAppService } from './rateApp';

vi.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => store[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete store[key];
      }),
      clear: vi.fn(async () => {
        store = {};
      }),
    },
  };
});

vi.mock('react-native', () => ({
  Linking: {
    canOpenURL: vi.fn().mockResolvedValue(true),
    openURL: vi.fn().mockResolvedValue(true),
  },
}));

describe('rateAppService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('allows prompting when user has no prior status', async () => {
    const shouldPrompt = await rateAppService.shouldPrompt();
    expect(shouldPrompt).toBe(true);
  });

  it('suppresses prompt when user has marked rated', async () => {
    await rateAppService.markRated();
    const shouldPrompt = await rateAppService.shouldPrompt();
    expect(shouldPrompt).toBe(false);
  });

  it('suppresses prompt when user has opted out with never', async () => {
    await rateAppService.markNever();
    const shouldPrompt = await rateAppService.shouldPrompt();
    expect(shouldPrompt).toBe(false);
  });

  it('suppresses prompt within 7 days of choosing remind later', async () => {
    await rateAppService.markRemindLater();
    const shouldPrompt = await rateAppService.shouldPrompt();
    expect(shouldPrompt).toBe(false);
  });

  it('records positive delight actions', async () => {
    const first = await rateAppService.recordDelightAction();
    expect(first).toBe(1);
    const second = await rateAppService.recordDelightAction();
    expect(second).toBe(2);
  });

  it('opens Google Play Store package URL', async () => {
    await rateAppService.openPlayStore();
    expect(Linking.openURL).toHaveBeenCalledWith('market://details?id=com.eaglepathway.app');
  });
});
