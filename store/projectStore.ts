import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ProjectState, INITIAL_PROJECT_STATE, User, AnalysisItem, Dimension, ProjectGoal, Activity } from '../types';
import { ProjectRepository } from '../services/repository';
import * as Gemini from '../services/geminiService';
import Swal from 'sweetalert2';
import { STEPS } from '../constants';

// --- HELPER: VALIDATION ---
const checkPrerequisites = (project: ProjectState, currentStep: number, action: string) => {
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
    const msg = e?.message || "";
    if (msg === "QUOTA_EXCEEDED") {
        Swal.fire({
            icon: 'error',
            title: 'Batas Kuota Tercapai',
            text: 'Kuota Gemini API habis. Coba lagi besok atau gunakan API Key sendiri.',
            confirmButtonColor: '#2563EB',
        });
    } else if (msg === "INVALID_API_KEY") {
         Swal.fire({
            icon: 'error',
            title: 'API Key Tidak Valid',
            text: 'Kunci akses AI tidak valid.',
            confirmButtonColor: '#2563EB'
        });
    } else {
         Swal.fire('Gagal', 'Terjadi kesalahan AI. Silakan coba lagi.', 'error');
    }
};

interface ProjectStoreState {
    project: ProjectState;
    savedProjects: ProjectState[];
    currentStep: number;
    loadingAI: boolean;
    isFinalizing: boolean;
    currentUser: User | null;
    
    actions: {
        setOwner: (user: User) => void;
        fetchSavedProjects: () => Promise<void>;
        
        updateProject: (field: keyof ProjectState, value: any) => void;
        setProject: (p: ProjectState) => void;
        
        createNewProject: () => void;
        loadProject: (id: string) => void;
        saveProject: () => Promise<void>;
        deleteProject: (id: string) => Promise<void>;
        duplicateProject: (id: string, newClass: string, newPhase: string) => Promise<void>;
        createNextProjectForClass: (targetClass: string) => void;
        resetProject: () => void;
        
        nextStep: () => void;
        prevStep: () => void;
        goToStep: (step: number) => void;
        
        // AI Actions
        runAnalysis: () => Promise<void>;
        autoRunDimensions: () => Promise<void>;
        runThemeRecommend: () => Promise<void>;
        runCreativeIdeaGen: () => Promise<void>;
        runGoalDraft: () => Promise<void>;
        runActivityPlan: () => Promise<void>;
        runFinalization: () => Promise<void>;
    }
}

export const useProjectStore = create<ProjectStoreState>()(
    persist(
        immer((set, get) => ({
            // --- STATE ---
            project: { ...INITIAL_PROJECT_STATE, id: crypto.randomUUID() },
            savedProjects: [],
            currentStep: 0,
            loadingAI: false,
            isFinalizing: false,
            currentUser: null,

            actions: {
                setOwner: (user) => {
                    const prevUser = get().currentUser;
                    if (prevUser?.id !== user.id) {
                        set({ currentUser: user });
                        // If coordinator name is empty, fill with user name
                        if (!get().project.coordinatorName && user.name) {
                            set((state) => { state.project.coordinatorName = user.name! });
                        }
                        get().actions.fetchSavedProjects();
                    }
                },

                fetchSavedProjects: async () => {
                    const user = get().currentUser;
                    if (!user || user.id === 'emergency-admin-id') return;
                    try {
                        const projects = await ProjectRepository.getProjectsByUser(user.email);
                        if (projects) set({ savedProjects: projects });
                    } catch (e) { console.error(e); }
                },

                updateProject: (field, value) => {
                    set((state) => {
                        // @ts-ignore
                        state.project[field] = value;
                        state.project.lastUpdated = Date.now();
                    });
                },

                setProject: (p) => set({ project: p }),

                createNewProject: () => {
                    const current = get().project;
                    const user = get().currentUser;
                    const newP = {
                        ...INITIAL_PROJECT_STATE,
                        id: crypto.randomUUID(),
                        schoolName: current.schoolName,
                        coordinatorName: user?.name || current.coordinatorName,
                        coordinatorNip: current.coordinatorNip,
                        principalName: current.principalName,
                        principalNip: current.principalNip,
                        signaturePlace: current.signaturePlace,
                        contextAnalysis: current.contextAnalysis,
                        analysisSummary: current.analysisSummary
                    };
                    set({ project: newP, currentStep: 0 });
                },

                loadProject: (id) => {
                    const found = get().savedProjects.find(p => p.id === id);
                    if (found) {
                        set({ project: found, currentStep: found.lastStep || 0 });
                    }
                },

                saveProject: async () => {
                    const { project, currentUser, currentStep } = get();
                    if (!currentUser) return;

                    const updatedProject = { ...project, lastUpdated: Date.now(), lastStep: currentStep };
                    
                    // Optimistic Update
                    set((state) => {
                        state.project = updatedProject;
                        const idx = state.savedProjects.findIndex(p => p.id === project.id);
                        if (idx >= 0) state.savedProjects[idx] = updatedProject;
                        else state.savedProjects.push(updatedProject);
                    });

                    try {
                        await ProjectRepository.saveProject(updatedProject, { id: currentUser.id, email: currentUser.email });
                        Swal.fire({
                            icon: 'success',
                            title: 'Tersimpan!',
                            text: `Projek "${project.selectedTheme || 'Draft'}" berhasil disimpan.`,
                            timer: 1500,
                            showConfirmButton: false
                        });
                    } catch (e) {
                         Swal.fire({
                            icon: 'success', 
                            title: 'Tersimpan (Lokal)', 
                            text: 'Gagal sinkron ke cloud, disimpan di browser.',
                            timer: 1500, showConfirmButton: false
                        });
                    }
                },

                deleteProject: async (id) => {
                    try {
                        await ProjectRepository.deleteProject(id);
                        set((state) => {
                            state.savedProjects = state.savedProjects.filter(p => p.id !== id);
                            if (state.project.id === id) {
                                // Reset if deleted active project
                                // Note: calling actions inside setter needs get() or careful structure. 
                                // Simplified for Immer: we can just mutate.
                                // Actually, better to call createNewProject logic or reset manually.
                                Object.assign(state.project, { ...INITIAL_PROJECT_STATE, id: crypto.randomUUID() });
                                state.currentStep = 0;
                            }
                        });
                    } catch (e) {
                        Swal.fire('Error', 'Gagal menghapus projek.', 'error');
                    }
                },

                duplicateProject: async (id, newClass, newPhase) => {
                    const original = get().savedProjects.find(p => p.id === id);
                    const user = get().currentUser;
                    if (original && user) {
                        const newProject = {
                            ...original,
                            id: crypto.randomUUID(),
                            targetClass: newClass,
                            phase: newPhase,
                            lastUpdated: Date.now()
                        };
                        try {
                            await ProjectRepository.saveProject(newProject, { id: user.id, email: user.email });
                            set((state) => { state.savedProjects.unshift(newProject); });
                            Swal.fire('Duplikasi Berhasil', `Projek disalin ke ${newClass}`, 'success');
                        } catch (e) {
                            Swal.fire('Gagal', 'Gagal menduplikasi.', 'error');
                        }
                    }
                },

                createNextProjectForClass: (targetClass) => {
                    const reference = get().savedProjects.find(p => p.targetClass === targetClass && p.analysisSummary);
                    if (!reference) {
                        Swal.fire('Error', 'Tidak ditemukan data analisis untuk kelas ini.', 'error');
                        return;
                    }
                    const newP: ProjectState = {
                        ...INITIAL_PROJECT_STATE,
                        id: crypto.randomUUID(),
                        schoolName: reference.schoolName,
                        coordinatorName: reference.coordinatorName,
                        coordinatorNip: reference.coordinatorNip,
                        principalName: reference.principalName,
                        principalNip: reference.principalNip,
                        signaturePlace: reference.signaturePlace,
                        phase: reference.phase,
                        targetClass: reference.targetClass,
                        totalJpAnnual: reference.totalJpAnnual,
                        contextAnalysis: reference.contextAnalysis,
                        analysisSummary: reference.analysisSummary,
                        recommendedDimensions: reference.recommendedDimensions,
                        selectedDimensions: reference.selectedDimensions,
                        lastStep: 3
                    };
                    set({ project: newP, currentStep: 3 });
                },

                resetProject: () => {
                    const current = get().project;
                    set({
                        project: {
                            ...INITIAL_PROJECT_STATE,
                            id: crypto.randomUUID(),
                            schoolName: current.schoolName,
                            coordinatorName: current.coordinatorName,
                            coordinatorNip: current.coordinatorNip,
                            principalName: current.principalName,
                            principalNip: current.principalNip,
                            signaturePlace: current.signaturePlace,
                        },
                        currentStep: 0
                    });
                },

                // --- NAVIGATION ---
                nextStep: () => {
                    const { project, currentStep } = get();
                    if (!checkPrerequisites(project, currentStep, 'next')) return;
                    if (currentStep < STEPS.length - 1) {
                        set((state) => { state.currentStep += 1; });
                        
                        // Auto-trigger Dimensions on Step 3 (Index 2)
                        const newState = get();
                        if (newState.currentStep === 2 && newState.project.analysisSummary && newState.project.recommendedDimensions.length === 0) {
                            get().actions.autoRunDimensions();
                        }
                    }
                },

                prevStep: () => {
                    const { currentStep } = get();
                    if (currentStep > 0) set({ currentStep: currentStep - 1 });
                },

                goToStep: (stepIndex) => {
                    const { currentStep, project } = get();
                    if (stepIndex > currentStep) {
                        if (stepIndex > currentStep + 1) {
                            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: '⚠️ Anda tidak bisa melompati tahapan.', confirmButtonColor: '#2563EB' });
                            return;
                        }
                        if (!checkPrerequisites(project, currentStep, 'next')) return;
                    }
                    set({ currentStep: stepIndex });
                    // Handle auto-trigger if jumping to step 2
                    if (stepIndex === 2 && project.analysisSummary && project.recommendedDimensions.length === 0) {
                         get().actions.autoRunDimensions();
                    }
                },

                // --- AI WRAPPERS ---
                runAnalysis: async () => {
                    const { project } = get();
                    if (!checkPrerequisites(project, get().currentStep, 'analyze')) return;
                    set({ loadingAI: true });
                    try {
                        const d = project.contextAnalysis;
                        const fmt = (item: AnalysisItem) => {
                          const parts = [...item.selected];
                          if (item.custom) parts.push(`(Lainnya: ${item.custom})`);
                          return parts.length > 0 ? parts.join(", ") : "-";
                        };
                        const promptText = `[1. Kurikulum] Potensi: ${fmt(d.curriculum.goals)}, Gap: ${fmt(d.curriculum.gaps)}, Nilai: ${fmt(d.curriculum.values)} [2. Murid] Minat: ${fmt(d.students.interests)}, Bakat: ${fmt(d.students.talents)}, Kebutuhan: ${fmt(d.students.needs)} [3. Sumber Daya] Fisik: ${fmt(d.resources.assets)}, SDM: ${fmt(d.resources.people)}, Keuangan: ${fmt(d.resources.finance)}, Mitra: ${fmt(d.resources.partners)} [4. Sosial] Isu: ${fmt(d.social.issues)}, Nilai: ${fmt(d.social.values)}, Eko: ${fmt(d.social.socioeco)}`;
                        
                        const summary = await Gemini.analyzeSchoolContext(promptText);
                        set((state) => { state.project.analysisSummary = summary; state.loadingAI = false; });
                    } catch (e) { handleAIError(e); set({ loadingAI: false }); }
                },

                autoRunDimensions: async () => {
                    const { project } = get();
                    if (!project.analysisSummary) return;
                    set({ loadingAI: true });
                    try {
                        const dims = await Gemini.recommendDimensions(project.analysisSummary);
                        set((state) => { state.project.recommendedDimensions = dims; state.loadingAI = false; });
                    } catch (e) { handleAIError(e); set({ loadingAI: false }); }
                },

                runThemeRecommend: async () => {
                    const { project } = get();
                    if (!checkPrerequisites(project, get().currentStep, 'theme')) return;
                    set({ loadingAI: true });
                    try {
                        const themes = await Gemini.recommendThemes(project.analysisSummary, project.selectedDimensions);
                        set((state) => { state.project.themeOptions = themes; state.loadingAI = false; });
                    } catch(e) { handleAIError(e); set({ loadingAI: false }); }
                },

                runCreativeIdeaGen: async () => {
                    const { project } = get();
                    if (!checkPrerequisites(project, get().currentStep, 'ideas')) return;
                    set({ loadingAI: true });
                    try {
                        const ideas = await Gemini.generateCreativeIdeas(project.selectedTheme, project.activityFormat, project.analysisSummary);
                        set((state) => { state.project.creativeIdeas = ideas; state.loadingAI = false; });
                    } catch (e) { handleAIError(e); set({ loadingAI: false }); }
                },

                runGoalDraft: async () => {
                    const { project } = get();
                    if (!checkPrerequisites(project, get().currentStep, 'goals')) return;
                    set({ loadingAI: true });
                    try {
                        const goals = await Gemini.draftProjectGoals(project.selectedTheme, project.selectedDimensions, project.activityFormat, project.phase);
                        set((state) => { state.project.projectGoals = goals; state.loadingAI = false; });
                    } catch (e) { handleAIError(e); set({ loadingAI: false }); }
                },

                runActivityPlan: async () => {
                    const { project } = get();
                    if (!checkPrerequisites(project, get().currentStep, 'activities')) return;
                    set({ loadingAI: true });
                    try {
                        const acts = await Gemini.generateActivityPlan(project.projectJpAllocation, project.selectedTheme, project.projectGoals, project.activityFormat);
                        set((state) => { state.project.activities = acts; state.loadingAI = false; });
                    } catch (e) { handleAIError(e); set({ loadingAI: false }); }
                },

                runFinalization: async () => {
                    set({ isFinalizing: true });
                    try {
                        const hiddenData = await Gemini.generateHiddenSections(get().project);
                        set((state) => { Object.assign(state.project, hiddenData); state.isFinalizing = false; });
                    } catch (e) { handleAIError(e); set({ isFinalizing: false }); }
                }
            }
        })),
        {
            name: 'pakar-project-store',
            partialize: (state) => ({ 
                project: state.project, 
                savedProjects: state.savedProjects, 
                currentStep: state.currentStep 
            })
        }
    )
);