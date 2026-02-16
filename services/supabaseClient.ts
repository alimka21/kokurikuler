
import { createClient } from '@supabase/supabase-js';

// 1. Strict Environment Access Helper
const getEnv = (key: string): string => {
    // Priority 1: Vite (import.meta.env)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }

    // Priority 2: Process (Node/Webpack/Jest compatibility)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
    }
    
    return '';
};

// Known working credentials from your project (Fallback)
const DEFAULT_URL = 'https://ndawqyzvvyzqtqyxchjl.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYXdxeXp2dnl6cXRxeXhjaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjgxNzIsImV4cCI6MjA4NjgwNDE3Mn0.GWF1r6GPORrooNRVDkWrRDeGmowTHCod8NF3HFUMc5M';

// 2. Load Configuration (Prioritize Env, Fallback to Default)
const supabaseUrl = getEnv('VITE_SUPABASE_URL').trim() || DEFAULT_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY').trim() || DEFAULT_KEY;

// 3. Fail Fast Validation
// Even with fallbacks, we check validity to ensure we don't pass empty strings.

if (!supabaseUrl) {
    throw new Error(
        "[FATAL] VITE_SUPABASE_URL is missing.\n" +
        "Please check your .env file or default configuration."
    );
}

if (!supabaseKey) {
    throw new Error(
        "[FATAL] VITE_SUPABASE_ANON_KEY is missing.\n" +
        "Please check your .env file or default configuration."
    );
}

// Basic URL format validation to prevent cryptic connection errors later
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    throw new Error(
        `[FATAL] Invalid VITE_SUPABASE_URL format: "${supabaseUrl}".\n` +
        "URL must start with http:// or https://."
    );
}

// 4. Initialize Client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
