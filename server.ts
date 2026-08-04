import express from "express";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: "10mb" }));

// Helper to extract and deduplicate multiple API keys (supports newline, comma, or semicolon)
function parseApiKeys(rawInput?: string): string[] {
  const combined = [rawInput, process.env.KOBOILLM_API_KEY, process.env.LITELLM_API_KEY, process.env.GEMINI_API_KEY]
    .filter(Boolean)
    .join('\n');
  const keys = Array.from(new Set(
    combined
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5)
  ));
  return keys;
}

// Helper to format AI errors nicely for client responses
function formatServerAiError(error: any): { statusCode: number; message: string } {
  const errorString = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
  const isQuota = 
    error?.status === 429 || 
    error?.statusCode === 429 || 
    error?.status === 503 ||
    error?.statusCode === 503 ||
    error?.code === 429 ||
    error?.code === 503 ||
    /quota|limit|429|exhausted|503|demand|unavailable/i.test(errorString);

  if (isQuota) {
    return {
      statusCode: 429,
      message: `⚠️ Kuota / Rate Limit API LiteLLM (KoboILLM) Telah Terlampaui (Error 429 Exceeded Quota).

💡 SOLUSI CARA MENGATASINYA:
1. Buka Tab 1 ('1. Input Parameter & Promt') dan pilih Pengaturan Koneksi AI (Gemini & LiteLLM).
2. Masukkan Kunci API LiteLLM / KoboILLM Anda sendiri pada kolom API Key.
3. Anda dapat memasukkan beberapa API Key dipisah koma/baris baru untuk Rotasi Otomatis.`
    };
  }

  const isInvalidModel = /invalid model|model_not_found|not found|view available models|invalid model name/i.test(errorString);
  if (isInvalidModel) {
    return {
      statusCode: 400,
      message: `⚠️ Nama Model AI Tidak Valid / Tidak Didukung oleh Server LiteLLM.

💡 SOLUSI:
1. Buka Tab '1. Input Parameter & Promt' > 'Pengaturan Koneksi AI (Gemini & LiteLLM)'.
2. Klik tombol '🔄 Ambil Daftar Model dari Server' untuk memuat daftar model resmi yang didukung oleh API Key Anda.
3. Pilih model aktif yang tersedia dari menu dropdown.`
    };
  }

  return {
    statusCode: 500,
    message: errorString || "Terjadi kesalahan pada layanan API LiteLLM / KoboILLM."
  };
}

// Helper to sanitize markdown JSON codeblocks and extract pure JSON strings
function cleanJsonOutput(text: string): string {
  if (!text) return "[]";
  let cleaned = text.trim();

  // 1. Extract content inside markdown ```json ... ``` or ``` ... ```
  const codeblockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeblockMatch && codeblockMatch[1] && codeblockMatch[1].trim().length > 0) {
    cleaned = codeblockMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  // 2. Extract JSON Array [...] if embedded inside conversational text
  const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    return arrayMatch[0].trim();
  }

  // 3. Extract JSON Object {...} if embedded inside conversational text
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0].trim();
  }

  return cleaned;
}

// Ultra-robust JSON parser with multi-stage auto-repair for LLM output
function safeParseJson(jsonString: string): any {
  const cleaned = cleanJsonOutput(jsonString);

  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // Attempt 1: Fix trailing commas in arrays/objects (e.g. [1, 2,] -> [1, 2])
    let repaired = cleaned.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch (err2) {
      // Attempt 2: Escape unescaped control characters inside string values (raw newlines, tabs)
      repaired = repaired.replace(/[\u0000-\u001F]+/g, (match) => {
        if (match === '\n') return '\\n';
        if (match === '\r') return '\\r';
        if (match === '\t') return '\\t';
        return '';
      });
      try {
        return JSON.parse(repaired);
      } catch (err3) {
        // Attempt 3: Extract individual valid JSON objects using regex
        const objectMatches = repaired.match(/\{[^{}]*\}/g);
        if (objectMatches && objectMatches.length > 0) {
          const items: any[] = [];
          for (const m of objectMatches) {
            try {
              items.push(JSON.parse(m));
            } catch {}
          }
          if (items.length > 0) return items;
        }
        throw err1; // Throw original error if repair fails completely
      }
    }
  }
}

// Helper to dynamically query available models from LiteLLM server
async function fetchServerModelsList(baseUrl: string, apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    let rawList: any[] = [];
    if (Array.isArray(data.data)) rawList = data.data;
    else if (Array.isArray(data)) rawList = data;
    else if (Array.isArray(data.models)) rawList = data.models;

    return rawList
      .map((item: any) => typeof item === 'string' ? item : item.id || item.name || String(item))
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

// LiteLLM / KoboILLM Chat Completions Caller
async function generateContentWithLiteLLM(
  params: {
    contents: string;
    config?: any;
    apiKeysRaw?: string;
    temperature?: number;
    baseUrl?: string;
  }
): Promise<{ text: string; meta: { keyIndex: number; totalKeys: number; rotated: boolean } }> {
  const keysToTry = parseApiKeys(params.apiKeysRaw);
  if (keysToTry.length === 0) {
    throw new Error(
      "Kunci API LiteLLM / KoboILLM tidak ditemukan. Silakan masukkan Kunci API pada Pengaturan Koneksi AI (Langkah 1)."
    );
  }

  const baseUrl = (params.baseUrl || params.config?.baseUrl || process.env.KOBOILLM_BASE_URL || process.env.LITELLM_BASE_URL || "https://api.koboillm.com/v1").replace(/\/+$/, '');
  
  const preferredModel = params.config?.model || "gemini-2.0-flash";
  const candidateModels = [
    preferredModel,
    `google/${preferredModel}`,
    `gemini/${preferredModel}`,
    "gemini-1.5-flash",
    "google/gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-5-sonnet"
  ];
  const modelsToTry = Array.from(new Set(candidateModels.filter(Boolean)));

  let lastError: any = null;

  // Key Rotation Loop
  for (let keyIdx = 0; keyIdx < keysToTry.length; keyIdx++) {
    const apiKey = keysToTry[keyIdx];
    console.log(`[LiteLLM API Rotation] Trying Key #${keyIdx + 1} of ${keysToTry.length} at ${baseUrl}/chat/completions...`);

    let serverModelsFetched = false;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        const messages: any[] = [];
        if (params.config?.systemInstruction) {
          messages.push({ role: "system", content: params.config.systemInstruction });
        }
        messages.push({ role: "user", content: params.contents });

        const requestBody: any = {
          model,
          messages,
          temperature: params.temperature ?? params.config?.temperature ?? 0.7,
        };

        if (params.config?.responseMimeType === "application/json") {
          requestBody.response_format = { type: "json_object" };
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "x-api-key": apiKey
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`LiteLLM model ${model} request failed (status ${response.status}): ${errText}`);
          
          // If model name is invalid, dynamically discover models from server if not done yet
          if (!serverModelsFetched && /invalid model|model_not_found|view available models/i.test(errText)) {
            serverModelsFetched = true;
            console.log(`[LiteLLM Auto-Discovery] Fetching available models directly from ${baseUrl}/models...`);
            const remoteModels = await fetchServerModelsList(baseUrl, apiKey);
            if (remoteModels.length > 0) {
              console.log(`[LiteLLM Auto-Discovery] Found ${remoteModels.length} models:`, remoteModels);
              for (const rm of remoteModels) {
                if (!modelsToTry.includes(rm)) {
                  modelsToTry.push(rm);
                }
              }
            }
          }

          throw new Error(`API LiteLLM Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        let contentText = data.choices?.[0]?.message?.content || "";

        if (!contentText) {
          throw new Error("Respon kosong dari LiteLLM API.");
        }

        return {
          text: contentText,
          meta: {
            keyIndex: keyIdx,
            totalKeys: keysToTry.length,
            rotated: keyIdx > 0
          }
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`Key #${keyIdx + 1} model ${model} failed:`, err?.message || err);
      }
    }
  }

  throw lastError || new Error("Gagal memproses AI setelah merotasi seluruh API Key dan model.");
}

// Helper to attach rotation header metadata to response
function attachRotationHeader(res: express.Response, meta?: { keyIndex: number; totalKeys: number; rotated: boolean }) {
  if (meta) {
    res.setHeader('x-api-key-index', String(meta.keyIndex));
    res.setHeader('x-api-keys-total', String(meta.totalKeys));
    res.setHeader('x-api-key-rotated', meta.rotated ? 'true' : 'false');
  }
}

// API Routes
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    provider: "litellm",
    baseUrl: process.env.KOBOILLM_BASE_URL || "https://api.koboillm.com/v1",
    apiKeyPresent: parseApiKeys().length > 0 
  });
});

// Endpoint: Fetch Available Models from Base URL (https://api.koboillm.com/v1/models)
apiRouter.post("/fetch-models", async (req, res) => {
  try {
    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;
    const keys = parseApiKeys(apiKeysRaw);
    const baseUrl = (req.body.baseUrl || process.env.KOBOILLM_BASE_URL || "https://api.koboillm.com/v1").replace(/\/+$/, '');

    const apiKey = keys[0] || '';

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ 
        error: `Gagal mengambil daftar model dari ${baseUrl}/models: ${errText}` 
      });
    }

    const data = await response.json();
    let modelsList: string[] = [];

    if (Array.isArray(data.data)) {
      modelsList = data.data
        .map((item: any) => typeof item === 'string' ? item : item.id || item.name || String(item))
        .filter(Boolean);
    } else if (Array.isArray(data)) {
      modelsList = data
        .map((item: any) => typeof item === 'string' ? item : item.id || item.name || String(item))
        .filter(Boolean);
    } else if (data.models && Array.isArray(data.models)) {
      modelsList = data.models
        .map((item: any) => typeof item === 'string' ? item : item.id || item.name || String(item))
        .filter(Boolean);
    }

    if (modelsList.length === 0) {
      modelsList = [
        "gemini-2.0-flash",
        "gemini-2.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gpt-4o",
        "claude-3-5-sonnet"
      ];
    }

    res.json({ baseUrl, totalModels: modelsList.length, models: modelsList });
  } catch (error: any) {
    console.error("Error fetching models:", error);
    res.status(500).json({ error: error?.message || "Gagal mengambil daftar model dari LiteLLM API." });
  }
});

// Endpoint 1: Generate Kisi-Kisi (Matriks Asesmen) via AI LiteLLM
apiRouter.post("/generate-kisi", async (req, res) => {
  try {
    const {
      mataPelajaran,
      definisi,
      muatan,
      kompetensi,
      elemenMateri,
      subElemenMateri,
      count = 3,
      baseUrl,
      model
    } = req.body;

    if (!mataPelajaran) {
      return res.status(400).json({ error: "Mata Pelajaran harus diisi" });
    }

    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;

    const systemInstruction = `Anda adalah ahli kurikulum pendidikan menengah SMA di Indonesia (khususnya untuk penyusunan Tes Kemampuan Akademik / TKA). 
Tugas Anda adalah membuat rancangan KISI-KISI SOAL dalam bentuk MATRIKS ASESMEN sesuai dengan Kurikulum Merdeka atau K-13 tingkat SMA kelas X, XI, atau XII.
Rancanglah kisi-kisi soal yang berbobot, mengandung stimulus yang kuat, valid, dan seimbang berdasarkan input dari pengguna.
Hasilkan output berupa JSON Array murni yang valid tanpa teks pembungkus lain.`;

    const prompt = `Buatkan ${count} baris matriks asesmen kisi-kisi soal untuk mata pelajaran berikut:
Mata Pelajaran: ${mataPelajaran}
${definisi ? `Definisi/Tujuan: ${definisi}` : ""}
${muatan ? `Muatan Kurikulum: ${muatan}` : ""}
${kompetensi ? `Kompetensi Umum: ${kompetensi}` : ""}
${elemenMateri ? `Elemen/Materi Utama: ${elemenMateri}` : ""}
${subElemenMateri ? `Sub-Elemen/Submateri: ${subElemenMateri}` : ""}

Aturan Penyusunan Matriks:
1. Setiap baris harus bervariasi jenis bentuk soalnya: 'pilihan_ganda_sederhana' (PG Sederhana), 'mcma' (PG Kompleks Multiple Choice Multiple Answers), atau 'kategori' (PG Kompleks kategori Benar/Salah atau Sesuai/Tidak Sesuai).
2. Tingkat kognitif harus bervariasi antara: 'level_1' (Pemahaman / Knowing: Mengenali, mengingat, dan memahami konsep dasar), 'level_2' (Penerapan / Applying: Menerapkan konsep pada fenomena nyata), atau 'level_3' (Penalaran / Reasoning: Berpikir kritis dan menalar secara logis).
3. Buat rincian elemen, sub-elemen, kompetensi yang diukur, serta batasan materi secara logis dan mendalam.
4. Distribusikan jumlah soal per kisi-kisi (misalnya antara 3-10 soal per baris).
5. Hasilkan juga 'konteksNusantara' (rencana integrasi konteks lokal Nusantara/Indonesia yang spesifik dan relevan dengan materi ini, misal adat daerah, keragaman etnis, geografi kepulauan, sejarah lokal, dsb) serta 'stimulusTambahan' (rencana bentuk stimulus seperti teks bacaan, studi kasus riil, berita, data tabel, atau peristiwa konkret khas Indonesia) untuk meningkatkan kualitas stimulus soal.

Hasilkan format JSON Array objek dengan properti:
[
  {
    "bentukSoal": "pilihan_ganda_sederhana" | "mcma" | "kategori",
    "levelKognitif": "level_1" | "level_2" | "level_3",
    "elemenMateri": "string",
    "subElemenMateri": "string",
    "kompetensi": "string",
    "batasanCatatan": "string",
    "jumlahSoal": 5,
    "konteksNusantara": "string",
    "stimulusTambahan": "string"
  }
]`;

    const result = await generateContentWithLiteLLM({
      contents: prompt,
      apiKeysRaw,
      baseUrl,
      config: {
        model,
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    attachRotationHeader(res, result.meta);
    let parsed = safeParseJson(result.text);

    if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.kisi)) parsed = parsed.kisi;
      else if (Array.isArray(parsed.data)) parsed = parsed.data;
      else if (Array.isArray(parsed.items)) parsed = parsed.items;
      else parsed = [parsed];
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating kisi-kisi:", error);
    const formatted = formatServerAiError(error);
    res.status(formatted.statusCode).json({ error: formatted.message });
  }
});

// Endpoint 2: Generate Soal (Pembuat Soal) dari Kisi-Kisi via AI LiteLLM
apiRouter.post("/generate-soal", async (req, res) => {
  try {
    const {
      kisi,
      mataPelajaran,
      definisi,
      muatan,
      jumlahOpsi = 5,
      jenisSoal = "tunggal",
      konteksLokal = [],
      stimulusKonten = [],
      kualitasChecklist = [],
      noSoalStart = 1,
      existingQuestions = [],
      baseUrl,
      model
    } = req.body;

    if (!kisi) {
      return res.status(400).json({ error: "Data Kisi-Kisi wajib dilampirkan" });
    }

    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;

    const systemInstruction = `Anda adalah ahli pembuat soal ujian nasional dan TKA (Tes Kemampuan Akademik) SMA di Indonesia.
Anda sangat terampil menyusun soal tingkat tinggi (HOTS - Higher Order Thinking Skills), bervariasi, mendalam, dan bebas dari bias.
Patuhi instruksi bentuk soal dan parameter kognitif yang ditentukan pengguna secara presisi.
Hasilkan output berupa JSON Array murni yang valid tanpa teks pembungkus markdown tambahan.`;

    const activeKonteksLokal = (kisi.konteksLokal && kisi.konteksLokal.length > 0) ? kisi.konteksLokal : konteksLokal;
    const activeStimulusKonten = (kisi.stimulusKonten && kisi.stimulusKonten.length > 0) ? kisi.stimulusKonten : stimulusKonten;
    const activeKualitasChecklist = (kisi.kualitasChecklist && kisi.kualitasChecklist.length > 0) ? kisi.kualitasChecklist : kualitasChecklist;

    const konteksStr = activeKonteksLokal.length > 0 
      ? `Integrasikan KONTEKS LOKAL INDONESIA berikut ke dalam stimulus atau soal: ${activeKonteksLokal.join(", ")}.`
      : "";

    const stimulusStr = activeStimulusKonten.length > 0
      ? `Gunakan tipe STIMULUS DAN PENGEMBANGAN KONTEN berikut: ${activeStimulusKonten.join(", ")} (misal teks bacaan, data/tabel, berita, kasus nyata).`
      : "Gunakan stimulus yang relevan jika sesuai dengan kompetensi.";

    const checklistStr = activeKualitasChecklist.length > 0
      ? `Pastikan memenuhi KUALITAS SOAL berikut: ${activeKualitasChecklist.join(", ")}.`
      : "";

    const bentukSoalDesc = 
      kisi.bentukSoal === "pilihan_ganda_sederhana"
        ? "Pilihan ganda sederhana: Hanya ada satu jawaban yang benar. Sediakan pilihan A sampai " + (jumlahOpsi === 5 ? "E" : "D") + "."
        : kisi.bentukSoal === "mcma"
        ? "Pilihan ganda kompleks model multiple choice multiple answers (MCMA): Ada lebih dari satu jawaban yang benar. Peserta diminta memilih semua jawaban benar. Kunci jawaban harus menyebutkan semua pilihan yang benar (misal: 'A, C'). Sediakan pilihan A sampai " + (jumlahOpsi === 5 ? "E" : "D") + "."
        : "Pilihan ganda kompleks kategori: Menyajikan beberapa pernyataan (minimal 3-4 pernyataan) yang semuanya harus direspon, misalnya dengan pilihan 'Benar'/'Salah' atau 'Sesuai'/'Tidak Sesuai'. Kunci jawaban harus merinci status setiap pernyataan (misal: '1. Benar, 2. Salah, 3. Benar').";

    const countRequired = Number(req.body.count) || Number(kisi.jumlahSoal) || 1;

    let existingQuestionsConstraint = '';
    if (Array.isArray(existingQuestions) && existingQuestions.length > 0) {
      const sanitizedList = existingQuestions
        .filter(item => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 30);
      if (sanitizedList.length > 0) {
        existingQuestionsConstraint = `

HINDARI PENGULANGAN SOAL (SANGAT PENTING):
Jangan membuat soal yang sama atau mirip dengan soal-soal berikut:
${sanitizedList.map((text: string, idx: number) => `- Soal ${idx + 1}: ${text.substring(0, 150)}...`).join('\n')}
Pastikan butir soal yang Anda hasilkan saat ini benar-benar segar, baru, unik secara naratif, bervariasi, dan tidak mengulangi pertanyaan di atas.`;
      }
    }

    const prompt = `Buatkan tepat sebanyak ${countRequired} butir soal ujian TKA SMA yang berbeda untuk Mata Pelajaran ${mataPelajaran}.
    
PENTING: Jumlah objek soal yang dihasilkan dalam array JSON HARUS tepat sebanyak ${countRequired} butir soal.

INFORMASI MATRIKS ASESMEN KISI-KISI:
- No Soal Mulai: ${noSoalStart}
- Bentuk Soal: ${kisi.bentukSoal} (${bentukSoalDesc})
- Tingkat Kognitif: ${kisi.levelKognitif}
- Elemen/Materi: ${kisi.elemenMateri}
- Sub-Elemen/Submateri: ${kisi.subElemenMateri}
- Kompetensi yang Diuji: ${kisi.kompetensi}
- Batasan/Catatan Khusus: ${kisi.batasanCatatan || "Tidak ada"}
- Konteks Nusantara: ${kisi.konteksNusantara || "Tidak ada khusus"}
- Stimulus Tambahan: ${kisi.stimulusTambahan || "Tidak ada khusus"}
- Jenis Soal: ${jenisSoal}
${existingQuestionsConstraint}

PANDUAN UTAMA:
1. ${konteksStr}
2. ${stimulusStr}
3. ${checklistStr}
4. Kunci jawaban harus sangat akurat dan pembahasan harus lengkap, ilmiah, edukatif, dan terstruktur dengan rapi.
5. SANGAT PENTING (MANDATORI): Gabungkan paragraf stimulus/pengantar/studi kasus (bila ada) langsung ke bagian awal field 'soal' (diikuti pertanyaan utama di bawahnya), dan kosongkan field 'stimulus' (isi dengan string kosong ""). Jangan memisahkannya.
6. SANGAT PENTING: JANGAN mencantumkan nomor soal (seperti '1.', 'Soal 1.') di dalam teks field 'soal'.
7. SANGAT PENTING: Setiap pilihan jawaban di dalam array 'opsi' WAJIB diawali dengan huruf label pilihan dan titik, contoh: ['A. ...', 'B. ...', 'C. ...', 'D. ...', 'E. ...'].

Hasilkan format JSON Array:
[
  {
    "kompetensi": "${kisi.kompetensi}",
    "subKompetensi": "${kisi.subElemenMateri}",
    "bentukSoal": "${kisi.bentukSoal}",
    "stimulus": "",
    "soal": "Teks stimulus/pengantar dan pertanyaan utama...",
    "opsi": ["A. Opsi A", "B. Opsi B", "C. Opsi C", "D. Opsi D", "E. Opsi E"],
    "kunciJawaban": "A",
    "pembahasan": "Penjelasan...",
    "kataKunci": "Topik Utama",
    "gambarUrl": ""
  }
]`;

    const result = await generateContentWithLiteLLM({
      contents: prompt,
      apiKeysRaw,
      baseUrl,
      config: {
        model,
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    attachRotationHeader(res, result.meta);
    let parsed = safeParseJson(result.text);

    if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.soal)) parsed = parsed.soal;
      else if (Array.isArray(parsed.questions)) parsed = parsed.questions;
      else if (Array.isArray(parsed.data)) parsed = parsed.data;
      else if (Array.isArray(parsed.items)) parsed = parsed.items;
      else parsed = [parsed];
    }

    if (Array.isArray(parsed)) {
      parsed = parsed.map((q: any) => {
        let cleanSoal = typeof q.soal === 'string' ? q.soal.trim() : (typeof q.question === 'string' ? q.question.trim() : '');
        cleanSoal = cleanSoal.replace(/^(soal\s*)?(no\.?\s*)?\d+[\.\)\:\-]\s*/i, '').trim();

        let cleanOpsi = Array.isArray(q.opsi) ? q.opsi : (Array.isArray(q.options) ? q.options : []);
        cleanOpsi = cleanOpsi.map((opt: string, idx: number) => {
          let text = String(opt || '').trim();
          text = text.replace(/^\*\*([^*]+)\*\*/, '$1').trim();
          text = text.replace(/^[\*\-\•\s]*\(?([A-Ea-e1-5])\)?[\.\)\:\-]\s*/, '').trim();
          text = text.replace(/^[A-Ea-e]\s+/, '').trim();
          const letter = String.fromCharCode(65 + idx);
          return `${letter}. ${text}`;
        });

        return {
          ...q,
          soal: cleanSoal,
          opsi: cleanOpsi
        };
      });
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating soal:", error);
    const formatted = formatServerAiError(error);
    res.status(formatted.statusCode).json({ error: formatted.message });
  }
});

// Endpoint 3: Generate Custom SVG Illustration/Graphic via AI LiteLLM
apiRouter.post("/generate-illustration", async (req, res) => {
  try {
    const { prompt, context, baseUrl, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Permintaan ilustrasi (prompt) harus diisi." });
    }

    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;
    const systemInstruction = `Anda adalah desainer grafis dan ahli ilustrasi ilmiah/edukatif profesional untuk soal ujian SMA.
Tugas Anda adalah menghasilkan kode inline SVG (<svg> ... </svg>) yang valid, indah, bersih, modern, dan sangat responsif untuk mendukung pemahaman soal ujian.`;

    const userPrompt = `Buatlah kode SVG inline yang merepresentasikan ilustrasi berikut:
Permintaan Pengguna: "${prompt}"
${context ? `Konteks Soal yang berkaitan: "${context}"` : ""}

Ingat, hanya hasilkan kode SVG langsung tanpa penanda kode atau pembungkus markdown apapun. Dimulai dari '<svg' sampai '</svg>'.`;

    const result = await generateContentWithLiteLLM({
      contents: userPrompt,
      apiKeysRaw,
      baseUrl,
      config: {
        model,
        systemInstruction,
        temperature: 0.2,
      },
    });

    attachRotationHeader(res, result.meta);
    let svgCode = cleanJsonOutput(result.text);
    
    res.json({ svg: svgCode });
  } catch (error: any) {
    console.error("Error generating illustration:", error);
    const formatted = formatServerAiError(error);
    res.status(formatted.statusCode).json({ error: formatted.message });
  }
});

// Endpoint 4: Test Health and Validity of Multiple API Keys via LiteLLM
apiRouter.post("/test-key-health", async (req, res) => {
  try {
    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;
    const keys = parseApiKeys(apiKeysRaw);
    const baseUrl = (req.body.baseUrl || process.env.KOBOILLM_BASE_URL || "https://api.koboillm.com/v1").replace(/\/+$/, '');

    if (keys.length === 0) {
      return res.status(400).json({ error: "Tidak ada API Key yang diberikan." });
    }

    const results = [];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const snippet = key.substring(0, 7) + "..." + key.substring(key.length - 4);
      try {
        const response = await fetch(`${baseUrl}/models`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${key}`,
            "x-api-key": key
          }
        });

        if (response.ok) {
          results.push({ keyIndex: i, snippet, status: "valid", message: "API Key Aktif & Normal" });
        } else {
          const errText = await response.text();
          const isQuota = response.status === 429 || /quota|limit|429/i.test(errText);
          results.push({ 
            keyIndex: i, 
            snippet, 
            status: isQuota ? "exhausted" : "invalid", 
            message: isQuota ? "Limit Kuota Terlampaui (429)" : `Error HTTP ${response.status}`
          });
        }
      } catch (err: any) {
        results.push({ 
          keyIndex: i, 
          snippet, 
          status: "invalid", 
          message: err?.message || "Gagal terhubung"
        });
      }
    }

    res.json({ totalKeys: keys.length, results });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Gagal menguji kesehatan API Key" });
  }
});

// Endpoint 5: Optimize/Generate Professional AI Prompt for a Kisi-Kisi Row
apiRouter.post("/optimize-prompt", async (req, res) => {
  try {
    const { kisi, mataPelajaran, baseUrl, model } = req.body;
    if (!kisi) {
      return res.status(400).json({ error: "Data kisi-kisi harus disediakan." });
    }

    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;
    const systemInstruction = `Anda adalah ahli Rekayasa Prompt (Prompt Engineer) profesional dan spesialis Kurikulum & Evaluasi Pendidikan Indonesia.
Tugas Anda adalah merumuskan Prompt AI yang sangat detail, spesifik, dan efektif (Megaprompt) agar guru atau akademisi dapat menyalin prompt tersebut ke LLM lain (seperti Gemini, ChatGPT, Claude) untuk menghasilkan butir soal HOTS yang luar biasa.

Buat prompt dalam bahasa Indonesia yang berwibawa, rapi, terstruktur menggunakan format markdown (gunakan list, tebal, kode blok untuk visualisasi jika perlu). Prompt tersebut harus menginstruksikan AI eksternal untuk membuat soal berkualitas tinggi sesuai dengan kisi-kisi yang dikirimkan.`;

    const userPrompt = `Buatlah draf PROMPT AI (Megaprompt) yang siap disalin oleh guru. Prompt tersebut harus dioptimalkan untuk menghasilkan soal ujian yang sangat spesifik berdasarkan data matriks berikut:
- Mata Pelajaran: ${mataPelajaran || "Mata Pelajaran Umum"}
- No Kisi-Kisi: ${kisi.no}
- Kompetensi Dasar / Lingkup: ${kisi.kompetensi}
- Materi Pokok: ${kisi.elemenMateri || kisi.materi || ""}
- Sub-materi / Indikator: ${kisi.subElemenMateri || kisi.subMateri || "-"}
- Level Kognitif: ${kisi.levelKognitif}
- Bentuk Soal: ${kisi.bentukSoal}
- Jumlah Soal yang Diminta: ${kisi.jumlahSoal} butir soal
${kisi.konteksNusantara ? `- Rencana Konteks Nusantara: ${kisi.konteksNusantara}` : ""}
${kisi.stimulusTambahan ? `- Rencana Stimulus Tambahan: ${kisi.stimulusTambahan}` : ""}

Draf Megaprompt yang Anda buat harus memuat:
1. Peran AI yang diinstruksikan (misal: "Anda adalah dosen/guru senior pembuat soal TKA SMA...").
2. Spesifikasi lengkap materi, tingkat kognitif (C1-C6/HOTS), serta integrasi Konteks Nusantara dan Stimulus Tambahan yang spesifik agar bernuansa ke-Indonesia-an yang otentik dan mendalam.
3. ATURAN PENULISAN SOAL MANDATORI: Wajib menginstruksikan AI eksternal untuk MENGGABUNGKAN stimulus (paragraf/data/tabel/studi kasus) dan pertanyaan utama secara langsung menyatu di dalam satu bagian 'Soal:', tanpa dipisah menjadi section/field stimulus tersendiri, serta tanpa nomor soal di dalam teks.
4. Aturan pengecoh pilihan ganda yang homogen, diawali huruf A, B, C, D, E dan titik, serta tidak mengandung tanda asteris (*).
5. Format keluaran (soal, opsi A-E, kunci jawaban, dan pembahasan mendalam). Wajib menyertakan instruksi: "Jadikan Hasil soal Outpot Format word dan excel." dan Wajib menginstruksikan untuk menggabungkan stimulus dan pertanyaan utama secara langsung dalam bagian 'Soal'.
6. Teknik melahirkan pertanyaan tingkat tinggi (HOTS) yang memicu daya analisis siswa.

Tulis draf prompt tersebut langsung dalam format Markdown yang elegan, berwibawa, rapi, dan langsung bisa dicopy oleh pengguna. Jangan tambahkan penjelasan pembuka dari Anda sendiri seperti "Berikut adalah prompt yang Anda minta", melainkan langsung mulailah isi prompt tersebut dengan judul atau teks instruksi utama yang siap disalin.`;

    const { text, meta } = await generateContentWithLiteLLM({
      contents: userPrompt,
      apiKeysRaw,
      baseUrl,
      config: {
        model,
        systemInstruction,
        temperature: 0.7,
      },
    });

    attachRotationHeader(res, meta);
    res.json({ prompt: text });
  } catch (error: any) {
    console.error("Error optimizing prompt:", error);
    const formatted = formatServerAiError(error);
    res.status(formatted.statusCode).json({ error: formatted.message });
  }
});

// Endpoint 6: Generate Systematic Learning Material from Kisi-Kisi Row
apiRouter.post("/generate-materi", async (req, res) => {
  try {
    const { kisi, mataPelajaran, mode, baseUrl, model } = req.body;
    if (!kisi) {
      return res.status(400).json({ error: "Data kisi-kisi harus disediakan." });
    }

    const apiKeysRaw = (req.headers['x-api-key'] as string) || req.body.apiKey || undefined;
    
    let systemInstruction = "";
    let userPrompt = "";

    if (mode === "materi") {
      systemInstruction = `Anda adalah ahli kurikulum sosiologi dan pengajar senior kelas dunia yang sangat karismatik dan inspiratif.
Tugas Anda adalah menyusun RINGKASAN MATERI AJAR yang sangat detail, akademis, komprehensif, mendalam, dan sistematis berdasarkan parameter kisi-kisi matriks yang diberikan.

PEDOMAN GAYA PENULISAN & FORMATTING TERIKAT:
1. Tulis dengan gaya bahasa yang sangat MENARIK BACA, KOMUNIKATIF, INSPIRATIF, DAN MENGGUGAH MINAT BACA SISWA MAUPUN GURU.
2. ATURAN BOLD DAN ITALIC (CETAK TEBAL DAN MIRING):
   - WAJIB MENGGUNAKAN CETAK MIRING (Markdown *istilah*) KHUSUS UNTUK SEMUA ISTILAH BAHASA ASING, BAHASA LATIN, ATAU BAHASA INGGRIS.
   - WAJIB MENGGUNAKAN CETAK TEBAL (Markdown **Konsep**) KHUSUS UNTUK KATA ATAU KONSEP KHUSUS, NAMA TEORI, NAMA TOKOH/AHLI SOSIOLOGI.
3. DILARANG KERAS MENGGUNAKAN TABEL. Sajikan semua perbandingan dalam bentuk narasi paragraf yang rapi dan daftar poin.
4. DILARANG MENGGUNAKAN TANDA BINTANG / ASTERISK ('*') SECARA ACAK ATAU BERANTAKAN.

Materi ajar ini wajib terdiri dari 4 bagian utama yang diberi judul Markdown (#):
# 1. PENDAHULUAN & DEFINISI
# 2. KONSEP UTAMA & TEORI PENDEKATAN
# 3. STUDI KASUS KONKRIT (KONTEKSTUAL INDONESIA)
# 4. ANALISIS KRITIS & REFLEKSI`;

      userPrompt = `Buatkan RINGKASAN MATERI AJAR yang komprehensif, inspiratif, dan sangat menarik untuk dibaca untuk tingkat SMA Kelas XII berdasarkan unit berikut:
Mata Pelajaran: ${mataPelajaran || "Sosiologi"}
Topik / Elemen Materi: ${kisi.elemenMateri}
Sub-elemen / Sub-materi: ${kisi.subElemenMateri}
Target Kompetensi Siswa: ${kisi.kompetensi}
Level Kognitif: ${kisi.levelKognitif === 'level_1' ? 'Pemahaman & Pengetahuan (Knowing - C1/C2)' : kisi.levelKognitif === 'level_2' ? 'Penerapan/Aplikasi (Applying - C3)' : 'Penalaran/Analisis Tinggi (Reasoning/HOTS - C4/C5/C6)'}
Batasan & Catatan Kurikulum: ${kisi.batasanCatatan || "Tidak ada batasan khusus"}

Tulis secara panjang lebar, menarik, dan rapi. Gunakan cetak miring (*...*) untuk bahasa asing dan cetak tebal (**...**) untuk kata/konsep khusus. TANPA TABEL.`;
    } else {
      systemInstruction = `Anda adalah ahli prompt engineering pendidikan dan desainer instruksional kelas dunia.
Tugas Anda adalah merumuskan sebuah MEGA-PROMPT yang sangat detail, komprehensif, terstruktur rapi, dan siap saji (copy-pasteable) untuk digunakan oleh guru/pengajar di NOTEBOOK LM atau GEMINI AI guna menghasilkan INFOGRAFIS PEMBELAJARAN atau SLIDE PRESENTASI INTERAKTIF yang berkualitas tinggi, estetis, dan mendalam.`;

      userPrompt = `Buatkan MEGA-PROMPT siap pakai untuk menyusun Slide Presentasi dan Infografis Pembelajaran tingkat SMA Kelas XII yang sangat detail dan kaya konten untuk unit berikut:
Mata Pelajaran: ${mataPelajaran || "Sosiologi"}
Topik / Elemen Materi: ${kisi.elemenMateri}
Sub-elemen / Sub-materi: ${kisi.subElemenMateri}
Target Kompetensi Siswa: ${kisi.kompetensi}
Level Kognitif: ${kisi.levelKognitif === 'level_1' ? 'Pemahaman & Pengetahuan (Knowing - C1/C2)' : kisi.levelKognitif === 'level_2' ? 'Penerapan/Aplikasi (Applying - C3)' : 'Penalaran/Analisis Tinggi (Reasoning/HOTS - C4/C5/C6)'}
Batasan & Catatan Kurikulum: ${kisi.batasanCatatan || "Tidak ada batasan khusus"}`;
    }

    const { text, meta } = await generateContentWithLiteLLM({
      contents: userPrompt,
      apiKeysRaw,
      baseUrl,
      config: {
        model,
        systemInstruction,
        temperature: 0.7,
      },
    });

    attachRotationHeader(res, meta);
    res.json({ materi: text });
  } catch (error: any) {
    console.error("Error generating materi:", error);
    const formatted = formatServerAiError(error);
    res.status(formatted.statusCode).json({ error: formatted.message });
  }
});

// Mount the API Router on both /api and / to handle Vercel routing variations seamlessly
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler caught unexpected error:", err);
  res.status(500).json({ error: err.message || "Terjadi kesalahan internal pada server." });
});

// Serve frontend static assets in production, or let Vite handle it in dev
if (process.env.NODE_ENV !== "production") {
  const startDevServer = async () => {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[DEV] Server running on http://localhost:${PORT}`);
    });
  };
  startDevServer();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[PROD] Server running on port ${PORT}`);
    });
  }
}

export default app;
