
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { User as UserType } from '../types';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import { InputGroup } from './common/UiKit';
import { tokenManager } from '../utils/tokenManager';
import Swal from 'sweetalert2';

interface Props {
  user: UserType;
}

const AccountSettings: React.FC<Props> = ({ user }) => {
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return Swal.fire('Error', 'Nama tidak boleh kosong.', 'error');
    
    setLoading(true);
    try {
        const updates: any = { data: { name } };
        if (password) {
            if (password.length < 6) throw new Error("Password minimal 6 karakter");
            updates.password = password;
        }

        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;

        // Sync to users table
        await UserRepository.updateProfile(user.id, { name: name });

        Swal.fire({
            title: 'Berhasil',
            text: 'Profil dan pengaturan berhasil diperbarui.',
            icon: 'success'
        });
        
        setPassword('');
    } catch (err: any) {
        Swal.fire('Gagal', err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Pengaturan Akun</h2>
          <p className="text-slate-500">Kelola identitas profil dan keamanan akun Anda.</p>
      </div>

      <form onSubmit={handleUpdate} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-soft space-y-8">
          
          {/* Section 1: Identity */}
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 font-bold text-xl text-primary">
                    {name ? name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Email Login</p>
                    <p className="font-medium text-slate-900">{user.email}</p>
                </div>
            </div>

            <InputGroup label="Nama Profil" icon={User} value={name} onChange={setName} placeholder="Nama Lengkap" />
          </div>
          
          {/* Section 2: Security */}
          <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                 <Lock className="w-4 h-4 text-slate-400" />
                 <h3 className="text-sm font-bold text-slate-700">Ganti Password</h3>
              </div>
              <InputGroup label="Password Baru" icon={Lock} value={password} onChange={setPassword}>
                  <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold transition-all focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Kosongkan jika tidak ingin mengganti"
                  />
              </InputGroup>
              <p className="text-xs text-slate-400 mt-2 ml-1">Minimal 6 karakter.</p>
          </div>

          <div className="pt-4">
              <button 
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Simpan Perubahan
              </button>
          </div>
      </form>
    </div>
  );
};

export default AccountSettings;
