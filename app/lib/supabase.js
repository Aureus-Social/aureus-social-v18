// app/lib/supabase.js — Aureus Social Pro
// Singleton Supabase client for dynamic imports
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: { 'x-app-name': 'aureus-social-pro' },
      },
    })
  : null;
