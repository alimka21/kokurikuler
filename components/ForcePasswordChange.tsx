
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { Lock, User, Loader2, ShieldCheck, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { InputGroup } from './common/UiKit';
import Swal from 'sweetalert2';

interface Props {
  onSuccess: () => void;
}

const ForcePasswordChange: React.FC<Props> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validations
    if (!name.trim()) {
        Swal.fire('Validasi', 'Nama lengkap harus diisi.', 'warning');
        return;
    }
    if (password.length < 6) {
        Swal.fire('Validasi', 'Password minimal 6 karakter.', 'warning');
        return;
    }
    if (password !== confirmPassword) {
        Swal.fire('Validasi', 'Konfirmasi password tidak cocok.', 'warning');
        return;
    }

    setLoading(true);
    try {
        // 2. Get Current User Session First
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) throw new Error("Sesi pengguna tidak ditemukan. Silakan login ulang.");

        // 3. Update Auth System (Supabase Auth)
        // This updates the actual login password and metadata flags
        const { error: authError } = await supabase.auth.updateUser({
            password: password,
            data: { 
                name: name,
                force_password_change: false 
            } 
        });

        if (authError) throw authError;

        // 4. Update Database Record (public.users)
        // CRITICAL FIX: We explicitly update 'passwordText' so Admin sees the new password in the table.
        await UserRepository.updateProfile(currentUser.id, { 
            name: name,
            passwordText: password 
        });

        Swal.fire({
            title: 'Akun Diaktifkan',
            text: 'Password berhasil diperbarui. Selamat datang!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        
        // 5. Trigger Success Callback (Redirect to App)
        onSuccess();

    } catch (err: any) {
        console.error("Activation Error:", err);
        Swal.fire('Gagal', err.message || "Terjadi kesalahan saat aktivasi.", 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in">
       <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 border-t-4 border-amber-500 max-h-[90vh] overflow-y-auto">
           <div className="text-center mb-6">
               <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-100 shadow-sm">
                   <ShieldCheck className="w-8 h-8" />
               </div>
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Aktivasi Akun</h2>
               <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                   Demi keamanan, silakan lengkapi profil dan ubah password bawaan Anda.
               </p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-4">
               
               {/* Nama */}
               <InputGroup label="Nama Profil Anda" icon={User} value={name} onChange={setName} placeholder="Contoh: Alimka, S.Pd., M.Pd." />
               
               {/* Password Baru */}
               <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-slate-900"
                            placeholder="Minimal 6 karakter"
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
               </div>

               {/* Konfirmasi Password */}
               <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Konfirmasi Password Baru</label>
                    <div className="relative">
                        <CheckCircle className={`absolute left-3.5 top-3.5 w-5 h-5 transition-colors ${password && password === confirmPassword ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <input 
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-11 pr-11 p-3.5 bg-slate-50 border rounded-xl font-bold focus:bg-white focus:ring-2 transition-all text-slate-900 ${password && confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-200'}`}
                            placeholder="Ketik ulang password..."
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1 font-bold ml-1">Password tidak cocok.</p>
                    )}
               </div>
               
               <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold mt-2 flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan & Masuk Aplikasi"}
               </button>
           </form>
       </div>
    </div>
  );
};

export default ForcePasswordChange;
