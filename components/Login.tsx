
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { GraduationCap, ArrowRight, Loader2, AlertTriangle, ShieldAlert, Lock, User, Building, Mail, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import { InputGroup } from './common/UiKit';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    // Stage: 'check_email' | 'login_password' | 'register_details'
    const [stage, setStage] = useState<'check_email' | 'login_password' | 'register_details'>('check_email');
    
    // Form Data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [school, setSchool] = useState('');
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Toggle Password Visibility
    const [whitelistData, setWhitelistData] = useState<any>(null);

    // 1. Check Email in Whitelist
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // @ts-ignore
            const currentUrl = supabase.supabaseUrl || "";
            if (currentUrl.includes("placeholder")) {
                 throw new Error("Konfigurasi Supabase belum disetting di file .env");
            }

            // Check Whitelist (public.users)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.trim().toLowerCase())
                .maybeSingle();

            if (error) {
                console.warn("Whitelist check error:", error);
                throw new Error("Gagal mengecek whitelist. Pastikan tabel 'users' sudah dibuat di database.");
            }

            if (!data) {
                Swal.fire({
                    icon: 'error',
                    title: 'Email Tidak Terdaftar',
                    text: 'Email Anda belum masuk whitelist sistem. Silakan hubungi Administrator.',
                    confirmButtonColor: '#d33'
                });
            } else {
                setWhitelistData(data);
                // Reset password visibility when changing stages
                setShowPassword(false);
                
                // Logic: If user has 'is_registered' flag true, or we assume specific admin logic
                if (data.is_registered) {
                    setStage('login_password');
                } else {
                    setStage('register_details');
                    // Pre-fill if exists
                    if (data.name) setName(data.name);
                    if (data.school) setSchool(data.school);
                }
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire('Error', err.message || 'Gagal menghubungi server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // 2. Register / Setup Account (First Time)
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // A. Create Auth User in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // B. Update Whitelist Data (Mark as registered)
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        name: name,
                        school: school,
                        is_registered: true,
                        // Optionally link auth_id if you have that column, otherwise rely on email
                    })
                    .eq('email', email.trim());

                if (updateError) throw updateError;

                Swal.fire({
                    icon: 'success',
                    title: 'Akun Berhasil Dibuat!',
                    text: 'Selamat datang di Pakar Kokurikuler.',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Auto login via callback
                onLogin({ 
                    ...whitelistData, 
                    name, 
                    school, 
                    is_registered: true, 
                    id: authData.user.id // Use Auth ID 
                });
            }
        } catch (err: any) {
            console.error(err);
            Swal.fire('Gagal Registrasi', err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 3. Login (Subsequent Times)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) throw error;

            Swal.fire({
                icon: 'success',
                title: 'Berhasil Masuk',
                timer: 1000,
                showConfirmButton: false
            });

            onLogin({ ...whitelistData, id: authData.user.id });

        } catch (err: any) {
            Swal.fire('Gagal Login', 'Password salah atau terjadi kesalahan.', 'error');
        } finally {
            setLoading(false);
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
                        {stage === 'check_email' && "Masuk untuk mengelola projek"}
                        {stage === 'register_details' && "Lengkapi Identitas Anda"}
                        {stage === 'login_password' && "Masukkan Kata Sandi"}
                    </p>
                </div>

                {/* STAGE 1: CHECK EMAIL */}
                {stage === 'check_email' && (
                    <form onSubmit={handleCheckEmail} className="space-y-4">
                        <InputGroup label="Email Sekolah" icon={Mail} value={email} onChange={setEmail} placeholder="nama@sekolah.id">
                           <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@sekolah.id"
                            className="w-full pl-11 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium"
                           />
                        </InputGroup>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Lanjut <ArrowRight className="w-5 h-5" /></>}
                        </button>
                    </form>
                )}

                {/* STAGE 2: REGISTER (FIRST TIME) */}
                {stage === 'register_details' && (
                    <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-right duration-300">
                         <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4 flex items-start gap-2">
                            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            Email Anda terdaftar di whitelist. Silakan buat password dan lengkapi data untuk mengaktifkan akun.
                         </div>

                         <InputGroup label="Email" icon={Mail} value={email} onChange={() => {}}>
                            <input disabled value={email} className="w-full pl-11 p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium" />
                         </InputGroup>

                         <InputGroup label="Nama Lengkap" icon={User} value={name} onChange={setName} placeholder="Nama Guru Lengkap" />
                         <InputGroup label="Asal Sekolah" icon={Building} value={school} onChange={setSchool} placeholder="Nama Sekolah" />
                         
                         <InputGroup label="Buat Password" icon={Lock} value={password} onChange={setPassword}>
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimal 6 karakter"
                                className="w-full pl-11 pr-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
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
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Aktifkan Akun Saya"}
                        </button>
                    </form>
                )}

                {/* STAGE 3: LOGIN (HAS PASSWORD) */}
                {stage === 'login_password' && (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in slide-in-from-right duration-300">
                        <InputGroup label="Email" icon={Mail} value={email} onChange={() => {}}>
                            <input disabled value={email} className="w-full pl-11 p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium" />
                        </InputGroup>

                        <InputGroup label="Password" icon={Lock} value={password} onChange={setPassword}>
                             <input 
                                type={showPassword ? "text" : "password"} 
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-bold"
                                placeholder="••••••••"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-4 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </InputGroup>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Masuk <ArrowRight className="w-5 h-5" /></>}
                        </button>
                        
                        <div className="text-center mt-4">
                            <button type="button" onClick={() => { setStage('check_email'); setEmail(''); setPassword(''); }} className="text-sm text-slate-400 hover:text-primary transition-colors">
                                Ganti Akun / Email
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                        Sistem Informasi Kokurikuler<br/>
                        Versi 1.1 (Secure Login)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
