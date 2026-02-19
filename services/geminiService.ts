
import { GoogleGenAI, Type } from "@google/genai";
import { Dimension, Activity, ThemeOption, ProjectState, ProjectGoal, CreativeIdeaOption } from "../types";
import { SUBJECTS_BY_PHASE, DEFAULT_SUBJECTS } from "../constants";
import { tokenManager } from "../utils/tokenManager";

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

// DYNAMIC CLIENT FACTORY
// Strategi: Prioritaskan Custom Key (TokenManager), Fallback ke System Key (Env)
const getAiClient = (): GoogleGenAI => {
    const customKey = tokenManager.getKey();
    const systemKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('API_KEY');
    
    const finalKey = customKey || systemKey;

    if (!finalKey || finalKey.trim().length === 0) {
        throw new Error("INVALID_API_KEY");
    }

    return new GoogleGenAI({ apiKey: finalKey.trim() });
}

// Validation Utility for UI
export const validateApiKey = async (key: string): Promise<boolean> => {
    try {
        const tempClient = new GoogleGenAI({ apiKey: key });
        // Request paling ringan untuk tes koneksi
        await tempClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Test connection',
        });
        return true;
    } catch (e) {
        console.error("API Key Validation Failed:", e);
        return false;
    }
}


// Default model for most tasks (Analysis, Ideas, etc.)
const MODEL_NAME = 'gemini-2.5-flash'; 

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
    maxRetries = 3
): Promise<T | null> {
    
    let currentPrompt = prompt;
    let attempts = 0;

    // Feature: Allow specific functions to override the model
    const targetModel = config.model || MODEL_NAME;

    while (attempts < maxRetries) {
        try {
            console.log(`[AI-Agent] ${operationName} (${targetModel}) - Attempt ${attempts + 1}`);
            
            // Get Dynamic Client
            const ai = getAiClient();

            const response = await ai.models.generateContent({
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
            const msg = error.message || error.toString() || "Unknown Error";
            const isQuotaError = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
            
            console.warn(`[AI-Agent] Correction triggered: ${msg}`);

            // If we run out of retries, throw or return fallback
            if (attempts >= maxRetries) {
                console.error(`[AI-Agent] Failed after ${maxRetries} attempts. Last error: ${msg}`);
                // If specific API error, throw it up
                handleGeminiError(error);
                return null; 
            }
            
            // Exponential Backoff
            // If quota error, wait longer: 5s, 10s...
            // Else: 2s, 4s...
            const baseWait = isQuotaError ? 5000 : 2000;
            const waitTime = baseWait * Math.pow(1.5, attempts - 1);
            
            console.log(`[AI-Agent] Waiting ${Math.round(waitTime)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            // FEEDBACK LOOP: Append the error to the prompt so the AI can fix it
            // Only for logic/json errors, not network/quota errors
            if (!isQuotaError) {
                currentPrompt += `\n\n[SYSTEM ERROR]: Output sebelumnya SALAH. \nError: ${msg}. \nPerbaiki kesalahan ini dan generate ulang JSON yang valid. HANYA JSON.`;
            }
        }
    }
    return null;
}

const handleGeminiError = (error: any) => {
    // Robust error message extraction to handle various error object structures
    const msg = error?.message || error?.error?.message || JSON.stringify(error) || "";
    
    if (msg.includes("429") || msg.includes("Resource has been exhausted") || msg.includes("Quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("QUOTA_EXCEEDED");
    }
    if (msg.includes("API_KEY") || msg.includes("403") || msg.includes("400") || msg.includes("INVALID_ARGUMENT")) {
        throw new Error("INVALID_API_KEY");
    }
    // Don't re-throw logic errors from the loop, just log them
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
    
    let specificContext = "";
    if (format.toLowerCase().includes("7 kaih") || format.toLowerCase().includes("kebiasaan")) {
        specificContext = `
        MODUS SPESIFIK: GERAKAN 7 KAIH (7 Kebiasaan Anak Indonesia Hebat).
        Daftar 7 Kebiasaan (Pilih 1 atau MAKSIMAL 2 untuk ide projek ini):
        1. Bangun pagi
        2. Beribadah
        3. Berolahraga
        4. Makan sehat dan bergizi
        5. Gemar belajar
        6. Bermasyarakat
        7. Tidur cepat / tepat waktu

        Tugas: 
        1. Buat judul projek yang mencerminkan pembiasaan kebiasaan yang dipilih (Misal: "Generasi Bugar" untuk kebiasaan Olahraga & Makan Sehat).
        2. Deskripsi harus menyebutkan eksplisit kebiasaan mana dari 7 KAIH yang diambil.
        `;
    }

    const prompt = `
    Role: Creative Director & Educational Consultant.
    Tema: "${theme}", Bentuk: "${format}", Insight: "${safeAnalysis}".
    
    ${specificContext}
    
    Tugas: Rumuskan 3 Ide Judul Projek Kokurikuler yang KONTEKSTUAL, RELEVAN, dan JELAS.
    
    Prinsip Utama:
    1. Judul harus menggambarkan aktivitas yang cocok dengan konteks siswa/sekolah.
    2. Singkatan/Akronim BOLEH digunakan jika bermakna.
    3. Fokus pada kualitas ide dan relevansi.
    
    Aturan Deskripsi ("description"):
    Deskripsi harus berupa 1 paragraf naratif yang mencakup alur:
    Masalah/Latar Belakang -> Aktivitas Murid (Fokus Pembiasaan jika 7 KAIH) -> Output (Produk/Karakter).

    Output JSON: [{ "title": "Judul Projek", "description": "Narasi sesuai aturan alur di atas..." }]
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

export const draftProjectGoals = async (theme: string, dimensions: Dimension[], format: string, phase: string): Promise<ProjectGoal[]> => {
    const allowedSubjects = SUBJECTS_BY_PHASE[phase] || DEFAULT_SUBJECTS;
    
    let specificInstruction = "";
    // LOGIC CABANG UNTUK FORMAT
    if (format.toLowerCase().includes("kolabora")) {
        // CASE A: KOLABORATIF
        specificInstruction = `
        MODUS: KOLABORATIF MATA PELAJARAN (STRICT)
        Aturan Penulisan "description" & "subjects":
        1. Tujuan harus SANGAT SPESIFIK mengacu pada 1 (SATU) mata pelajaran saja.
        2. TIDAK BOLEH menggabungkan 2 mapel dalam 1 tujuan. Buat tujuan terpisah untuk mapel lain.
        3. Array "subjects" WAJIB berisi TEPAT 1 (SATU) nama mata pelajaran yang sesuai.
        4. Di akhir deskripsi tujuan, tuliskan nama mapel dalam kurung. Contoh: "... (mata pelajaran IPA)".
        `;
    } else if (format.toLowerCase().includes("7 kaih") || format.toLowerCase().includes("kebiasaan")) {
        // CASE B: 7 KAIH (NEW LOGIC)
        specificInstruction = `
        MODUS: GERAKAN 7 KAIH (PEMBIASAAN)
        Daftar Referensi Kebiasaan: [Bangun pagi, Beribadah, Berolahraga, Makan sehat dan bergizi, Gemar belajar, Bermasyarakat, Tidur cepat].
        
        Aturan Penulisan Tujuan:
        1. Tujuan harus fokus pada "PEMBIASAAN" (Habituation), bukan sekadar pengetahuan.
        2. Pilih 1 atau 2 kebiasaan dari daftar di atas yang relevan dengan Tema "${theme}".
        3. Rumusan tujuan mencakup: Membangun kesepakatan, Melaksanakan pembiasaan (di sekolah & rumah), dan Refleksi diri.
        4. "subjects" diisi dengan mata pelajaran yang relevan dengan kebiasaan tersebut (Misal: PJOK untuk Olahraga/Tidur Cepat, Agama untuk Beribadah, PKN/IPS untuk Bermasyarakat).
        5. Contoh deskripsi: "Membiasakan pola hidup sehat melalui rutinitas bangun pagi dan berolahraga secara konsisten."
        `;
    } else {
        // CASE C: LAINNYA
        specificInstruction = `
        MODUS: PROJEK UMUM / KEWIRAUSAHAAN
        Aturan Penulisan "description":
        1. Tujuan harus berupa pembiasaan, rutinitas, atau pemahaman manfaat.
        2. JANGAN menuliskan nama mata pelajaran di dalam teks deskripsi. Teks harus bersih.
        3. Array "subjects" berisi mapel yang relevan.
        `;
    }

    const prompt = `
    Tema: "${theme}". Dimensi: ${dimensions.join(', ')}. Format: "${format}".
    Fase/Jenjang: "${phase}".
    
    DAFTAR MATA PELAJARAN YANG TERSEDIA DI FASE INI (PILIH DARI SINI SAJA UNTUK ARRAY SUBJECTS):
    ${allowedSubjects.join(', ')}

    ${specificInstruction}

    Tugas: Rumuskan 3-4 Tujuan Projek.
    
    Output JSON: [{ "id": "1", "description": "Isi sesuai aturan modus di atas...", "subjects": ["Nama Mapel"] }]
    `;

    const result = await generateWithRetry<ProjectGoal[]>(
        "Draft Goals",
        prompt,
        (data) => {
            if (!Array.isArray(data)) return { isValid: false, error: "Output bukan Array" };
            if (data.length === 0) return { isValid: false, error: "Data kosong" };
            
            // Validasi tambahan untuk Kolaborasi: Pastikan subjects.length === 1
            if (format.toLowerCase().includes("kolabora")) {
                const invalid = data.find((g: any) => !g.subjects || g.subjects.length !== 1);
                if (invalid) return { isValid: false, error: "Mode Kolaborasi: Setiap tujuan wajib memiliki tepat 1 mata pelajaran di array subjects." };
            }

            return { isValid: true };
        },
        { responseMimeType: "application/json" }
    );
    
    return result || [];
};

export const generateActivityPlan = async (totalJp: number, theme: string, goals: ProjectGoal[], format: string): Promise<Activity[]> => {
    const goalsText = goals.map(g => `- ${g.description}`).join('\n');
    
    let specificGuide = "";
    if (format.toLowerCase().includes("7 kaih") || format.toLowerCase().includes("kebiasaan")) {
        specificGuide = `
        STRUKTUR KHUSUS GERAKAN 7 KAIH (WAJIB DIIKUTI):
        Buat alur aktivitas dengan tahapan berikut (sesuaikan jumlah JP agar total pas ${totalJp} JP):
        1. MEMBANGUN KESEPAKATAN (Introduction): Guru & siswa menyepakati kebiasaan (misal: kontrak belajar, jadwal tidur/bangun, atau jadwal olahraga).
        2. EKSPLORASI STRATEGI: Siswa mencari cara/strategi untuk menjalankan kebiasaan tersebut.
        3. PELAKSANAAN & JURNAL (Execution): Siswa mempraktikkan kebiasaan (di sekolah/rumah) dan mengisi Jurnal Harian. (Ini adalah inti, alokasikan JP terbanyak di sini atau buat beberapa pertemuan).
        4. REFLEKSI & EVALUASI: Membahas tantangan dalam pelaksanaan dan mencari solusi.
        5. PRESENTASI/SHARING: Membagikan pengalaman perubahan yang dirasakan (tubuh lebih bugar, pikiran segar, dll).
        `;
    } else {
        specificGuide = "Buat alur aktivitas yang logis: Pengenalan -> Kontekstualisasi -> Aksi -> Refleksi -> Tindak Lanjut.";
    }

    const prompt = `
    Peran: Ahli Kurikulum.
    Tugas: Susun "Alur Aktivitas Kokurikuler".
    
    CONSTRAINT (PENTING):
    1. Total JP Aktivitas WAJIB sama persis dengan ${totalJp} JP.
    2. Jika perlu, sesuaikan durasi per pertemuan agar totalnya pas.
    
    Konteks: Tema "${theme}", Format "${format}".
    Tujuan: ${goalsText}
    
    ${specificGuide}
    
    Output JSON Array: [{ "id": "1", "name": "Nama Aktivitas (Singkat & Jelas)", "type": "Tipe (misal: Diskusi/Praktik)", "jp": 0, "description": "Penjelasan singkat tentang apa yang dilakukan..." }]
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
    // Pass the existing structure to be filled out
    const activityContext = project.activities.map(a => `- ${a.name} (${a.jp} JP): ${a.description}`).join('\n');
    const is7Kaih = project.activityFormat.toLowerCase().includes("7 kaih");

    const prompt = `
    Data Projek: ${project.title}
    Tema: ${project.selectedTheme}
    Dimensi: ${project.selectedDimensions.join(', ')}
    Format: ${project.activityFormat}
    Konsep Dasar (Deskripsi): ${project.projectDescription || "-"}
    
    Daftar Aktivitas Awal:
    ${activityContext}

    Tugas 1: Lengkapi dokumen kokurikuler dengan narasi akademik.
    Tugas 2: UNTUK SETIAP AKTIVITAS di atas, buatkan MICRO STEPS (Langkah-langkah mikro/detail) yang sangat operasional (5-10 poin per aktivitas).
    
    ${is7Kaih ? `
    KHUSUS 7 KAIH:
    - Micro Steps untuk aktivitas "Pelaksanaan/Jurnal" harus mencakup: kerjasama dengan orang tua, pengisian checklist harian, dan monitoring guru.
    - Assessment Rubric harus menilai "Konsistensi Pembiasaan" (misal: Frekuensi bangun pagi/olahraga).
    ` : ''}

    PERMINTAAN FORMAT ISI (WAJIB DIIKUTI):
    1. "pedagogicalStrategy": Gunakan format list (\\n) (Pendekatan, Model, Strategi).
    2. "learningEnvironment": Gunakan format list (\\n) (Setting kelas, Kondisi belajar).
    3. "activityLocations": List JSON String Array. Contoh: ["Kelas", "Halaman Sekolah", "Rumah (Monitoring Orang Tua)"].
    4. "partnerships": Gunakan format list (\\n) (Mitra, Orang Tua, Peran Masyarakat).
    5. "digitalTools": Gunakan format list (\\n) (Platform, Media).
    
    Output WAJIB JSON Object:
    {
      "activityLocations": ["Lokasi 1", "Lokasi 2"],
      "pedagogicalStrategy": "Pendekatan: ... \\nModel: ... \\nStrategi: ...", 
      "learningEnvironment": "Lokasi: ... \\nSetting Kelas: ...",
      "partnerships": "Mitra: ... \\nOrang Tua: ...",
      "digitalTools": "Platform: ... \\nMedia: ...",
      "assessmentPlan": "Narasi rencana asesmen...",
      "activities": [
         {
           "id": "ID_SAMA", 
           "steps": ["1. Guru...", "2. Siswa..."]
         }
      ],
      "assessmentRubrics": [
         {
           "dimensionName": "Nama Dimensi",
           "rubrics": [
             { "aspect": "...", "score1": "...", "score2": "...", "score3": "...", "score4": "..." }
           ]
         }
      ]
    }
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

            // Critical Check: Detailed Activities
            if (!data.activities || !Array.isArray(data.activities)) {
                 return { isValid: false, error: "Rincian aktivitas hilang (Key: activities array tidak ditemukan)" };
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
    
    // Merge generated steps into original activities
    if (result && result.activities) {
        const mergedActivities = project.activities.map((original, index) => {
            const generated = result.activities?.find((a: any) => a.id === original.id) || result.activities?.[index];
            return {
                ...original,
                steps: generated?.steps || ["Kegiatan belum dirinci."]
            };
        });
        result.activities = mergedActivities;
    }

    return result || {};
}
