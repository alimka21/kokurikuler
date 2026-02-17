
import React, { useRef, useEffect } from 'react';
import { ThemeOption, CreativeIdeaOption } from '../../types';
import { AIButton, SelectionCard } from '../common/UiKit';
import { Layers, PenTool, Sparkles, Lightbulb, Zap } from 'lucide-react';
import Swal from 'sweetalert2';

interface Props {
    options: ThemeOption[];
    selectedTheme: string;
    onSelectTheme: (t: string, r: string) => void;
    
    activityFormat: string;
    onSelectFormat: (f: string) => void;
    
    creativeIdeas: CreativeIdeaOption[];
    selectedIdea: string;
    onSelectIdea: (title: string) => void;
    
    isLoading: boolean;
    onGenerateThemes: () => void;
    onGenerateIdeas: () => void;

    // Checks for overwrite warning
    hasDownstreamData: boolean; 
}

const StepThemeAndFormat: React.FC<Props> = ({ 
    options, selectedTheme, onSelectTheme, 
    activityFormat, onSelectFormat, 
    creativeIdeas, selectedIdea, onSelectIdea,
    isLoading, onGenerateThemes, onGenerateIdeas,
    hasDownstreamData
}) => {
    
    const ideaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to idea section if ideas are generated
    useEffect(() => {
        if (creativeIdeas.length > 0 && ideaRef.current) {
            ideaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [creativeIdeas]);

    const handleThemeChange = (name: string, reason: string) => {
        if (hasDownstreamData && selectedTheme && name !== selectedTheme) {
            Swal.fire({
                title: 'Perhatian!',
                text: 'Anda sudah memiliki data Tujuan/Aktivitas di langkah selanjutnya. Mengubah Tema mungkin membuat data tersebut tidak relevan. Lanjutkan?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Ubah',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#F59E0B'
            }).then((result) => {
                if (result.isConfirmed) {
                    onSelectTheme(name, reason);
                }
            });
        } else {
            onSelectTheme(name, reason);
        }
    };

    const handleFormatChange = (fmtId: string) => {
         if (hasDownstreamData && activityFormat && fmtId !== activityFormat) {
            Swal.fire({
                title: 'Perhatian!',
                text: 'Anda sudah menyusun rencana di langkah selanjutnya. Mengubah Bentuk Kegiatan mungkin memerlukan penyesuaian besar. Lanjutkan?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ya, Ubah',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#F59E0B'
            }).then((result) => {
                if (result.isConfirmed) {
                    onSelectFormat(fmtId);
                }
            });
        } else {
            onSelectFormat(fmtId);
        }
    };

    const formats = [
        { id: "Kolaboratif Lintas Disiplin Ilmu", desc: "Integrasi kompetensi dari beberapa mata pelajaran." },
        { id: "Gerakan 7 KAIH", desc: "Pembiasaan 7 Kebiasaan Anak Indonesia Hebat (Bangun Pagi, Ibadah, Olahraga, dll)." },
        { id: "Cara Lainnya", desc: "Pendekatan berbasis budaya lokal atau kewirausahaan mandiri." },
    ];

    return (
        <div className="py-4 space-y-12 max-w-5xl mx-auto">
            
            {/* 1. TEMA UMUM */}
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-primary rounded-lg">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">1. Tema Kokurikuler</h3>
                            <p className="text-slate-500 text-sm">Pilih tema besar (kategori) sesuai Kurikulum Nasional.</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-auto">
                        <AIButton onClick={onGenerateThemes} isLoading={isLoading} text="Rekomendasi Tema" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {options.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                            Klik tombol "Rekomendasi Tema" untuk melihat pilihan tema yang sesuai analisis.
                        </div>
                    ) : (
                        options.map((opt, i) => (
                            <SelectionCard
                                key={i}
                                selected={selectedTheme === opt.name}
                                onClick={() => handleThemeChange(opt.name, opt.reason)}
                                title={opt.name}
                                description={opt.reason}
                                icon={Layers}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* 2. BENTUK KEGIATAN */}
            {selectedTheme && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-100 text-stone-600 rounded-lg">
                            <PenTool className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">2. Bentuk Kegiatan</h3>
                            <p className="text-slate-500 text-sm">Bagaimana pendekatan pelaksanaan projek ini?</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {formats.map((fmt) => (
                             <SelectionCard
                                key={fmt.id}
                                selected={activityFormat === fmt.id}
                                onClick={() => handleFormatChange(fmt.id)}
                                title={fmt.id}
                                description={fmt.desc}
                                icon={Zap}
                             />
                        ))}
                    </div>
                </div>
            )}

            {/* 3. IDE PROJEK (CREATIVE TITLE) */}
            {selectedTheme && activityFormat && (
                 <div ref={ideaRef} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 bg-gradient-to-br from-emerald-50 to-stone-50 p-6 rounded-3xl border border-emerald-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-200 text-emerald-800 rounded-lg">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">3. Ide Projek Kreatif</h3>
                                <p className="text-slate-500 text-sm">Nama projek yang menarik & relevan untuk siswa.</p>
                            </div>
                        </div>
                        <div className="w-full sm:w-auto">
                            <AIButton onClick={onGenerateIdeas} isLoading={isLoading} text="Generate Ide Kreatif" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        {creativeIdeas.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm italic">
                                Klik tombol Generate untuk mendapatkan ide judul projek yang sesuai.
                            </div>
                        ) : (
                            creativeIdeas.map((idea, i) => (
                                <SelectionCard
                                    key={i}
                                    selected={selectedIdea === idea.title}
                                    onClick={() => onSelectIdea(idea.title)}
                                    title={idea.title}
                                    description={idea.description}
                                    icon={Lightbulb}
                                    recommended={false} // Requirement: No recommendation highlight
                                />
                            ))
                        )}
                    </div>
                 </div>
            )}

        </div>
    );
};

export default StepThemeAndFormat;
