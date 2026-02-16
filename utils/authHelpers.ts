
import { User } from '../types';

export const mapSessionToUser = (sessionUser: any): User => {
    // Extract metadata or use empty object if missing
    const meta = sessionUser.user_metadata || {};
    
    // Return strictly typed User object with safe defaults
    return {
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: meta.name || sessionUser.email?.split('@')[0] || 'Pengguna',
        school: meta.school || '',
        role: meta.role || 'user', // Ensure role comes from metadata if set there
        is_registered: true,
        force_password_change: meta.force_password_change || false
    };
};
