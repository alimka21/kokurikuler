
import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
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
import ApiKeySettings from './components/ApiKeySettings'; // New Import
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

import { ChevronRight, ChevronLeft, Save, AlertTriangle, WifiOff, RotateCcw } from 'lucide-react';

type ViewMode = 'dashboard' | 'projects' | 'wizard' | 'editor' | 'identity' | 'admin' | 'account' | 'apikey';

// --- SUB-COMPONENT: The Authenticated Layout & Routing ---
const AuthenticatedApp: React.FC = () => {
    const { user, logout, updateUser } = useAuth();
    const { 
        project, savedProjects, updateProject, currentStep, nextStep, prevStep, goToStep,
        loadingAI, isFinalizing, saveProject, createNewProject, loadProject, duplicateProject, resetProject, deleteProject, createNextProjectForClass,
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

    // DEBUG: Log JWT Token for RLS Testing
    useEffect(() => {
        if (user) {
            getAccessToken().then(token => {
                if (token) {
                    console.log("%c🔑 JWT Token (Copy untuk SQL Editor):", "color: #558B6E; font-weight: bold; font-size: 12px;", token);
                }
            });
        }
    }, [user]);

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
            else if (hash === 'apikey') setView('apikey');
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
        else if (view === 'apikey') targetHash = 'apikey';

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
    
    const handleReset = () => {
        Swal.fire({
            title: 'Buat Projek Baru?',
            text: 'Tindakan ini akan mereset data projek saat ini. Pastikan Anda sudah menyimpannya jika perlu.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#558B6E',
            confirmButtonText: 'Ya, Buat Baru',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                resetProject();
                window.scrollTo(0, 0);
            }
        });
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
    else if (view === 'apikey') headerTitle = "Manajemen API Key";
    else if (view === 'wizard') headerTitle = STEPS[currentStep].title;

    const renderStepContent = () => {
        switch (currentStep + 1) {
            case 1: return <StepIdentity project={project} onChange={updateProject} savedProjects={savedProjects} />;
            case 2: return <StepAnalysis data={project.contextAnalysis} phase={project.phase} targetClass={project.targetClass} onUpdateData={(d) => updateProject('contextAnalysis', d)} onAnalyze={runAnalysis} summary={project.analysisSummary} isAnalyzing={loadingAI} />;
            case 3: return <StepDimensions recommended={project.recommendedDimensions} selected={project.selectedDimensions} onSelect={(dims) => updateProject('selectedDimensions', dims)} isLoading={loadingAI} />;
            case 4: return <StepThemeAndFormat options={project.themeOptions} selectedTheme={project.selectedTheme} onSelectTheme={(t, r) => { updateProject('selectedTheme', t); updateProject('selectedThemeReason', r); }} activityFormat={project.activityFormat} onSelectFormat={(f) => updateProject('activityFormat', f)} creativeIdeas={project.creativeIdeas} selectedIdea={project.title} onSelectIdea={(t) => { updateProject('title', t); const selectedIdeaObj = project.creativeIdeas.find(idea => idea.title === t); if (selectedIdeaObj) { updateProject('projectDescription', selectedIdeaObj.description); } }} onGenerateIdeas={runCreativeIdeaGen} isLoading={loadingAI} onGenerateThemes={runThemeRecommend} hasDownstreamData={project.projectGoals.length > 0 || project.activities.length > 0} />;
            case 5: return <StepGoals goals={project.projectGoals} setGoals={(g) => updateProject('projectGoals', g)} onGenerate={runGoalDraft} isGenerating={loadingAI} phase={project.phase} />;
            case 6: 
                // Calculate Used JP by OTHER projects in the same class
                const usedByOthers = savedProjects
                    .filter(p => p.targetClass === project.targetClass && p.id !== project.id)
                    .reduce((acc, p) => acc + (p.projectJpAllocation || 0), 0);
                
                return <StepActivityPlanning 
                    totalJp={project.projectJpAllocation} 
                    totalAnnualJp={project.totalJpAnnual} 
                    usedByOthers={usedByOthers}
                    setTotalJp={(v) => updateProject('projectJpAllocation', v)} 
                    activities={project.activities} 
                    setActivities={(a) => updateProject('activities', a)} 
                    onGenerate={runActivityPlan} 
                    isGenerating={loadingAI} 
                />;
            case 7: return <StepFinalization project={project} isReady={!!project.assessmentPlan} isFinalizing={isFinalizing} themeName={project.selectedTheme} onFinalize={runFinalization} onViewEditor={() => setView('editor')} onDownload={exportDocx} onDownloadAnnual={exportAnnualDocx} onSaveProject={saveProject} onReset={handleReset} />;
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
                    {view === 'projects' && (
                        <MyProjects 
                            onNewProject={handleStartProject} 
                            savedProjects={savedProjects} 
                            onLoadProject={handleLoadProject} 
                            onDuplicateProject={duplicateProject}
                            onDeleteProject={deleteProject}
                            onCreateNextProject={createNextProjectForClass}
                            onChangeView={(v) => setView(v as ViewMode)}
                        />
                    )}
                    {view === 'identity' && <IdentitySettings project={project} onChange={updateProject} onSave={() => showNotify('Data Sekolah berhasil disimpan!', 'success')} />}
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
                                <button onClick={prevStep} disabled={currentStep === 0} className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2 transition-all flex-1 sm:flex-none justify-center">
                                    <ChevronLeft className="w-5 h-5" /> Back
                                </button>
                                {/* Reset Button Icon */}
                                <button onClick={handleReset} className="px-4 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-2 flex-none" title="Buat Projek Baru / Reset">
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={() => saveProject()} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center">
                                        <Save className="w-4 h-4" /> Simpan
                                    </button>
                                )}
                                {currentStep < STEPS.length - 1 && (
                                    <button onClick={nextStep} className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center">
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

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="animate-pulse font-medium text-slate-500">Memuat Sesi...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={(u) => login(u)} />;
    }

    return (
        <ProjectProvider user={user}>
            <AuthenticatedApp />
        </ProjectProvider>
    );
};

export default App;
