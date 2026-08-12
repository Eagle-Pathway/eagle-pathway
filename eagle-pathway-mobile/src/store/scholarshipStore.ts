import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scholarshipsService } from '../services/scholarships';
import { Scholarship, Application, PackageTier } from '../types';

interface ScholarshipState {
  scholarships: Scholarship[];
  applications: Application[];
  savedScholarshipIds: string[];
  recommendedScholarships: Scholarship[];
  isLoadingScholarships: boolean;
  isReviewingSOP: boolean;
  isGeneratingMagicSOP: boolean;

  // Actions
  loadScholarships: (filters?: Record<string, unknown>) => Promise<void>;
  loadRecommendations: (userId: string) => Promise<void>;
  loadApplications: (userId: string) => Promise<void>;
  createApplication: (userId: string, scholarshipId: string, packageTier: PackageTier, sopContent?: string) => Promise<Application>;
  updateSOP: (applicationId: string, content: string) => Promise<void>;
  reviewSOP: (content: string, scholarshipId?: string, studentId?: string) => Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
    inline_comments?: {
      paragraph_index: number;
      quote: string;
      severity: 'strength' | 'suggestion' | 'critical';
      comment: string;
      suggested_revision?: string;
    }[];
  }>;
  generateMagicSOP: (student: any, scholarship?: Partial<Scholarship> | null) => Promise<string>;
  
  // Persistence
  toggleSaveScholarship: (id: string) => void;
  loadSavedScholarships: () => Promise<void>;
}

const STORAGE_KEY = '@eagle_saved_scholarships';
const CACHE_SCHOLARSHIPS = '@cache_scholarships';
const CACHE_APPLICATIONS = '@cache_applications';

export const useScholarshipStore = create<ScholarshipState>((set, get) => ({
  scholarships: [],
  applications: [],
  savedScholarshipIds: [],
  recommendedScholarships: [],
  isLoadingScholarships: false,
  isReviewingSOP: false,
  isGeneratingMagicSOP: false,

  loadScholarships: async (filters) => {
    set({ isLoadingScholarships: true });
    try {
      const scholarships = await scholarshipsService.getScholarships(filters);
      set({ scholarships });
      // Cache the unfiltered list for offline viewing.
      if (!filters || Object.keys(filters).length === 0) {
        AsyncStorage.setItem(CACHE_SCHOLARSHIPS, JSON.stringify(scholarships)).catch(() => {});
      }
    } catch (e) {
      // Offline / failed: fall back to the cached list if we have one.
      const cached = await AsyncStorage.getItem(CACHE_SCHOLARSHIPS).catch(() => null);
      if (cached) {
        if (get().scholarships.length === 0) {
          try { set({ scholarships: JSON.parse(cached) }); } catch { /* ignore */ }
        }
        // Showed cached data — don't surface an error.
      } else {
        throw e; // nothing to show → let the screen render its error state
      }
    } finally {
      set({ isLoadingScholarships: false });
    }
  },

  loadRecommendations: async (userId) => {
    try {
      const recommended = await scholarshipsService.getRecommendedScholarships(userId);
      set({ recommendedScholarships: recommended });
    } catch (e) {
      console.error('Error loading recommendations:', e);
    }
  },

  loadApplications: async (userId) => {
    const cacheKey = `${CACHE_APPLICATIONS}_${userId}`;
    try {
      const applications = await scholarshipsService.getStudentApplications(userId);
      set({ applications });
      AsyncStorage.setItem(cacheKey, JSON.stringify(applications)).catch(() => {});
    } catch (e) {
      const cached = await AsyncStorage.getItem(cacheKey).catch(() => null);
      if (cached) {
        if (get().applications.length === 0) {
          try { set({ applications: JSON.parse(cached) }); } catch { /* ignore */ }
        }
      } else {
        throw e;
      }
    }
  },

  createApplication: async (userId, scholarshipId, packageTier, sopContent) => {
    const application = await scholarshipsService.createApplication({
      studentId: userId,
      scholarshipId,
      packageTier,
      sopContent,
    });
    set(state => ({ applications: [application, ...state.applications] }));
    return application;
  },

  updateSOP: async (applicationId, content) => {
    await scholarshipsService.updateSOPContent(applicationId, content);
    set(state => ({
      applications: state.applications.map(a => 
        a.id === applicationId ? { ...a, sop_content: content } : a
      )
    }));
  },

  reviewSOP: async (content, scholarshipId, studentId) => {
    set({ isReviewingSOP: true });
    try {
      return await scholarshipsService.getSOPFeedback(content, scholarshipId, studentId);
    } finally {
      set({ isReviewingSOP: false });
    }
  },

  generateMagicSOP: async (student, scholarship) => {
    set({ isGeneratingMagicSOP: true });
    try {
      return await scholarshipsService.generateMagicSOP(student, scholarship);
    } finally {
      set({ isGeneratingMagicSOP: false });
    }
  },

  toggleSaveScholarship: (id) => {
    const { savedScholarshipIds } = get();
    const newSaved = savedScholarshipIds.includes(id)
      ? savedScholarshipIds.filter(s => s !== id)
      : [...savedScholarshipIds, id];
      
    set({ savedScholarshipIds: newSaved });
    
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved)).catch(err => 
      console.error('Persistence failed:', err)
    );
  },

  loadSavedScholarships: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          set({ savedScholarshipIds: parsed });
        }
      }
    } catch (e) {
      console.error('Failed to load saved scholarships:', e);
    }
  },
}));
