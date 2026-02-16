
import { useState, useEffect } from 'react';
import { ProjectState, INITIAL_PROJECT_STATE, AnalysisItem } from '../types';
import * as Gemini from '../services/geminiService';
import { generateAndDownloadDocx, generateAnnualProgramDocx } from '../utils/docxGenerator';
import { STEPS } from '../constants';
import Swal from 'sweetalert2';
import { supabase } from '../services/supabaseClient';

export const useProjectWizard = (user: any) => {
    // Current active project being edited
    const [project, setProject] = useState<ProjectState>(() => ({
        ...INITIAL_PROJECT_STATE,
        id: crypto.randomUUID(), // Initialize with UUID immediately
        // Pre-fill user data if available
        schoolName: user?.school || '',
        coordinatorName: user?.name || ''
    }));

    // List of all saved projects
    const [savedProjects, setSavedProjects] = useState<ProjectState[]>([]);
    
    const [currentStep, setCurrentStep] = useState(0);
    const [loadingAI, setLoadingAI] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // --- SUPABASE INTEGRATION ---
    useEffect(() => {
        if (user?.email && user?.id !== 'emergency-admin-id') {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_email', user.email)
                .order('updated_at', { ascending: false });

            if (error) {
                // Ignore missing table error (code 42P01) or other schema issues
                if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('schema')) {
                    setSavedProjects([]);
                    return;
                }
                console.warn("Fetch projects error:", error.message);
                return;
            }

            if (data) {
                const mappedProjects = data.map((d: any) => {
                    // Fallback if content is null (legacy data)
                    const content = d.content || {};
                    return {
                        ...INITIAL_PROJECT_STATE, // Ensure defaults
                        ...content,
                        id: d.id, // Database ID is source of truth
                    };
                });
                setSavedProjects(mappedProjects);
            }
        } catch (e) {
            // Silent catch
        }
    };

    const persistToSupabase = async (proj: ProjectState) => {
        // Skip sync in emergency mode
        if (user.id === 'emergency-admin-id') {
            console.warn("Cloud sync disabled in Emergency Admin Mode");
            return;
        }

        // Prepare Payload: Hybrid Approach
        // 1. Relational Columns (for Indexing/Filtering)
        // 2. JSONB 'content' (for Full App State)
        const payload = {
            id: proj.id,
            user_id: user.id, // Foreign Key link
            user_email: user.email, // Redundant but useful for quick checks
            
            // Metadata for Dashboard Querying
            title: proj.title,
            school_name: proj.schoolName,
            phase: proj.phase,
            target_class: proj.targetClass,
            total_jp_annual: proj.totalJpAnnual,
            project_jp_allocation: proj.projectJpAllocation,
            selected_theme: proj.selectedTheme,
            activity_format: proj.activityFormat,
            analysis_summary: proj.analysisSummary,
            
            // Complex Data stored as JSONB
            content: proj,
            
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('projects')
            .upsert(payload);

        if (error) {
            // Suppress schema errors if table doesn't exist yet
            if (error.code === '42P01' || error.message.includes('relation')) {
                // Do not show error alert to user, they can just use local state
                console.warn("Cloud sync failed: Projects table missing.");
            } else {
                console.error("Error saving to Supabase", error);
                Swal.fire('Error', 'Gagal menyimpan ke cloud. Periksa koneksi internet.', 'error');
            }
        } else {
            fetchProjects(); // Refresh list to get server timestamp/consistency
        }
    };

    const updateProject = (field: keyof ProjectState, value: any) => {
        setProject(prev => ({ ...prev, [field]: value }));
    };

    // --- Data Management Functions ---

    // 1. Save Project to List & Cloud
    const saveProject = async () => {
        const updatedProject = { ...project, lastUpdated: Date.now() };
        
        // Optimistic update locally
        setSavedProjects(prev => {
            const others = prev.filter(p => p.id !== project.id);
            return [...others, updatedProject];
        });

        // Save to DB
        await persistToSupabase(updatedProject);

        Swal.fire({
            icon: 'success',
            title: 'Tersimpan!',
            text: `Projek "${project.selectedTheme || 'Draft'}" berhasil disimpan.`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    // 2. Create New Project
    const createNewProject = () => {
        setProject(prev => ({
            ...INITIAL_PROJECT_STATE,
            id: crypto.randomUUID(), // Generate new UUID
            schoolName: user?.school || prev.schoolName,
            coordinatorName: user?.name || prev.coordinatorName,
            coordinatorNip: prev.coordinatorNip,
            principalName: prev.principalName,
            principalNip: prev.principalNip,
            signaturePlace: prev.signaturePlace,
            contextAnalysis: prev.contextAnalysis,
            analysisSummary: prev.analysisSummary
        }));
        setCurrentStep(0);
    };

    // 3. Load Project
    const loadProject = (id: string) => {
        const found = savedProjects.find(p => p.id === id);
        if (found) {
            setProject(found);
            setCurrentStep(0); 
        }
    };

    // 4. Duplicate Project
    const duplicateProject = async (id: string, newClass: string, newPhase: string) => {
        const original = savedProjects.find(p => p.id === id);
        if (original) {
            const newId = crypto.randomUUID();
            const newProject: ProjectState = {
                ...original,
                id: newId,
                targetClass: newClass,
                phase: newPhase,
                lastUpdated: Date.now(),
            };
            
            // Persist duplicate
            await persistToSupabase(newProject);
            
            Swal.fire('Duplikasi Berhasil', `Projek disalin ke ${newClass}`, 'success');
        }
    };

    // 5. Get projects for Annual Program (Same Class)
    const getProjectsForClass = (targetClass: string) => {
        return savedProjects.filter(p => p.targetClass === targetClass);
    };


    // --- Validation Helper ---
    const checkPrerequisites = (action: 'next' | 'analyze' | 'dimensions' | 'theme' | 'ideas' | 'goals' | 'activities') => {
        const showError = (text: string) => {
            Swal.fire({
                icon: 'warning',
                title: 'Perhatian',
                text: text,
                confirmButtonColor: '#2563EB',
                confirmButtonText: 'Baik, Saya Cek'
            });
        };

        if (action === 'analyze' || (action === 'next' && currentStep === 0)) {
            if (!project.schoolName) {
                showError("⚠️ Harap isi Nama Sekolah di Tahap Identitas terlebih dahulu.");
                return false;
            }
        }
        if (action === 'dimensions' || action === 'theme' || (action === 'next' && currentStep === 1)) {
            if (!project.analysisSummary) {
                showError("⚠️ Anda belum melakukan Analisis Konteks (Tahap 2).");
                return false;
            }
        }
        if (action === 'next' && currentStep === 2) {
             if (project.selectedDimensions.length === 0) {
                 showError("⚠️ Pilih minimal 1 Dimensi Profil Lulusan.");
                 return false;
             }
        }
        if (action === 'ideas') {
            if (!project.selectedTheme) {
                showError("⚠️ Pilih Tema Terlebih Dahulu.");
                return false;
            }
            if (!project.activityFormat) {
                showError("⚠️ Pilih Bentuk Kegiatan Terlebih Dahulu.");
                return false;
            }
        }
        if (action === 'goals' || (action === 'next' && currentStep === 3)) {
            if (!project.selectedTheme) {
                showError("⚠️ Tema Projek belum dipilih.");
                return false;
            }
        }
        if (action === 'activities' || (action === 'next' && currentStep === 4)) {
            if (project.projectGoals.length === 0) {
                showError("⚠️ Tujuan Projek belum dirumuskan.");
                return false;
            }
        }
        if (action === 'next' && currentStep === 5) {
             if (project.projectJpAllocation <= 0) {
                 showError("⚠️ Alokasi JP Projek belum diisi.");
                 return false;
             }
        }
        return true;
    };

    const handleAIError = (e: any) => {
        setLoadingAI(false);
        setIsFinalizing(false);
        
        const msg = e?.message || "";
        
        if (msg === "QUOTA_EXCEEDED") {
            Swal.fire({
                icon: 'error',
                title: 'Batas Kuota Tercapai (Limit)',
                text: 'Maaf, kuota penggunaan AI (Gemini API) hari ini telah habis. Silakan coba lagi besok atau gunakan API Key lain.',
                confirmButtonColor: '#2563EB',
                footer: '<a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #2563EB; font-weight: bold;">Cek Google AI Studio</a>'
            });
        } else if (msg === "INVALID_API_KEY") {
             Swal.fire({
                icon: 'error',
                title: 'API Key Tidak Valid',
                text: 'Kunci akses AI tidak valid atau kadaluarsa.',
                confirmButtonColor: '#2563EB'
            });
        } else {
             Swal.fire('Gagal', 'Terjadi kesalahan saat menghubungi AI. Silakan coba lagi.', 'error');
        }
    }

    const nextStep = async () => {
        if (!checkPrerequisites('next')) return;
        if (currentStep < STEPS.length - 1) {
            if (currentStep + 1 === 2 && project.analysisSummary && project.recommendedDimensions.length === 0) {
                setLoadingAI(true);
                try {
                    const dims = await Gemini.recommendDimensions(project.analysisSummary);
                    updateProject('recommendedDimensions', dims);
                    setLoadingAI(false);
                    setCurrentStep(c => c + 1);
                } catch (e) {
                    handleAIError(e);
                }
            } else {
                setCurrentStep(c => c + 1);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    const goToStep = (stepIndex: number) => {
        if (stepIndex > currentStep) {
             if (stepIndex > currentStep + 1) {
                 Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: '⚠️ Anda tidak bisa melompati tahapan. Harap selesaikan secara berurutan.',
                    confirmButtonColor: '#2563EB'
                 });
                 return;
             }
             if (!checkPrerequisites('next')) return;
        }
        setCurrentStep(stepIndex);
    }

    // --- AI Actions ---

    const runAnalysis = async () => {
        if (!checkPrerequisites('analyze')) return;
        setLoadingAI(true);
        try {
            const d = project.contextAnalysis;
            const fmt = (item: AnalysisItem) => {
              const parts = [...item.selected];
              if (item.custom) parts.push(`(Lainnya: ${item.custom})`);
              return parts.length > 0 ? parts.join(", ") : "-";
            };
            const promptText = `
            [1. Kurikulum] Potensi: ${fmt(d.curriculum.goals)}, Gap: ${fmt(d.curriculum.gaps)}, Nilai: ${fmt(d.curriculum.values)}
            [2. Murid] Minat: ${fmt(d.students.interests)}, Bakat: ${fmt(d.students.talents)}, Kebutuhan: ${fmt(d.students.needs)}
            [3. Sumber Daya] Fisik: ${fmt(d.resources.assets)}, SDM: ${fmt(d.resources.people)}, Keuangan: ${fmt(d.resources.finance)}, Mitra: ${fmt(d.resources.partners)}
            [4. Sosial] Isu: ${fmt(d.social.issues)}, Nilai: ${fmt(d.social.values)}, Eko: ${fmt(d.social.socioeco)}
            `;
            const summary = await Gemini.analyzeSchoolContext(promptText);
            updateProject('analysisSummary', summary);
            setLoadingAI(false);
        } catch (e) {
            handleAIError(e);
        }
    };

    const runThemeRecommend = async () => {
        if (!checkPrerequisites('theme')) return;
        setLoadingAI(true);
        try {
            const themes = await Gemini.recommendThemes(project.analysisSummary, project.selectedDimensions);
            updateProject('themeOptions', themes);
            setLoadingAI(false);
        } catch(e) {
            handleAIError(e);
        }
    };

    const runCreativeIdeaGen = async () => {
        if (!checkPrerequisites('ideas')) return;
        setLoadingAI(true);
        try {
            const ideas = await Gemini.generateCreativeIdeas(project.selectedTheme, project.activityFormat, project.analysisSummary);
            
            if (ideas.length === 0) {
                 Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: 'AI tidak berhasil membuat ide. Silakan coba lagi atau cek koneksi internet.',
                    confirmButtonColor: '#2563EB'
                });
            } else {
                updateProject('creativeIdeas', ideas);
            }
            setLoadingAI(false);
        } catch (e) {
             handleAIError(e);
        }
    };

    const runGoalDraft = async () => {
        if (!checkPrerequisites('goals')) return;
        setLoadingAI(true);
        try {
            const goal = await Gemini.draftProjectGoals(project.selectedTheme, project.selectedDimensions, project.activityFormat);
            updateProject('projectGoals', goal);
            setLoadingAI(false);
        } catch (e) {
            handleAIError(e);
        }
    };

    const runActivityPlan = async () => {
        if (!checkPrerequisites('activities')) return;
        setLoadingAI(true);
        try {
            const acts = await Gemini.generateActivityPlan(project.projectJpAllocation, project.selectedTheme, project.projectGoals, project.activityFormat);
            updateProject('activities', acts);
            setLoadingAI(false);
        } catch (e) {
            handleAIError(e);
        }
    };

    const runFinalization = async () => {
        setIsFinalizing(true);
        try {
            const hiddenData = await Gemini.generateHiddenSections(project);
            setProject(prev => ({ ...prev, ...hiddenData }));
            setIsFinalizing(false);
        } catch (e) {
            handleAIError(e);
        }
    };

    const exportDocx = async () => {
        await generateAndDownloadDocx(project);
    };

    const exportAnnualDocx = async () => {
        // Pass current project + all saved projects that match the class
        const classmates = getProjectsForClass(project.targetClass);
        await generateAnnualProgramDocx(project, classmates);
    };

    return {
        project,
        savedProjects, // Exported list
        updateProject,
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        loadingAI,
        isFinalizing,
        // Actions
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
    };
};
