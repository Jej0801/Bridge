import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Bridge runs on mock data when these are absent. The data layer checks
// `isSupabaseConfigured` before ever touching the client, so the app
// boots cleanly with no .env file.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  if (!client) {
    client = createClient(url as string, anonKey as string);
  }
  return client;
}
