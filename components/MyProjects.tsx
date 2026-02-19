
import React, { useState, useMemo } from 'react';
import { 
  PlusCircle,
  Table as TableIcon,
  X,
  Trash2,
  FolderOpen,
  PieChart,
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowRight,
  Download
} from 'lucide-react';
import { ProjectState } from '../types';
import Swal from 'sweetalert2';
import { generateAnnualProgramDocx, generateAndDownloadDocx } from '../utils/docxGenerator';
import DocumentPreview from './common/DocumentPreview';

interface MyProjectsProps {
  onNewProject: () => void;
  savedProjects: ProjectState[];
  onLoadProject: (id: string) => void;
  onDuplicateProject: (id: string, newClass: string, phase: string) => void;
  onDeleteProject?: (id: string) => void; // New prop
  onCreateNextProject?: (targetClass: string) => void; // New prop
  onChangeView?: (view: string) => void; // Pass to redirect after creating next project
}

const MyProjects: React.FC<MyProjectsProps> = ({ 
    onNewProject, 
    savedProjects, 
    onLoadProject, 
    onDeleteProject,
    onCreateNextProject,
    onChangeView
}) => {
  
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [previewProject, setPreviewProject] = useState<ProjectState | null>(null);

  // Group Projects by Class
  const groupedProjects = useMemo(() => {
    const groups: Record<string, ProjectState[]> = {};
    savedProjects.forEach(p => {
        const cls = p.targetClass || "Draft (Tanpa Kelas)";
        if (!groups[cls]) groups[cls] = [];
        groups[cls].push(p);
    });
    // Sort by class name
    return Object.keys(groups).sort().reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
    }, {} as Record<string, ProjectState[]>);
  }, [savedProjects]);

  // Initial Expand for all classes
  useMemo(() => {
      const initial: Record<string, boolean> = {};
      Object.keys(groupedProjects).forEach(k => initial[k] = true);
      if (Object.keys(expandedClasses).length === 0) setExpandedClasses(initial);
  }, [groupedProjects]);

  const toggleClass = (cls: string) => {
      setExpandedClasses(prev => ({ ...prev, [cls]: !prev[cls] }));
  };

  const handleDownloadAnnual = async (className: string, projects: ProjectState[]) => {
      try {
          if (projects.length === 0) return;
          // Use the first project as the "primary" context carrier
          await generateAnnualProgramDocx(projects[0], projects);
          Swal.fire({
              icon: 'success',
              title: 'Berhasil Unduh',
              text: `Program Tahunan ${className} telah diunduh.`,
              timer: 1500,
              showConfirmButton: false
          });
      } catch (e) {
          Swal.fire('Error', 'Gagal mengunduh dokumen.', 'error');
      }
  };

  const handleDownloadSingle = async () => {
      if (!previewProject) return;
      try {
          await generateAndDownloadDocx(previewProject);
          Swal.fire({
              icon: 'success',
              title: 'Unduhan Dimulai',
              text: 'Dokumen sedang diproses...',
              timer: 1500,
              showConfirmButton: false
          });
      } catch (e) {
          Swal.fire('Error', 'Gagal mengunduh dokumen.', 'error');
      }
  };

  const handleDelete = (id: string) => {
      Swal.fire({
          title: 'Hapus Projek?',
          text: "Data yang dihapus tidak dapat dikembalikan.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Ya, Hapus'
      }).then((result) => {
          if (result.isConfirmed && onDeleteProject) {
              onDeleteProject(id);
          }
      });
  };

  const handleCreateNext = (cls: string) => {
      if (onCreateNextProject && onChangeView) {
          onCreateNextProject(cls);
          onChangeView('wizard');
      }
  };

  const handleOpenPreview = (proj: ProjectState) => {
      setPreviewProject(proj);
  };

  const handleEditFromPreview = () => {
      if (previewProject) {
          onLoadProject(previewProject.id);
          setPreviewProject(null);
      }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Daftar Projek</h1>
          <p className="text-slate-500 text-sm">Kelola dokumen kokurikuler Anda per kelas.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
                onClick={onNewProject}
                className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
             >
                <PlusCircle className="w-5 h-5" /> Buat Projek Baru (Awal)
             </button>
        </div>
      </div>

      {Object.keys(groupedProjects).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Belum ada projek tersimpan</h3>
              <p className="text-slate-500 max-w-sm text-center mb-6">
                  Mulai buat projek baru atau simpan draft projek yang sedang Anda kerjakan.
              </p>
          </div>
      ) : (
        <div className="space-y-6">
            {Object.entries(groupedProjects).map(([className, projects]: [string, ProjectState[]]) => {
                const totalUsed = projects.reduce((acc, p) => acc + p.projectJpAllocation, 0);
                const annualTarget = projects[0]?.totalJpAnnual || 0;
                const isOverLimit = totalUsed > annualTarget;
                const isOpen = expandedClasses[className];

                return (
                    <div key={className} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        {/* Group Header */}
                        <div 
                            className="p-5 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => toggleClass(className)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-1 rounded-md transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{className}</h3>
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5">
                                        <PieChart className="w-3.5 h-3.5" />
                                        <span>Total JP: <strong className={isOverLimit ? "text-red-500" : "text-emerald-600"}>{totalUsed}</strong> / {annualTarget} JP</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3" onClick={e => e.stopPropagation()}>
                                <button 
                                    onClick={() => handleCreateNext(className)}
                                    className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-primary/20"
                                    title="Buat projek ke-2 di kelas ini tanpa analisis ulang"
                                >
                                    <PlusCircle className="w-4 h-4" /> Projek Lanjutan
                                </button>
                                <button 
                                    onClick={() => handleDownloadAnnual(className, projects)}
                                    className="px-4 py-2 bg-white text-slate-600 hover:text-teal-600 hover:border-teal-200 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <TableIcon className="w-4 h-4" /> Program Tahunan
                                </button>
                            </div>
                        </div>

                        {/* Projects List Table */}
                        {isOpen && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-white border-b border-slate-100 text-xs uppercase font-bold text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 w-12 text-center">No</th>
                                            <th className="px-6 py-4">Tema & Ide Projek</th>
                                            <th className="px-6 py-4">Dimensi Profil</th>
                                            <th className="px-6 py-4 text-center">Alokasi JP</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {projects.map((proj, idx) => (
                                            <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-center font-medium text-slate-400">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-base">{proj.selectedTheme || "Belum Ada Tema"}</div>
                                                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">{proj.title !== "MODUL PROJEK" ? proj.title : "Draft Projek"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {proj.selectedDimensions.slice(0, 2).map((d, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium">{d}</span>
                                                        ))}
                                                        {proj.selectedDimensions.length > 2 && (
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium">+{proj.selectedDimensions.length - 2}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">{proj.projectJpAllocation} JP</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!!proj.assessmentPlan ? (
                                                        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold">Selesai</span>
                                                    ) : (
                                                        <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-md text-xs font-bold">Draft</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleOpenPreview(proj)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Buka
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(proj.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      )}
    </div>

    {/* Preview Modal */}
    {previewProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-transparent w-full max-w-5xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 px-4">
                    <h3 className="text-white font-bold text-lg">Preview Dokumen</h3>
                    <button onClick={() => setPreviewProject(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden rounded-3xl bg-slate-100 relative shadow-2xl">
                     <div className="absolute inset-0 overflow-y-auto p-4 sm:p-8 flex justify-center">
                         <DocumentPreview project={previewProject} />
                     </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => setPreviewProject(null)} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                        Tutup
                    </button>
                    
                    {/* Download Button */}
                    <button 
                        onClick={handleDownloadSingle}
                        className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Download className="w-5 h-5" /> Unduh .docx
                    </button>

                    {!previewProject.assessmentPlan && (
                        <button 
                            onClick={handleEditFromPreview}
                            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all"
                        >
                            Lanjut Edit / Revisi <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default MyProjects;
