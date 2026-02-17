
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
    GraduationCap, 
    Loader2, 
    Lock, 
    Mail, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    Facebook, 
    Instagram,
    ExternalLink,
    Rocket
} from 'lucide-react';
import Swal from 'sweetalert2';
import { mapSessionToUser } from '../utils/authHelpers';
import { SettingsRepository } from '../services/repository';

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
            const url = await SettingsRepository.getUrl();
            if (isMounted.current && url) {
                setSubscriptionLink(url);
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
                    showConfirmButton: false,
                    confirmButtonColor: '#558B6E'
                });

                // FORCE REDIRECT FOR ADMIN
                if (safeUser.role === 'admin') {
                    window.location.hash = '#/admin';
                } else {
                    window.location.hash = '#/dashboard';
                }

                // Trigger parent update
                onLogin(safeUser);
            }

        } catch (err: any) {
            let msg = err.message || "Terjadi kesalahan.";
            const lowerMsg = msg.toLowerCase();

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
        <div className="min-h-screen w-full flex bg-white font-sans overflow-hidden">
          
          {/* BAGIAN KIRI - HERO / BRANDING (Hanya Desktop) */}
          <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-[#558B6E] to-[#2F4F4F] relative items-center justify-center p-12 text-white overflow-hidden">
             {/* Elemen Dekoratif Background */}
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-3xl animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8FBC8F]/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
             
             <div className="relative z-10 flex flex-col items-center text-center max-w-md animate-in fade-in slide-in-from-top-10 duration-700">
                {/* Logo Wrapper */}
                <div className="bg-white/15 backdrop-blur-md p-6 rounded-3xl mb-8 shadow-xl border border-white/20 transform hover:scale-105 transition-transform duration-500">
                    <GraduationCap size={70} strokeWidth={1.5} className="text-white drop-shadow-md" />
                </div>
                
                <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-4 drop-shadow-sm uppercase">
                    PAKAR KOKURIKULER <br/> <span className="text-[#D3E4CD]">AI GENERATOR</span>
                </h1>
                <p className="text-[#E8F3E8] text-lg font-medium leading-relaxed mb-8">
                    Asisten cerdas untuk membantu guru merancang dokumen projek kokurikuler yang sistematis dan sesuai kurikulum nasional.
                </p>
                
                {/* Developer / Footer Credit Pill */}
                <div className="flex items-center gap-4 bg-white/10 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm hover:bg-white/20 transition-all cursor-default shadow-lg">
                     <span className="text-xs font-medium text-blue-50">Dev by <strong className="text-white">Muhammad Alimka</strong></span>
                     <div className="w-px h-3 bg-white/30"></div>
                     <div className="flex items-center gap-3 text-white/80">
                         {/* Tiktok */}
                         <a href="https://www.tiktok.com/@muh.alimka/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all cursor-pointer" title="TikTok">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                            </svg>
                         </a>
                         {/* Facebook */}
                         <a href="https://web.facebook.com/muhammad.alimka/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all cursor-pointer" title="Facebook">
                            <Facebook size={14} />
                         </a>
                         {/* Instagram */}
                         <a href="https://www.instagram.com/muh.alimka/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:scale-110 transition-all cursor-pointer" title="Instagram">
                            <Instagram size={14} />
                         </a>
                     </div>
                </div>

                {/* NEW LINK PAKAR MODUL AJAR (Desktop) */}
                <a 
                    href="https://pakarmodul.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-6 group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-[#3D6950] bg-white rounded-full shadow-2xl hover:bg-[#F0F5F2] hover:scale-105 transition-all duration-300 ring-4 ring-white/30"
                >
                    <Rocket className="w-4 h-4 mr-2 text-[#558B6E] animate-pulse" />
                    <span>Buka Pakar Modul Ajar</span>
                    <ExternalLink className="w-3 h-3 ml-2 opacity-60" />
                </a>

             </div>
          </div>

          {/* BAGIAN KANAN - FORM LOGIN */}
          <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 lg:p-12 relative bg-[#F7F9F8]">
            
             <div className="w-full max-w-[420px] mx-auto animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Logo Mobile (Hanya muncul di layar kecil) */}
                <div className="lg:hidden flex flex-col items-center mb-8">
                    <div className="text-primary bg-primary/10 p-4 rounded-2xl mb-3 shadow-md">
                        <GraduationCap size={40} />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 uppercase text-center leading-tight">
                        PAKAR KOKURIKULER
                    </h2>
                </div>

                {/* Card Login */}
                <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-xl border border-slate-100">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Selamat Datang</h2>
                        <p className="text-slate-500 text-sm mt-1">Masuk untuk mengelola projek Anda.</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {/* Input Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Mail className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                </div>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                    placeholder="nama@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Input Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kata Sandi</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-bold placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Tombol Login */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                            {loading ? 'Memproses...' : 'Masuk Sekarang'}
                        </button>
                    </form>

                    {/* Footer Card */}
                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-sm text-slate-500 mb-4">Belum memiliki akun?</p>
                        <a 
                            href={subscriptionLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-3 border border-slate-200 hover:border-primary/50 hover:bg-emerald-50 text-slate-700 hover:text-primary font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm no-underline"
                        >
                            Daftar / Langganan <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>

                <div className="mt-8 text-center flex flex-col items-center gap-4">
                    <p className="text-[10px] text-slate-300">Dev by Muhammad Alimka | 2026</p>
                </div>
             </div>
          </div>
        </div>
    );
};

export default Login;
