
import React from 'react';
import { ProjectState } from '../types';
import { Building2, Calendar, User, Briefcase, Save, MapPin } from 'lucide-react';
import { InputGroup } from './common/UiKit';
import Swal from 'sweetalert2';

interface Props {
    project: ProjectState;
    onChange: (f: keyof ProjectState, v: any) => void;
    onSave: () => void;
}

const IdentitySettings: React.FC<Props> = ({ project, onChange, onSave }) => {
    
    const handleSave = () => {
        onSave();
        Swal.fire({
            icon: 'success',
            title: 'Data Tersimpan!',
            text: 'Informasi Sekolah & Tim Pelaksana berhasil diperbarui.',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#2563EB'
        });
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Data Sekolah & Admin</h2>
                <p className="text-slate-500">Informasi ini akan digunakan secara otomatis pada Cover dan Halaman Pengesahan dokumen.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-soft space-y-8">
                
                {/* Data Sekolah */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Informasi Sekolah</h3>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <InputGroup label="Nama Sekolah" icon={Building2} value={project.schoolName} onChange={(v) => onChange('schoolName', v)} placeholder="Contoh: SMP Merdeka 1" />
                        {/* Location input removed as it is generated later */}
                    </div>
                </div>

                {/* Tim Pelaksana */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Tim Pelaksana (Tanda Tangan)</h3>
                    
                    {/* Koordinator */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm text-slate-800">Koordinator Projek</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="Nama Lengkap" 
                                value={project.coordinatorName} 
                                onChange={(e) => onChange('coordinatorName', e.target.value)} 
                            />
                            <input 
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="NIP" 
                                value={project.coordinatorNip} 
                                onChange={(e) => onChange('coordinatorNip', e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Kepsek */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-secondary" />
                            <span className="font-bold text-sm text-slate-800">Kepala Sekolah</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="Nama Lengkap" 
                                value={project.principalName} 
                                onChange={(e) => onChange('principalName', e.target.value)} 
                            />
                            <input 
                                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary" 
                                placeholder="NIP" 
                                value={project.principalNip} 
                                onChange={(e) => onChange('principalNip', e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                {/* Titimangsa */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Tempat & Tanggal Surat</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Tempat Surat" icon={MapPin} value={project.signaturePlace} onChange={(v) => onChange('signaturePlace', v)} placeholder="Contoh: Jakarta" />
                        <InputGroup label="Tanggal Surat" icon={Calendar} value={project.signatureDate} onChange={() => {}}>
                            <input 
                                type="date"
                                value={project.signatureDate}
                                onChange={(e) => onChange('signatureDate', e.target.value)}
                                className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
                            />
                        </InputGroup>
                    </div>
                </div>

                {/* Save Button at Bottom */}
                <div className="pt-6 border-t border-slate-100">
                    <button 
                        onClick={handleSave}
                        className="w-full px-6 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Simpan Data
                    </button>
                </div>

            </div>
        </div>
    );
};

export default IdentitySettings;
