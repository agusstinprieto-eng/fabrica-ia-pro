
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder');

if (isPlaceholder) {
    console.warn('Supabase credentials missing or placeholders. App will run in Offline/Demo mode.');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
