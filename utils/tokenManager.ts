
/**
 * TokenManager (Singleton)
 * Mengelola siklus hidup API Key di sisi klien menggunakan strategi Hybrid:
 * 1. Memory Layer (Variable) -> Akses tercepat untuk Service
 * 2. Session Layer (SessionStorage) -> Persistensi saat refresh halaman
 */

class TokenManager {
    private apiKey: string | null = null;
    private readonly STORAGE_KEY = 'custom_gemini_api_key';

    constructor() {
        // Hydrate from session storage on instantiation (Page Refresh)
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.apiKey = stored;
            }
        }
    }

    /**
     * Set API Key ke Memory dan Session
     */
    setKey(key: string) {
        if (!key) return;
        this.apiKey = key;
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(this.STORAGE_KEY, key);
        }
    }

    /**
     * Dapatkan API Key dari Memory
     */
    getKey(): string | null {
        return this.apiKey;
    }

    /**
     * Hapus API Key dari Memory dan Session (Logout/Clear)
     */
    clearKey() {
        this.apiKey = null;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Cek apakah user menggunakan Custom Key
     */
    hasCustomKey(): boolean {
        return !!this.apiKey;
    }
}

export const tokenManager = new TokenManager();
