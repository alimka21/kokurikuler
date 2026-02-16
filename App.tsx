
import React, { useState, useEffect } from 'react';
import { STEPS } from './constants';
import { useProjectWizard } from './hooks/useProjectWizard';
import { NotificationToast, NotificationType } from './components/common/UiKit';
import { User } from './types';
import { supabase } from './services/supabaseClient';

// View Components
import Dashboard from './components/Dashboard';
import MyProjects from './components/MyProjects';
import Editor from './components/Editor';
import IdentitySettings from './components/IdentitySettings';
import AdminDashboard from './components/AdminDashboard'; 
import Login from './components/Login'; 

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

import { ChevronRight, ChevronLeft, Save } from 'lucide-react';

type ViewMode = 'dashboard' | 'projects' | 'wizard' | 'editor' | 'identity' | 'admin';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // App State
    const [view, setView] = useState<ViewMode>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: NotificationType }>({ show: false, msg: '', type: 'success' });

    const showNotify = (msg: string, type: NotificationType = 'success') => {
        setToast({ show: true, msg, type });
    };

    // --- NEW ROBUST AUTH ARCHITECTURE ---
    useEffect(() => {
        // Helper to construct user object from session + optional db profile
        const constructUser = async (sessionUser: any) => {
            // 1. Construct Basic User from Auth Metadata (Fail-safe)
            const meta = sessionUser.user_metadata || {};
            const basicUser: User = {
                id: sessionUser.id,
                email: sessionUser.email || '',
                name: meta.name || sessionUser.email?.split('@')[0] || 'Pengguna',
                school: meta.school || '',
                role: 'user', // Default role
                is_registered: true
            };

            // Set immediately so UI loads fast
            setUser(basicUser);

            // 2. OPTIONAL: Fetch Role & Detailed Profile from DB
            // If DB is down or row doesn't exist, this fails silently without blocking login.
            try {
                if (!supabase) return;

                const { data: profile, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (error) {
                    // Silent fail for schema errors to prevent user panic
                    // Only log if it's NOT a schema/relation error
                    if (!error.message?.includes('relation') && !error.message?.includes('schema')) {
                        console.warn("Profile fetch warning:", error.message);
                    }
                } else if (profile) {
                    // Merge DB profile with Auth ID
                    setUser({
                        ...basicUser,
                        ...profile, // Overwrites name/school/role from DB if exists
                        id: sessionUser.id // Ensure ID remains from Auth
                    });
                }
            } catch (e) {
                // Completely silent catch for optional profile fetch
            }
        };

        const initAuth = async () => {
            setIsLoadingUser(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await constructUser(session.user);
                } else {
                    setUser(null);
                }
            } catch (e) {
                console.error("Auth init error:", e);
                setUser(null);
            } finally {
                setIsLoadingUser(false);
            }
        };

        initAuth();

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
             if (event === 'SIGNED_IN' && session?.user) {
                 await constructUser(session.user);
             } else if (event === 'SIGNED_OUT') {
                 setUser(null);
                 window.location.hash = '';
             }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setView('dashboard');
        setUser(null);
    };

    // --- Routing Logic (Hash based) ---
    useEffect(() => {
        if (!user) return;

        const handleHashChange = () => {
            const hash = window.location.hash.replace('#/', '');
            
            if (hash === 'admin') {
                if (user.role === 'admin') setView('admin');
                else {
                    setView('dashboard');
                    window.location.hash = '#/dashboard';
                }
            }
            else if (hash === 'projects') setView('projects');
            else if (hash === 'wizard') setView('wizard');
            else if (hash === 'editor') setView('editor');
            else if (hash === 'settings') setView('identity');
            else {
                setView('dashboard');
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [user?.role]);

    // Sync View to Hash
    useEffect(() => {
        if (!user) return;
        const hash = window.location.hash.replace('#/', '');
        let targetHash = 'dashboard';

        if (view === 'admin') targetHash = 'admin';
        else if (view === 'projects') targetHash = 'projects';
        else if (view === 'wizard') targetHash = 'wizard';
        else if (view === 'editor') targetHash = 'editor';
        else if (view === 'identity') targetHash = 'settings';

        if (hash !== targetHash) {
            window.history.pushState(null, '', `#/${targetHash}`);
        }
    }, [view, user]);

    // Use Custom Hook for Project Logic
    const {
        project,
        savedProjects, 
        updateProject,
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        loadingAI,
        isFinalizing,
        saveProject,
        createNewProject,
        loadProject,
        duplicateProject,
        runAnalysis,
        runThemeRecommend,
        runCreativeIdeaGen,
        runGoalDraft,
        runActivityPlan,
        runFinalization,
        exportDocx,
        exportAnnualDocx
    } = useProjectWizard(user);

    // --- RENDER ---

    if (isLoadingUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={(u) => setUser(u)} />;
    }

    const handleStartProject = () => {
        createNewProject();
        setView('wizard');
    };

    const handleLoadProject = (id: string) => {
        loadProject(id);
        setView('wizard');
    };

    const renderStepContent = () => {
        switch (currentStep + 1) {
            case 1: return <StepIdentity 
                project={project} 
                onChange={updateProject} 
                savedProjects={savedProjects} 
            />;
            case 2: return <StepAnalysis
                data={project.contextAnalysis}
                phase={project.phase}
                targetClass={project.targetClass}
                onUpdateData={(d) => updateProject('contextAnalysis', d)}
                onAnalyze={runAnalysis}
                summary={project.analysisSummary}
                isAnalyzing={loadingAI}
            />;
            case 3: return <StepDimensions 
                recommended={project.recommendedDimensions} 
                selected={project.selectedDimensions} 
                onSelect={(dims) => updateProject('selectedDimensions', dims)} 
                isLoading={loadingAI}
            />;
            case 4: return <StepThemeAndFormat
                options={project.themeOptions}
                selectedTheme={project.selectedTheme}
                onSelectTheme={(t, r) => { updateProject('selectedTheme', t); updateProject('selectedThemeReason', r); }}
                activityFormat={project.activityFormat}
                onSelectFormat={(f) => updateProject('activityFormat', f)}
                
                creativeIdeas={project.creativeIdeas}
                selectedIdea={project.title}
                onSelectIdea={(t) => {
                    updateProject('title', t);
                    const selectedIdeaObj = project.creativeIdeas.find(idea => idea.title === t);
                    if (selectedIdeaObj) {
                        updateProject('projectDescription', selectedIdeaObj.description);
                    }
                }}
                onGenerateIdeas={runCreativeIdeaGen}
                
                isLoading={loadingAI}
                onGenerateThemes={runThemeRecommend}
            />;
            case 5: return <StepGoals 
                goals={project.projectGoals} 
                setGoals={(g) => updateProject('projectGoals', g)} 
                onGenerate={runGoalDraft} 
                isGenerating={loadingAI} 
            />;
            case 6: return <StepActivityPlanning
                totalJp={project.projectJpAllocation}
                totalAnnualJp={project.totalJpAnnual}
                setTotalJp={(v) => updateProject('projectJpAllocation', v)}
                activities={project.activities}
                setActivities={(a) => updateProject('activities', a)}
                onGenerate={runActivityPlan}
                isGenerating={loadingAI}
            />;
            case 7: return <StepFinalization 
                project={project}
                isReady={!!project.assessmentPlan}
                isFinalizing={isFinalizing}
                themeName={project.selectedTheme}
                onFinalize={runFinalization}
                onViewEditor={() => setView('editor')}
                onDownload={exportDocx}
                onDownloadAnnual={exportAnnualDocx}
                onSaveProject={saveProject}
            />;
            default: return null;
        }
    };

    let headerTitle = "Overview";
    if (view === 'editor') headerTitle = "Document Editor";
    else if (view === 'projects') headerTitle = "Library & Projek";
    else if (view === 'identity') headerTitle = "Pengaturan Data Sekolah";
    else if (view === 'admin') headerTitle = "Admin Dashboard";
    else if (view === 'wizard') headerTitle = STEPS[currentStep].title;

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans text-slate-900">
            <NotificationToast 
                isVisible={toast.show} 
                message={toast.msg} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, show: false })} 
            />

            <Sidebar 
                isOpen={isSidebarOpen}
                currentView={view}
                onChangeView={(v) => setView(v)}
                currentStep={currentStep}
                onStepClick={(idx) => { setView('wizard'); goToStep(idx); }}
                user={user}
                projectData={project}
                onEditIdentity={() => setView('identity')}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Header title={headerTitle} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />

                <div className="flex-1 overflow-y-auto scroll-smooth p-6 sm:p-8">
                    {view === 'dashboard' && <Dashboard 
                        onNewProject={handleStartProject} 
                        savedProjects={savedProjects}
                        onLoadProject={handleLoadProject}
                    />}
                    
                    {view === 'projects' && <MyProjects 
                        onNewProject={handleStartProject} 
                        savedProjects={savedProjects}
                        onLoadProject={handleLoadProject}
                        onDuplicateProject={duplicateProject}
                    />}
                    
                    {view === 'identity' && <IdentitySettings project={project} onChange={updateProject} onSave={() => showNotify('Data Sekolah & Admin berhasil disimpan!', 'success')} />}

                    {view === 'admin' && user.role === 'admin' && <AdminDashboard />}

                    {view === 'wizard' && (
                        <div className="max-w-5xl mx-auto pb-32">
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {renderStepContent()}
                            </div>
                        </div>
                    )}

                    {view === 'editor' && (
                        <div className="max-w-5xl mx-auto h-full">
                            <Editor 
                                label="Review Dokumen Lengkap" 
                                value={`MODUL PROJEK\n${project.schoolName}\n\nTema: ${project.selectedTheme}\n\n[Dokumen lengkap tersedia dalam format .docx setelah diunduh]`} 
                                onChange={()=>{}} 
                                height="h-screen" 
                            />
                        </div>
                    )}
                </div>

                {view === 'wizard' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-6 z-40">
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 flex items-center gap-2 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" /> Back
                            </button>
                            
                            <div className="flex items-center gap-3">
                                {currentStep < STEPS.length - 1 && (
                                    <button
                                        onClick={() => saveProject()}
                                        className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Simpan
                                    </button>
                                )}

                                {currentStep < STEPS.length - 1 && (
                                    <button
                                        onClick={nextStep}
                                        className="px-8 py-3 rounded-xl font-bold text-white bg-primary shadow-lg shadow-primary/30 hover:bg-primary-hover hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
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

export default App;
