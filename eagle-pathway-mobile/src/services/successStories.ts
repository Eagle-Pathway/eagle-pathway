import { supabase } from './supabase';

export interface SuccessStory {
  id: string;
  student_name: string;
  avatar_url?: string | null;
  scholarship_name: string;
  scholarship_id?: string | null;
  country?: string | null;
  country_flag?: string | null;
  year?: number | null;
  quote: string;
  story?: string | null;
  created_at: string;
}

export const successStoriesService = {
  async list(filters?: { scholarshipName?: string; country?: string }): Promise<SuccessStory[]> {
    let query = supabase
      .from('success_stories')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (filters?.scholarshipName) query = query.eq('scholarship_name', filters.scholarshipName);
    else if (filters?.country) query = query.eq('country', filters.country);

    const { data, error } = await query;
    if (error) throw error;
    return data as SuccessStory[];
  },
};
