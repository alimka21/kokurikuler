
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';
import { 
  Users, 
  FolderOpen, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Shield, 
  X,
  Save,
  Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { InputGroup } from './common/UiKit';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Stats (Safe Fetch)
      // Check if tables exist by doing a lightweight query first or using try-catch
      let userCount = 0;
      let projectCount = 0;
      
      try {
          const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
          if (!error) userCount = count || 0;
      } catch (e) {
          console.warn("Could not fetch user stats:", e);
      }

      try {
          const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });
          if (!error) projectCount = count || 0;
      } catch (e) {
           console.warn("Could not fetch project stats:", e);
      }
      
      setStats({ users: userCount, projects: projectCount });

      // 2. Get Users List
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
          // If error is schema related, don't throw, just return empty list
          if (error.message.includes('relation') || error.message.includes('schema')) {
              console.warn("Table users likely missing:", error.message);
              setUsers([]);
          } else {
              throw error;
          }
      } else {
          setUsers(data as User[]);
      }
    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      // Only show alert if it's not a schema error
      if (!error.message?.includes('schema')) {
          Swal.fire('Error', 'Gagal memuat data admin.', 'error');
      }
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
    } else {
      setEditingUser({ role: 'user', school: '', name: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email || !editingUser.name) {
      Swal.fire('Validasi', 'Email dan Nama wajib diisi.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editingUser,
        email: editingUser.email.trim().toLowerCase(), // Force lowercase to match Login logic
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload) 
        .select();

      if (error) throw error;

      setIsModalOpen(false);
      Swal.fire('Sukses', 'Data user berhasil disimpan.', 'success');
      fetchData();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 text-white p-8 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-slate-400 text-sm">Kelola akses pengguna dan pantau statistik sistem.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px]">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                 <Users className="w-4 h-4" /> Total Users
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.users}</p>
           </div>
           <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 min-w-[140px]">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
                 <FolderOpen className="w-4 h-4" /> Total Projek
              </div>
              <p className="text-3xl font-bold text-white">{loading ? '...' : stats.projects}</p>
           </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">Daftar Pengguna (Whitelist)</h2>
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
                        <th className="px-6 py-4">Email (Login ID)</th>
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
                                            <Edit3 className="w-4 h-4" />
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
                        {editingUser.id ? 'Edit User' : 'Tambah User Baru'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <InputGroup label="Email (Untuk Login)" icon={Shield} value={editingUser.email || ''} onChange={(v) => setEditingUser({...editingUser, email: v})}>
                         <input 
                            type="email" 
                            required
                            placeholder="nama@email.com"
                            value={editingUser.email || ''}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                            className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
                        />
                    </InputGroup>
                    
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

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                        <button type="submit" disabled={isSaving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70">
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {editingUser.id ? 'Simpan Perubahan' : 'Tambah User'}
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
