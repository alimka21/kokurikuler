
import { User } from '../types';

export const mapSessionToUser = (sessionUser: any): User => {
    // 1. Basic Validation - Auth User MUST exist
    if (!sessionUser || !sessionUser.id) {
        // Return null or throw handled error. 
        // Throwing allows the caller to handle unauthenticated state.
        throw new Error("Invalid Session Data");
    }

    // 2. Extract metadata safely (fallback to empty object)
    const meta = sessionUser.user_metadata || {};
    
    // 3. Construct Robust User Object (AppUser compliant)
    // We strictly follow the rule: User = Supabase Auth (Base) + Profile (Optional)
    
    // EMERGENCY OVERRIDE:
    // Ensure specific email is ALWAYS admin immediately upon object creation.
    // This prevents race conditions where the DB fetch is slower than the UI render.
    let role = meta.role || 'user';
    if (sessionUser.email === 'alimkamcl@gmail.com') {
        role = 'admin';
    }

    return {
        id: sessionUser.id,
        email: sessionUser.email || '', // Email should exist on Auth user
        
        // Optional Fields - Do NOT assume they exist
        name: meta.name || undefined,
        school: meta.school || undefined,
        role: role, 
        
        // Extra state
        force_password_change: meta.force_password_change === true,
        created_at: sessionUser.created_at
    };
};
