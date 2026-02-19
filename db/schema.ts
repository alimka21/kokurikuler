
// Definisi Schema Database (Single Source of Truth)
// Updated to support "Minimal Schema" (Content-first strategy)

export interface DbUser {
    id: string;
    email: string;
    name?: string;
    // school removed
    role?: string;
    api_key?: string; // New: BYOK Support
    force_password_change?: boolean;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface DbProject {
    id: string;
    user_id: string;
    user_email: string;
    title: string;
    school_name?: string; // Optional (Moved to content)
    phase: string;
    target_class: string;
    total_jp_annual?: number; // Optional (Moved to content)
    project_jp_allocation?: number; // Optional (Moved to content)
    selected_theme?: string; // Optional (Moved to content)
    activity_format?: string; // Optional (Moved to content)
    analysis_summary?: string; // Optional (Moved to content)
    content: any; // JSONB storage for complex nested state (Primary Source)
    created_at?: string;
    updated_at?: string;
}

export interface DbSystemSettings {
    key: string;
    value: string;
}
