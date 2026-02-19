
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { User as UserType } from '../types';
import { User, Lock, Save, Loader2, KeyRound, CheckCircle, AlertTriangle, XCircle, Key } from 'lucide-react';
import { InputGroup } from './common/UiKit';
import { validateApiKey } from '../services/geminiService';
import { tokenManager } from '../utils/tokenManager';
import Swal from 'sweetalert2';

interface Props {
  user: UserType;
}

const AccountSettings: React.FC<Props> = ({ user }) => {
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');
  
  // API Key State
  const [apiKey, setApiKey] = useState(user.apiKey || '');
  const [keyStatus, setKeyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  
  const [loading, setLoading] = useState(false);

  const handleTestKey = async () => {
      if (!apiKey) return;
      setKeyStatus('checking');
      const isValid = await validateApiKey(apiKey);
      setKeyStatus(isValid ? 'valid' : 'invalid');
      
      if (isValid) {
           Swal.fire({ 
               icon: 'success', 
               title: 'Koneksi Berhasil', 
               text: 'API Key valid dan dapat digunakan.',
               timer: 1500,
               showConfirmButton: false 
            });
      } else {
           Swal.fire({
               icon: 'error',
               title: 'Koneksi Gagal',
               text: 'API Key tidak valid atau kuota habis.',
           });
      }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return Swal.fire('Error', 'Nama tidak boleh kosong.', 'error');
    
    // Validate Key if changed and not empty
    if (apiKey && apiKey !== user.apiKey && keyStatus !== 'valid') {
        const result = await Swal.fire({
            title: 'API Key Belum Diuji',
            text: 'Anda memasukkan API Key baru namun belum diuji validitasnya. Tetap simpan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Simpan',
            cancelButtonText: 'Uji Dulu'
        });
        if (!result.isConfirmed) {
            handleTestKey();
            return;
        }
    }

    setLoading(true);
    try {
        const updates: any = { data: { name } };
        if (password) {
            if (password.length < 6) throw new Error("Password minimal 6 karakter");
            updates.password = password;
        }

        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;

        // Sync to users table including API Key
        await UserRepository.updateProfile(user.id, { 
            name: name,
            apiKey: apiKey.trim() // Save API Key to DB
        });

        // Update Memory & Session
        tokenManager.setKey(apiKey.trim());

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
          <p className="text-slate-500">Kelola identitas profil, keamanan, dan integrasi AI.</p>
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
          
          {/* Section 2: AI Configuration (BYOK) */}
          <div className="border-t border-slate-100 pt-6">
               <div className="flex items-center gap-2 mb-4">
                 <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Key className="w-4 h-4" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-700">Integrasi AI (Google Gemini)</h3>
              </div>
              
              <div className="space-y-3">
                   <div className="relative">
                       <InputGroup label="Custom API Key (Opsional)" icon={KeyRound} value={apiKey} onChange={(v) => { setApiKey(v); setKeyStatus('idle'); }}>
                           <input 
                              type="password"
                              value={apiKey}
                              onChange={(e) => { setApiKey(e.target.value); setKeyStatus('idle'); }}
                              className="w-full pl-11 pr-24 p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-mono text-sm"
                              placeholder="Masukkan API Key Gemini Anda..."
                           />
                           <div className="absolute right-2 top-[34px]">
                               <button 
                                type="button" 
                                onClick={handleTestKey}
                                disabled={!apiKey || keyStatus === 'checking'}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                    keyStatus === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                                    keyStatus === 'invalid' ? 'bg-red-100 text-red-700' :
                                    'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                }`}
                               >
                                  {keyStatus === 'checking' && <Loader2 className="w-3 h-3 animate-spin" />}
                                  {keyStatus === 'valid' && <CheckCircle className="w-3 h-3" />}
                                  {keyStatus === 'invalid' && <XCircle className="w-3 h-3" />}
                                  {keyStatus === 'idle' ? 'Tes Koneksi' : keyStatus === 'checking' ? 'Menguji...' : keyStatus === 'valid' ? 'Valid' : 'Invalid'}
                               </button>
                           </div>
                       </InputGroup>
                   </div>
                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-3">
                       <AlertTriangle className="w-4 h-4 text-indigo-500 mt-0.5" />
                       <div className="text-xs text-indigo-800 leading-relaxed">
                           <strong className="block mb-1 font-bold">Mengapa pakai API Key sendiri?</strong>
                           Anda akan memiliki kontrol penuh atas kuota penggunaan AI tanpa batas harian dari sistem kami. Dapatkan key gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline font-bold hover:text-indigo-600">Google AI Studio</a>.
                       </div>
                   </div>
              </div>
          </div>

          {/* Section 3: Security */}
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
                      className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-all focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
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
