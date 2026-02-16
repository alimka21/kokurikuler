
import React, { useState } from 'react';
import { Wand2, CheckCircle, FileText, Download, CalendarRange, Save, Eye } from 'lucide-react';
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
    onSaveProject
}) => {
    
    const [previewTab, setPreviewTab] = useState<'modul' | 'annual'>('modul');
    
    const formatDate = (d: string) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

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
                            Sistem cerdas akan menyusun narasi akademik untuk bagian: <strong>Pedagogi, Lingkungan, Digital, dan Asesmen.</strong>
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
                    <p className="text-slate-600 font-medium animate-pulse">Sedang menyusun narasi...</p>
                </div>
            ) : (
                // STATE 3: Ready with Preview
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in duration-500">
                    
                    {/* LEFT COLUMN: ACTIONS */}
                    <div className="lg:col-span-4 space-y-6">
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
                                {onDownloadAnnual && (
                                    <button onClick={onDownloadAnnual} className="w-full px-6 py-4 bg-teal-500 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/25 hover:bg-teal-600 flex items-center justify-center gap-2 transition-all">
                                        <CalendarRange className="w-5 h-5" /> Unduh Program Tahunan
                                    </button>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                                <button onClick={onViewEditor} className="px-4 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2 transition-all text-sm">
                                    <FileText className="w-4 h-4" /> Edit Teks
                                </button>
                                <button 
                                    onClick={onSaveProject} 
                                    className="px-4 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 flex items-center justify-center gap-2 transition-all text-sm"
                                >
                                    <Save className="w-4 h-4" /> Simpan
                                </button>
                            </div>
                        </div>

                         {/* View Switcher */}
                         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tampilan Preview</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setPreviewTab('modul')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${previewTab === 'modul' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Modul Projek
                                </button>
                                <button 
                                    onClick={() => setPreviewTab('annual')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${previewTab === 'annual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Program Tahunan
                                </button>
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
                                                <tr><th colSpan={2} className="border border-black bg-gray-200 p-1 text-center">Identitas Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="border border-black p-1 font-bold w-1/3">Tema Projek</td><td className="border border-black p-1">{project?.selectedTheme}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Ide Projek</td><td className="border border-black p-1">{project?.title === "MODUL PROJEK" ? "-" : project?.title}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Kelas</td><td className="border border-black p-1">{project?.targetClass}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Alokasi Waktu</td><td className="border border-black p-1">{project?.projectJpAllocation} JP</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Lokasi</td><td className="border border-black p-1">{project?.activityLocations?.join(", ") || "-"}</td></tr>
                                            </tbody>
                                        </table>

                                        {/* Table 2: Deskripsi */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <thead>
                                                <tr><th className="border border-black bg-gray-200 p-1 text-center">Deskripsi Singkat Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr><td className="border border-black p-2">{project?.analysisSummary?.substring(0, 300) || "..."}</td></tr>
                                            </tbody>
                                        </table>

                                        {/* Table 3: Detail */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <tbody>
                                                <tr><td className="border border-black p-1 font-bold w-1/3">Dimensi Profil Lulusan</td><td className="border border-black p-1">{project?.selectedDimensions.join(", ")}</td></tr>
                                                <tr><td className="border border-black p-1 font-bold">Tujuan Projek</td><td className="border border-black p-1">
                                                    <ul className="list-decimal pl-4">
                                                        {project?.projectGoals.map(g => <li key={g.id}>{g.description}</li>)}
                                                    </ul>
                                                </td></tr>
                                            </tbody>
                                        </table>
                                        
                                        {/* Table 4: Kegiatan */}
                                        <table className="w-full border-collapse border border-black mb-6 text-lg">
                                            <thead>
                                                <tr><th className="border border-black bg-gray-200 p-1 text-center">Kegiatan Projek</th></tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-black p-2">
                                                        {project?.activities.map((act, i) => (
                                                            <div key={act.id} className="mb-2">
                                                                <strong>{i+1}. {act.name} ({act.jp} JP)</strong>
                                                                <p className="pl-4">{act.description}</p>
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        {/* Signatures */}
                                        <div className="mt-8 flex justify-between px-4 text-lg">
                                            <div className="text-center">
                                                <p>Kepala Sekolah</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline">{project?.principalName || "Nama..."}</p>
                                                <p>NIP. {project?.principalNip}</p>
                                            </div>
                                            <div className="text-center">
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

                            {/* TAB 2: PROGRAM TAHUNAN (A4 LANDSCAPE) */}
                            {previewTab === 'annual' && (
                                <div className="origin-top transition-all duration-300 ease-in-out shadow-2xl" style={{ transform: 'scale(0.55)', marginBottom: '-10%' }}>
                                    <div 
                                        className="bg-white text-black p-12 origin-top-left"
                                        style={{ 
                                            width: '842px', // A4 Landscape
                                            minHeight: '595px', 
                                            fontFamily: '"Times New Roman", Times, serif'
                                        }}
                                    >
                                        <h1 className="text-center font-bold text-2xl mb-2">PROGRAM TAHUNAN</h1>
                                        <h2 className="text-center font-bold text-xl uppercase mb-6">TAHUN AJARAN {new Date().getFullYear()}/{new Date().getFullYear() + 1}</h2>

                                        <table className="w-full border-collapse border border-black text-sm">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th className="border border-black p-2">No</th>
                                                    <th className="border border-black p-2">Kelas</th>
                                                    <th className="border border-black p-2">Tema</th>
                                                    <th className="border border-black p-2">Alokasi JP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="border border-black p-2 text-center">1</td>
                                                    <td className="border border-black p-2 text-center">{project?.targetClass || "-"}</td>
                                                    <td className="border border-black p-2">{project?.selectedTheme || "Belum ditentukan"}</td>
                                                    <td className="border border-black p-2 text-center">{project?.projectJpAllocation || 0} JP</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="border border-black p-2 text-right font-bold">Total JP Tahunan</td>
                                                    <td className="border border-black p-2 text-center font-bold">{project?.totalJpAnnual || 0} JP</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        
                                        {/* Signatures for Annual */}
                                        <div className="mt-16 flex justify-between px-8">
                                            <div className="text-center">
                                                <p>Kepala Sekolah</p>
                                                <br/><br/><br/>
                                                <p className="font-bold underline">{project?.principalName || "Nama..."}</p>
                                                <p>NIP. {project?.principalNip}</p>
                                            </div>
                                            <div className="text-center">
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
