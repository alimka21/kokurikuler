
import React, { useState } from 'react';
import { Wand2, CheckCircle, Download, Save, Eye, PlusCircle, AlertTriangle } from 'lucide-react';
import { ProjectState } from '../../types';

interface Props {
    project: ProjectState;
    isReady: boolean;
    isFinalizing: boolean;
    themeName: string;
    onFinalize: () => void;
    onViewEditor: () => void;
    onDownload: () => void;
    onDownloadAnnual?: () => void;
    onSaveProject?: () => void;
    onReset?: () => void;
}

const StepFinalization: React.FC<Props> = ({ 
    project,
    isReady, 
    isFinalizing, 
    themeName, 
    onFinalize, 
    onViewEditor, 
    onDownload,
    onDownloadAnnual,
    onSaveProject,
    onReset
}) => {
    
    const [previewTab, setPreviewTab] = useState<'modul' | 'annual'>('modul');
    
    const formatDate = (d: string) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Helper for Alphabet Indexing
    const getAlphabetIndex = (index: number) => {
        return String.fromCharCode(65 + index); // 65 is 'A'
    };

    // Derived unique subjects
    const uniqueSubjects = Array.from(new Set(project.projectGoals.flatMap(g => g.subjects)));

    return (
        <div className="flex flex-col items-center justify-center py-4 max-w-6xl mx-auto w-full">
            {!isReady && !isFinalizing ? (
                // STATE 1: Not Generated Yet
                <div className="space-y-8 bg-white p-12 rounded-3xl border border-slate-200 shadow-soft-lg text-center max-w-3xl">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <Wand2 className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3">Finalisasi Dokumen</h2>
                        <p className="text-slate-500 leading-relaxed max-w-lg mx-auto">
                            Sistem cerdas akan menyusun narasi akademik untuk bagian: <strong>Pedagogi, Lingkungan, Digital, Asesmen, dan Rincian Langkah Kegiatan.</strong>
                        </p>
                    </div>
                    <button onClick={onFinalize} className="px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-hover transition-all">
                        Generate Dokumen Lengkap
                    </button>
                </div>
            ) : isFinalizing ? (
                // STATE 2: Loading
                <div className="space-y-6 text-center py-20">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-600 font-medium animate-pulse">Sedang menyusun narasi dan rincian aktivitas...</p>
                </div>
            ) : (
                // STATE 3: Ready with Preview
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
                    
                    {/* LEFT COLUMN: ACTIONS */}
                    <div className="lg:col-span-4 space-y-6">
                        
                        {/* WARNING ALERT */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-amber-800">Peringatan</h4>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    Jangan lupa klik tombol <strong>Simpan</strong> di bawah sebelum meninggalkan halaman ini agar dokumen tidak hilang.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-soft-lg space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Dokumen Siap</h2>
                                    <p className="text-xs text-slate-500">Siap diunduh & dicetak</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <button onClick={onDownload} className="w-full px-6 py-4 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:bg-primary-hover flex items-center justify-center gap-2 transition-all">
                                    <Download className="w-5 h-5" /> Unduh Modul (.docx)
                                </button>
                                {/* Download Annual removed here, available in My Projects */}
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 gap-3">
                                <button 
                                    onClick={onSaveProject} 
                                    className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <Save className="w-4 h-4" /> Simpan Projek
                                </button>
                                {onReset && (
                                    <button 
                                        onClick={onReset}
                                        className="w-full px-4 py-3 bg-white border border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <PlusCircle className="w-4 h-4" /> Buat Projek Lagi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: PREVIEW */}
                    <div className="lg:col-span-8">
                        <div className="bg-slate-500/10 rounded-3xl p-6 sm:p-10 border border-slate-200/50 flex justify-center overflow-hidden min-h-[600px] relative inner-shadow">
                             <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1 z-10">
                                <Eye className="w-3 h-3" /> Live Preview
                             </div>

                             {/* TAB 1: MODUL PROJEK (A4 PORTRAIT) */}
                             {previewTab === 'modul' && (
                                <div className="origin-top transition-all duration-300 ease-in-out shadow-2xl" style={{ transform: 'scale(0.65)', marginBottom: '-30%' }}>
                                    <div 
                                        className="bg-white text-black p-16 flex flex-col"
                                        style={{ 
                                            width: '595px', // Standard CSS px for A4 width ratio
                                            minHeight: '842px', 
                                            fontFamily: '"Times New Roman", Times, serif',
                                            lineHeight: '1.5'
                                        }}
                                    >
                                        <h1 className="text-center font-bold text-2xl mb-1">MODUL PROJEK</h1>
                                        <h2 className="text-center font-bold text-xl uppercase">{project?.schoolName || "NAMA SEKOLAH"}</h2>

                                        {/* Table 1: Identitas */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg mt-8">
                                            <thead>
                                                <tr><th colSpan={2} className="border border-black bg-gray-200 p-2 text-center">Identitas Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="border border-black p-2 font-bold w-1/3">Tema Projek</td><td className="border border-black p-2">{project?.selectedTheme}</td></tr>
                                                <tr><td className="border border-black p-2 font-bold">Ide Projek</td><td className="border border-black p-2">{project?.title === "MODUL PROJEK" ? "-" : project?.title}</td></tr>
                                                <tr><td className="border border-black p-2 font-bold">Kelas</td><td className="border border-black p-2">{project?.targetClass}</td></tr>
                                                <tr><td className="border border-black p-2 font-bold">Alokasi Waktu</td><td className="border border-black p-2">{project?.projectJpAllocation} JP</td></tr>
                                                {/* NEW ROW: Integrated Subjects */}
                                                <tr>
                                                    <td className="border border-black p-2 font-bold align-top">Mata Pelajaran Terkait</td>
                                                    <td className="border border-black p-2 align-top">
                                                         {uniqueSubjects.length > 0 ? (
                                                            <ol className="list-decimal pl-5 m-0 space-y-1">
                                                                {uniqueSubjects.map(s => <li key={s}>{s}</li>)}
                                                            </ol>
                                                         ) : "-"}
                                                    </td>
                                                </tr>
                                                {/* UPDATED ROW: Locations as Numbered List */}
                                                <tr>
                                                    <td className="border border-black p-2 font-bold align-top">Lokasi Kegiatan</td>
                                                    <td className="border border-black p-2 align-top">
                                                        {project?.activityLocations && project.activityLocations.length > 0 ? (
                                                            <ol className="list-decimal pl-5 m-0 space-y-1">
                                                                {project.activityLocations.map((loc, idx) => (
                                                                    <li key={idx}>{loc}</li>
                                                                ))}
                                                            </ol>
                                                        ) : "-"}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Table 2: Deskripsi (Simplified: NO Context Analysis) */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <thead>
                                                <tr><th className="border border-black bg-gray-200 p-2 text-center">Deskripsi Singkat Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="border border-black p-3">{project?.projectDescription || "Belum ada deskripsi."}</td></tr>
                                            </tbody>
                                        </table>

                                        {/* Table 3: Detail */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <tbody>
                                                <tr>
                                                    <td className="border border-black p-2 font-bold w-1/3 align-top">Dimensi Profil Lulusan</td>
                                                    <td className="border border-black p-2 align-top">
                                                        <ol className="list-decimal pl-5 m-0 space-y-2">
                                                            {project?.selectedDimensions.map(d => (
                                                                <li key={d}>{d}</li>
                                                            ))}
                                                        </ol>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className="border border-black p-2 font-bold align-top">Tujuan Projek</td>
                                                    <td className="border border-black p-2 align-top">
                                                        <ol className="list-decimal pl-5 m-0 space-y-2">
                                                            {project?.projectGoals.map(g => (
                                                                <li key={g.id}>{g.description}</li>
                                                            ))}
                                                        </ol>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        
                                        {/* Table 4: Kegiatan (Updated to match detailed format) */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <thead>
                                                <tr><th className="border border-black bg-gray-200 p-2 text-center">Kegiatan Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-black p-3 align-top">
                                                        {project?.activities.map((act, i) => (
                                                            <div key={act.id} className="mb-6">
                                                                <div className="font-bold mb-2">
                                                                    {getAlphabetIndex(i)}. {act.name} ({act.jp} JP)
                                                                </div>
                                                                {/* Render Detailed Steps if Available */}
                                                                {act.steps && act.steps.length > 0 ? (
                                                                    <ol className="list-decimal pl-5 m-0 space-y-1 text-base">
                                                                        {act.steps.map((step, idx) => (
                                                                            <li key={idx}>{step.replace(/^\d+[\.\)]\s*/, '')}</li>
                                                                        ))}
                                                                    </ol>
                                                                ) : (
                                                                    <p className="pl-4 mt-1 text-base italic text-gray-500">{act.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Table 5: Asesmen */}
                                        <h2 className="text-center font-bold text-xl mb-2 mt-4">Asesmen Projek</h2>
                                        <table className="w-full border-collapse border border-black mb-6 text-sm">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th className="border border-black p-2">Dimensi</th>
                                                    <th className="border border-black p-2">Aspek</th>
                                                    <th className="border border-black p-2">Sangat Baik</th>
                                                    <th className="border border-black p-2">Baik</th>
                                                    <th className="border border-black p-2">Cukup</th>
                                                    <th className="border border-black p-2">Kurang</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {project.assessmentRubrics && project.assessmentRubrics.length > 0 ? (
                                                    project.assessmentRubrics.map((dimGroup, i) => (
                                                        dimGroup.rubrics.map((rubric, j) => (
                                                            <tr key={`${i}-${j}`}>
                                                                <td className="border border-black p-2 font-bold">{j === 0 ? dimGroup.dimensionName : ''}</td>
                                                                <td className="border border-black p-2">{rubric.aspect}</td>
                                                                <td className="border border-black p-2">{rubric.score4}</td>
                                                                <td className="border border-black p-2">{rubric.score3}</td>
                                                                <td className="border border-black p-2">{rubric.score2}</td>
                                                                <td className="border border-black p-2">{rubric.score1}</td>
                                                            </tr>
                                                        ))
                                                    ))
                                                ) : (
                                                    <tr><td colSpan={6} className="border border-black p-2 text-center text-gray-500">-</td></tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {/* Signatures */}
                                        <div className="mt-8 flex justify-between px-4 text-lg">
                                            <div className="text-center w-1/2">
                                                <p>Kepala Sekolah</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline">{project?.principalName || "Nama..."}</p>
                                                <p>NIP. {project?.principalNip}</p>
                                            </div>
                                            <div className="text-center w-1/2">
                                                <p>{project?.signaturePlace}, {formatDate(project?.signatureDate || "")}</p>
                                                <p>Koordinator Projek</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline">{project?.coordinatorName || "Nama..."}</p>
                                                <p>NIP. {project?.coordinatorNip}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepFinalization;
