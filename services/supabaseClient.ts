
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars (Handles both Vite and standard process.env)
const getEnv = (key: string) => {
    // Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
        return (import.meta as any).env[key];
    }
    // Process (Webpack/Node/CRA) - wrapped in try-catch to avoid ReferenceError in pure browser
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {
        // ignore reference errors
    }
    return '';
};

// Use provided credentials as fallback if .env is missing
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://zmtpnmjkakwisjydykfw.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdHBubWprYWt3aXNqeWR5a2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExOTA1OTAsImV4cCI6MjA4Njc2NjU5MH0.oC0sm654Knye8aUZYVp48zwMJ76gjNEb_caIkOcbEVQ';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("Supabase URL or Key is missing. Database features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
