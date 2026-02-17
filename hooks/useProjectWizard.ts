
import { useState, useEffect, useRef } from 'react';
import { ProjectState, INITIAL_PROJECT_STATE, AnalysisItem } from '../types';
import * as Gemini from '../services/geminiService';
import { generateAndDownloadDocx, generateAnnualProgramDocx } from '../utils/docxGenerator';
import { STEPS } from '../constants';
import Swal from 'sweetalert2';
import { saveDraft, loadDraft } from '../utils/sessionManager';
import { ProjectRepository } from '../services/repository';

export const useProjectWizard = (user: any) => {
    // Current active project being edited
    const [project, setProject] = useState<ProjectState>(() => {
        // STATE HYDRATION: Check local storage for draft first
        const savedDraft = loadDraft('current_project');
        if (savedDraft) return savedDraft;

        return {
            ...INITIAL_PROJECT_STATE,
            id: crypto.randomUUID(), 
            schoolName: user?.school || '',
            coordinatorName: user?.name || ''
        };
    });

    // List of all saved projects
    const [savedProjects, setSavedProjects] = useState<ProjectState[]>([]);
    
    // Check local storage for step
    const [currentStep, setCurrentStep] = useState(() => {
        const savedStep = loadDraft('current_step');
        return typeof savedStep === 'number' ? savedStep : 0;
    });

    const [loadingAI, setLoadingAI] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const isFirstRun = useRef(true);

    // --- AUTO SAVE DRAFT LOCALLY ---
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        const handler = setTimeout(() => {
            saveDraft('current_project', project);
            saveDraft('current_step', currentStep);
        }, 1000); // Debounce saves

        return () => clearTimeout(handler);
    }, [project, currentStep]);


    // --- REPOSITORY INTEGRATION ---
    useEffect(() => {
        if (user?.email && user?.id !== 'emergency-admin-id') {
            fetchProjects();
        }
    }, [user]);

    const fetchProjects = async () => {
        try {
            const projects = await ProjectRepository.getProjectsByUser(user.email);
            setSavedProjects(projects);
        } catch (e) {
            console.error("Failed to fetch projects", e);
            // Fallback to empty if table doesn't exist yet
            setSavedProjects([]);
        }
    };

    const persistToDatabase = async (proj: ProjectState) => {
        if (user.id === 'emergency-admin-id') return;
        
        try {
            await ProjectRepository.saveProject(proj, { id: user.id, email: user.email });
            fetchProjects();
        } catch (e) {
            console.error("Save failed", e);
            throw e;
        }
    };

    const updateProject = (field: keyof ProjectState, value: any) => {
        setProject(prev => ({ ...prev, [field]: value }));
    };

    const saveProject = async () => {
        const updatedProject = { ...project, lastUpdated: Date.now() };
        
        // Optimistic UI Update
        setSavedProjects(prev => {
            const others = prev.filter(p => p.id !== project.id);
            return [...others, updatedProject];
        });

        try {
            await persistToDatabase(updatedProject);
            Swal.fire({
                icon: 'success',
                title: 'Tersimpan!',
                text: `Projek "${project.selectedTheme || 'Draft'}" berhasil disimpan.`,
                timer: 1500,
                showConfirmButton: false
            });
        } catch (e) {
            Swal.fire('Error', 'Gagal menyimpan ke database cloud.', 'error');
        }
    };

    const createNewProject = () => {
        const newP = {
            ...INITIAL_PROJECT_STATE,
            id: crypto.randomUUID(),
            schoolName: user?.school || project.schoolName,
            coordinatorName: user?.name || project.coordinatorName,
            coordinatorNip: project.coordinatorNip,
            principalName: project.principalName,
            principalNip: project.principalNip,
            signaturePlace: project.signaturePlace,
            contextAnalysis: project.contextAnalysis,
            analysisSummary: project.analysisSummary
        };
        setProject(newP);
        setCurrentStep(0);
        saveDraft('current_project', newP);
        saveDraft('current_step', 0);
    };

    const loadProject = (id: string) => {
        const found = savedProjects.find(p => p.id === id);
        if (found) {
            setProject(found);
            setCurrentStep(0); 
            saveDraft('current_project', found);
            saveDraft('current_step', 0);
        }
    };

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
            try {
                await persistToDatabase(newProject);
                Swal.fire('Duplikasi Berhasil', `Projek disalin ke ${newClass}`, 'success');
            } catch (e) {
                Swal.fire('Gagal', 'Gagal menduplikasi projek.', 'error');
            }
        }
    };

    const getProjectsForClass = (targetClass: string) => {
        return savedProjects.filter(p => p.targetClass === targetClass);
    };

    // --- Validation Helper ---
    const checkPrerequisites = (action: string) => {
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
                 Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: '⚠️ Anda tidak bisa melompati tahapan.', confirmButtonColor: '#2563EB' });
                 return;
             }
             if (!checkPrerequisites('next')) return;
        }
        setCurrentStep(stepIndex);
    }

    // --- AI Actions Wrappers (Same as before) ---
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
            const promptText = `[1. Kurikulum] Potensi: ${fmt(d.curriculum.goals)}, Gap: ${fmt(d.curriculum.gaps)}, Nilai: ${fmt(d.curriculum.values)} [2. Murid] Minat: ${fmt(d.students.interests)}, Bakat: ${fmt(d.students.talents)}, Kebutuhan: ${fmt(d.students.needs)} [3. Sumber Daya] Fisik: ${fmt(d.resources.assets)}, SDM: ${fmt(d.resources.people)}, Keuangan: ${fmt(d.resources.finance)}, Mitra: ${fmt(d.resources.partners)} [4. Sosial] Isu: ${fmt(d.social.issues)}, Nilai: ${fmt(d.social.values)}, Eko: ${fmt(d.social.socioeco)}`;
            const summary = await Gemini.analyzeSchoolContext(promptText);
            updateProject('analysisSummary', summary);
            setLoadingAI(false);
        } catch (e) { handleAIError(e); }
    };

    const runThemeRecommend = async () => {
        if (!checkPrerequisites('theme')) return;
        setLoadingAI(true);
        try {
            const themes = await Gemini.recommendThemes(project.analysisSummary, project.selectedDimensions);
            updateProject('themeOptions', themes);
            setLoadingAI(false);
        } catch(e) { handleAIError(e); }
    };

    const runCreativeIdeaGen = async () => {
        if (!checkPrerequisites('ideas')) return;
        setLoadingAI(true);
        try {
            const ideas = await Gemini.generateCreativeIdeas(project.selectedTheme, project.activityFormat, project.analysisSummary);
            if (ideas.length === 0) { Swal.fire({ icon: 'error', title: 'Gagal', text: 'AI tidak berhasil membuat ide.', confirmButtonColor: '#2563EB' }); } else { updateProject('creativeIdeas', ideas); }
            setLoadingAI(false);
        } catch (e) { handleAIError(e); }
    };

    const runGoalDraft = async () => {
        if (!checkPrerequisites('goals')) return;
        setLoadingAI(true);
        try {
            const goal = await Gemini.draftProjectGoals(project.selectedTheme, project.selectedDimensions, project.activityFormat);
            updateProject('projectGoals', goal);
            setLoadingAI(false);
        } catch (e) { handleAIError(e); }
    };

    const runActivityPlan = async () => {
        if (!checkPrerequisites('activities')) return;
        setLoadingAI(true);
        try {
            const acts = await Gemini.generateActivityPlan(project.projectJpAllocation, project.selectedTheme, project.projectGoals, project.activityFormat);
            updateProject('activities', acts);
            setLoadingAI(false);
        } catch (e) { handleAIError(e); }
    };

    const runFinalization = async () => {
        setIsFinalizing(true);
        try {
            const hiddenData = await Gemini.generateHiddenSections(project);
            setProject(prev => ({ ...prev, ...hiddenData }));
            setIsFinalizing(false);
        } catch (e) { handleAIError(e); }
    };

    const exportDocx = async () => { await generateAndDownloadDocx(project); };
    const exportAnnualDocx = async () => { const classmates = getProjectsForClass(project.targetClass); await generateAnnualProgramDocx(project, classmates); };

    return {
        project, savedProjects, updateProject, currentStep, nextStep, prevStep, goToStep, loadingAI, isFinalizing,
        saveProject, createNewProject, loadProject, duplicateProject, runAnalysis, runThemeRecommend, runCreativeIdeaGen,
        runGoalDraft, runActivityPlan, runFinalization, exportDocx, exportAnnualDocx
    };
};
