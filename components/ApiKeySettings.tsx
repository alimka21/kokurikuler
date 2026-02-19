
import React, { useState, useEffect } from 'react';
import { 
    Key, 
    CheckCircle, 
    AlertCircle, 
    Trash2, 
    Edit2, 
    Save, 
    Loader2, 
    Info, 
    Zap, 
    ExternalLink, 
    ShieldCheck,
    HelpCircle,
    Copy,
    Eye,
    EyeOff
} from 'lucide-react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';
import { UserRepository } from '../services/repository';
import { validateApiKey } from '../services/geminiService';
import { tokenManager } from '../utils/tokenManager';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

interface Props {
    user: User;
}

const ApiKeySettings: React.FC<Props> = ({ user }) => {
    const { updateUser } = useAuth();
    
    // UI States
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState<'idle' | 'validating' | 'saving' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const hasKey = !!user.apiKey;

    // Mask helper: AIzaSy...7o
    const getMaskedKey = (key: string) => {
        if (!key || key.length < 10) return "••••••••••••••••";
        return `${key.substring(0, 8)}...${key.substring(key.length - 6)}`;
    };

    const handleCancel = () => {
        setIsEditing(false);
        setInputValue('');
        setStatus('idle');
        setErrorMessage('');
    };

    const handleSave = async () => {
        if (!inputValue.trim()) {
            setErrorMessage("API Key tidak boleh kosong");
            return;
        }

        setStatus('validating');
        
        // 1. Validate
        const isValid = await validateApiKey(inputValue.trim());
        if (!isValid) {
            setStatus('error');
            setErrorMessage("API Key tidak valid atau kuota habis. Pastikan key dari Google AI Studio.");
            return;
        }

        setStatus('saving');
        try {
            // 2. Save to DB
            await UserRepository.updateProfile(user.id, { apiKey: inputValue.trim() });
            
            // 3. Update Local State (Memory/Session)
            tokenManager.setKey(inputValue.trim());
            
            // 4. Update Context
            updateUser({ ...user, apiKey: inputValue.trim() });

            setStatus('success');
            Swal.fire({
                icon: 'success',
                title: 'Berhasil Disimpan',
                text: 'API Key pribadi Anda siap digunakan!',
                timer: 1500,
                showConfirmButton: false
            });
            setIsEditing(false);
            setInputValue('');
        } catch (e) {
            setStatus('error');
            setErrorMessage("Gagal menyimpan ke database.");
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Hapus API Key?',
            text: "Sistem akan kembali menggunakan API Key bawaan (limit terbatas).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await UserRepository.updateProfile(user.id, { apiKey: '' }); // Send empty string to clear
                tokenManager.clearKey();
                updateUser({ ...user, apiKey: undefined });
                Swal.fire('Terhapus', 'API Key berhasil dihapus.', 'success');
            } catch (e) {
                Swal.fire('Error', 'Gagal menghapus key.', 'error');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Key className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen API Key Gemini</h1>
                </div>
                <p className="text-slate-500">Kelola API Key pribadi untuk akses AI Generator tanpa batas (Unlimited Quota).</p>
            </div>

            {/* Blue Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                        <HelpCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="font-bold text-blue-900 text-sm md:text-base">Bagaimana Sistem API Key Bekerja?</h3>
                        <ul className="space-y-2 text-sm text-blue-800 list-disc pl-4 marker:text-blue-400">
                            <li>Aplikasi memiliki <strong>API Key bawaan</strong> (server bersama) untuk semua pengguna gratis.</li>
                            <li>Anda bisa menggunakan <strong>API Key pribadi</strong> Anda sendiri untuk kuota unlimited.</li>
                            <li>Prioritas: Jika ada API Key pribadi yang valid, sistem menggunakan itu terlebih dahulu.</li>
                            <li>Jika API Key pribadi habis atau dihapus, sistem otomatis kembali ke API Key bawaan.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Status Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Status API Key Anda</h3>
                
                {hasKey && !isEditing ? (
                    // STATE: KEY EXISTS (VALID)
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 fill-emerald-600 text-white" />
                                API Key Valid & Siap Digunakan
                            </h4>
                            <div className="mt-1 text-sm text-emerald-700 space-y-1">
                                <p>Sumber: 🔐 API Key Pribadi Anda</p>
                                <p>Tersimpan: Ya (di Database Aman)</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STATE: NO KEY
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center gap-4">
                        <div className="bg-slate-200 p-3 rounded-full text-slate-500">
                            <Info className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-700">Menggunakan API Key Bawaan</h4>
                            <p className="text-sm text-slate-500">Anda berbagi kuota dengan pengguna lain. Tambahkan key pribadi untuk performa maksimal.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input / Display Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">API Key Pribadi Anda</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <p className="text-sm text-slate-500 mb-4">
                        {isEditing 
                            ? "Masukkan API Key baru dari Google AI Studio." 
                            : hasKey 
                                ? "API Key Anda tersimpan di database. Ditampilkan sebagian untuk keamanan:"
                                : "Belum ada API Key tersimpan."}
                    </p>

                    {/* View Mode */}
                    {!isEditing && hasKey && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-slate-700 text-lg tracking-wide flex items-center justify-between">
                                <span>{getMaskedKey(user.apiKey!)}</span>
                                <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">Hidden</span>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <Edit2 className="w-4 h-4" /> Ubah API Key
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" /> Hapus API Key
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Edit/Input Mode */}
                    {(isEditing || !hasKey) && (
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Key className="w-5 h-5" />
                                </div>
                                <input 
                                    type={isVisible ? "text" : "password"}
                                    value={inputValue}
                                    onChange={(e) => {
                                        setInputValue(e.target.value);
                                        setErrorMessage('');
                                        setStatus('idle');
                                    }}
                                    className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-200 outline-none font-mono text-sm transition-all ${errorMessage ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'}`}
                                    placeholder="Paste API Key di sini (mulai dengan AIza...)"
                                    autoFocus
                                />
                                <button 
                                    onClick={() => setIsVisible(!isVisible)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {errorMessage && (
                                <div className="flex items-center gap-2 text-red-600 text-sm px-1 animate-in slide-in-from-top-1">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={status === 'validating' || status === 'saving' || !inputValue}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
                                >
                                    {status === 'validating' || status === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {status === 'validating' ? 'Memeriksa...' : status === 'saving' ? 'Menyimpan...' : 'Simpan & Validasi'}
                                </button>
                                {hasKey && (
                                    <button 
                                        onClick={handleCancel}
                                        className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tips Section */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                    <div className="text-amber-600 mt-1"><Zap className="w-5 h-5" /></div>
                    <div>
                        <h4 className="font-bold text-amber-900 text-sm mb-2">Tips:</h4>
                        <ul className="text-sm text-amber-800 space-y-1 list-disc pl-4">
                            <li>
                                Dapatkan API Key gratis di: <a href="https://aistudio.google.com/app/apikey" target="_blank" className="font-bold underline hover:text-amber-600">aistudio.google.com/apikey</a>
                            </li>
                            <li>Jangan share API Key Anda dengan orang lain</li>
                            <li>Satu API Key bisa digunakan untuk multiple project</li>
                            <li>Monitor quota penggunaan di Google Cloud Console</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Quota Info */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-6 flex items-start gap-3">
                <div className="text-slate-500 mt-1"><Loader2 className="w-5 h-5" /></div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1">Informasi Quota:</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Jika Anda melihat error <strong>"Kuota Habis"</strong>, berarti Anda telah mencapai batas API pribadi untuk periode ini. 
                    </p>
                    <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                        Solusi: <span className="inline-flex items-center gap-1 bg-white border px-2 py-0.5 rounded text-xs font-mono"><ExternalLink className="w-3 h-3" /> Gunakan API Key lain</span> atau tunggu reset quota (biasanya setiap hari)
                    </p>
                </div>
            </div>

        </div>
    );
};

export default ApiKeySettings;
