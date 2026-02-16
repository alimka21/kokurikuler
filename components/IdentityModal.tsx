
import React from 'react';
import { ProjectState } from '../types';
import { Building2, MapPin, Calendar, User, X, Briefcase } from 'lucide-react';
import { InputGroup } from './common/UiKit';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    project: ProjectState;
    onChange: (f: keyof ProjectState, v: any) => void;
}

const IdentityModal: React.FC<Props> = ({ isOpen, onClose, project, onChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Data Sekolah & Admin</h3>
                        <p className="text-sm text-slate-500">Informasi ini akan muncul di Cover dan Halaman Pengesahan.</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-6 overflow-y-auto space-y-8">
                    
                    {/* Data Sekolah */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Informasi Sekolah</h3>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                            <InputGroup label="Nama Sekolah" icon={Building2} value={project.schoolName} onChange={(v) => onChange('schoolName', v)} placeholder="Contoh: SMP Merdeka 1" />
                            {/* activityLocation input removed */}
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

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all">
                        Simpan Perubahan
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdentityModal;