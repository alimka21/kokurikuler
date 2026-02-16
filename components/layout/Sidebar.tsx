
import React, { useMemo } from 'react';
import { GraduationCap, LayoutDashboard, FolderOpen, CheckCircle, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { STEPS } from '../../constants';
import { ProjectState, User } from '../../types';

interface SidebarProps {
    isOpen: boolean;
    currentView: string;
    onChangeView: (view: any) => void;
    currentStep: number;
    onStepClick: (idx: number) => void;
    user: User;
    projectData?: ProjectState;
    onEditIdentity: () => void; 
    onLogout: () => void; // Added Prop
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentView, onChangeView, currentStep, onStepClick, user, onEditIdentity, onLogout }) => {
    
    // Calculate progress percentage
    const progress = useMemo(() => {
        return Math.round(((currentStep + 1) / STEPS.length) * 100);
    }, [currentStep]);

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex flex-col shadow-lg shadow-slate-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Header */}
            <div className="h-24 px-8 flex items-center gap-4 border-b border-slate-50">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-glow shadow-primary/30">
                    <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-xl tracking-tight text-slate-900 leading-none">Pakar Kokurikuler</h1>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1.5">AI Generator</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">
                
                {/* Main Menu */}
                <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Menu Utama</h3>
                    <button onClick={() => onChangeView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${currentView === 'dashboard' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <LayoutDashboard className={`w-5 h-5 ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>Dashboard</span>
                    </button>
                    <button onClick={() => onChangeView('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${currentView === 'projects' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <FolderOpen className={`w-5 h-5 ${currentView === 'projects' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>Projek Saya</span>
                    </button>
                    <button onClick={onEditIdentity} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${currentView === 'identity' ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                        <Settings className={`w-5 h-5 ${currentView === 'identity' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span>Data Sekolah & Admin</span>
                    </button>

                    {/* Admin Menu Only */}
                    {user.role === 'admin' && (
                        <button onClick={() => onChangeView('admin')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group mt-4 border border-purple-100 ${currentView === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-slate-50/50 text-slate-600 hover:bg-purple-50 hover:text-purple-700'}`}>
                            <ShieldCheck className={`w-5 h-5 ${currentView === 'admin' ? 'text-purple-600' : 'text-slate-400 group-hover:text-purple-600'}`} />
                            <span>Admin Panel</span>
                        </button>
                    )}
                </div>

                {/* Wizard Steps (Only visible if not in Admin view) */}
                {currentView !== 'admin' && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tahapan Projek</h3>
                        {currentView === 'wizard' && (
                             <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{progress}%</span>
                        )}
                    </div>
                    <div className="relative pl-3 ml-2 border-l border-slate-100 space-y-1">
                        {STEPS.map((step, idx) => {
                            const isActive = currentView === 'wizard' && idx === currentStep;
                            const isCompleted = currentView === 'wizard' && idx < currentStep;

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => onStepClick(idx)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group ${
                                        isActive
                                            ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-semibold'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {isActive && <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full"></div>}
                                    <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : isCompleted ? 'text-emerald-500' : 'text-slate-300'}`}>
                                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : step.icon}
                                    </span>
                                    <span className="truncate">{step.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}
            </div>

            {/* Footer User Profile */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${user.role === 'admin' ? 'bg-purple-600' : 'bg-slate-400'}`}>
                            {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1">
                                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{user.name || 'User'}</p>
                                {user.role === 'admin' && <ShieldCheck className="w-3 h-3 text-purple-600" />}
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-[120px]">{user.school || 'School Name'}</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
                >
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
