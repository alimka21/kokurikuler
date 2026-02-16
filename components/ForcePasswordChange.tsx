
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Lock, User, Loader2 } from 'lucide-react';
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
        const { error } = await supabase.auth.updateUser({
            password: password,
            data: {
                name: name,
                force_password_change: false // Reset flag
            }
        });

        if (error) throw error;

        // Also update users table for consistency
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
             await supabase.from('users').update({ name: name }).eq('id', user.id);
        }

        Swal.fire({
            title: 'Berhasil',
            text: 'Akun Anda telah diaktifkan.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
        
        onSuccess();
    } catch (err: any) {
        Swal.fire('Gagal', err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
       <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in-95">
           <div className="text-center mb-6">
               <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                   <Lock className="w-8 h-8" />
               </div>
               <h2 className="text-xl font-bold text-slate-900">Aktivasi Akun</h2>
               <p className="text-slate-500 text-sm mt-1">
                   Ini adalah login pertama Anda. Mohon atur Nama Profil dan Password baru untuk keamanan.
               </p>
           </div>
           
           <form onSubmit={handleSubmit} className="space-y-4">
               <InputGroup label="Nama Profil Baru" icon={User} value={name} onChange={setName} placeholder="Nama Anda" />
               <InputGroup label="Password Baru" icon={Lock} value={password} onChange={setPassword}>
                   <input 
                       type="password"
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                       placeholder="Minimal 6 karakter"
                   />
               </InputGroup>
               
               <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-white rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan & Lanjutkan"}
               </button>
           </form>
       </div>
    </div>
  );
};

export default ForcePasswordChange;
