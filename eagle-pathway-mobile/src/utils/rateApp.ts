import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANDROID_PACKAGE = 'com.eaglepathway.app';
const STORAGE_KEYS = {
  STATUS: '@eagle_rate_status',
  LAST_PROMPT: '@eagle_last_rate_prompt',
  ACTIONS_COUNT: '@eagle_delight_actions',
};

export type RateStatus = 'rated' | 'remind_later' | 'never';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const rateAppService = {
  /**
   * Opens Google Play Store directly to the Eagle Pathway listing
   */
  async openPlayStore(): Promise<void> {
    const marketUrl = `market://details?id=${ANDROID_PACKAGE}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

    try {
      const supported = await Linking.canOpenURL(marketUrl);
      if (supported) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  },

  /**
   * Increments positive engagement actions (e.g. applications submitted, bookings made)
   */
  async recordDelightAction(): Promise<number> {
    try {
      const current = await AsyncStorage.getItem(STORAGE_KEYS.ACTIONS_COUNT);
      const count = (parseInt(current || '0', 10) || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIONS_COUNT, count.toString());
      return count;
    } catch {
      return 1;
    }
  },

  /**
   * Checks whether the user is eligible for an in-app rating prompt.
   * Ensures users are never spammed.
   */
  async shouldPrompt(): Promise<boolean> {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.STATUS);
      if (status === 'rated' || status === 'never') {
        return false;
      }

      const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PROMPT);
      if (lastPromptStr) {
        const lastPromptTime = parseInt(lastPromptStr, 10);
        if (Date.now() - lastPromptTime < SEVEN_DAYS_MS) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * User tapped "Rate on Google Play"
   */
  async markRated(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATUS, 'rated');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
    } catch {}
  },

  /**
   * User chose "Remind Me Later" (7-day cooldown)
   */
  async markRemindLater(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATUS, 'remind_later');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
    } catch {}
  },

  /**
   * User chose "Don't ask again"
   */
  async markNever(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STATUS, 'never');
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PROMPT, Date.now().toString());
    } catch {}
  },
};
