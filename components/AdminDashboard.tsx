
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js'; // Import createClient for temp instance
import { User } from '../types';
import { 
  Users, 
  FolderOpen, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  Shield, 
  X,
  Save,
  Loader2,
  Link as LinkIcon,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import Swal from 'sweetalert2';
import { InputGroup } from './common/UiKit';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Settings State
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);
  // Separate password field for creating users only
  const [newUserPassword, setNewUserPassword] = useState('');

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
      try {
          const { data, error } = await supabase
              .from('system_settings')
              .select('value')
              .eq('key', 'subscription_url')
              .single();
          
          if (data) {
              setSubscriptionUrl(data.value);
          } else {
              setSubscriptionUrl('https://s.id/alimkadigital/');
          }
      } catch (e) {
          setSubscriptionUrl('https://s.id/alimkadigital/');
      }
  };

  const saveSettings = async () => {
      setLoadingSettings(true);
      try {
          // Try to insert/update. This requires a table 'system_settings' with columns 'key' (PK) and 'value'.
          const { error } = await supabase
            .from('system_settings')
            .upsert({ key: 'subscription_url', value: subscriptionUrl });
            
          if (error) throw error;
          Swal.fire('Tersimpan', 'Link langganan berhasil diperbarui.', 'success');
      } catch (e: any) {
          console.error(e);
          Swal.fire('Gagal', 'Gagal menyimpan pengaturan. Pastikan tabel system_settings ada.', 'error');
      } finally {
          setLoadingSettings(false);
      }
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Stats (Safe Fetch)
      let userCount = 0;
      let projectCount = 0;
      
      try {
          const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
          if (!error) userCount = count || 0;
      } catch (e) {}

      try {
          const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });
          if (!error) projectCount = count || 0;
      } catch (e) {}
      
      setStats({ users: userCount, projects: projectCount });

      // 2. Get Users List
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
          if (!error.message.includes('relation') && !error.message.includes('schema')) {
              throw error;
          }
      } else {
          setUsers(data as User[]);
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    const result = await Swal.fire({
      title: 'Hapus User?',
      text: `Apakah Anda yakin ingin menghapus akses untuk ${email}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
      } else {
        Swal.fire('Terhapus', 'User berhasil dihapus.', 'success');
        fetchData();
      }
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setNewUserPassword(''); // Editing doesn't require password change here
    } else {
      setEditingUser({ role: 'user', school: '', name: 'Guru', email: '' });
      setNewUserPassword('123456'); // Default password
    }
    setIsModalOpen(true);
  };

  // Helper to safely get env vars locally for the temp client
  const getEnv = (key: string) => {
      try {
          // @ts-ignore
          if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
      } catch (e) {}
      try {
          // @ts-ignore
          if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
      } catch (e) {}
      return '';
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email || !editingUser.name) {
      Swal.fire('Validasi', 'Email dan Nama wajib diisi.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      if (!editingUser.id) {
          // --- CREATE NEW USER FLOW ---
          
          // CRITICAL FIX: Use a temporary, non-persisting Supabase client.
          // This allows us to create a new user via 'signUp' WITHOUT overwriting 
          // the current Admin's session in localStorage.
          
          const envUrl = getEnv('VITE_SUPABASE_URL');
          const envKey = getEnv('VITE_SUPABASE_ANON_KEY');
          const defaultUrl = 'https://ndawqyzvvyzqtqyxchjl.supabase.co';
          const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kYXdxeXp2dnl6cXRxeXhjaGpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjgxNzIsImV4cCI6MjA4NjgwNDE3Mn0.GWF1r6GPORrooNRVDkWrRDeGmowTHCod8NF3HFUMc5M';

          const tempUrl = (envUrl || defaultUrl).trim();
          const tempKey = (envKey || defaultKey).trim();

          // Create isolated client instance
          const tempSupabase = createClient(tempUrl, tempKey, {
              auth: {
                  autoRefreshToken: false,
                  persistSession: false, // This ensures Admin stays logged in
                  detectSessionInUrl: false
              }
          });

          const { data, error } = await tempSupabase.auth.signUp({
            email: editingUser.email.trim(),
            password: newUserPassword,
            options: {
                data: {
                    name: editingUser.name,
                    school: editingUser.school,
                    role: editingUser.role,
                    force_password_change: true // Force NEW USER to change password on THEIR first login
                }
            }
          });

          if (error) throw error;
          
          if (data.user) {
             Swal.fire({
                 title: 'User Dibuat',
                 text: `Akun berhasil dibuat. Email: ${data.user.email} | Pass: ${newUserPassword}`,
                 icon: 'success'
             });
             
             // Manually sync to public users table immediately to reflect in Admin UI
             // (Useful if DB triggers are slow or RLS issues exist)
             await supabase.from('users').upsert({
                 id: data.user.id,
                 email: data.user.email,
                 name: editingUser.name,
                 school: editingUser.school,
                 role: editingUser.role,
                 updated_at: new Date().toISOString()
             });
          }

      } else {
          // --- EDIT EXISTING USER FLOW ---
          // Update metadata in 'users' table
          const payload = {
            ...editingUser,
            email: editingUser.email.trim().toLowerCase(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase
            .from('users')
            .upsert(payload) 
            .select();

          if (error) throw error;
          Swal.fire('Sukses', 'Data user berhasil disimpan.', 'success');
      }

      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Gagal menyimpan user.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.school && u.school.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              </div>
              <p className="text-slate-400 text-sm">Kelola akses pengguna dan pengaturan sistem.</p>
            </div>

            <button 
                onClick={() => window.location.hash = '#/dashboard'}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 group"
            >
                <LayoutDashboard className="w-5 h-5" /> 
                Buat Projek (Aplikasi Utama)
            </button>
        </div>
        
        <div className="flex gap-4 pt-6 border-t border-white/10 overflow-x-auto pb-2 sm:pb-0">
           <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px] flex-1 sm:flex-none">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                 <Users className="w-4 h-4" /> Total Users
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.users}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px] flex-1 sm:flex-none">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                 <FolderOpen className="w-4 h-4" /> Total Projek
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.projects}</p>
           </div>
        </div>
      </div>

      {/* System Settings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Settings className="w-5 h-5 text-slate-500" />
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Sistem</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
                 <InputGroup label="Link Langganan (Halaman Login)" icon={LinkIcon} value={subscriptionUrl} onChange={setSubscriptionUrl} placeholder="https://..." />
             </div>
             <button 
                onClick={saveSettings}
                disabled={loadingSettings}
                className="bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
             >
                {loadingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Link
             </button>
          </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">Manajemen Pengguna</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
                >
                    <Plus className="w-4 h-4" /> Tambah User
                </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase font-bold text-slate-500">
                    <tr>
                        <th className="px-6 py-4">Nama User</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Sekolah</th>
                        <th className="px-6 py-4 text-center">Role</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Memuat data...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Tidak ada user ditemukan.</td></tr>
                    ) : (
                        filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{u.name || "-"}</td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">{u.school || "-"}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {u.role || 'user'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleOpenModal(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(u.id, u.email)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
         <div className="p-4 border-t border-slate-100 text-center text-xs text-slate-400">
            Menampilkan {filteredUsers.length} dari {stats.users} total pengguna.
         </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900">
                        {editingUser.id ? 'Edit User' : 'Buat Akun Baru'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <InputGroup label="Email (Login ID)" icon={Shield} value={editingUser.email || ''} onChange={(v) => setEditingUser({...editingUser, email: v})}>
                         <input 
                            type="email" 
                            required
                            placeholder="nama@email.com"
                            value={editingUser.email || ''}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                            disabled={!!editingUser.id} // Cannot change email if editing
                            className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 disabled:opacity-60"
                        />
                    </InputGroup>

                    {!editingUser.id && (
                        <InputGroup label="Password Default" icon={Shield} value={newUserPassword} onChange={setNewUserPassword}>
                             <input 
                                type="text"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                            />
                        </InputGroup>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Nama Lengkap" icon={Users} value={editingUser.name || ''} onChange={(v) => setEditingUser({...editingUser, name: v})} placeholder="Nama Guru" />
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                            <select 
                                value={editingUser.role || 'user'}
                                onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'admin' | 'user'})}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            >
                                <option value="user">User (Guru)</option>
                                <option value="admin">Admin (Full Access)</option>
                            </select>
                        </div>
                    </div>

                    <InputGroup label="Nama Sekolah" icon={FolderOpen} value={editingUser.school || ''} onChange={(v) => setEditingUser({...editingUser, school: v})} placeholder="Contoh: SMP Negeri 1" />

                    {!editingUser.id && (
                        <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg flex items-start gap-2">
                            <span className="font-bold">Info:</span> User baru akan diminta mengganti password saat login pertama kali.
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {editingUser.id ? 'Simpan Perubahan' : 'Buat User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
