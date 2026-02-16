
import React from 'react';
import { FolderOpen, Edit3, CheckCircle, Plus, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { ProjectState } from '../types';

interface DashboardProps {
  onNewProject: () => void;
  savedProjects: ProjectState[];
  onLoadProject: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNewProject, savedProjects, onLoadProject }) => {
  
  // Calculate Stats
  const totalProjects = savedProjects.length;
  // Assume a project is "Completed" if it has generated the final assessment plan
  const completedProjects = savedProjects.filter(p => !!p.assessmentPlan).length;
  const draftProjects = totalProjects - completedProjects;

  // Get Recent Projects (Sort by lastUpdated desc, take top 2)
  const recentProjects = [...savedProjects]
    .sort((a, b) => b.lastUpdated - a.lastUpdated)
    .slice(0, 2);

  // Time formatter helper
  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700">
      
      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Dokumen</p>
              <p className="text-3xl font-bold text-slate-900">{totalProjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
              <FolderOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Draft Aktif</p>
              <p className="text-3xl font-bold text-slate-900">{draftProjects}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Edit3 className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Terselesaikan</p>
              <p className="text-3xl font-bold text-slate-900">{completedProjects}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-secondary">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Projek Terbaru</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Mapped Recent Projects */}
          {recentProjects.map((proj) => (
            <div key={proj.id} onClick={() => onLoadProject(proj.id)} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-soft hover:shadow-lg hover:border-primary/30 transition-all duration-300 group cursor-pointer h-[280px]">
              <div className="h-32 bg-slate-100 relative overflow-hidden">
                 {/* Decorative Gradient based on theme string length */}
                 <div className={`absolute inset-0 opacity-80 bg-gradient-to-br ${proj.selectedTheme.length % 2 === 0 ? 'from-blue-500 to-primary' : 'from-emerald-400 to-secondary'}`}></div>
                 <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-medium border border-white/20">
                   {proj.targetClass || "Draft"}
                 </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {proj.selectedTheme || "Projek Tanpa Judul"}
                </h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {proj.projectGoals.length > 0 ? proj.projectGoals[0].description : "Belum ada deskripsi tujuan."}
                </p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{getTimeAgo(proj.lastUpdated)}</span>
                  </div>
                  <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Lanjut <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* New Project CTA Card */}
          <button onClick={onNewProject} className="flex flex-col items-center justify-center h-[280px] border-2 border-dashed border-slate-300 rounded-2xl hover:border-primary hover:bg-blue-50/50 transition-all group">
            <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-primary transition-all duration-300">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <span className="text-slate-900 font-bold text-lg">Buat Projek Baru</span>
            <span className="text-slate-400 text-sm mt-1">Mulai dari awal</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
