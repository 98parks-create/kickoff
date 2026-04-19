import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks to avoid top-level crashes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Key is missing. Cloud features will not work.');
}

// Create client with fail-safe URL if missing (dummy URL)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
