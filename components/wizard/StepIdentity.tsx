
import React, { useEffect } from 'react';
import { ProjectState } from '../../types';
import { GraduationCap, Clock, Layers } from 'lucide-react';
import { InputGroup, SectionHeader } from '../common/UiKit';
import Swal from 'sweetalert2';

interface Props {
    project: ProjectState;
    onChange: (f: keyof ProjectState, v: any) => void;
}

interface EnhancedProps extends Props {
    savedProjects?: ProjectState[];
}

const PHASES = [
    { value: "Fase A", label: "Fase A (Kelas 1-2 SD)", classes: ["Kelas 1", "Kelas 2"] },
    { value: "Fase B", label: "Fase B (Kelas 3-4 SD)", classes: ["Kelas 3", "Kelas 4"] },
    { value: "Fase C", label: "Fase C (Kelas 5-6 SD)", classes: ["Kelas 5", "Kelas 6"] },
    { value: "Fase D", label: "Fase D (Kelas 7-9 SMP)", classes: ["Kelas 7", "Kelas 8", "Kelas 9"] },
    { value: "Fase E", label: "Fase E (Kelas 10 SMA)", classes: ["Kelas 10"] },
    { value: "Fase F", label: "Fase F (Kelas 11-12 SMA)", classes: ["Kelas 11", "Kelas 12"] },
];

const JP_MAPPING: Record<string, number> = {
    "Kelas 1": 216,
    "Kelas 2": 216,
    "Kelas 3": 252,
    "Kelas 4": 252,
    "Kelas 5": 252,
    "Kelas 6": 224,
    "Kelas 7": 360,
    "Kelas 8": 360,
    "Kelas 9": 320,
    "Kelas 10": 396,
    "Kelas 11": 144,
    "Kelas 12": 128,
};

const StepIdentity: React.FC<EnhancedProps> = ({ project, onChange, savedProjects = [] }) => {
    
    const currentPhase = PHASES.find(p => p.value === project.phase) || PHASES[3];

    // Auto-Analyze Logic
    const handleClassChange = (newClass: string) => {
        onChange('targetClass', newClass);
        if (JP_MAPPING[newClass]) {
            onChange('totalJpAnnual', JP_MAPPING[newClass]);
        }

        // Check for existing project with same class
        const existing = savedProjects.find(p => p.targetClass === newClass && p.id !== project.id && p.analysisSummary);
        if (existing) {
            Swal.fire({
                title: 'Data Ditemukan!',
                text: `Kami menemukan analisis konteks dari projek ${existing.selectedTheme} di kelas ${newClass}. Apakah Anda ingin menggunakannya kembali?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Gunakan (Hemat Waktu)',
                cancelButtonText: 'Tidak, Buat Baru',
                confirmButtonColor: '#558B6E'
            }).then((result) => {
                if (result.isConfirmed) {
                    onChange('contextAnalysis', existing.contextAnalysis);
                    onChange('analysisSummary', existing.analysisSummary);
                    Swal.fire('Berhasil', 'Analisis konteks telah disalin.', 'success');
                }
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4">
            <SectionHeader 
                title="Target Murid & Alokasi Waktu" 
                subtitle="Tentukan jenjang, kelas target, dan ketersediaan waktu untuk projek ini." 
            />

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-soft space-y-8">
                
                {/* Jenjang & Kelas */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Target Murid</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Jenjang (Fase)" icon={Layers} value={project.phase} onChange={() => { }}>
                            <select
                                value={project.phase}
                                onChange={(e) => {
                                    onChange('phase', e.target.value);
                                    onChange('targetClass', '');
                                    onChange('totalJpAnnual', 0);
                                }}
                                className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none text-slate-700 font-medium"
                            >
                                {PHASES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </InputGroup>

                        <InputGroup label="Kelas Target" icon={GraduationCap} value={project.targetClass} onChange={() => { }}>
                            <select
                                value={project.targetClass}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none text-slate-700 font-medium"
                            >
                                <option value="">Pilih Kelas</option>
                                {currentPhase.classes.map((cls) => (
                                    <option key={cls} value={cls}>{cls}</option>
                                ))}
                            </select>
                        </InputGroup>
                    </div>
                </div>

                {/* Alokasi Waktu */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Ketersediaan Waktu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Total Alokasi JP (Setahun)" icon={Clock} value={project.totalJpAnnual} onChange={(v) => onChange('totalJpAnnual', parseInt(v) || 0)} type="number" placeholder="Contoh: 360">
                             <input 
                                type="number"
                                value={project.totalJpAnnual || ''}
                                onChange={(e) => onChange('totalJpAnnual', parseInt(e.target.value) || 0)}
                                className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900 font-bold"
                                placeholder="0"
                            />
                        </InputGroup>
                        
                         <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                            <div className="mt-1 text-primary">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-primary text-sm">Info Alokasi Waktu</h4>
                                <p className="text-emerald-700 text-xs mt-1 leading-relaxed">
                                    Angka ini adalah batas maksimal total JP untuk projek kokurikuler dalam satu tahun ajaran sesuai struktur kurikulum.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StepIdentity;
