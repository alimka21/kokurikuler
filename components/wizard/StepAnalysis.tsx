
import React from 'react';
import { ContextAnalysisData, AnalysisItem } from '../../types';
import { BookOpen, Users, Building2, Globe, Check, Sparkles, AlertCircle } from 'lucide-react';
import { ANALYSIS_OPTIONS } from '../../constants';
import { SectionHeader, AIButton } from '../common/UiKit';

const CheckboxGroup: React.FC<{
  options: string[];
  selected: string[];
  custom: string;
  onSelect: (val: string[]) => void;
  onCustomChange: (val: string) => void;
}> = ({ options, selected, custom, onSelect, onCustomChange }) => {
  const toggle = (opt: string) => selected.includes(opt) ? onSelect(selected.filter(s => s !== opt)) : onSelect([...selected, opt]);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(opt => {
          const isChecked = selected.includes(opt);
          return (
            <div key={opt} onClick={() => toggle(opt)} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-primary ring-1 ring-primary' : 'bg-slate-50 border-slate-200 hover:border-primary/50'}`}>
              <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center transition-colors ${isChecked ? 'bg-primary text-white' : 'bg-white border border-slate-300'}`}>
                {isChecked && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-sm font-medium leading-snug ${isChecked ? 'text-primary' : 'text-slate-700'}`}>{opt}</span>
            </div>
          )
        })}
      </div>
      <input type="text" value={custom} onChange={(e) => onCustomChange(e.target.value)} placeholder="Lainnya (tulis manual)..." className="w-full text-sm p-3 bg-white border border-slate-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" />
    </div>
  );
};

const AnalysisSection: React.FC<{
    title: string;
    icon: React.ElementType;
    colorClass: string;
    children: React.ReactNode;
}> = ({ title, icon: Icon, colorClass, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="bg-slate-50/80 p-6 border-b border-slate-100 flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white ${colorClass}`}><Icon className="w-5 h-5"/></div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        </div>
        <div className="p-6 space-y-8">{children}</div>
    </div>
);

interface Props {
  data: ContextAnalysisData;
  phase: string;
  targetClass: string;
  onUpdateData: (data: ContextAnalysisData) => void;
  onAnalyze: () => void;
  summary: string;
  isAnalyzing: boolean;
}

const StepAnalysis: React.FC<Props> = ({ data, phase, targetClass, onUpdateData, onAnalyze, summary, isAnalyzing }) => {

  const update = <K extends keyof ContextAnalysisData>(sec: K, key: keyof ContextAnalysisData[K], field: 'selected' | 'custom', val: any) => {
    onUpdateData({ ...data, [sec]: { ...data[sec], [key]: { ...(data[sec][key] as AnalysisItem), [field]: val } } });
  };

  const renderField = <K extends keyof ContextAnalysisData>(label: string, sec: K, key: keyof ContextAnalysisData[K]) => (
    <div>
      <label className="block text-sm font-bold text-slate-800 mb-3 leading-relaxed">{label}</label>
      <CheckboxGroup 
        options={(ANALYSIS_OPTIONS as any)[sec][key]} 
        selected={(data[sec] as any)[key].selected} 
        custom={(data[sec] as any)[key].custom}
        onSelect={(v) => update(sec, key, 'selected', v)}
        onCustomChange={(v) => update(sec, key, 'custom', v)}
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-4">
      <SectionHeader title="Analisis Konteks" subtitle="Jawab pertanyaan reflektif berikut untuk memetakan kondisi sekolah Anda." />
      
      {/* Context Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-amber-500">
                <AlertCircle className="w-5 h-5" />
            </div>
            <div>
                <h4 className="font-bold text-amber-800 text-sm">Lingkup Analisis</h4>
                <p className="text-amber-700 text-sm mt-1 leading-relaxed">
                    Analisis ini hanya mencakup kondisi pada <strong>{phase} - {targetClass || "Kelas Target"}</strong> yang Anda pilih, bukan kondisi umum satu sekolah. Pastikan jawaban Anda relevan dengan murid di kelas tersebut.
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-8">
        <AnalysisSection title="1. Kesesuaian Kurikulum" icon={BookOpen} colorClass="bg-primary">
             {renderField("Bagaimana kegiatan kokurikuler bisa mendukung capaian kurikulum dan dimensi profil lulusan yang ditargetkan sekolah?", "curriculum", "goals")}
             {renderField("Kompetensi apa dari murid yang belum optimal tercapai melalui intrakurikuler?", "curriculum", "gaps")}
             {renderField("Nilai/karakter apa yang paling ingin ditanamkan melalui kokurikuler?", "curriculum", "values")}
        </AnalysisSection>
        <AnalysisSection title="2. Profil Murid" icon={Users} colorClass="bg-secondary">
             {renderField("Bidang apa yang paling diminati murid?", "students", "interests")}
             {renderField("Bakat/keunggulan apa yang sudah menonjol pada murid?", "students", "talents")}
             {renderField("Dari intrakurikuler, aspek apa yang masih lemah?", "students", "needs")}
        </AnalysisSection>
        <AnalysisSection title="3. Sumber Daya Sekolah" icon={Building2} colorClass="bg-amber-500">
             {renderField("Fasilitas fisik apa yang bisa dimanfaatkan untuk kegiatan kokurikuler?", "resources", "assets")}
             {renderField("Siapa saja yang bisa dilibatkan?", "resources", "people")}
             {renderField("Bagaimana kondisi finansial sekolah?", "resources", "finance")}
             {renderField("Mitra/lingkungan apa di sekitar sekolah yang bisa diajak kerja sama?", "resources", "partners")}
        </AnalysisSection>
        <AnalysisSection title="4. Konteks Sosial" icon={Globe} colorClass="bg-indigo-500">
             {renderField("Isu nyata apa yang sedang dihadapi murid?", "social", "issues")}
             {renderField("Nilai apa yang paling perlu dikuatkan agar murid siap menghadapi tantangan sosial?", "social", "values")}
             {renderField("Bagaimana kondisi sosial ekonomi mayoritas keluarga murid dan dampaknya?", "social", "socioeco")}
        </AnalysisSection>
      </div>

      <div className="mt-10 mb-8 sticky bottom-4 z-20">
         <AIButton onClick={onAnalyze} isLoading={isAnalyzing} text="Bantu AI untuk Menganalisis" />
      </div>

      {summary && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-soft animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
             <div className="p-2 bg-blue-100 text-primary rounded-lg"><Sparkles className="w-5 h-5" /></div>
             <h3 className="font-bold text-lg text-slate-900">Hasil Analisis & Insight Strategis</h3>
          </div>
          <p className="whitespace-pre-wrap text-slate-700 leading-relaxed text-sm">{summary}</p>
        </div>
      )}
    </div>
  );
};

export default StepAnalysis;
