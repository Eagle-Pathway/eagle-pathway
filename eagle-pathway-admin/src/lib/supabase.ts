import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Supports both new sb_publishable_ keys and legacy eyJ... anon keys
const isNewKeyFormat = supabaseKey?.startsWith('sb_publishable_');

export const supabase = createClient(supabaseUrl, supabaseKey);

// Diagnostic logging for development
if (typeof window !== 'undefined') {
  console.log('Supabase initialized:', {
    url: !!supabaseUrl,
    keyType: isNewKeyFormat ? 'new' : 'legacy',
    hasKey: !!supabaseKey
  });
}
