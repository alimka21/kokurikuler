
import React, { useEffect } from 'react';
import { Sparkles, CheckCircle, X, AlertCircle } from 'lucide-react';

export const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="text-center mb-10">
    <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-2xl mx-auto">{subtitle}</p>
  </div>
);

export const AIButton: React.FC<{ onClick: () => void; isLoading: boolean; text?: string }> = ({ 
  onClick, isLoading, text = "Bantu AI untuk Menganalisis" 
}) => (
  <button 
    onClick={onClick} 
    disabled={isLoading}
    className="w-full bg-primary text-white p-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
  >
    {isLoading ? (
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
    ) : (
      <Sparkles className="w-5 h-5" />
    )}
    <span>{isLoading ? 'Menganalisis...' : text}</span>
  </button>
);

export const InputGroup: React.FC<{
  label: string;
  icon: React.ElementType;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  children?: React.ReactNode; 
}> = ({ label, icon: Icon, value, onChange, placeholder, type = "text", children }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
      {children ? children : (
        <input 
          type={type} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-11 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

export const SelectionCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  recommended?: boolean;
  icon?: React.ElementType;
}> = ({ selected, onClick, title, description, recommended, icon: Icon }) => (
  <div 
    onClick={onClick}
    className={`relative p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-md ${
      selected 
        ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-soft' 
        : recommended
          ? 'border-emerald-400 ring-1 ring-emerald-400 bg-white'
          : 'border-slate-200 bg-white hover:border-primary/50'
    }`}
  >
    {recommended && (
      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap z-10 shadow-sm">
         Rekomendasi
      </div>
    )}
    <div className="flex justify-between items-start mb-2 gap-3">
      <div className="flex items-center gap-3">
         {Icon && (
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Icon className="w-5 h-5" />
             </div>
         )}
         <h4 className={`font-bold text-sm sm:text-base ${selected ? 'text-primary' : 'text-slate-900'}`}>{title}</h4>
      </div>
      {selected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />}
    </div>
    {description && (
      <p className="text-xs sm:text-sm leading-relaxed text-slate-500 mt-2 pl-1">
        {description}
      </p>
    )}
  </div>
);

// --- Notification Toast ---
export type NotificationType = 'success' | 'error' | 'info';

export const NotificationToast: React.FC<{
  message: string;
  type: NotificationType;
  isVisible: boolean;
  onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgClass = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? <CheckCircle className="w-5 h-5" /> : type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />;

  return (
    <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className={`${bgClass} text-white px-4 py-3 rounded-xl shadow-lg shadow-black/10 flex items-center gap-3 min-w-[300px]`}>
        {icon}
        <span className="font-bold text-sm flex-1">{message}</span>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
