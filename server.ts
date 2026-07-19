import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini client to avoid crashes if GEMINI_API_KEY is not yet present
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY tidak ditemukan di environment variables. Hubungi admin atau atur di tab Secrets."
    );
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Circuit breaker to avoid spamming rate-limited or quota-exhausted models
const coolOffModels = new Map<string, number>();
const COOL_OFF_DURATION = 180 * 1000; // 3 minutes cool-off

// Robust content generation with retries and model fallbacks (e.g. gemini-3.1-flash-lite)
async function generateContentWithFallbackAndRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  // Ordered by preferred + high availability (2.5-flash is extremely fast, followed by 3.5-flash and lite)
  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];

  const now = Date.now();
  // Filter active models not in active cool-off
  const activeModels = modelsToTry.filter(m => {
    const lastFail = coolOffModels.get(m);
    return !lastFail || (now - lastFail > COOL_OFF_DURATION);
  });
  
  // Deferred ones kept as low-priority fallback at the end
  const deferredModels = modelsToTry.filter(m => {
    const lastFail = coolOffModels.get(m);
    return lastFail && (now - lastFail <= COOL_OFF_DURATION);
  });

  const orderedModels = activeModels.length > 0 ? [...activeModels, ...deferredModels] : modelsToTry;
  let lastError: any = null;

  for (const model of orderedModels) {
    const isCoolOff = coolOffModels.has(model) && (now - (coolOffModels.get(model) || 0) <= COOL_OFF_DURATION);
    console.log(`Calling Gemini API using model ${model}${isCoolOff ? ' (deferred fallback)' : ''}...`);
    try {
      // 15-second timeout per model call to allow fast failover before gateway/client times out
      let timeoutId: any;
      const apiCall = ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      }).then(res => {
        if (timeoutId) clearTimeout(timeoutId);
        return res;
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`Timeout waiting for model ${model}`)), 15000);
      });

      const response = await Promise.race([apiCall, timeoutPromise]);
      return response;
    } catch (error: any) {
      lastError = error;
      console.error(`Model ${model} failed with error:`, error);

      // Check if this error is a rate limit / quota exceeded error (429)
      const isQuotaError = 
        error?.status === 429 || 
        error?.statusCode === 429 || 
        (error?.message && /quota|limit|429|exhausted/i.test(error.message)) ||
        (typeof error === 'string' && /quota|limit|429|exhausted/i.test(error));
      
      if (isQuotaError) {
        console.warn(`Model ${model} returned a quota limit error. Cool-off applied.`);
        coolOffModels.set(model, Date.now());
      }
      // Immediately proceed to the next model in the list
    }
  }

  throw lastError || new Error("Gagal memproses AI setelah mencoba beberapa model.");
}

// API Routes
const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", apiKeyPresent: !!process.env.GEMINI_API_KEY });
});

// Endpoint 1: Generate Kisi-Kisi (Matriks Asesmen) via AI
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
    } = req.body;

    if (!mataPelajaran) {
      return res.status(400).json({ error: "Mata Pelajaran harus diisi" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Anda adalah ahli kurikulum pendidikan menengah SMA di Indonesia (khususnya untuk penyusunan Tes Kemampuan Akademik / TKA). 
Tugas Anda adalah membuat rancangan KISI-KISI SOAL dalam bentuk MATRIKS ASESMEN sesuai dengan Kurikulum Merdeka atau K-13 tingkat SMA kelas X, XI, atau XII.
Rancanglah kisi-kisi soal yang berbobot, mengandung stimulus yang kuat, valid, dan seimbang berdasarkan input dari pengguna.`;

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
5. Hasilkan juga 'konteksNusantara' (rencana integrasi konteks lokal Nusantara/Indonesia yang spesifik dan relevan dengan materi ini, misal adat daerah, keragaman etnis, geografi kepulauan, sejarah lokal, dsb) serta 'stimulusTambahan' (rencana bentuk stimulus seperti teks bacaan, studi kasus riil, berita, data tabel, atau peristiwa konkret khas Indonesia) untuk meningkatkan kualitas stimulus soal.`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bentukSoal: { 
                type: Type.STRING, 
                description: "Nilai wajib berupa salah satu dari: 'pilihan_ganda_sederhana', 'mcma', atau 'kategori'" 
              },
              levelKognitif: { 
                type: Type.STRING, 
                description: "Nilai wajib berupa salah satu dari: 'level_1', 'level_2', atau 'level_3'" 
              },
              elemenMateri: { type: Type.STRING, description: "Nama elemen atau materi utama" },
              subElemenMateri: { type: Type.STRING, description: "Nama sub-elemen atau sub-materi spesifik" },
              kompetensi: { type: Type.STRING, description: "Deskripsi kompetensi spesifik yang akan diukur" },
              batasanCatatan: { type: Type.STRING, description: "Batasan materi, batasan variabel, atau catatan khusus" },
              jumlahSoal: { type: Type.INTEGER, description: "Jumlah soal yang dialokasikan untuk kisi-kisi ini" },
              konteksNusantara: { type: Type.STRING, description: "Konteks lokal Nusantara spesifik (misal kebudayaan daerah, kearifan lokal, suku, adat, isu sosial/geografis Indonesia, dsb) yang relevan" },
              stimulusTambahan: { type: Type.STRING, description: "Stimulus tambahan berupa skenario studi kasus, kutipan berita, data fiktif terstruktur, atau sketsa peristiwa nyata di Indonesia untuk memperkaya soal" }
            },
            required: [
              "bentukSoal",
              "levelKognitif",
              "elemenMateri",
              "subElemenMateri",
              "kompetensi",
              "batasanCatatan",
              "jumlahSoal",
              "konteksNusantara",
              "stimulusTambahan"
            ]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating kisi-kisi:", error);
    res.status(500).json({ error: error.message || "Gagal membuat kisi-kisi" });
  }
});

// Endpoint 2: Generate Soal (Pembuat Soal) dari Kisi-Kisi via AI
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
    } = req.body;

    if (!kisi) {
      return res.status(400).json({ error: "Data Kisi-Kisi wajib dilampirkan" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Anda adalah ahli pembuat soal ujian nasional dan TKA (Tes Kemampuan Akademik) SMA di Indonesia.
Anda sangat terampil menyusun soal tingkat tinggi (HOTS - Higher Order Thinking Skills), bervariasi, mendalam, dan bebas dari bias.
Patuhi instruksi bentuk soal dan parameter kognitif yang ditentukan pengguna secara presisi.`;

    // Build context strings (prefer Kisi-specific parameters over global fallbacks)
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

    const prompt = `Buatkan tepat sebanyak ${countRequired} butir soal ujian TKA SMA yang berbeda untuk Mata Pelajaran ${mataPelajaran}.
    
PENTING: Jumlah objek soal yang dihasilkan dalam array JSON HARUS tepat sebanyak ${countRequired} butir soal, tidak kurang dan tidak lebih.
Setiap butir soal harus unik, bervariasi, dan didasarkan pada kisi-kisi berikut.

INFORMASI MATRIKS ASESMEN KISI-KISI:
- No Soal Mulai: ${noSoalStart}
- Bentuk Soal: ${kisi.bentukSoal} (${bentukSoalDesc})
- Tingkat Kognitif: ${kisi.levelKognitif} (${kisi.levelKognitif === 'level_1' ? 'Pemahaman (Knowing) - Mengenali, mengingat, dan memahami konsep dasar' : kisi.levelKognitif === 'level_2' ? 'Penerapan (Applying) - Menerapkan konsep pada fenomena nyata' : 'Penalaran (Reasoning) - Berpikir kritis dan menalar secara logis'})
- Elemen/Materi: ${kisi.elemenMateri}
- Sub-Elemen/Submateri: ${kisi.subElemenMateri}
- Kompetensi yang Diuji: ${kisi.kompetensi}
- Batasan/Catatan Khusus: ${kisi.batasanCatatan || "Tidak ada"}
- Konteks Nusantara: ${kisi.konteksNusantara || "Tidak ada khusus"}
- Stimulus Tambahan: ${kisi.stimulusTambahan || "Tidak ada khusus"}
- Jenis Soal: ${jenisSoal} (Soal Tunggal atau Soal Grup/Terhubung)

PANDUAN EKSTRA:
1. ${konteksStr} ${kisi.konteksNusantara ? `Integrasikan juga secara mendalam target Konteks Nusantara berikut ke dalam stimulus atau pokok soal agar bernuansa ke-Indonesia-an yang otentik: "${kisi.konteksNusantara}".` : ""}
2. ${stimulusStr} ${kisi.stimulusTambahan ? `Gunakan secara aktif target Stimulus Tambahan berikut untuk merancang stimulus/skenario pendukung yang kaya dan berbobot: "${kisi.stimulusTambahan}".` : ""}
3. ${checklistStr}
4. Kunci jawaban harus sangat akurat dan pembahasan harus lengkap, ilmiah, edukatif, dan terstruktur dengan rapi agar mudah dipahami siswa SMA. Tambahkan juga field 'kataKunci' yang berisi kata kunci atau konsep penting/topik utama yang digunakan/diuji dalam soal ini (misal: 'Sistem Persamaan Linear', 'Gaya Gravitasi', 'Asimilasi Sosial').
5. JIKA soal membutuhkan visual pendukung (seperti grafik fungsi, diagram kartesius, bangun geometri, siklus biologi, diagram sirkuit, kurva ekonomi, dsb.), Anda disarankan untuk membuat kode SVG inline yang valid (dimulai dengan '<svg' dan ditutup '</svg>' lengkap dengan viewBox, stroke, fill, teks label agar indah dan responsive) ATAU mencantumkan URL gambar Unsplash yang relevan pada field 'gambarUrl'. Jika tidak membutuhkan visual, isi 'gambarUrl' dengan string kosong "".
6. Harap sesuaikan bahasa agar baku, formal, sesuai EBI (Ejaan Bahasa Indonesia), namun mudah dimengerti.
7. Hasilkan tepat ${countRequired} objek soal di dalam array hasil.`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              kompetensi: { type: Type.STRING },
              subKompetensi: { type: Type.STRING },
              bentukSoal: { type: Type.STRING },
              stimulus: { type: Type.STRING, description: "Paragraf stimulus atau pengantar soal (bila ada)" },
              soal: { type: Type.STRING, description: "Pertanyaan atau pokok soal utama" },
              opsi: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Array pilihan jawaban (misal ['A. ...', 'B. ...']) atau daftar pernyataan untuk tipe kategori" 
              },
              kunciJawaban: { type: Type.STRING, description: "Kunci jawaban yang tepat dan presisi" },
              pembahasan: { type: Type.STRING, description: "Pembahasan mendalam, terstruktur, dan ilmiah" },
              kataKunci: { type: Type.STRING, description: "Kata kunci atau konsep utama yang digunakan dalam soal ini" },
              gambarUrl: { type: Type.STRING, description: "Kode SVG inline lengkap (dimulai dengan '<svg' dan diakhiri '</svg>') atau URL gambar eksternal, atau string kosong '' jika tidak ada ilustrasi." }
            },
            required: ["kompetensi", "subKompetensi", "bentukSoal", "soal", "opsi", "kunciJawaban", "pembahasan", "kataKunci", "gambarUrl"]
          }
        }
      }
    });

    const resultText = response.text || "[]";
    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (error: any) {
    console.error("Error generating soal:", error);
    res.status(500).json({ error: error.message || "Gagal membuat soal" });
  }
});

// Endpoint 3: Generate Custom SVG Illustration/Graphic via AI Gemini
apiRouter.post("/generate-illustration", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Permintaan ilustrasi (prompt) harus diisi." });
    }

    const ai = getGeminiClient();
    const systemInstruction = `Anda adalah desainer grafis dan ahli ilustrasi ilmiah/edukatif profesional untuk soal ujian SMA.
Tugas Anda adalah menghasilkan kode inline SVG (<svg> ... </svg>) yang valid, indah, bersih, modern, dan sangat responsif untuk mendukung pemahaman soal ujian.

Ketentuan pembuatan SVG:
1. Hasilkan HANYA kode SVG mentah tanpa penjelasan, tanpa teks pengantar, tanpa markdown, dan tanpa pembungkus backticks (jangan gunakan \`\`\`xml atau \`\`\`svg). Mulai langsung dengan '<svg' dan akhiri dengan '</svg>'.
2. Buat desain yang modern, estetis, dan profesional:
   - Gunakan palet warna modern yang bersih dan kontras tinggi (misalnya Indigo, Emerald, Violet, Amber, Slate, Rose, Sky).
   - Gunakan garis stroke tebal dan jelas (misal stroke-width="2"), marker panah yang rapi, dan grid yang presisi.
   - Tambahkan teks label, sumbu koordinat, keterangan, atau rumus dengan font-family="system-ui, -apple-system, sans-serif" agar serasi dengan antarmuka web modern dan mudah dibaca (font-size minimal 11px-12px, font-weight bold jika penting).
   - Atur viewBox secara proporsional agar responsive (misal viewBox="0 0 500 280"). Gunakan background warna netral atau transparan, tapi berikan padding yang cukup agar elemen tidak mepet ke tepi.
   - Pastikan teks label tidak terpotong dan koordinat teks diletakkan dengan presisi di sebelah objek/garis/titik yang dirujuk.
3. Konten visual harus merepresentasikan permintaan pengguna dengan sangat akurat secara ilmiah/matematis (misalnya: jika diminta grafik parabola kuadrat, gambar kurva mulus berbentuk parabola yang memotong sumbu dengan benar; jika diminta rangkaian listrik, gambarkan simbol resistor/baterai/saklar standar dengan label nilai hambatannya).
4. Gambar harus bersifat mandiri (self-contained), murni berbasis elemen vektor SVG (<rect>, <circle>, <path>, <text>, <line>, <g>, dll.), tidak bergantung pada file eksternal.`;

    const userPrompt = `Buatlah kode SVG inline yang merepresentasikan ilustrasi berikut:
Permintaan Pengguna: "${prompt}"
${context ? `Konteks Soal yang berkaitan: "${context}"` : ""}

Ingat, hanya hasilkan kode SVG langsung tanpa penanda kode atau pembungkus markdown apapun. Dimulai dari '<svg' sampai '</svg>'.`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    let svgCode = response.text || "";
    // Clean up potential markdown code block wrappers if any slips through
    svgCode = svgCode.trim();
    if (svgCode.startsWith("```")) {
      svgCode = svgCode.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
    }
    
    res.json({ svg: svgCode });
  } catch (error: any) {
    console.error("Error generating illustration:", error);
    res.status(500).json({ error: error.message || "Gagal menghasilkan ilustrasi" });
  }
});

// Endpoint 4: Optimize/Generate Professional AI Prompt for a Kisi-Kisi Row
apiRouter.post("/optimize-prompt", async (req, res) => {
  try {
    const { kisi, mataPelajaran } = req.body;
    if (!kisi) {
      return res.status(400).json({ error: "Data kisi-kisi harus disediakan." });
    }

    const ai = getGeminiClient();
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
3. Aturan pembuatan stimulus (kontekstual, studi kasus, riil, atau data ilmiah khas Nusantara).
4. Aturan pengecoh pilihan ganda yang homogen dan tidak terlalu mudah tereliminasi.
5. Format keluaran (soal, opsi A-E, kunci jawaban, dan pembahasan mendalam).
6. Teknik melahirkan pertanyaan tingkat tinggi (HOTS) yang memicu daya analisis siswa.

Tulis draf prompt tersebut langsung dalam format Markdown yang elegan, berwibawa, rapi, dan langsung bisa dicopy oleh pengguna. Jangan tambahkan penjelasan pembuka dari Anda sendiri seperti "Berikut adalah prompt yang Anda minta", melainkan langsung mulailah isi prompt tersebut dengan judul atau teks instruksi utama yang siap disalin.`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const optimizedPrompt = response.text || "";
    res.json({ prompt: optimizedPrompt });
  } catch (error: any) {
    console.error("Error optimizing prompt:", error);
    res.status(500).json({ error: error.message || "Gagal mengoptimasi prompt" });
  }
});

// Endpoint 5: Generate Systematic Learning Material from Kisi-Kisi Row
apiRouter.post("/generate-materi", async (req, res) => {
  try {
    const { kisi, mataPelajaran, guidanceText } = req.body;
    if (!kisi) {
      return res.status(400).json({ error: "Data kisi-kisi harus disediakan." });
    }

    const ai = getGeminiClient();
    const systemInstruction = `Anda adalah ahli kurikulum nasional Kemendikbudristek dan penyusun modul bahan ajar profesional tingkat SMA.
Tugas Anda adalah menyusun MODUL AJAR PEMBELAJARAN (LEARNING MODULE) YANG SANGAT DETAIL, MENDALAM, KOMPREHENSIF, DAN SISTEMATIS. Modul ini harus setara dengan satu bab penuh buku teks pelajaran berkualitas tinggi.
Hindari ringkasan pendek atau penjelasan permukaan. Tuliskan penjelasan teoretis secara panjang lebar, mendalam, akademis, terstruktur, serta kaya akan literasi sosiologis/ilmiah.

Gunakan struktur modul yang baku sebagai berikut:
1. PENDAHULUAN & DEFINISI UTAMA secara komprehensif (bahas etimologi, definisi menurut minimal 2 tokoh/ahli sosiologi/ilmu terkait, serta signifikansi materi dalam kehidupan sosial). Uraikan secara rinci.
2. KONSEP KUNCI, DIMENSI, DAN TEORI PENDEKATAN secara mendetail. Berikan sub-bab penjelasan untuk setiap dimensi, jelaskan mekanisme sosialnya, klasifikasinya, serta tabel/pembagian konseptual jika relevan.
3. STUDI KASUS KONTEKSTUAL INDONESIA secara mendalam. Tuliskan narasi studi kasus riil atau fenomena sosial aktual di Indonesia yang sedang hangat, kemudian berikan pembahasan dan analisis kritis sosiologis yang komprehensif terhadap kasus tersebut.
4. LEMBAR AKTIVITAS REFLEKTIF & ANALISIS HOTS (Higher Order Thinking Skills). Tuliskan instruksi aktivitas siswa, pertanyaan reflektif tingkat tinggi (analisis, evaluasi, dan kreasi) untuk mengukur pemahaman konsep siswa secara mandiri.

Seluruh materi harus ditulis dalam Bahasa Indonesia yang formal, akademis, mengalir secara teoretis, dan diformat menggunakan Markdown yang sangat rapi dan tertata.`;

    const userPrompt = `Buatlah Modul Ajar Pembelajaran yang sangat lengkap, rinci, dan mendalam untuk unit berikut:
Mata Pelajaran: ${mataPelajaran || "Sosiologi"}
Topik / Elemen Materi: ${kisi.elemenMateri}
Sub-elemen / Sub-materi: ${kisi.subElemenMateri}
Target Kompetensi Siswa: ${kisi.kompetensi}
Level Kognitif: ${kisi.levelKognitif === 'level_1' ? 'Pemahaman & Pengetahuan (Knowing - C1/C2)' : kisi.levelKognitif === 'level_2' ? 'Penerapan/Aplikasi (Applying - C3)' : 'Penalaran/Analisis Tinggi (Reasoning/HOTS - C4/C5/C6)'}
Batasan & Catatan Kurikulum: ${kisi.batasanCatatan || "Tidak ada batasan khusus"}

${guidanceText ? `INTEGRASIKAN SECARA SEAMLESS PANDUAN RESMI KURIKULUM BERIKUT:
"${guidanceText}"` : ""}

Ingat, buat modul ini SANGAT DETAIL dan kaya teks penjelasan ilmiah agar layak dijadikan pegangan belajar utama siswa maupun panduan mengajar guru. Sajikan langsung dalam format Markdown lengkap tanpa teks pengantar lainnya.`;

    const response = await generateContentWithFallbackAndRetry(ai, {
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const materi = response.text || "";
    res.json({ materi });
  } catch (error: any) {
    console.error("Error generating materi:", error);
    res.status(500).json({ error: error.message || "Gagal membuat materi pembelajaran" });
  }
});

// Mount the API Router on both /api and / to handle Vercel routing variations seamlessly
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handling Middleware to guarantee JSON response format on failure
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
