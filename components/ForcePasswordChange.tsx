
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { Lock, User, Loader2, ShieldCheck } from 'lucide-react';
import { InputGroup } from './common/UiKit';
import Swal from 'sweetalert2';

interface Props {
  onSuccess: () => void;
}

const ForcePasswordChange: React.FC<Props> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
        Swal.fire('Error', 'Password minimal 6 karakter.', 'error');
        return;
    }
    if (!name.trim()) {
        Swal.fire('Error', 'Nama harus diisi.', 'error');
        return;
    }

    setLoading(true);
    try {
        // 1. Update Password in Supabase Auth AND Update Metadata Flag
        // We set force_password_change to FALSE in metadata here.
        const { data: { user }, error: authError } = await supabase.auth.updateUser({
            password: password,
            data: { 
                name: name,
                force_password_change: false 
            } 
        });

        if (authError) throw authError;
        if (!user) throw new Error("User not found");

        // 2. Sync Name in Database (public.users)
        // Note: We do NOT call markPasswordChanged anymore as the column is missing. 
        // Metadata update above handles the flag.
        await UserRepository.updateProfile(user.id, { name: name });

        Swal.fire({
            title: 'Akun Diaktifkan',
            text: 'Password berhasil diubah. Mengalihkan ke dashboard...',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        
        // 3. Trigger UI transition (App.tsx will re-render based on updated context)
        onSuccess();

    } catch (err: any) {
        Swal.fire('Gagal', err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in">
       <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 border-t-4 border-amber-500">
           <div className="text-center mb-8">
               <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-sm">
                   <ShieldCheck className="w-10 h-10" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Aktivasi Akun</h2>
               <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                   Demi keamanan, Anda wajib mengubah password default dan melengkapi profil sebelum mengakses sistem.
               </p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-5">
               <InputGroup label="Nama Profil Anda" icon={User} value={name} onChange={setName} placeholder="Contoh: Budi Santoso, S.Pd" />
               <InputGroup label="Buat Password Baru" icon={Lock} value={password} onChange={setPassword}>
                   <input 
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                       placeholder="Minimal 6 karakter"
                   />
               </InputGroup>
               
               <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold mt-4 flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Password & Masuk"}
               </button>
           </form>
       </div>
    </div>
  );
};

export default ForcePasswordChange;
