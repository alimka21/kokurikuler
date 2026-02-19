
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

        // 1. Get Initial Session
        const getInitialSession = async () => {
            try {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                if (authUser && mounted) {
                    await syncUserProfile(authUser);
                } else {
                    if (mounted) setIsLoading(false);
                }
            } catch (e) {
                console.error("Auth Init Error:", e);
                if (mounted) setIsLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
                await syncUserProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
                if (mounted) {
                    setUser(null);
                    tokenManager.clearKey(); // HYBRID STRATEGY: Cleanup Key
                    setIsLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Helper: Merge Auth User with Public User Profile
    const syncUserProfile = async (authUser: any) => {
        try {
            // Fetch additional profile data from public.users
            const dbProfile = await UserRepository.getCurrentProfile(authUser.id);
            
            // GUARD: Check Account Status
            // If is_active is explicitly false, force logout
            if (dbProfile?.is_active === false) {
                await supabase.auth.signOut();
                setUser(null);
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

            const mergedUser: User = {
                id: authUser.id,
                email: authUser.email || '',
                role: authUser.user_metadata?.role || dbProfile?.role || 'user',
                name: dbProfile?.name || authUser.user_metadata?.name,
                // school removed
                apiKey: dbProfile?.api_key, // Add API Key to context
                // Critical: Prioritize DB flag for password change
                force_password_change: dbProfile?.force_password_change ?? false, 
                is_active: dbProfile?.is_active ?? true,
                created_at: authUser.created_at
            };
            
            setUser(mergedUser);
        } catch (e) {
            console.error("Profile Sync Error", e);
            // Fallback (Only use if DB fails, but assumes active to avoid lockout during glitch)
            setUser({
                id: authUser.id,
                email: authUser.email || '',
                role: 'user',
                force_password_change: false,
                is_active: true
            });
        } finally {
            setIsLoading(false);
        }
    };

    const login = (u: User) => setUser(u);
    const logout = async () => {
        tokenManager.clearKey(); // HYBRID STRATEGY: Cleanup Key
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
