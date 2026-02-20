
import { supabase } from './supabaseClient';
import { DbUser, DbProject } from '../db/schema';
import { ProjectState, INITIAL_PROJECT_STATE, User } from '../types';

/**
 * DATABASE REPOSITORY LAYER
 * Adjusted for RLS & Content-First Architecture
 */

export const UserRepository = {
    async getCurrentProfile(userId: string): Promise<Partial<DbUser> | null> {
        try {
            // Select explicit columns to ensure api_key is fetched
            const { data, error } = await supabase
                .from('users')
                .select('id, email, name, role, api_key, is_active, password_text')
                .eq('id', userId)
                .maybeSingle();
            
            if (error) {
                 // Handle specific RLS Recursion Error Code
                 if (error.code === '42P17') {
                     console.warn("[Repository] RLS Recursion detected. Using Auth Metadata fallback.");
                     const { data: { user } } = await supabase.auth.getUser();
                     if (user && user.id === userId) {
                         return {
                             id: user.id,
                             email: user.email || '',
                             name: user.user_metadata?.name,
                             role: user.user_metadata?.role || 'user',
                             force_password_change: user.user_metadata?.force_password_change,
                             is_active: true 
                         } as DbUser;
                     }
                     return null;
                 }
                 console.warn("[Repository] Fetch Profile Error:", error.message);
                 return null; // Return null so AuthContext can handle it (create new user or fallback)
            }
            return data as DbUser;
        } catch (err) {
            console.error("[Repository] Unexpected Error:", err);
            return null;
        }
    },

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error fetching all users:", error);
            return [];
        }
        
        return data.map((u: DbUser) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            apiKey: u.api_key,
            passwordText: u.password_text, // Map database column to type
            is_active: u.is_active,
            created_at: u.created_at
        })) as User[];
    },

    async updateProfile(userId: string, data: Partial<User>): Promise<void> {
        const payload: Partial<DbUser> = {
            name: data.name,
            updated_at: new Date().toISOString()
        };
        
        if (data.apiKey !== undefined) {
            payload.api_key = data.apiKey;
        }

        if (data.passwordText !== undefined) {
            payload.password_text = data.passwordText;
        }

        const { error } = await supabase.from('users').update(payload).eq('id', userId);
        if (error) throw error;
    },

    async markPasswordChanged(userId: string): Promise<void> {
        return Promise.resolve();
    },

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
    },

    async getStats(): Promise<{ users: number; projects: number }> {
        let userCount = 0;
        let projectCount = 0;
        try {
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
            userCount = count || 0;
            const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true });
            projectCount = pCount || 0;
        } catch (e) {}
        return { users: userCount, projects: projectCount };
    }
};

export const ProjectRepository = {
    async getProjectsByUser(email: string): Promise<ProjectState[] | null> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            if (error.code === '42P01') return []; 
            if (error.code === '42P17') {
                 console.warn("[Repository] RLS Recursion (42P17).");
                 return null;
            }
            // Log but don't throw to prevent app crash
            console.warn("Fetch Projects Error:", error);
            return [];
        }

        if (!data) return [];

        return data.map((d: DbProject) => {
            const content = d.content || {};
            
            const projectState: ProjectState = {
                ...INITIAL_PROJECT_STATE,
                ...content, 
                id: d.id, 
            };

            if (d.title) projectState.title = d.title;
            if (d.phase) projectState.phase = d.phase;
            if (d.target_class) projectState.targetClass = d.target_class;
            
            return projectState;
        });
    },

    async saveProject(project: ProjectState, user: { id: string; email: string }): Promise<void> {
        const payload: Partial<DbProject> = {
            id: project.id,
            user_id: user.id, 
            user_email: user.email,
            title: project.title,
            phase: project.phase,
            target_class: project.targetClass,
            content: project, 
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('projects').upsert(payload);
        
        if (error) {
            console.error("Supabase Save Error:", error);
            if (error.code === '42P17') return;
            throw error;
        }
    },

    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) {
             if (error.code === '42P17') return;
             throw error;
        }
    }
};

export const SettingsRepository = {
    async getUrl(): Promise<string> {
        try {
            const { data } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'subscription_url')
                .single();
            return data?.value || 'https://s.id/alimkadigital/';
        } catch (e) {
            return 'https://s.id/alimkadigital/';
        }
    },

    async setUrl(url: string): Promise<void> {
        const { error } = await supabase
            .from('system_settings')
            .upsert({ key: 'subscription_url', value: url });
        if (error) throw error;
    }
};
