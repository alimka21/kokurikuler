
// Definisi Schema Database (Single Source of Truth)
// Meskipun kita menggunakan Supabase Client di Browser, definisi ini menjaga konsistensi tipe.

export interface DbUser {
    id: string;
    email: string;
    name?: string;
    school?: string;
    role?: string;
    force_password_change?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface DbProject {
    id: string;
    user_id: string;
    user_email: string;
    title: string;
    school_name: string;
    phase: string;
    target_class: string;
    total_jp_annual: number;
    project_jp_allocation: number;
    selected_theme: string;
    activity_format: string;
    analysis_summary: string;
    content: any; // JSONB storage for complex nested state
    created_at?: string;
    updated_at?: string;
}

export interface DbSystemSettings {
    key: string;
    value: string;
}
