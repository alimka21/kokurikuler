
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { mapSessionToUser } from '../utils/authHelpers';
import { saveSessionToCache, restoreSessionFromCache, clearSessionCache } from '../utils/sessionManager';

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

                // DB Hydration
                if (supabase) {
                    let dbProfile = null;
                    try {
                        const { data: profileById } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', sessionUser.id)
                            .maybeSingle(); 
                        dbProfile = profileById;
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
                    clearSessionCache();
                }
            } catch (e: any) {
                console.error("Auth Init Error:", e);
                if (!cachedUser) {
                    let msg = e.message || "Gagal memuat sesi.";
                    if (msg.includes("NetworkError")) msg = "Koneksi internet bermasalah.";
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
                 clearSessionCache();
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
        clearSessionCache();
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
