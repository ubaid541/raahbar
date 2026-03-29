import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all guesthouses from Supabase.
 * @returns {Promise<{ data: object[], error: object|null }>}
 */
export async function fetchGuesthouses() {
  const { data, error } = await supabase
    .from('guesthouses')
    .select('*')
    .order('name', { ascending: true });
  return { data, error };
}

/**
 * Fetch all pass statuses from Supabase.
 * @returns {Promise<{ data: object[], error: object|null }>}
 */
export async function fetchPassStatuses() {
  const { data, error } = await supabase
    .from('pass_status')
    .select('*')
    .order('name', { ascending: true });
  return { data, error };
}
