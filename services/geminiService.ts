
import { GoogleGenAI, Type } from "@google/genai";
import { Dimension, Activity, ThemeOption, ProjectState, ProjectGoal, CreativeIdeaOption } from "../types";

// Safe env access
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) {}

    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {}
    return '';
};

const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('API_KEY'); 

let ai: GoogleGenAI | null = null;
try {
    if (apiKey && apiKey.trim().length > 0) {
        ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    }
} catch (e) {
    console.error("Failed to initialize Gemini Client:", e);
}

// Default model for most tasks (Analysis, Ideas, etc.)
const MODEL_NAME = 'gemini-2.5-flash-preview'; 

const SYSTEM_INSTRUCTION = `
Anda adalah Ahli Kokurikuler (Kurikulum Nasional) & Instructional Designer Senior.
Tugas Anda membantu guru menyusun dokumen Kokurikuler.
Gunakan istilah "Kokurikuler" dan "Dimensi Profil Lulusan".
Bahasa Indonesia formal, pedagogis, namun praktis.

ATURAN STRICT (SELF-CORRECTION):
1. Jangan pernah memberikan output kosong.
2. Pastikan format JSON valid (tanpa trailing comma).
3. HANYA berikan output JSON murni jika diminta, jangan ada teks pembuka/penutup.
4. Pastikan logika konsisten (misal: Total JP aktivitas = Total Alokasi).
`;

// --- CORE: SELF-CORRECTION UTILITIES ---

// 1. Helper to clean markdown JSON fences
const cleanJson = (text: string): string => {
    if (!text) return "[]";
    
    // 1. Try extracting from markdown code blocks first
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
        return match[1].trim();
    }

    // 2. If no blocks, try to find the first '[' or '{' and last ']' or '}'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    
    let startIdx = -1;
    // Determine which starts first to identify Object vs Array
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIdx = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        startIdx = firstBrace;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
    }

    if (startIdx !== -1) {
        const lastBrace = text.lastIndexOf('}');
        const lastBracket = text.lastIndexOf(']');
        const endIdx = Math.max(lastBrace, lastBracket);
        
        if (endIdx > startIdx) {
            return text.substring(startIdx, endIdx + 1);
        }
    }

    // 3. Fallback: return original trimmed (might fail JSON.parse if dirty)
    return text.trim();
};

// 2. The Verification Loop Engine
async function generateWithRetry<T>(
    operationName: string,
    prompt: string,
    validator: (data: any) => { isValid: boolean; error?: string },
    config: any = {},
    maxRetries = 4
): Promise<T | null> {
    
    checkAI();
    let currentPrompt = prompt;
    let attempts = 0;

    // Feature: Allow specific functions to override the model
    const targetModel = config.model || MODEL_NAME;

    while (attempts < maxRetries) {
        try {
            console.log(`[AI-Agent] ${operationName} (${targetModel}) - Attempt ${attempts + 1}`);
            
            const response = await ai!.models.generateContent({
                model: targetModel,
                contents: currentPrompt,
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    ...config
                }
            });

            const textOutput = response.text || "";
            
            // A. JSON Parsing Attempt
            let parsedData: any;
            try {
                if (config.responseMimeType === "application/json") {
                    parsedData = JSON.parse(cleanJson(textOutput));
                } else {
                    // For text-only responses, we treat the text itself as data
                    parsedData = textOutput; 
                }
            } catch (jsonError) {
                console.warn(`[AI-Agent] JSON Parse Error:`, textOutput.substring(0, 100) + "...");
                throw new Error("INVALID_JSON_FORMAT");
            }

            // B. Logical Validation (The "Consistency Check")
            const validation = validator(parsedData);
            
            if (validation.isValid) {
                return parsedData as T;
            } else {
                // Validation Failed
                throw new Error(`LOGIC_ERROR: ${validation.error}`);
            }

        } catch (error: any) {
            attempts++;
            const msg = error.message || "Unknown Error";
            console.warn(`[AI-Agent] Correction triggered: ${msg}`);

            // If we run out of retries, throw or return fallback
            if (attempts >= maxRetries) {
                console.error(`[AI-Agent] Failed after ${maxRetries} attempts. Last error: ${msg}`);
                // If specific API error, throw it up
                handleGeminiError(error);
                return null; 
            }
            
            // Backoff delay to prevent rate limiting or rapid failures
            await new Promise(resolve => setTimeout(resolve, 1500 * attempts));

            // FEEDBACK LOOP: Append the error to the prompt so the AI can fix it
            currentPrompt += `\n\n[SYSTEM ERROR]: Output sebelumnya SALAH. \nError: ${msg}. \nPerbaiki kesalahan ini dan generate ulang JSON yang valid. HANYA JSON.`;
        }
    }
    return null;
}

const handleGeminiError = (error: any) => {
    const msg = error?.toString() || "";
    if (msg.includes("429") || msg.includes("Resource has been exhausted") || msg.includes("Quota exceeded")) {
        throw new Error("QUOTA_EXCEEDED");
    }
    if (msg.includes("API_KEY") || msg.includes("403") || msg.includes("400") || msg.includes("INVALID_ARGUMENT")) {
        throw new Error("INVALID_API_KEY");
    }
    // Don't re-throw logic errors from the loop, just log them
};

const checkAI = () => {
    if (!ai) throw new Error("INVALID_API_KEY");
};

// --- IMPLEMENTATION ---

export const analyzeSchoolContext = async (text: string): Promise<string> => {
  if (!text) return "Tidak ada data.";
  
  const prompt = `Data Refleksi Sekolah: ${text}
  Tugas: Lakukan analisis mendalam "Insight Strategis".
  Metode: Core Idea -> Clustering -> Abstraction -> Synthesis.
  Output: 2-3 paragraf naratif kohesif. TANPA simbol asterisk (*), TANPA bullet points.`;

  const result = await generateWithRetry<string>(
      "Context Analysis",
      prompt,
      (data) => {
          if (typeof data !== 'string') return { isValid: false, error: "Output bukan teks" };
          if (data.length < 50) return { isValid: false, error: "Analisis terlalu pendek/gagal" };
          return { isValid: true };
      },
      { responseMimeType: "text/plain" }
  );

  return result || "Gagal menganalisis konteks. Silakan coba lagi.";
};

export const recommendDimensions = async (analysis: string): Promise<Dimension[]> => {
    const prompt = `Analisis konteks: "${analysis}"
    Pilih 3 "Dimensi Profil Lulusan" yang paling relevan.
    Pilihan Valid: [Keimanan dan Ketakwaan kepada Tuhan YME, Kewargaan (Global/Lokal), Penalaran Kritis, Kreativitas, Kolaborasi, Kemandirian, Kesehatan, Komunikasi].
    Output: JSON Array string.`;

    const result = await generateWithRetry<Dimension[]>(
        "Recommend Dimensions",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length === 0) return { isValid: false, error: "Array kosong" };
            return { isValid: true };
        },
        { responseMimeType: "application/json" }
    );

    return result || [];
};

export const recommendThemes = async (analysis: string, dimensions: Dimension[]): Promise<ThemeOption[]> => {
    const prompt = `Analisis: "${analysis}". Dimensi: "${dimensions.join(', ')}".
    Pilih 3 Tema Kokurikuler relevan (misal: Gaya Hidup Berkelanjutan, Kearifan Lokal, Kewirausahaan, dll).
    Output JSON: [{ "name": "Nama Tema", "reason": "Alasan singkat" }]`;

    const result = await generateWithRetry<ThemeOption[]>(
        "Recommend Themes",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length === 0) return { isValid: false, error: "Array kosong" };
            if (!data[0].name || !data[0].reason) return { isValid: false, error: "Format objek salah (butuh name & reason)" };
            return { isValid: true };
        },
        { responseMimeType: "application/json" }
    );

    return result || [
        { name: "Kearifan Lokal", reason: "Fallback default." },
        { name: "Gaya hidup berkelanjutan", reason: "Fallback default." }
    ];
};

export const generateCreativeIdeas = async (theme: string, format: string, analysis: string): Promise<CreativeIdeaOption[]> => {
    const safeAnalysis = analysis ? analysis.substring(0, 1500) : "Sekolah Menengah";
    const prompt = `
    Role: Creative Director & Educational Consultant.
    Tema: "${theme}", Bentuk: "${format}", Insight: "${safeAnalysis}".
    
    Tugas: Rumuskan 3 Ide Judul Projek Kokurikuler yang KONTEKSTUAL, RELEVAN, dan JELAS.
    
    Prinsip Utama:
    1. Judul harus menggambarkan aktivitas yang cocok dengan konteks siswa/sekolah.
    2. Singkatan/Akronim BOLEH digunakan jika bermakna, TAPI TIDAK WAJIB. Jangan memaksakan singkatan jika terdengar aneh.
    3. Fokus pada kualitas ide dan relevansi, bukan sekadar permainan kata.
    
    Output JSON: [{ "title": "Judul Projek", "description": "Narasi menarik dan jelas tentang aktivitas projek..." }]
    `;

    const result = await generateWithRetry<CreativeIdeaOption[]>(
        "Creative Ideas",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length < 1) return { isValid: false, error: "Tidak ada ide yang dihasilkan" };
            return { isValid: true };
        },
        { responseMimeType: "application/json", temperature: 0.9 }
    );

    return result || [];
};

export const draftProjectGoals = async (theme: string, dimensions: Dimension[], format: string): Promise<ProjectGoal[]> => {
    const prompt = `
    Tema: "${theme}". Dimensi: ${dimensions.join(', ')}. Format: ${format}.
    Tugas: Rumuskan 3-4 Tujuan Projek.
    Aturan: Subject (Mapel) harus relevan.
    Output JSON: [{ "id": "1", "description": "Murid mampu...", "subjects": ["Mapel A", "Mapel B"] }]
    `;

    const result = await generateWithRetry<ProjectGoal[]>(
        "Draft Goals",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length === 0) return { isValid: false, error: "Data kosong" };
            return { isValid: true };
        },
        { responseMimeType: "application/json" }
    );
    
    return result || [];
};

export const generateActivityPlan = async (totalJp: number, theme: string, goals: ProjectGoal[], format: string): Promise<Activity[]> => {
    const goalsText = goals.map(g => `- ${g.description}`).join('\n');
    
    const prompt = `
    Peran: Ahli Kurikulum.
    Tugas: Susun "Alur Aktivitas Kokurikuler".
    
    CONSTRAINT (PENTING):
    1. Total JP Aktivitas WAJIB sama persis dengan ${totalJp} JP.
    2. Jika perlu, sesuaikan durasi per pertemuan agar totalnya pas.
    
    Konteks: Tema "${theme}", Format "${format}".
    Tujuan: ${goalsText}
    
    Output JSON Array: [{ "id": "1", "name": "...", "type": "Tipe", "jp": 0, "description": "..." }]
    `;

    const result = await generateWithRetry<Activity[]>(
        "Activity Plan",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length === 0) return { isValid: false, error: "Data kosong" };
            
            // MATH VALIDATION
            const sum = data.reduce((acc: number, curr: any) => acc + (parseInt(curr.jp) || 0), 0);
            const diff = Math.abs(sum - totalJp);
            
            if (diff > 0) {
                return { 
                    isValid: false, 
                    error: `Matematika Salah! Total JP aktivitas kamu adalah ${sum}, padahal target alokasi adalah ${totalJp}. Selisih ${diff} JP. Revisi durasi kegiatan agar pas.` 
                };
            }
            
            return { isValid: true };
        },
        { responseMimeType: "application/json" },
        3 // Max 3 retries for Math
    );

    return result || [];
};

// --- FINALIZATION: Uses gemini-3-flash-preview specifically ---
export const generateHiddenSections = async (project: ProjectState): Promise<Partial<ProjectState>> => {
    const prompt = `
    Data Projek: ${project.title}
    Tema: ${project.selectedTheme}
    Dimensi: ${project.selectedDimensions.join(', ')}
    
    Tugas: Lengkapi dokumen kokurikuler dengan narasi akademik dan rubrik penilaian detil.
    
    Output WAJIB JSON Object dengan struktur persis ini (tanpa markdown code block tambahan di dalam string):
    {
      "activityLocations": ["Lokasi 1", "Lokasi 2"],
      "pedagogicalStrategy": "Paragraf narasi...",
      "learningEnvironment": "Paragraf narasi...",
      "partnerships": "Narasi kemitraan...",
      "digitalTools": "Narasi alat digital...",
      "assessmentPlan": "Narasi rencana asesmen...",
      "assessmentRubrics": [
         {
           "dimensionName": "Nama Dimensi (Sesuai Input)",
           "rubrics": [
             { 
               "aspect": "Aspek penilaian",
               "score1": "Deskripsi Mulai Berkembang",
               "score2": "Deskripsi Sedang Berkembang",
               "score3": "Deskripsi Berkembang Sesuai Harapan",
               "score4": "Deskripsi Sangat Berkembang"
             }
           ]
         }
      ]
    }
    
    Buatkan rubrik untuk SEMUA dimensi yang dipilih: ${project.selectedDimensions.join(', ')}.
    `;

    const result = await generateWithRetry<Partial<ProjectState>>(
        "Finalization",
        prompt,
        (data) => {
            if (typeof data !== 'object') return { isValid: false, error: "Bukan Object" };
            
            // Critical Check: Assessment Rubrics
            if (!data.assessmentRubrics || !Array.isArray(data.assessmentRubrics)) {
                return { isValid: false, error: "Rubrik penilaian hilang (Key: assessmentRubrics tidak ditemukan)" };
            }
            
            if (data.assessmentRubrics.length === 0) {
                 return { isValid: false, error: "Rubrik penilaian kosong, harus ada minimal 1 dimensi" };
            }

            return { isValid: true };
        },
        { 
            responseMimeType: "application/json",
            model: "gemini-3-flash-preview" // Override default 2.5 with 3-flash for this complex task
        },
        3
    );

    return result || {};
}
