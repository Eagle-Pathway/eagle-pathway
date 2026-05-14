import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Returns a Supabase client with SERVICE_ROLE privileges.
 * ONLY use this on the server (Server Actions, API Routes).
 */
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client.');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
