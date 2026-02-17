
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { STEPS } from './constants';
import { NotificationToast, NotificationType } from './components/common/UiKit';
import Swal from 'sweetalert2';

// View Components
import Dashboard from './components/Dashboard';
import MyProjects from './components/MyProjects';
import Editor from './components/Editor';
import IdentitySettings from './components/IdentitySettings';
import AccountSettings from './components/AccountSettings'; 
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

import { ChevronRight, ChevronLeft, Save, AlertTriangle, WifiOff } from 'lucide-react';

type ViewMode = 'dashboard' | 'projects' | 'wizard' | 'editor' | 'identity' | 'admin' | 'account';

// --- SUB-COMPONENT: The Authenticated Layout & Routing ---
const AuthenticatedApp: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const { 
        project, savedProjects, updateProject, currentStep, nextStep, prevStep, goToStep,
        loadingAI, isFinalizing, saveProject, createNewProject, loadProject, duplicateProject,
        runAnalysis, runThemeRecommend, runCreativeIdeaGen, runGoalDraft, runActivityPlan, 
        runFinalization, exportDocx, exportAnnualDocx 
    } = useProject();

    // UI State
    const [view, setView] = useState<ViewMode>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: NotificationType }>({ show: false, msg: '', type: 'success' });

    const showNotify = (msg: string, type: NotificationType = 'success') => {
        setToast({ show: true, msg, type });
    };

    // Offline Detection
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

    // --- ROUTING ENGINE ---
    useEffect(() => {
        if (!user) return;

        const handleHashChange = () => {
            // Robust hash parsing
            const hash = window.location.hash.replace(/^#\/?/, '');

            // 1. Admin Routing Priority
            if (user.role === 'admin') {
                if (hash === 'admin') {
                    setView('admin');
                    return;
                }
                // Redirect admin to admin panel if they are on root or standard dashboard
                if (hash === '' || hash === 'dashboard') {
                    window.location.hash = '#/admin';
                    return;
                }
            }

            // 2. Protect Admin Route from Non-Admins
            if (hash === 'admin' && user.role !== 'admin') {
                setView('dashboard');
                window.location.hash = '#/dashboard';
                return;
            }

            // 3. Standard Routing
            if (hash === 'projects') setView('projects');
            else if (hash === 'wizard') setView('wizard');
            else if (hash === 'editor') setView('editor');
            else if (hash === 'settings') setView('identity');
            else if (hash === 'account') setView('account');
            else if (hash === 'dashboard') setView('dashboard');
            else if (hash === 'admin') setView('admin'); // Valid admin case
            else {
                // Fallback
                if (user.role === 'admin') {
                    window.location.hash = '#/admin';
                } else {
                    setView('dashboard');
                    if (hash !== 'dashboard') window.location.hash = '#/dashboard';
                }
            }
        };

        // Run immediately on mount
        handleHashChange();
        
        // Listen for changes
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [user, user?.role]); 

    // Sync View State changes back to URL Hash
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

        if (hash !== targetHash) {
            if (targetHash === 'admin' && user.role !== 'admin') return;
            window.location.hash = `/${targetHash}`;
        }
    }, [view, user]);

    const handleStartProject = () => {
        createNewProject();
        setView('wizard');
    };

    const handleLoadProject = (id: string) => {
        loadProject(id);
        setView('wizard');
    };

    const handleLogout = async () => {
        // Confirmation before logout to prevent data loss
        const result = await Swal.fire({
            title: 'Keluar Aplikasi?',
            text: "Pastikan Anda sudah menyimpan projek yang sedang dikerjakan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            await logout();
            setView('dashboard');
            window.location.hash = '';
        }
    };

    // --- RENDER LOGIC ---

    if (user?.force_password_change) {
        return <ForcePasswordChange onSuccess={() => updateUser({ ...user, force_password_change: false })} />;
    }

    // SPECIAL CASE: Standalone Admin Dashboard
    if (view === 'admin' && user?.role === 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
                <AdminDashboard />
                {/* Floating Logout for Admin Standalone View */}
                <button 
                    onClick={handleLogout}
                    className="fixed bottom-6 right-6 bg-white text-slate-600 px-4 py-2 rounded-lg shadow-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-xs font-bold"
                >
                    Keluar
                </button>
            </div>
        );
    }

    let headerTitle = "Overview";
    if (view === 'editor') headerTitle = "Document Editor";
    else if (view === 'projects') headerTitle = "Library & Projek";
    else if (view === 'identity') headerTitle = "Pengaturan Data Sekolah";
    else if (view === 'account') headerTitle = "Pengaturan Akun";
    else if (view === 'wizard') headerTitle = STEPS[currentStep].title;

    const renderStepContent = () => {
        switch (currentStep + 1) {
            case 1: return <StepIdentity project={project} onChange={updateProject} savedProjects={savedProjects} />;
            case 2: return <StepAnalysis data={project.contextAnalysis} phase={project.phase} targetClass={project.targetClass} onUpdateData={(d) => updateProject('contextAnalysis', d)} onAnalyze={runAnalysis} summary={project.analysisSummary} isAnalyzing={loadingAI} />;
            case 3: return <StepDimensions recommended={project.recommendedDimensions} selected={project.selectedDimensions} onSelect={(dims) => updateProject('selectedDimensions', dims)} isLoading={loadingAI} />;
            case 4: return <StepThemeAndFormat options={project.themeOptions} selectedTheme={project.selectedTheme} onSelectTheme={(t, r) => { updateProject('selectedTheme', t); updateProject('selectedThemeReason', r); }} activityFormat={project.activityFormat} onSelectFormat={(f) => updateProject('activityFormat', f)} creativeIdeas={project.creativeIdeas} selectedIdea={project.title} onSelectIdea={(t) => { updateProject('title', t); const selectedIdeaObj = project.creativeIdeas.find(idea => idea.title === t); if (selectedIdeaObj) { updateProject('projectDescription', selectedIdeaObj.description); } }} onGenerateIdeas={runCreativeIdeaGen} isLoading={loadingAI} onGenerateThemes={runThemeRecommend} />;
            case 5: return <StepGoals goals={project.projectGoals} setGoals={(g) => updateProject('projectGoals', g)} onGenerate={runGoalDraft} isGenerating={loadingAI} />;
            case 6: return <StepActivityPlanning totalJp={project.projectJpAllocation} totalAnnualJp={project.totalJpAnnual} setTotalJp={(v) => updateProject('projectJpAllocation', v)} activities={project.activities} setActivities={(a) => updateProject('activities', a)} onGenerate={runActivityPlan} isGenerating={loadingAI} />;
            case 7: return <StepFinalization project={project} isReady={!!project.assessmentPlan} isFinalizing={isFinalizing} themeName={project.selectedTheme} onFinalize={runFinalization} onViewEditor={() => setView('editor')} onDownload={exportDocx} onDownloadAnnual={exportAnnualDocx} onSaveProject={saveProject} />;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans text-slate-900">
             {isOffline && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-800 text-white text-xs py-1 text-center flex items-center justify-center gap-2">
                    <WifiOff className="w-3 h-3" /> Mode Offline - Perubahan disimpan secara lokal.
                </div>
            )}
            <NotificationToast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

            <Sidebar 
                isOpen={isSidebarOpen} currentView={view} onChangeView={(v) => setView(v)}
                currentStep={currentStep} onStepClick={(idx) => { setView('wizard'); goToStep(idx); }}
                user={user!} projectData={project} onEditIdentity={() => setView('identity')} onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header title={headerTitle} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
                <div className="flex-1 overflow-y-auto scroll-smooth p-6 sm:p-8">
                    {view === 'dashboard' && <Dashboard onNewProject={handleStartProject} savedProjects={savedProjects} onLoadProject={handleLoadProject} />}
                    {view === 'projects' && <MyProjects onNewProject={handleStartProject} savedProjects={savedProjects} onLoadProject={handleLoadProject} onDuplicateProject={duplicateProject} />}
                    {view === 'identity' && <IdentitySettings project={project} onChange={updateProject} onSave={() => showNotify('Data Sekolah berhasil disimpan!', 'success')} />}
                    {view === 'account' && <AccountSettings user={user!} />}
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
                            <button onClick={prevStep} disabled={currentStep === 0} className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2 transition-all">
                                <ChevronLeft className="w-5 h-5" /> Back
                            </button>
                            <div className="flex items-center gap-3">
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={() => saveProject()} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Simpan
                                    </button>
                                )}
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={nextStep} className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center gap-2">
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

// --- ROOT COMPONENT: Orchestrator ---
const App: React.FC = () => {
    const { user, isLoading, connectionError, login } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <p className="text-xs text-slate-400 mt-2">Memuat Sesi...</p>
                </div>
            </div>
        );
    }

    if (connectionError && !user) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Koneksi Database Gagal</h2>
                    <p className="text-slate-500 mb-6 text-sm leading-relaxed">{connectionError}</p>
                    <button onClick={() => window.location.reload()} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                        Muat Ulang
                    </button>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={login} />;
    }

    return (
        <ProjectProvider user={user}>
            <AuthenticatedApp />
        </ProjectProvider>
    );
};

export default App;
