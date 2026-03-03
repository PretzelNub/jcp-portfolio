import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanitize URL: remove trailing slashes and whitespace
const supabaseUrl = rawUrl?.trim().replace(/\/$/, '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY'
);

if (!isSupabaseConfigured) {
  console.warn('Supabase URL or Anon Key is missing or using placeholder values. Please check your environment variables.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
