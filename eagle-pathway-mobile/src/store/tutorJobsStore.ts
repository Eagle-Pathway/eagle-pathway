import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

export interface TutorJobPost {
  id: string;
  created_at: string;
  place: string;
  grade: string;
  subjects: string[];
  session_hours: number;
  days_per_week: number;
  start_time: string;
  hourly_rate: number;
  gender_preference: string;
  status: string;
}

export interface TutorJobApplication {
  id: string;
  job_post_id: string;
  status: string;
  created_at: string;
  job_post?: TutorJobPost;
}

interface TutorJobsState {
  jobs: TutorJobPost[];
  myApplications: TutorJobApplication[];
  loading: boolean;
  fetchJobs: () => Promise<void>;
  fetchMyApplications: () => Promise<void>;
}

export const useTutorJobsStore = create<TutorJobsState>((set, get) => ({
  jobs: [],
  myApplications: [],
  loading: false,

  fetchJobs: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('tutor_job_posts')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ jobs: data as TutorJobPost[] });
    }
    set({ loading: false });
  },

  fetchMyApplications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    set({ loading: true });
    const { data, error } = await supabase
      .from('tutor_job_applications')
      .select('*, job_post:tutor_job_posts(*)')
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      set({ myApplications: data as any });
    }
    set({ loading: false });
  }
}));
