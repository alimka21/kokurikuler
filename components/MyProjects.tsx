
import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Sparkles, 
  PlusCircle,
  Clock,
  ArrowRight,
  Table as TableIcon,
  X,
  Copy,
  Trash2
} from 'lucide-react';
import { ProjectState } from '../types';
import Swal from 'sweetalert2';

// Helper to determine classes based on Phase (Simplified for Duplication Modal)
const getClassesForPhase = (phase: string) => {
    if (phase === "Fase A") return ["Kelas 1", "Kelas 2"];
    if (phase === "Fase B") return ["Kelas 3", "Kelas 4"];
    if (phase === "Fase C") return ["Kelas 5", "Kelas 6"];
    if (phase === "Fase D") return ["Kelas 7", "Kelas 8", "Kelas 9"];
    if (phase === "Fase E") return ["Kelas 10"];
    if (phase === "Fase F") return ["Kelas 11", "Kelas 12"];
    return [];
};

interface ProjectCardProps {
  project: ProjectState;
  onLoad: () => void;
  onViewAnnual: () => void;
  onDuplicate: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onLoad, onViewAnnual, onDuplicate }) => {
  // Simple random image based on theme string length to keep it deterministic but varied
  const images = [
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2604&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2622&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2673&auto=format&fit=crop"
  ];
  const imgIdx = (project.selectedTheme?.length || 0) % images.length;
  const image = images[imgIdx];

  return (
  <div className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full relative">
    {/* Duplicate Button */}
    <button 
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
        className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur text-slate-600 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-primary shadow-sm"
        title="Duplikasi Projek ke Kelas Lain"
    >
        <Copy className="w-4 h-4" />
    </button>

    <div className="h-40 overflow-hidden relative">
      <img 
        src={image} 
        alt={project.title} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      <div className="absolute top-3 left-3">
        <span className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> {project.targetClass || "Draft"}
        </span>
      </div>
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide bg-slate-100 text-slate-600">
            {project.phase}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide bg-emerald-100 text-emerald-700">
            {project.projectJpAllocation} JP
          </span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-primary transition-colors">
        {project.selectedTheme || "Belum Ada Tema"}
      </h3>
      <p className="text-slate-500 text-xs mb-4 line-clamp-2">
         {project.projectGoals.length > 0 ? project.projectGoals[0].description : "Masih dalam tahap perancangan..."}
      </p>
      
      <div className="mt-auto grid grid-cols-2 gap-2">
        <button 
          onClick={onLoad}
          className="col-span-2 bg-primary/5 hover:bg-primary hover:text-white text-primary font-bold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/20"
        >
          <ArrowRight className="w-4 h-4" />
          <span>Buka</span>
        </button>
        {/* <button 
          onClick={onViewAnnual}
          className="col-span-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Lihat Program Tahunan</span>
        </button> */}
      </div>
    </div>
  </div>
)};

interface MyProjectsProps {
  onNewProject: () => void;
  savedProjects: ProjectState[];
  onLoadProject: (id: string) => void;
  onDuplicateProject: (id: string, newClass: string, phase: string) => void;
}

const MyProjects: React.FC<MyProjectsProps> = ({ onNewProject, savedProjects, onLoadProject, onDuplicateProject }) => {
  
  const [duplicateModal, setDuplicateModal] = useState<{ isOpen: boolean; projectId: string; phase: string } | null>(null);
  
  const handleDuplicateClick = (proj: ProjectState) => {
      setDuplicateModal({ isOpen: true, projectId: proj.id, phase: proj.phase });
  };

  const confirmDuplicate = (newClass: string) => {
      if (duplicateModal) {
          onDuplicateProject(duplicateModal.projectId, newClass, duplicateModal.phase);
          setDuplicateModal(null);
      }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Projek Saya</h1>
          <p className="text-slate-500 text-sm">Kelola {savedProjects.length} rancangan projek tersimpan.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
             <button 
                onClick={onNewProject}
                className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2"
             >
                <PlusCircle className="w-5 h-5" /> Buat Baru
             </button>
        </div>
      </div>

      {/* Grid Projects */}
      {savedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Belum ada projek tersimpan</h3>
              <p className="text-slate-500 max-w-sm text-center mb-6">
                  Mulai buat projek baru atau simpan draft projek yang sedang Anda kerjakan.
              </p>
              <button onClick={onNewProject} className="text-primary font-bold hover:underline">Mulai Buat Projek</button>
          </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {savedProjects.map((proj) => (
            <ProjectCard 
                key={proj.id}
                project={proj}
                onLoad={() => onLoadProject(proj.id)}
                onViewAnnual={() => {}} // Not implemented in view only
                onDuplicate={() => handleDuplicateClick(proj)}
            />
            ))}
        </div>
      )}
    </div>
    
    {/* Duplicate Modal */}
    {duplicateModal && duplicateModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Duplikasi Projek</h3>
                    <button onClick={() => setDuplicateModal(null)}><X className="w-5 h-5 text-slate-500" /></button>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                    Pilih kelas tujuan untuk menduplikasi projek ini. Hanya kelas dalam <strong>{duplicateModal.phase}</strong> yang tersedia.
                </p>
                <div className="space-y-2">
                    {getClassesForPhase(duplicateModal.phase).map(cls => (
                        <button 
                            key={cls}
                            onClick={() => confirmDuplicate(cls)}
                            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 hover:text-primary font-medium transition-all flex justify-between items-center group"
                        >
                            <span>{cls}</span>
                            <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default MyProjects;
