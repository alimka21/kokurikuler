
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { tokenManager } from '../utils/tokenManager';
import Swal from 'sweetalert2';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => void; 
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let profileSyncInProgress = false; // Guard for race condition

        // Helper: Merge Auth User with Public User Profile
        const syncUserProfile = async (authUser: any) => {
            if (profileSyncInProgress) return;
            profileSyncInProgress = true;

            try {
                // Fetch additional profile data from public.users
                let dbProfile = await UserRepository.getCurrentProfile(authUser.id);
                
                // CRITICAL FIX: If profile doesn't exist in public.users, create it immediately.
                if (!dbProfile) {
                    console.log("[Auth] User missing in public table. Syncing now...");
                    const newProfile = {
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.user_metadata?.name || 'User',
                        role: authUser.user_metadata?.role || 'user',
                        is_active: true
                    };
                    
                    // Direct insert via Supabase client to bypass repository restrictive Select
                    const { error: insertError } = await supabase
                        .from('users')
                        .upsert(newProfile);
                    
                    if (!insertError) {
                        dbProfile = newProfile;
                    } else {
                        console.error("Failed to sync user to public table:", insertError);
                    }
                }

                // GUARD: Check Account Status
                if (dbProfile?.is_active === false) {
                    await supabase.auth.signOut();
                    if (mounted) setUser(null);
                    Swal.fire({
                        icon: 'error',
                        title: 'Akun Dinonaktifkan',
                        text: 'Akun Anda telah dinonaktifkan oleh Administrator. Silakan hubungi admin sekolah.',
                        confirmButtonColor: '#d33'
                    });
                    return;
                }

                // HYBRID STRATEGY: Auto-Restore API Key
                if (dbProfile?.api_key) {
                    tokenManager.setKey(dbProfile.api_key);
                    console.log("[Auth] API Key restored from profile.");
                }
                
                const role = authUser.user_metadata?.role || dbProfile?.role || 'user';
                
                // LOGIC: Check Metadata for force_password_change
                const isForceChange = authUser.user_metadata?.force_password_change === true;
                const finalForceChange = role !== 'admin' && isForceChange;

                const mergedUser: User = {
                    id: authUser.id,
                    email: authUser.email || '',
                    role: role,
                    name: dbProfile?.name || authUser.user_metadata?.name || 'User',
                    apiKey: dbProfile?.api_key,
                    force_password_change: finalForceChange, 
                    is_active: dbProfile?.is_active ?? true,
                    created_at: authUser.created_at
                };
                
                if (mounted) setUser(mergedUser);
            } catch (e) {
                console.error("Profile Sync Error", e);
                if (mounted) {
                    setUser(prev => prev || {
                        id: authUser.id,
                        email: authUser.email || '',
                        role: authUser.user_metadata?.role || 'user',
                        name: authUser.user_metadata?.name || 'User',
                        force_password_change: false,
                        is_active: true,
                        created_at: authUser.created_at
                    });
                }
            } finally {
                profileSyncInProgress = false;
            }
        };

        // 1. Get Initial Session
        const getInitialSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session?.user) {
                    if (mounted) setIsLoading(false);
                    return;
                }

                const authUser = session.user;
                
                // Set minimal user immediately to unblock UI (Instant Boot)
                const minimalUser: User = {
                    id: authUser.id,
                    email: authUser.email || '',
                    role: authUser.user_metadata?.role || 'user',
                    name: authUser.user_metadata?.name || 'User',
                    force_password_change: authUser.user_metadata?.force_password_change === true && authUser.user_metadata?.role !== 'admin',
                    is_active: true,
                    created_at: authUser.created_at
                };
                
                if (mounted) setUser(minimalUser);
                if (mounted) setIsLoading(false); // Unblock UI immediately!

                // 2. Sync profile in background (No await, no Promise.race, no timeout hack)
                syncUserProfile(authUser);

            } catch (e) {
                console.error("[Auth] Init Error:", e);
                if (mounted) setIsLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
                syncUserProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    tokenManager.clearKey();
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = (u: User) => setUser(u);
    const logout = async () => {
        tokenManager.clearKey();
        await supabase.auth.signOut();
        setUser(null);
    };
    const updateUser = (u: User) => setUser(u);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
