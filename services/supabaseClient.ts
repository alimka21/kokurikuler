
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars (Handles both Vite and standard process.env)
const getEnv = (key: string) => {
    try {
        // Vite
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) {}

    try {
        // Process (Webpack/Node/CRA)
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {}
    
    return '';
};

// Retrieve Credentials with trimmed whitespace
const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

const defaultUrl = 'https://ndawqyzvvyzqtqyxchjl.supabase.co';
// User provided key - retained for convenience
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYXdxeXp2dnl6cXRxeXhjaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjgxNzIsImV4cCI6MjA4NjgwNDE3Mn0.GWF1r6GPORrooNRVDkWrRDeGmowTHCod8NF3HFUMc5M';

const supabaseUrl = (envUrl || defaultUrl).trim();
const supabaseKey = (envKey || defaultKey).trim();

// Safe Client Initialization
// This prevents the app from crashing (White Screen) if the URL/Key are malformed.
let client;
try {
    if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
        throw new Error("Invalid Supabase URL");
    }
    client = createClient(supabaseUrl, supabaseKey);
} catch (error) {
    console.error("Supabase Client Init Failed:", error);
    // Fallback to a safe dummy client to allow App UI to render the error message
    // instead of crashing entirely at the module level.
    client = createClient('https://placeholder.supabase.co', 'placeholder');
}

export const supabase = client;
