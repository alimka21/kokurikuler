import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useProjectStore } from './store/projectStore';
import { STEPS } from './constants';
import { NotificationToast, NotificationType } from './components/common/UiKit';
import Swal from 'sweetalert2';
import { getAccessToken } from './services/supabaseClient';

// View Components
import Dashboard from './components/Dashboard';
import MyProjects from './components/MyProjects';
import Editor from './components/Editor';
import IdentitySettings from './components/IdentitySettings';
import AccountSettings from './components/AccountSettings'; 
import ApiKeySettings from './components/ApiKeySettings';
import AdminDashboard from './components/AdminDashboard'; 
import Login from './components/Login'; 
import ForcePasswordChange from './components/ForcePasswordChange'; 

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Steps
import StepIdentity from './components/wizard/StepIdentity';
import StepAnalysis from './components/wizard/StepAnalysis';
import StepDimensions from './components/wizard/StepDimensions';
import StepThemeAndFormat from './components/wizard/StepThemeAndFormat';
import StepGoals from './components/wizard/StepGoals';
import StepActivityPlanning from './components/wizard/StepActivityPlanning';
import StepFinalization from './components/wizard/StepFinalization';

import { ChevronRight, ChevronLeft, Save, WifiOff, RotateCcw } from 'lucide-react';

type ViewMode = 'dashboard' | 'projects' | 'wizard' | 'editor' | 'identity' | 'admin' | 'account' | 'apikey';

const AuthenticatedApp: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    
    // ZUSTAND HOOKS
    // We select state granularly to minimize re-renders where possible, 
    // but App acts as the Main Controller, so it subscribing to 'project' is expected behavior for passing props.
    // The performance win comes from Sidebar and other leaf components not re-rendering.
    const project = useProjectStore(state => state.project);
    const savedProjects = useProjectStore(state => state.savedProjects);
    const currentStep = useProjectStore(state => state.currentStep);
    const loadingAI = useProjectStore(state => state.loadingAI);
    const isFinalizing = useProjectStore(state => state.isFinalizing);
    
    // Actions
    const actions = useProjectStore(state => state.actions);

    // Sync User to Store
    useEffect(() => {
        if (user) actions.setOwner(user);
    }, [user]);

    // UI State
    const [view, setView] = useState<ViewMode>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: NotificationType }>({ show: false, msg: '', type: 'success' });

    const showNotify = (msg: string, type: NotificationType = 'success') => {
        setToast({ show: true, msg, type });
    };

    useEffect(() => {
        const handleOnline = () => { setIsOffline(false); showNotify("Koneksi Internet Kembali", "success"); };
        const handleOffline = () => { setIsOffline(true); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // DEBUG: Log JWT Token
    useEffect(() => {
        if (user) {
            getAccessToken().then(token => {
                if (token) {
                    console.log("%c🔑 JWT Token:", "color: #558B6E; font-weight: bold; font-size: 12px;", token);
                }
            });
        }
    }, [user]);

    // --- ROUTING ENGINE ---
    useEffect(() => {
        if (!user) return;
        const handleHashChange = () => {
            const hash = window.location.hash.replace(/^#\/?/, '');
            if (user.role === 'admin') {
                if (hash === 'admin') { setView('admin'); return; }
                if (hash === '' || hash === 'dashboard') { window.location.hash = '#/admin'; return; }
            }
            if (hash === 'admin' && user.role !== 'admin') { setView('dashboard'); window.location.hash = '#/dashboard'; return; }

            if (hash === 'projects') setView('projects');
            else if (hash === 'wizard') setView('wizard');
            else if (hash === 'editor') setView('editor');
            else if (hash === 'settings') setView('identity');
            else if (hash === 'account') setView('account');
            else if (hash === 'apikey') setView('apikey');
            else if (hash === 'dashboard') setView('dashboard');
            else if (hash === 'admin') setView('admin');
            else {
                if (user.role === 'admin') window.location.hash = '#/admin';
                else { setView('dashboard'); if (hash !== 'dashboard') window.location.hash = '#/dashboard'; }
            }
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [user, user?.role]); 

    useEffect(() => {
        if (!user) return;
        const hash = window.location.hash.replace(/^#\/?/, '');
        let targetHash = 'dashboard';
        if (view === 'admin') targetHash = 'admin';
        else if (view === 'projects') targetHash = 'projects';
        else if (view === 'wizard') targetHash = 'wizard';
        else if (view === 'editor') targetHash = 'editor';
        else if (view === 'identity') targetHash = 'settings';
        else if (view === 'account') targetHash = 'account';
        else if (view === 'apikey') targetHash = 'apikey';

        if (hash !== targetHash) {
            if (targetHash === 'admin' && user.role !== 'admin') return;
            window.location.hash = `/${targetHash}`;
        }
    }, [view, user]);

    const handleStartProject = () => {
        actions.createNewProject();
        setView('wizard');
    };

    const handleLoadProject = (id: string) => {
        actions.loadProject(id);
        setView('wizard');
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Keluar Aplikasi?',
            text: "Pastikan Anda sudah menyimpan projek yang sedang dikerjakan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Keluar'
        });
        if (result.isConfirmed) {
            await logout();
            setView('dashboard');
            window.location.hash = '';
        }
    };
    
    const handleReset = () => {
        Swal.fire({
            title: 'Buat Projek Baru?',
            text: 'Tindakan ini akan mereset data projek saat ini.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Buat Baru',
            confirmButtonColor: '#558B6E'
        }).then((result) => {
            if (result.isConfirmed) {
                actions.resetProject();
                window.scrollTo(0, 0);
            }
        });
    };

    if (user?.force_password_change) {
        return <ForcePasswordChange onSuccess={() => updateUser({ ...user, force_password_change: false })} />;
    }

    if (view === 'admin' && user?.role === 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                <AdminDashboard />
                <button onClick={handleLogout} className="fixed bottom-6 right-6 bg-white text-slate-600 px-4 py-2 rounded-lg shadow-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 font-bold text-xs">Keluar</button>
            </div>
        );
    }

    let headerTitle = "Overview";
    if (view === 'editor') headerTitle = "Document Editor";
    else if (view === 'projects') headerTitle = "Library & Projek";
    else if (view === 'identity') headerTitle = "Pengaturan Data Sekolah";
    else if (view === 'account') headerTitle = "Pengaturan Akun";
    else if (view === 'apikey') headerTitle = "Manajemen API Key";
    else if (view === 'wizard') headerTitle = STEPS[currentStep].title;

    const renderStepContent = () => {
        switch (currentStep + 1) {
            case 1: return <StepIdentity project={project} onChange={actions.updateProject} savedProjects={savedProjects} />;
            case 2: return <StepAnalysis data={project.contextAnalysis} phase={project.phase} targetClass={project.targetClass} onUpdateData={(d) => actions.updateProject('contextAnalysis', d)} onAnalyze={actions.runAnalysis} summary={project.analysisSummary} isAnalyzing={loadingAI} />;
            case 3: return <StepDimensions recommended={project.recommendedDimensions} selected={project.selectedDimensions} onSelect={(dims) => actions.updateProject('selectedDimensions', dims)} isLoading={loadingAI} />;
            case 4: return <StepThemeAndFormat options={project.themeOptions} selectedTheme={project.selectedTheme} onSelectTheme={(t, r) => { actions.updateProject('selectedTheme', t); actions.updateProject('selectedThemeReason', r); }} activityFormat={project.activityFormat} onSelectFormat={(f) => actions.updateProject('activityFormat', f)} creativeIdeas={project.creativeIdeas} selectedIdea={project.title} onSelectIdea={(t) => { actions.updateProject('title', t); const sel = project.creativeIdeas.find(i => i.title === t); if(sel) actions.updateProject('projectDescription', sel.description); }} onGenerateIdeas={actions.runCreativeIdeaGen} isLoading={loadingAI} onGenerateThemes={actions.runThemeRecommend} hasDownstreamData={project.projectGoals.length > 0 || project.activities.length > 0} />;
            case 5: return <StepGoals goals={project.projectGoals} setGoals={(g) => actions.updateProject('projectGoals', g)} onGenerate={actions.runGoalDraft} isGenerating={loadingAI} phase={project.phase} />;
            case 6: 
                const usedByOthers = savedProjects.filter(p => p.targetClass === project.targetClass && p.id !== project.id).reduce((acc, p) => acc + (p.projectJpAllocation || 0), 0);
                return <StepActivityPlanning totalJp={project.projectJpAllocation} totalAnnualJp={project.totalJpAnnual} usedByOthers={usedByOthers} setTotalJp={(v) => actions.updateProject('projectJpAllocation', v)} activities={project.activities} setActivities={(a) => actions.updateProject('activities', a)} onGenerate={actions.runActivityPlan} isGenerating={loadingAI} />;
            case 7: return <StepFinalization project={project} isReady={!!project.assessmentPlan} isFinalizing={isFinalizing} themeName={project.selectedTheme} onFinalize={actions.runFinalization} onViewEditor={() => setView('editor')} onDownload={actions.exportDocx} onDownloadAnnual={actions.exportAnnualDocx} onSaveProject={actions.saveProject} onReset={handleReset} />;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans text-slate-900">
             {isOffline && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-800 text-white text-xs py-1 text-center flex items-center justify-center gap-2">
                    <WifiOff className="w-3 h-3" /> Mode Offline
                </div>
            )}
            <NotificationToast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <Sidebar 
                isOpen={isSidebarOpen} currentView={view} onChangeView={(v) => setView(v)}
                currentStep={currentStep} onStepClick={(idx) => { setView('wizard'); actions.goToStep(idx); }}
                user={user!} onEditIdentity={() => setView('identity')} onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header title={headerTitle} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                <div className="flex-1 overflow-y-auto scroll-smooth p-6 sm:p-8">
                    {view === 'dashboard' && <Dashboard onNewProject={handleStartProject} savedProjects={savedProjects} onLoadProject={handleLoadProject} />}
                    {view === 'projects' && (
                        <MyProjects 
                            onNewProject={handleStartProject} savedProjects={savedProjects} onLoadProject={handleLoadProject} 
                            onDuplicateProject={actions.duplicateProject} onDeleteProject={actions.deleteProject}
                            onCreateNextProject={actions.createNextProjectForClass} onChangeView={(v) => setView(v as ViewMode)}
                        />
                    )}
                    {view === 'identity' && <IdentitySettings project={project} onChange={actions.updateProject} onSave={() => showNotify('Data Sekolah berhasil disimpan!', 'success')} />}
                    {view === 'account' && <AccountSettings user={user!} />}
                    {view === 'apikey' && <ApiKeySettings user={user!} />}
                    {view === 'wizard' && (
                        <div className="max-w-5xl mx-auto pb-32">
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {renderStepContent()}
                            </div>
                        </div>
                    )}
                    {view === 'editor' && (
                        <div className="max-w-5xl mx-auto h-full">
                            <Editor label="Review Dokumen Lengkap" value={`MODUL PROJEK\n${project.schoolName}\n\nTema: ${project.selectedTheme}\n\n[Dokumen lengkap tersedia dalam format .docx setelah diunduh]`} onChange={()=>{}} height="h-screen" />
                        </div>
                    )}
                </div>

                {view === 'wizard' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 z-40">
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button onClick={actions.prevStep} disabled={currentStep === 0} className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2 flex-1 sm:flex-none justify-center">
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                <button onClick={handleReset} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all flex-none" title="Reset">
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={() => actions.saveProject()} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center">
                                        <Save className="w-4 h-4" /> Simpan
                                    </button>
                                )}
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={actions.nextStep} className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center">
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    const { user, isLoading, login } = useAuth();
    if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="w-10 h-10 border-4 border-primary rounded-full animate-spin border-t-transparent"></div></div>;
    if (!user) return <Login onLogin={(u) => login(u)} />;
    return <AuthenticatedApp />;
};

export default App;