
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { mapSessionToUser } from '../utils/authHelpers';
import { saveSessionToCache, restoreSessionFromCache, clearAllAppStorage } from '../utils/sessionManager';
import { UserRepository } from '../services/repository';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    connectionError: string | null;
    login: (user: User) => void;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    // --- Core Session Logic moved from App.tsx ---
    useEffect(() => {
        let mounted = true;

        // 1. LAZY LOAD (Cache)
        const cachedUser = restoreSessionFromCache();
        if (cachedUser) {
            setUser(cachedUser);
            setIsLoading(false);
        }

        // 2. FETCH & SYNC
        const fetchAndSyncUser = async (sessionUser: any) => {
            try {
                // Base User
                const baseUser = mapSessionToUser(sessionUser);
                if (!cachedUser && mounted) setUser(baseUser);

                // DB Hydration via Repository
                let dbProfile = null;
                try {
                    dbProfile = await UserRepository.getCurrentProfile(sessionUser.id);
                } catch (err) {
                    console.warn("DB Profile Fetch Error:", err);
                }

                if (mounted) {
                    const mergedUser: User = {
                        ...baseUser,
                        ...(dbProfile || {}),
                        id: baseUser.id,
                        email: baseUser.email
                    };
                    setUser(mergedUser);
                    saveSessionToCache(mergedUser);
                }
            } catch (e) {
                console.error("Session Sync Error:", e);
            }
        };

        const initAuth = async () => {
            if (!cachedUser) setIsLoading(true);
            setConnectionError(null);
            
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                if (session?.user) {
                    await fetchAndSyncUser(session.user);
                } else {
                    setUser(null);
                    clearAllAppStorage(); // Ensure clean state if no session found
                }
            } catch (e: any) {
                console.error("Auth Init Error:", e);
                if (!cachedUser) {
                    let msg = e.message || "Gagal memuat sesi.";
                    const lowerMsg = msg.toLowerCase();
                    
                    // Handle network/fetch errors gracefully
                    if (
                        lowerMsg.includes("networkerror") || 
                        lowerMsg.includes("failed to fetch") || 
                        lowerMsg.includes("load failed") ||
                        lowerMsg.includes("connection refused")
                    ) {
                        msg = "Koneksi ke server gagal. Mohon periksa koneksi internet Anda.";
                    }
                    
                    setConnectionError(msg);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (event === 'SIGNED_IN' && session?.user) {
                 await fetchAndSyncUser(session.user);
             } else if (event === 'SIGNED_OUT') {
                 setUser(null);
                 clearAllAppStorage();
             }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = (u: User) => {
        setUser(u);
        saveSessionToCache(u);
    };

    const logout = async () => {
        clearAllAppStorage(); // Wipes user session + Project Drafts
        await supabase.auth.signOut();
        setUser(null);
    };

    const updateUser = (u: User) => {
        setUser(u);
        saveSessionToCache(u);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, connectionError, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
