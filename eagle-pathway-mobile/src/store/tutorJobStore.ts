import { create } from 'zustand';
import { tutorJobsService } from '../services/tutorJobs';
import type { TutorJobPost, TutorJobApplication, TutorApplication } from '../types';

interface TutorJobState {
  // Jobs
  jobs: TutorJobPost[];
  loadingJobs: boolean;
  selectedJob: TutorJobPost | null;

  // Applications
  applications: TutorJobApplication[];
  loadingApplications: boolean;

  // Tutor application (profile verification)
  tutorApplication: TutorApplication | null;
  loadingTutorApp: boolean;

  // Actions
  loadJobs: () => Promise<void>;
  loadJobDetail: (jobId: string) => Promise<void>;
  loadApplications: (userId: string) => Promise<void>;
  loadTutorApplication: (tutorId: string) => Promise<void>;
  createTutorApplication: (params: {
    tutorId: string;
    educationStatus: string;
    livingAddress: string;
    universityName: string;
    phoneNumber: string;
    telegramUsername: string;
    cgpa: string;
    grade10Uri?: string;
    grade10Name?: string;
    grade12Uri?: string;
    grade12Name?: string;
    transcriptUri?: string;
    transcriptName?: string;
  }) => Promise<TutorApplication>;
  applyForJob: (params: {
    jobPostId: string;
    applicantId: string;
    educationStatus: string;
    livingAddress: string;
    universityName: string;
    phoneNumber: string;
    telegramUsername: string;
    cgpa: string;
    grade10Uri?: string;
    grade10Name?: string;
    grade12Uri?: string;
    grade12Name?: string;
    transcriptUri?: string;
    transcriptName?: string;
    existingGrade10Url?: string;
    existingGrade12Url?: string;
    existingTranscriptUrl?: string;
  }) => Promise<TutorJobApplication>;
  clearSelectedJob: () => void;
}

export const useTutorJobStore = create<TutorJobState>((set, get) => ({
  jobs: [],
  loadingJobs: false,
  selectedJob: null,
  applications: [],
  loadingApplications: false,
  tutorApplication: null,
  loadingTutorApp: false,

  loadJobs: async () => {
    set({ loadingJobs: true });
    try {
      const jobs = await tutorJobsService.getOpenJobs();
      set({ jobs });
    } catch (e) {
      console.error('Failed to load jobs:', e);
    } finally {
      set({ loadingJobs: false });
    }
  },

  loadJobDetail: async (jobId) => {
    try {
      const job = await tutorJobsService.getJobById(jobId);
      set({ selectedJob: job });
    } catch (e) {
      console.error('Failed to load job detail:', e);
    }
  },

  loadApplications: async (userId) => {
    set({ loadingApplications: true });
    try {
      const applications = await tutorJobsService.getUserApplications(userId);
      set({ applications });
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      set({ loadingApplications: false });
    }
  },

  loadTutorApplication: async (tutorId) => {
    set({ loadingTutorApp: true });
    try {
      const app = await tutorJobsService.getTutorApplication(tutorId);
      set({ tutorApplication: app });
    } catch (e) {
      console.error('Failed to load tutor application:', e);
    } finally {
      set({ loadingTutorApp: false });
    }
  },

  createTutorApplication: async (params) => {
    const app = await tutorJobsService.createTutorApplication(params);
    set({ tutorApplication: app });
    return app;
  },

  applyForJob: async (params) => {
    const app = await tutorJobsService.applyForJob(params);
    await get().loadApplications(params.applicantId);
    return app;
  },

  clearSelectedJob: () => set({ selectedJob: null }),
}));
