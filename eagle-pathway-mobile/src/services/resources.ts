import { supabase } from './supabase';
import type { UserRole } from '../types';

const SIGNED_URL_TTL_SECONDS = 3600;

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  audience: 'all' | 'student' | 'tutor' | 'parent';
  resource_type: 'file' | 'link';
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  external_url?: string | null;
  created_at: string;
}

export const resourcesService = {
  // Published resources visible to the given role. RLS already restricts rows to
  // audience='all' or the caller's role; passing the role keeps the query
  // explicit and correct even if the policy is ever relaxed.
  async list(role: UserRole): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_published', true)
      .in('audience', ['all', role])
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Resource[];
  },

  // Mint a fresh signed URL for a file resource at tap time. Stored paths are
  // private and signed URLs expire, so we sign on demand rather than caching.
  // Returns null when the file can't be signed (e.g. it was removed).
  async getFileUrl(filePath: string): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('resources')
      .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  },
};
