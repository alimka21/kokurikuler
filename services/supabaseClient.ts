
import { createClient } from '@supabase/supabase-js';

// Fallback credentials (Provided manually to fix missing env error)
const FALLBACK_URL = 'https://ndawqyzvvyzqtqyxchjl.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYXdxeXp2dnl6cXRxeXhjaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjgxNzIsImV4cCI6MjA4NjgwNDE3Mn0.GWF1r6GPORrooNRVDkWrRDeGmowTHCod8NF3HFUMc5M';

// EXPORT THESE CONSTANTS
let envUrl = import.meta.env.VITE_SUPABASE_URL || '';
let envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate URL format
if (envUrl && !envUrl.startsWith('http')) {
    console.warn("VITE_SUPABASE_URL is invalid. Using fallback.");
    envUrl = '';
}

export const supabaseUrl = envUrl || FALLBACK_URL;
export const supabaseAnonKey = envKey || FALLBACK_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn("CRITICAL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Please check your .env file.");
}

// Ensure valid strings are passed to createClient
// If still missing (unlikely with fallback), use placeholder to prevent white-screen crash
const validUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(
  validUrl,
  validKey
);

// Helper: Ambil Token JWT secara manual (untuk kebutuhan debugging RLS di SQL Editor)
export const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
};
