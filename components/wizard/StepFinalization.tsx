
import React, { useState } from 'react';
import { Wand2, CheckCircle, Download, Save, Eye, PlusCircle, AlertTriangle } from 'lucide-react';
import { ProjectState } from '../../types';
import DocumentPreview from '../common/DocumentPreview';

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
    onFinalize, 
    onDownload,
    onSaveProject,
    onReset
}) => {
    
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
                    <div className="lg:col-span-8 relative">
                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-500 flex items-center gap-1 z-10 pointer-events-none">
                            <Eye className="w-3 h-3" /> Live Preview
                        </div>
                        <DocumentPreview project={project} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepFinalization;
