
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

// Use fallback values if environment variables are missing to prevent "supabaseUrl is required" crash
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("Supabase URL or Key is missing. Database features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
