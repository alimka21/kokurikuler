
import { GoogleGenAI, Type } from "@google/genai";
import { Dimension, Activity, ThemeOption, ProjectState, ProjectGoal, CreativeIdeaOption } from "../types";

// Safe env access
const getEnv = (key: string) => {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
        return (import.meta as any).env[key];
    }
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            // @ts-ignore
            return process.env[key];
        }
    } catch (e) {}
    return '';
};

// Support both Vite import.meta.env and standard process.env
const apiKey = getEnv('VITE_GEMINI_API_KEY') || getEnv('API_KEY') || ''; 

const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

const SYSTEM_INSTRUCTION = `
Anda adalah Ahli Kokurikuler (Kurikulum Nasional). 
Tugas Anda membantu guru menyusun dokumen Kokurikuler.
Gunakan istilah "Kokurikuler" dan "Dimensi Profil Lulusan".
Bahasa Indonesia formal dan pedagogis.
`;

// Helper to detect specific API errors
const handleGeminiError = (error: any) => {
    const msg = error?.toString() || "";
    // Check for Quota Exceeded / Rate Limit
    if (msg.includes("429") || msg.includes("Resource has been exhausted") || msg.includes("Quota exceeded")) {
        throw new Error("QUOTA_EXCEEDED");
    }
    // Check for Invalid API Key
    if (msg.includes("API_KEY") || msg.includes("403") || msg.includes("400")) {
        throw new Error("INVALID_API_KEY");
    }
    throw error;
};

export const analyzeSchoolContext = async (text: string): Promise<string> => {
  if (!text) return "Tidak ada data.";
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Data Refleksi Sekolah:
      ${text}
      
      Tugas: Lakukan analisis mendalam untuk menyusun "Insight Strategis" sebagai fondasi modul projek.
      
      Gunakan METODE BERIKUT secara berurutan:
      1. Identifikasi Ide Inti (Core Idea Extraction) dari data mentah.
      2. Pengelompokan Tematik (Thematic Clustering) antara potensi murid, sumber daya, dan isu sosial.
      3. Generalisasi Informasi (Abstraction) menjadi gambaran utuh kondisi sekolah.
      4. Eliminasi Redundansi (Hapus pengulangan poin).
      5. Sintesis → Rekomendasi (Hubungkan kondisi nyata dengan kebutuhan pengembangan karakter).

      ATURAN FORMAT OUTPUT (STRICT):
      - Tulis dalam 2-3 paragraf naratif yang mengalir (Cohesive Narrative).
      - DILARANG KERAS menggunakan simbol asterisk (*), tanda bintang, bullet points, atau numbering.
      - DILARANG menggunakan format bold/italic markdown.
      - Jangan menyalin ulang data mentah, tapi jelaskan "artinya" bagi pembelajaran.
      - Gunakan bahasa profesional, empatik, dan solutif.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "Gagal menganalisis.";
  } catch (error) {
    handleGeminiError(error);
    return "Terjadi kesalahan.";
  }
};

export const recommendDimensions = async (analysis: string): Promise<Dimension[]> => {
  try {
     const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Berdasarkan analisis konteks sekolah ini: "${analysis}"
      
      Pilih 3 "Dimensi Profil Lulusan" yang paling relevan untuk dikuatkan.
      Pilihan tersedia:
      - Keimanan dan Ketakwaan kepada Tuhan YME
      - Kewargaan (Global/Lokal)
      - Penalaran Kritis
      - Kreativitas
      - Kolaborasi
      - Kemandirian
      - Kesehatan
      - Komunikasi

      Output: JSON Array string nama dimensi.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    handleGeminiError(e);
    return [];
  }
};

export const recommendThemes = async (analysis: string, dimensions: Dimension[]): Promise<ThemeOption[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Berdasarkan analisis konteks: "${analysis}" 
      dan dimensi terpilih: "${dimensions.join(', ')}".
      
      Tugas: Pilih dan urutkan 3 Tema Kokurikuler yang paling relevan dari daftar referensi di bawah ini.
      
      DAFTAR REFERENSI TEMA:
      1. Generasi sehat dan bugar
      2. Peduli dan berbagi
      3. Aku cinta Indonesia
      4. Hidup hemat dan produktif
      5. Berkarya untuk sesama dan bangsa
      6. Gaya hidup berkelanjutan
      7. Kearifan Lokal
      8. Bhinneka Tunggal Ika
      9. Berekayasa dan Berteknologi untuk Membangun NKRI
      10. Kewirausahaan
      
      Output JSON format: [{ "name": "Nama Tema (sesuai daftar)", "reason": "Alasan singkat mengapa tema ini cocok dengan analisis..." }]`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    handleGeminiError(error);
    return [
        { name: "Kearifan Lokal", reason: "Fallback default." },
        { name: "Gaya hidup berkelanjutan", reason: "Fallback default." }
    ];
  }
};

export const generateCreativeIdeas = async (theme: string, format: string, analysis: string): Promise<CreativeIdeaOption[]> => {
    try {
        // Prepare cleaner input for prompt
        const safeAnalysis = analysis ? analysis.substring(0, 1500) : "Sekolah Menengah";

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `
            Role: Konsultan Kreatif Projek Penguatan Profil Pelajar Pancasila (P5).
            
            INPUT DATA:
            - Tema Besar: "${theme}"
            - Bentuk Kegiatan: "${format}"
            - Konteks Sekolah: "${safeAnalysis}"
            
            TUGAS:
            Berikan 3 opsi Ide Projek yang spesifik, kreatif, dan catchy.
            
            KETENTUAN OUPUT JSON:
            1. title: Gunakan AKRONIM atau Singkatan Unik. Format: "AKRONIM: Kepanjangan". (Misal: "SABER: Sapu Bersih", "GELAS: Gerakan Lawan Sampah").
            2. description: Buat 1 paragraf narasi (3-4 kalimat) yang menjelaskan inti kegiatan projek ini secara menarik. Deskripsi ini akan dipakai sebagai "Deskripsi Singkat" di modul.
            `,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const jsonStr = response.text || "[]";
        const result = JSON.parse(jsonStr);
        // Fallback checks
        if (!Array.isArray(result) || result.length === 0) {
            console.warn("AI returned empty ideas");
            return [];
        }
        return result;
    } catch (e) {
        handleGeminiError(e);
        console.error("AI Generate Ideas Error:", e);
        return [];
    }
}

export const draftProjectGoals = async (theme: string, dimensions: Dimension[], format: string): Promise<ProjectGoal[]> => {
  try {
    let additionalInstruction = "";

    if (format === "Kolaboratif Lintas Disiplin Ilmu") {
        additionalInstruction = `
        KONTEKS BENTUK: Kolaboratif Lintas Disiplin Ilmu.
        SYARAT WAJIB 'subjects':
        - WAJIB berisi minimal 2 nama MATA PELAJARAN MURNI.
        - Contoh yang BENAR: ["Matematika", "IPA", "IPS", "Bahasa Indonesia", "Seni Budaya", "PJOK"].
        - DILARANG mengisi dengan karakter atau sikap (Jangan tulis "Mandiri", "Gotong Royong" di field subjects).
        `;
    } else if (format === "Gerakan 7 KAIH") {
        additionalInstruction = `
        KONTEKS KHUSUS: Gerakan 7 KAIH.
        SYARAT 'subjects':
        - Isi dengan ["Pendidikan Karakter", "Budi Pekerti", "PAI", "PPKn"].
        `;
    } else {
        additionalInstruction = `
        SYARAT 'subjects':
        - Isi dengan mata pelajaran relevan atau ["Kokurikuler", "Pengembangan Diri"].
        `;
    }

    const prompt = `
      Bertindaklah sebagai Konsultan Kurikulum Profesional.
      Tugas: Rumuskan 3-4 "Tujuan Projek" yang spesifik untuk tema "${theme}".

      DEFINISI PEDAGOGIS:
      Tujuan Projek menggabungkan kompetensi (${dimensions.join(', ')}) dengan konten tema "${theme}".

      FORMULA KALIMAT TUJUAN:
      "Murid mampu [KATA KERJA] [KONTEN] melalui [METODE]."
      
      PENTING TENTANG 'subjects' (Mata Pelajaran):
      ${additionalInstruction}

      Output JSON Array: [{ "id": "1", "description": "Murid mampu...", "subjects": ["Mapel A", "Mapel B"] }]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    description: { type: Type.STRING },
                    subjects: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
      }
    });
    
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    handleGeminiError(error);
    console.error(error);
    return [];
  }
};

export const generateActivityPlan = async (totalJp: number, theme: string, goals: ProjectGoal[], format: string): Promise<Activity[]> => {
  try {
    let contextInstruction = "";
    if (format === "Kolaboratif Lintas Disiplin Ilmu") {
        contextInstruction = "Konteks: Kolaborasi Lintas Mapel. Tunjukkan keterhubungan skill antar mapel dalam aktivitas.";
    } else if (format === "Gerakan 7 KAIH") {
        contextInstruction = `
        KONTEKS KHUSUS: Gerakan 7 KAIH.
        ATURAN KHUSUS: WAJIB menyertakan aktivitas pembiasaan berulang (monitoring jurnal/tantangan) selama beberapa JP.
        `;
    }

    // Convert structured goals to string for prompt context
    const goalsText = goals.map(g => `- ${g.description} (${g.subjects.join(', ')})`).join('\n');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
      Peran: Ahli Kurikulum & Desain Instruksional.
      Tugas: Susun "Alur Aktivitas Kokurikuler" yang detail.

      KONTEKS PROJEK:
      - Tema: "${theme}"
      - Total Waktu: ${totalJp} JP (Wajib dialokasikan habis).
      - Tujuan: 
      ${goalsText}
      
      INSTRUKSI KHUSUS:
      1. Pecah kegiatan menjadi langkah-langkah nyata.
      2. JP harus rasional (2-4 JP per pertemuan standar).
      3. ${contextInstruction}
      
      Output JSON Array: [{ "id": "1", "name": "...", "type": "Tipe Aktivitas", "jp": 0, "description": "Micro-steps..." }]`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING },
              jp: { type: Type.INTEGER },
              description: { type: Type.STRING }
            },
            required: ["id", "name", "type", "jp", "description"]
          }
        }
      }
    });
    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr);
  } catch (error) {
    handleGeminiError(error);
    return [];
  }
};

export const generateHiddenSections = async (project: ProjectState): Promise<Partial<ProjectState>> => {
    try {
        const prompt = `
        Berdasarkan data projek berikut, buatlah narasi lengkap dokumen kokurikuler.
        
        DATA PROJEK:
        Judul: ${project.title}
        Tema: ${project.selectedTheme}
        Dimensi: ${project.selectedDimensions.join(', ')}
        Tujuan: ${project.projectGoals.map(g => g.description).join('; ')}
        Daftar Aktivitas: ${project.activities.map(a => a.name).join(', ')}

        TUGAS 1: GENERATE LOKASI KEGIATAN
        Berdasarkan daftar aktivitas di atas, tentukan daftar tempat/lokasi spesifik pelaksanaan projek ini.
        Contoh: ["Ruang Kelas", "Halaman Sekolah", "Taman Kota", "Museum XYZ"].
        
        TUGAS 2: NARASI AKADEMIK
        Generate konten naratif untuk:
        - pedagogicalStrategy (Metode yang digunakan)
        - learningEnvironment (Setting lingkungan)
        - digitalTools (Alat bantu digital)
        - assessmentPlan (Rencana asesmen ringkas)

        TUGAS 3: RUBRIK ASESMEN (WAJIB DETAIL)
        Buat rubrik penilaian untuk dimensi: ${project.selectedDimensions.join(', ')}.
        Tentukan aspek penilaian spesifik dan deskripsi untuk 4 skala (Kurang, Cukup, Baik, Sangat Baik).
        
        Output JSON Object Lengkap.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        activityLocations: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Daftar lokasi kegiatan spesifik, misal Ruang Kelas, Aula, Lapangan."
                        },
                        pedagogicalStrategy: { type: Type.STRING },
                        learningEnvironment: { type: Type.STRING },
                        digitalTools: { type: Type.STRING },
                        assessmentPlan: { type: Type.STRING },
                        assessmentRubrics: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    dimensionName: { type: Type.STRING },
                                    rubrics: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                aspect: { type: Type.STRING },
                                                score1: { type: Type.STRING },
                                                score2: { type: Type.STRING },
                                                score3: { type: Type.STRING },
                                                score4: { type: Type.STRING }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No text");
        return JSON.parse(text);

    } catch (error) {
        handleGeminiError(error);
        console.error("Final Gen Error", error);
        return {};
    }
}
