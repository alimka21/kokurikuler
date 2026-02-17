
import React from 'react';
import { ProjectGoal } from '../../types';
import { AIButton, SectionHeader } from '../common/UiKit';
import { Plus, Trash2, Tag, BookOpenCheck, ChevronDown } from 'lucide-react';
import { SUBJECTS_BY_PHASE, DEFAULT_SUBJECTS } from '../../constants';

interface Props {
  goals: ProjectGoal[];
  setGoals: (goals: ProjectGoal[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  phase: string; // Receive phase for filtering
}

const StepGoals: React.FC<Props> = ({ goals, setGoals, onGenerate, isGenerating, phase }) => {

  const addGoal = () => {
    setGoals([
      ...goals, 
      { 
        id: Date.now().toString(), 
        description: "", 
        subjects: [] 
      }
    ]);
  };

  const updateGoal = (id: string, field: keyof ProjectGoal, value: any) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Helper to handle subject tags
  const addSubject = (id: string, currentSubjects: string[], newSubject: string) => {
     if (!newSubject.trim()) return;
     if (!currentSubjects.includes(newSubject.trim())) {
         updateGoal(id, 'subjects', [...currentSubjects, newSubject.trim()]);
     }
  };

  const removeSubject = (id: string, currentSubjects: string[], subjectToRemove: string) => {
      updateGoal(id, 'subjects', currentSubjects.filter(s => s !== subjectToRemove));
  };

  // Get subjects based on phase
  const availableSubjects = SUBJECTS_BY_PHASE[phase] || DEFAULT_SUBJECTS;

  return (
    <div className="max-w-4xl mx-auto py-4">
      <SectionHeader 
        title="Tujuan Projek & Integrasi Mapel" 
        subtitle="Rumuskan tujuan spesifik dan tentukan mata pelajaran yang terintegrasi (Minimal 2 Mapel)." 
      />

      <div className="flex justify-end mb-6">
         <div className="w-full sm:w-auto">
            <AIButton onClick={onGenerate} isLoading={isGenerating} text="Bantu AI untuk Menganalisis" />
         </div>
      </div>

      <div className="space-y-6">
        {goals.length === 0 ? (
           <div className="text-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
              <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Belum ada tujuan projek.</p>
              <button onClick={addGoal} className="mt-4 text-primary font-bold hover:underline">Tambah Tujuan Manual</button>
           </div>
        ) : (
            goals.map((goal, index) => (
                <div key={goal.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft group transition-all hover:border-primary/30">
                    <div className="flex items-start gap-4">
                        {/* Numbering Circle */}
                        <div className="w-8 h-8 flex-shrink-0 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm border border-slate-200 group-hover:bg-primary group-hover:text-white transition-colors">
                            {index + 1}
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Goal Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Rumusan Tujuan</label>
                                <textarea 
                                    value={goal.description}
                                    onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-900 resize-none font-medium"
                                    rows={2}
                                    placeholder="Peserta didik mampu..."
                                />
                            </div>

                            {/* Subjects Integration */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Tag className="w-3 h-3" /> Integrasi Mata Pelajaran ({phase})
                                     </label>
                                     {goal.subjects.length < 2 && (
                                         <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">Min. 2 Mapel</span>
                                     )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    {goal.subjects.map(subj => (
                                        <span key={subj} className="inline-flex items-center gap-1 px-3 py-1 bg-white text-blue-700 text-sm font-bold rounded-full border border-blue-100 shadow-sm">
                                            {subj}
                                            <button onClick={() => removeSubject(goal.id, goal.subjects, subj)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </span>
                                    ))}
                                    
                                    {/* Datalist Input for filtered subjects */}
                                    <div className="relative flex-1 min-w-[200px]">
                                        <input 
                                            list={`subjects-${goal.id}`}
                                            className="w-full bg-transparent border-none text-sm placeholder:text-slate-400 focus:ring-0 p-1"
                                            placeholder="+ Pilih Mapel (Ketik untuk cari...)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addSubject(goal.id, goal.subjects, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if(e.target.value) {
                                                    addSubject(goal.id, goal.subjects, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <datalist id={`subjects-${goal.id}`}>
                                            {availableSubjects.map((subject) => (
                                                <option key={subject} value={subject} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Delete Button */}
                        <button onClick={() => removeGoal(goal.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="mt-6 text-center">
         <button onClick={addGoal} className="px-6 py-3 bg-white border border-dashed border-slate-300 text-slate-500 rounded-xl font-bold hover:border-primary hover:text-primary transition-all flex items-center gap-2 mx-auto">
             <Plus className="w-5 h-5" /> Tambah Tujuan Manual
         </button>
      </div>
    </div>
  );
};

export default StepGoals;
