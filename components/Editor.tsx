
import React from 'react';
import { Wand2 } from 'lucide-react';

interface EditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  placeholder?: string;
  height?: string;
  helperText?: string;
}

const Editor: React.FC<EditorProps> = ({ 
  label, 
  value, 
  onChange, 
  onGenerate, 
  isGenerating, 
  placeholder,
  height = "h-96",
  helperText
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-soft">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
        <div>
           <label className="block text-xl font-bold text-slate-900">{label}</label>
           {helperText && <p className="text-slate-500 text-sm mt-0.5">{helperText}</p>}
        </div>
        
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {isGenerating ? 'Menganalisis...' : 'Bantu AI untuk Menganalisis'}
          </button>
        )}
      </div>
      <div className="relative">
        <textarea
          className={`w-full p-6 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 text-lg leading-relaxed font-doc resize-none transition-all placeholder:text-slate-300 shadow-inner ${height}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Mulai menulis..."}
        />
      </div>
    </div>
  );
};

export default Editor;
