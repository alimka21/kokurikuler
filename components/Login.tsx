
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { GraduationCap, Loader2, Lock, Mail, Eye, EyeOff, LogIn, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';
import { InputGroup } from './common/UiKit';
import { mapSessionToUser } from '../utils/authHelpers';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [subscriptionLink, setSubscriptionLink] = useState('https://s.id/alimkadigital/');

    // Mounted ref to prevent state updates on unmounted component
    const isMounted = useRef(true);
    
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'subscription_url')
                    .single();
                
                if (data && data.value) {
                    setSubscriptionLink(data.value);
                }
            } catch (e) {
                // Fallback silently to default
            }
        };
        fetchSettings();

        return () => { isMounted.current = false; };
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // --- LOGIN FLOW ---
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            // Safe User Mapping
            const safeUser = mapSessionToUser(data.user);
            
            if (isMounted.current) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil Masuk',
                    timer: 1000,
                    showConfirmButton: false
                });

                // Trigger parent update (this will unmount this component)
                onLogin(safeUser);
            }

        } catch (err: any) {
            let msg = err.message || "Terjadi kesalahan.";
            const lowerMsg = msg.toLowerCase();

            // Handle specific errors without polluting console for expected flows
            if (msg === "Invalid login credentials") {
                msg = "Email atau kata sandi salah.";
            } else if (lowerMsg.includes("database error") || lowerMsg.includes("schema") || lowerMsg.includes("fetch")) {
                msg = "Sistem sedang pemeliharaan atau gangguan koneksi database. Silakan coba lagi nanti.";
            } else {
                console.error("Auth Error:", err);
            }
            
            if (isMounted.current) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Masuk',
                    text: msg,
                    confirmButtonColor: '#d33'
                });
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Pakar Kokurikuler</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Masuk untuk mengelola projek
                    </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    
                    <InputGroup label="Email" icon={Mail} value={email} onChange={setEmail} placeholder="nama@sekolah.id">
                         <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@email.com"
                            className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium"
                        />
                    </InputGroup>

                    <InputGroup label="Password" icon={Lock} value={password} onChange={setPassword}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-bold"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </InputGroup>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Masuk <LogIn className="w-5 h-5" /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 mb-3">
                        Belum memiliki akun?
                    </p>
                    <a 
                        href={subscriptionLink}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center gap-2"
                    >
                        Klik Untuk Langganan <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
                
                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-300">
                        Sistem Informasi Kokurikuler v1.5.0<br/>
                        Powered by Supabase Auth
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
