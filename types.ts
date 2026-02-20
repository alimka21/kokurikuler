
export enum Dimension {
  FAITH = "Keimanan dan Ketakwaan kepada Tuhan YME",
  GLOBAL_CITIZEN = "Kewargaan (Global/Lokal)",
  CRITICAL_THINKING = "Penalaran Kritis",
  CREATIVITY = "Kreativitas",
  COLLABORATION = "Kolaborasi",
  INDEPENDENCE = "Kemandirian",
  HEALTH = "Kesehatan",
  COMMUNICATION = "Komunikasi"
}

// ARSITEKTUR ROBUST (AppUser Spec):
export interface User {
  id: string; // Mandatory (Auth ID)
  email: string; // Mandatory (Auth Email)
  
  role?: string; // Optional string ('admin' | 'user' | undefined)
  name?: string; // Optional
  apiKey?: string; // New: BYOK API Key from DB
  passwordText?: string; // New: Plain text password storage for Admin

  // Metadata / State
  is_registered?: boolean; 
  force_password_change?: boolean; 
  is_active?: boolean; // New: Account Status Flag
  created_at?: string;
}

export interface Activity {
  id: string;
  name: string;
  type: string;
  jp: number;
  description: string;
  steps?: string[]; // New: Detailed steps generated in finalization
}

export interface ProjectGoal {
  id: string;
  description: string;
  subjects: string[]; // List of integrated subjects
}

export interface ThemeOption {
  name: string;
  reason: string;
}

export interface CreativeIdeaOption {
  title: string; // e.g. "GELAS (Gerakan Lawan Sampah)"
  description: string;
}

// New structure for Analysis Item (Multi-select + Custom)
export interface AnalysisItem {
  selected: string[];
  custom: string;
}

export interface ContextAnalysisData {
  curriculum: { 
    goals: AnalysisItem; 
    gaps: AnalysisItem; 
    values: AnalysisItem; 
  };
  students: { 
    interests: AnalysisItem; 
    talents: AnalysisItem; 
    needs: AnalysisItem; 
  };
  resources: { 
    assets: AnalysisItem; 
    people: AnalysisItem; 
    finance: AnalysisItem; 
    partners: AnalysisItem; 
  };
  social: { 
    issues: AnalysisItem; 
    values: AnalysisItem; 
    socioeco: AnalysisItem; 
  };
}

// New Structure for Detailed Assessment Rubric
export interface RubricItem {
    aspect: string; // e.g., "Keaktifan Kerjasama"
    score1: string; // Kurang
    score2: string; // Cukup
    score3: string; // Baik
    score4: string; // Sangat Baik
}

export interface AssessmentDimension {
    dimensionName: string;
    rubrics: RubricItem[];
}

export interface ProjectState {
  id: string; // Unique ID for the project
  lastUpdated: number; // Timestamp
  lastStep?: number; // New: Save Wizard Progress

  // Identity (Admin Settings - Moved to Sidebar Modal)
  schoolName: string;
  // activityLocation removed from manual input
  coordinatorName: string;
  coordinatorNip: string;
  principalName: string;
  principalNip: string;
  signaturePlace: string;
  signatureDate: string; // Format YYYY-MM-DD

  // Step 1: Target & Allocation
  phase: string; // New: Jenjang / Fase (e.g., Fase D)
  targetClass: string; 
  totalJpAnnual: number; 
  projectJpAllocation: number; 
  
  // Step 2: Analysis
  title: string; // Used as the main document title (Creative Name)
  projectDescription: string; // New: Description from Creative Idea
  contextAnalysis: ContextAnalysisData; 
  analysisSummary: string; // AI Generated
  
  // Step 3: Dimensions
  recommendedDimensions: Dimension[]; // AI Suggested
  selectedDimensions: Dimension[];
  
  // Step 4: Theme & Format
  themeOptions: ThemeOption[];
  selectedTheme: string; // The General Category (e.g. Gaya Hidup Berkelanjutan)
  selectedThemeReason: string;
  
  activityFormat: string; // "Kolaborasi Mata Pelajaran", "Gerakan 7 KAIH", "Cara Lainnya"
  
  // Step 4b: Creative Idea (New)
  creativeIdeas: CreativeIdeaOption[];
  
  // Step 5: Format details
  integratedSubjects: string; // For annual report column
  
  // Step 6: Goals (Structured)
  projectGoals: ProjectGoal[];
  
  // Step 7: Activities
  activities: Activity[];
  
  // Generated Final Sections
  activityLocations: string[]; // Generated list of locations
  pedagogicalStrategy: string;
  learningEnvironment: string;
  partnerships: string;
  digitalTools: string;
  assessmentPlan: string; // General Narrative
  assessmentRubrics: AssessmentDimension[]; // Detailed Structured Rubric
}

const emptyItem: AnalysisItem = { selected: [], custom: "" };

export const INITIAL_CONTEXT_DATA: ContextAnalysisData = {
  curriculum: { goals: {...emptyItem}, gaps: {...emptyItem}, values: {...emptyItem} },
  students: { interests: {...emptyItem}, talents: {...emptyItem}, needs: {...emptyItem} },
  resources: { assets: {...emptyItem}, people: {...emptyItem}, finance: {...emptyItem}, partners: {...emptyItem} },
  social: { issues: {...emptyItem}, values: {...emptyItem}, socioeco: {...emptyItem} }
};

export const INITIAL_PROJECT_STATE: ProjectState = {
  id: "", // Will be generated
  lastUpdated: 0,
  lastStep: 0,
  
  schoolName: "",
  coordinatorName: "",
  coordinatorNip: "",
  principalName: "",
  principalNip: "",
  signaturePlace: "",
  signatureDate: new Date().toISOString().split('T')[0],

  phase: "Fase D", // Default
  targetClass: "",
  totalJpAnnual: 360, 
  projectJpAllocation: 0,
  
  title: "MODUL PROJEK",
  projectDescription: "",
  contextAnalysis: INITIAL_CONTEXT_DATA,
  analysisSummary: "",
  
  recommendedDimensions: [],
  selectedDimensions: [],
  
  themeOptions: [],
  selectedTheme: "",
  selectedThemeReason: "",
  
  activityFormat: "Kolaborasi Mata Pelajaran",
  creativeIdeas: [],
  
  integratedSubjects: "",
  
  projectGoals: [], 
  
  activities: [],
  
  activityLocations: [],
  pedagogicalStrategy: "",
  learningEnvironment: "",
  partnerships: "",
  digitalTools: "",
  assessmentPlan: "",
  assessmentRubrics: []
};

export const DIMENSION_OPTIONS = Object.values(Dimension);
