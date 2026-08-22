import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_SOP_PREFIX = 'draft:sop:';
const DRAFT_APPLY_PREFIX = 'draft:apply:';

export interface ApplicationDraft {
  scholarshipId: string;
  sopContent?: string;
  transactionId?: string;
  selectedPaymentMethod?: string;
  packageTier?: string;
  updatedAt: string;
}

export const draftStore = {
  /**
   * Persists an SOP draft for a specific scholarship ID.
   */
  async saveSopDraft(scholarshipId: string, text: string): Promise<void> {
    try {
      const key = `${DRAFT_SOP_PREFIX}${scholarshipId}`;
      if (!text || text.trim() === '') {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, text);
      }
    } catch (e) {
      console.warn('[DraftStore] Failed to save SOP draft:', e);
    }
  },

  /**
   * Retrieves an SOP draft for a specific scholarship ID.
   */
  async getSopDraft(scholarshipId: string): Promise<string | null> {
    try {
      const key = `${DRAFT_SOP_PREFIX}${scholarshipId}`;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn('[DraftStore] Failed to load SOP draft:', e);
      return null;
    }
  },

  /**
   * Clears an SOP draft after successful submission or review completion.
   */
  async clearSopDraft(scholarshipId: string): Promise<void> {
    try {
      const key = `${DRAFT_SOP_PREFIX}${scholarshipId}`;
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[DraftStore] Failed to clear SOP draft:', e);
    }
  },

  /**
   * Persists an application form draft locally.
   */
  async saveApplicationDraft(scholarshipId: string, draft: Partial<ApplicationDraft>): Promise<void> {
    try {
      const key = `${DRAFT_APPLY_PREFIX}${scholarshipId}`;
      const payload: ApplicationDraft = {
        scholarshipId,
        sopContent: draft.sopContent || '',
        transactionId: draft.transactionId || '',
        selectedPaymentMethod: draft.selectedPaymentMethod || '',
        packageTier: draft.packageTier || '',
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.warn('[DraftStore] Failed to save application draft:', e);
    }
  },

  /**
   * Retrieves an application form draft locally.
   */
  async getApplicationDraft(scholarshipId: string): Promise<ApplicationDraft | null> {
    try {
      const key = `${DRAFT_APPLY_PREFIX}${scholarshipId}`;
      const json = await AsyncStorage.getItem(key);
      return json ? JSON.parse(json) as ApplicationDraft : null;
    } catch (e) {
      console.warn('[DraftStore] Failed to load application draft:', e);
      return null;
    }
  },

  /**
   * Clears an application form draft after successful submission.
   */
  async clearApplicationDraft(scholarshipId: string): Promise<void> {
    try {
      const key = `${DRAFT_APPLY_PREFIX}${scholarshipId}`;
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn('[DraftStore] Failed to clear application draft:', e);
    }
  },
};
