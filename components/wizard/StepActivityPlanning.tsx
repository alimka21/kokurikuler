
import React from 'react';
import { Activity } from '../../types';
import { AIButton } from '../common/UiKit';
import { Plus, Trash2, PieChart, AlertCircle } from 'lucide-react';

const ActivityItem: React.FC<{ 
    idx: number; activity: Activity; 
    onUpdate: (id: string, f: keyof Activity, v: any) => void; 
    onRemove: (id: string) => void 
}> = ({ idx, activity, onUpdate, onRemove }) => (
    <div className="relative pl-12 group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
        <div className="absolute left-2.5 top-6 w-4 h-4 bg-white border-4 border-primary rounded-full z-10 shadow-sm"></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group-hover:border-primary/30">
            <div className="flex justify-between items-start mb-3 gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-md tracking-wide">
                        Tahap {idx + 1}
                        </span>
                        <input 
                        value={activity.type}
                        onChange={(e) => onUpdate(activity.id, 'type', e.target.value)}
                        className="text-xs text-primary font-bold bg-transparent border-none p-0 focus:ring-0 w-48 uppercase tracking-wide placeholder:text-primary/50"
                        placeholder="TIPE (CONTOH: KUNJUNGAN)"
                        />
                    </div>
                    <input 
                    value={activity.name}
                    onChange={(e) => onUpdate(activity.id, 'name', e.target.value)}
                    className="font-bold text-slate-900 text-lg w-full border-none p-0 focus:ring-0 bg-transparent placeholder:text-slate-300"
                    placeholder="Nama Kegiatan"
                    />
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <input 
                            type="number" 
                            value={activity.jp}
                            min={1}
                            onChange={(e) => onUpdate(activity.id, 'jp', parseInt(e.target.value) || 0)}
                            className="w-10 text-center bg-transparent border-none p-0 focus:ring-0 font-bold text-slate-900"
                            />
                            <span className="text-xs text-slate-400 font-bold">JP</span>
                        </div>
                        <button onClick={() => onRemove(activity.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
            <textarea 
                value={activity.description}
                onChange={(e) => onUpdate(activity.id, 'description', e.target.value)}
                className="w-full text-sm text-slate-600 bg-slate-50 rounded-xl p-3 border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                placeholder="Deskripsi kegiatan..."
                rows={2}
            />
        </div>
    </div>
);

interface Props {
  totalJp: number; // Project JP
  totalAnnualJp?: number; // Annual JP (Optional to avoid breaking if not passed yet)
  setTotalJp: (v: number) => void;
  activities: Activity[]; 
  setActivities: (a: Activity[]) => void;
  onGenerate: () => void; 
  isGenerating: boolean;
}

const StepActivityPlanning: React.FC<Props> = ({ totalJp, totalAnnualJp = 360, setTotalJp, activities, setActivities, onGenerate, isGenerating }) => {
  
  const totalAllocated = activities.reduce((acc, curr) => acc + curr.jp, 0);
  const remainingAnnual = Math.max(0, totalAnnualJp - totalJp);

  const add = () => setActivities([...activities, { id: Date.now().toString(), name: "Kegiatan Baru", type: "Praktik", jp: 2, description: "" }]);
  const update = (id: string, f: keyof Activity, v: any) => setActivities(activities.map(a => a.id === id ? { ...a, [f]: v } : a));
  const remove = (id: string) => setActivities(activities.filter(a => a.id !== id));

  return (
    <div className="flex flex-col lg:flex-row gap-8 py-4">
      <div className="w-full lg:w-1/3 space-y-6">
        <div className="sticky top-24 space-y-6">
           {/* Project Allocation Card */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Alokasi JP Projek Ini</label>
              <div className="relative">
                 <input type="number" value={totalJp || ''} onChange={(e) => setTotalJp(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-bold text-2xl text-slate-900" placeholder="0" />
                 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">JP</span>
              </div>
           </div>

           {/* Annual Stat Card */}
           <div className="bg-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-soft relative overflow-hidden">
                <PieChart className="absolute right-4 top-4 text-slate-700 w-24 h-24 opacity-20" />
                <div className="relative z-10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Program Tahunan</h3>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm text-slate-300">Total Tahunan</span>
                        <span className="font-bold">{totalAnnualJp} JP</span>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                         <span className="text-sm text-slate-300">Dipakai Projek Ini</span>
                         <span className="font-bold text-emerald-400">-{totalJp} JP</span>
                    </div>
                    <div className="pt-4 border-t border-slate-600">
                         <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-200">Sisa JP Tersedia</span>
                            <span className="text-2xl font-bold text-white">{remainingAnnual} JP</span>
                        </div>
                    </div>
                </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Distribusi Aktivitas</h3>
              <div className="flex items-baseline gap-2 mb-2">
                 <span className={`text-4xl font-bold tracking-tight ${totalAllocated > totalJp ? 'text-red-500' : 'text-primary'}`}>{totalAllocated}</span>
                 <span className="text-slate-400 font-medium text-lg">/ {totalJp} JP</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${totalAllocated > totalJp ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min((totalAllocated / totalJp) * 100, 100)}%` }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                  Pastikan total aktivitas sama dengan alokasi JP projek.
              </p>
           </div>

           <AIButton onClick={onGenerate} isLoading={isGenerating} text="Bantu AI untuk Menganalisis" />
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900 text-lg">Timeline Aktivitas</h3>
          <button onClick={add} className="text-xs font-bold text-primary bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
        </div>

        {activities.length === 0 ? (
           <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-400">Belum ada aktivitas. Masukkan JP lalu klik tombol AI.</div>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
             {activities.map((act, idx) => <ActivityItem key={act.id} idx={idx} activity={act} onUpdate={update} onRemove={remove} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default StepActivityPlanning;
