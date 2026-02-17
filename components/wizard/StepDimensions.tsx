
import React from 'react';
import { Dimension, DIMENSION_OPTIONS } from '../../types';
import { SectionHeader, SelectionCard } from '../common/UiKit';
import { Users, Sparkles } from 'lucide-react';

interface Props {
    recommended: Dimension[];
    selected: Dimension[];
    onSelect: (d: Dimension[]) => void;
    isLoading?: boolean;
}

const StepDimensions: React.FC<Props> = ({ recommended, selected, onSelect, isLoading }) => {
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-primary animate-pulse">
                        <Sparkles className="w-8 h-8" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Menganalisis Konteks...</h3>
                <p className="text-slate-500 max-w-md text-lg leading-relaxed">
                    Tunggu sebentar AI akan menentukan rekomendasi dimensi profil lulusan yang sesuai dengan hasil analisis konteks kamu
                </p>
            </div>
        );
    }

    const toggle = (dim: Dimension) => {
        if (selected.includes(dim)) onSelect(selected.filter(d => d !== dim));
        else if (selected.length < 3) onSelect([...selected, dim]);
        else alert("Maksimal pilih 3 dimensi.");
    };

    return (
        <div className="py-4">
            <SectionHeader title="Dimensi Profil Lulusan" subtitle="Pilih maksimal 3 dimensi yang akan dikuatkan." />
            
            {recommended.length > 0 && (
                <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-emerald-800 text-sm font-medium">
                        Berdasarkan analisis konteks, AI merekomendasikan dimensi yang ditandai.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {DIMENSION_OPTIONS.map((dim) => (
                    <SelectionCard
                        key={dim}
                        title={dim}
                        selected={selected.includes(dim)}
                        recommended={recommended.includes(dim)}
                        onClick={() => toggle(dim)}
                        icon={Users}
                    />
                ))}
            </div>
        </div>
    );
};

export default StepDimensions;
