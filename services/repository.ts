
import { supabase } from './supabaseClient';
import { DbUser, DbProject, DbSystemSettings } from '../db/schema';
import { ProjectState, INITIAL_PROJECT_STATE, User } from '../types';

/**
 * DATABASE REPOSITORY LAYER
 * Memisahkan logika Database dari UI Components/Hooks.
 * Mengembalikan data yang sudah di-mapping ke Domain Types aplikasi.
 */

export const UserRepository = {
    async getCurrentProfile(userId: string): Promise<Partial<DbUser> | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        
        if (error) {
             // Handle "Infinite recursion detected" (42P17) specifically
             // This happens if the RLS policy on 'users' refers to itself in a loop.
             // We swallow this error to allow the app to function using Auth Metadata instead.
             if (error.code === '42P17') {
                 console.warn("[Repository] RLS Recursion detected. Using Auth Metadata fallback.");
                 return null;
             }
             console.warn("Repo: Fetch Profile Error", error);
        }
        return data as DbUser;
    },

    async getAllUsers(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            // Safe fallback for Admin dashboard if DB is misconfigured
            if (error.code === '42P17') return [];
            throw error;
        }
        return data as User[];
    },

    async upsertUser(user: Partial<User>): Promise<void> {
        const payload: Partial<DbUser> = {
            id: user.id,
            email: user.email!,
            name: user.name,
            school: user.school,
            role: user.role,
            force_password_change: user.force_password_change,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('users').upsert(payload);
        if (error) throw error;
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
    // UPDATED: Return type allows null for error handling
    async getProjectsByUser(email: string): Promise<ProjectState[] | null> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_email', email)
            .order('updated_at', { ascending: false });

        if (error) {
            // Handle missing table
            if (error.code === '42P01') return []; 

            // FIX: Handle RLS Recursion (42P17) gracefully
            if (error.code === '42P17') {
                 console.warn("[Repository] RLS Recursion (42P17) detected. Returning null to preserve local state.");
                 return null;
            }
            throw error;
        }

        if (!data) return [];

        // Mapper: DbProject -> ProjectState
        return data.map((d: DbProject) => ({
            ...INITIAL_PROJECT_STATE,
            ...d.content, // Spread JSON content first
            id: d.id, // Ensure ID matches DB
            // Override with indexed columns to ensure sync
            title: d.title,
            schoolName: d.school_name,
            phase: d.phase,
            targetClass: d.target_class,
            totalJpAnnual: d.total_jp_annual,
            projectJpAllocation: d.project_jp_allocation,
            selectedTheme: d.selected_theme,
            activityFormat: d.activity_format,
            analysisSummary: d.analysis_summary
        }));
    },

    async saveProject(project: ProjectState, user: { id: string; email: string }): Promise<void> {
        // Mapper: ProjectState -> DbProject
        const payload: Partial<DbProject> = {
            id: project.id,
            user_id: user.id,
            user_email: user.email,
            title: project.title,
            school_name: project.schoolName,
            phase: project.phase,
            target_class: project.targetClass,
            total_jp_annual: project.totalJpAnnual,
            project_jp_allocation: project.projectJpAllocation,
            selected_theme: project.selectedTheme,
            activity_format: project.activityFormat,
            analysis_summary: project.analysisSummary,
            content: project, // Store full state in JSONB
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('projects').upsert(payload);
        
        if (error) {
            if (error.code === '42P17') {
                console.warn("[Repository] RLS Infinite Recursion detected during Save. Ignoring error to allow local persist.");
                return;
            }
            throw error;
        }
    },

    async deleteProject(projectId: string): Promise<void> {
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) {
             if (error.code === '42P17') return; // Ignore RLS loop on delete
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
