import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function isValidSupabaseUrl(url?: string): url is string {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('PASTE_YOUR_SUPABASE_URL_HERE')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidSupabaseKey(key?: string): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  return Boolean(trimmed) && !trimmed.includes('PASTE_YOUR_PUBLISHABLE_KEY_HERE');
}

export const isSupabaseConfigured =
  isValidSupabaseUrl(supabaseUrl) && isValidSupabaseKey(supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!.trim(), supabaseAnonKey!.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
