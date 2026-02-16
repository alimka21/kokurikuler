
import { User } from '../types';

const STORAGE_KEY = 'app_user_session_v1';
const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

interface CachedSession {
    user: User;
    timestamp: number;
}

/**
 * Save user profile to local storage for lazy restoration
 */
export const saveSessionToCache = (user: User) => {
    try {
        const data: CachedSession = {
            user,
            timestamp: Date.now()
        };
        // Simple obfuscation to prevent casual reading, not for high security
        const encrypted = btoa(JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (e) {
        console.warn('Failed to cache session', e);
    }
};

/**
 * Attempt to restore user from local storage (Instant Load)
 */
export const restoreSessionFromCache = (): User | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const data: CachedSession = JSON.parse(atob(raw));
        
        // Check TTL (Time To Live)
        if (Date.now() - data.timestamp > CACHE_DURATION) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return data.user;
    } catch (e) {
        return null;
    }
};

/**
 * Clear session cache
 */
export const clearSessionCache = () => {
    localStorage.removeItem(STORAGE_KEY);
};

/**
 * Draft Persistence for Wizard
 */
export const saveDraft = (key: string, data: any) => {
    try {
        localStorage.setItem(`draft_${key}`, JSON.stringify(data));
    } catch (e) {}
};

export const loadDraft = (key: string) => {
    try {
        const item = localStorage.getItem(`draft_${key}`);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
};
