
import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { SettingsRepository } from '../services/repository';
import { 
    GraduationCap, 
    Loader2, 
    Lock, 
    Mail, 
    Eye, 
    EyeOff, 
    Facebook, 
    Instagram,
    ExternalLink,
    Rocket,
    AlertCircle,
    CreditCard
} from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [subscriptionUrl, setSubscriptionUrl] = useState('https://s.id/alimkadigital');
    
    const isMounted = useRef(true);
    
    useEffect(() => {
        // Fetch subscription URL from DB (Managed by Admin)
        SettingsRepository.getUrl().then(url => {
            if (isMounted.current && url) {
                setSubscriptionUrl(url);
            }
        });

        return () => { isMounted.current = false; };
    }, []);

    // Explicitly check status here for immediate UI feedback on Login screen
    const checkAccountStatus = async (userId: string) => {
        const { data, error } = await supabase
            .from("users")
            .select("is_active")
            .eq("id", userId)
            .single();
        
        if (error) throw error;
        
        if (data && data.is_active === false) {
            await supabase.auth.signOut();
            throw new Error("ACCOUNT_DISABLED");
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSupabaseConfigured) {
            Swal.fire({ icon: 'error', title: 'Konfigurasi Hilang', text: 'Supabase URL & Key belum diatur.', confirmButtonColor: '#d33' });
            return;
        }

        setLoading(true);

        try {
            // --- LOGIN FLOW ---
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;
            
            // Check Account Status immediately
            if (authData.user) {
                await checkAccountStatus(authData.user.id);
            }

            if (isMounted.current) {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil Masuk',
                    timer: 1000,
                    showConfirmButton: false,
                    confirmButtonColor: '#558B6E'
                });
                // Navigation handled by App.tsx hash change based on Auth state
            }

        } catch (err: any) {
            let msg = err.message || "Terjadi kesalahan.";
            const lowerMsg = msg.toLowerCase();

            if (msg === "Invalid login credentials") {
                msg = "Email atau kata sandi salah.";
            } else if (lowerMsg.includes("fetch failed")) {
                msg = "Gagal terhubung ke server.";
            } else if (msg === "ACCOUNT_DISABLED") {
                msg = "Akun dinonaktifkan. Hubungi admin.";
            }
            
            if (isMounted.current) {
                Swal.fire({ icon: 'error', title: 'Gagal Masuk', text: msg, confirmButtonColor: '#d33' });
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
          
          {/* LEFT - BRANDING */}
          <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#558B6E] to-[#2F4F4F] relative items-center justify-center p-12 text-white overflow-hidden">
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8FBC8F]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center max-w-md animate-in fade-in slide-in-from-top-10 duration-700">
                <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl mb-8 shadow-xl border border-white/20 transform hover:scale-105 transition-transform duration-500">
                    <GraduationCap size={70} strokeWidth={1.5} className="text-white drop-shadow-md" />
                </div>
                
                <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-4 drop-shadow-sm uppercase">
                    PAKAR KOKURIKULER <br/> <span className="text-[#D3E4CD]">AI GENERATOR</span>
                </h1>
                <p className="text-[#E8F3E8] text-lg font-medium leading-relaxed mb-8">
                    Asisten cerdas untuk merancang dokumen projek kokurikuler sistematis sesuai kurikulum nasional.
                </p>
                
                <div className="flex items-center gap-4 bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm">
                     <span className="text-xs font-medium text-blue-50">Dev by <strong className="text-white">Muhammad Alimka</strong></span>
                     <div className="w-px h-3 bg-white/30"></div>
                     <div className="flex items-center gap-3 text-white/80">
                         <a href="https://web.facebook.com/muhammad.alimka/" target="_blank" className="hover:text-white hover:scale-110"><Facebook size={14} /></a>
                         <a href="https://www.instagram.com/muh.alimka/" target="_blank" className="hover:text-white hover:scale-110"><Instagram size={14} /></a>
                     </div>
                </div>

                <a href="https://pakarmodul.vercel.app/" target="_blank" className="mt-6 group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-full shadow-2xl hover:from-orange-600 hover:to-amber-600 hover:scale-105 transition-all">
                    <Rocket className="w-4 h-4 mr-2 text-white animate-pulse" />
                    <span>Buka Pakar Modul Ajar</span>
                    <ExternalLink className="w-3 h-3 ml-2 opacity-80" />
                </a>
             </div>
          </div>

          {/* RIGHT - LOGIN FORM */}
          <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 lg:p-12 relative bg-[#F7F9F8]">
             <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="lg:hidden flex flex-col items-center mb-8">
                    <div className="text-primary bg-primary/10 p-4 rounded-2xl mb-3 shadow-md"><GraduationCap size={40} /></div>
                    <h2 className="text-xl font-black text-slate-800 uppercase text-center">PAKAR KOKURIKULER</h2>
                </div>

                <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Masuk Aplikasi</h2>
                        <p className="text-slate-500 text-sm mt-1">Gunakan akun yang diberikan oleh Admin.</p>
                    </div>

                    {!isSupabaseConfigured && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 mt-0.5" />
                            <div><strong>Error Config:</strong> Env vars missing.</div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} /></div>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" placeholder="nama@email.com" required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Kata Sandi</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} /></div>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold" placeholder="••••••••" required />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-70">
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Masuk Sekarang'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 mb-3">Belum punya akun?</p>
                        <a 
                            href={subscriptionUrl}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm"
                        >
                            <CreditCard size={16} />
                            Langganan Pakar Kokurikuler
                        </a>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-300">Dev by Muhammad Alimka | 2026</p>
                </div>
             </div>
          </div>
        </div>
    );
};

export default Login;
