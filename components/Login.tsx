
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

interface LoginProps {
    onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check if user exists in 'users' table (Whitelist mechanism)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.trim())
                .single();

            if (error || !data) {
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: 'Email Anda belum terdaftar dalam sistem.',
                    confirmButtonColor: '#2563EB'
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: `Selamat Datang, ${data.name || 'Guru'}!`,
                    text: 'Berhasil masuk ke sistem.',
                    timer: 1500,
                    showConfirmButton: false
                });
                onLogin(data);
            }
        } catch (err) {
            Swal.fire('Error', 'Terjadi kesalahan koneksi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white w-full max-w-md p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Pakar Kokurikuler</h1>
                    <p className="text-slate-500 text-sm mt-1">Masuk untuk mengelola projek kokurikuler</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Terdaftar</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@sekolah.sch.id"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-medium"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Masuk <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Sistem ini menggunakan autentikasi tertutup.<br/>
                        Hubungi admin jika email belum terdaftar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
