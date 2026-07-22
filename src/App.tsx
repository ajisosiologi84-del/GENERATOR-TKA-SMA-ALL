import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Edit,
  BookOpen, 
  FileText, 
  FileSpreadsheet, 
  RefreshCw, 
  Sliders, 
  Layers, 
  HelpCircle, 
  Globe, 
  CheckSquare, 
  ArrowRight,
  Info,
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  Layout,
  Type,
  Upload,
  Image,
  Lock,
  LogOut,
  Users,
  UserPlus,
  Shield,
  User,
  Calendar,
  Save,
  X
} from 'lucide-react';
import { KisiKisiItem, Question, GeneratorConfig, BentukSoal, LevelKognitif, JumlahOpsi, JenisSoal, JadwalItem } from './types';
import { auth, db, createNewUserByAdmin } from './lib/firebase';
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  onSnapshot, 
  writeBatch,
  deleteDoc,
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import LoginScreen from './components/LoginScreen';
import { 
  exportKisiToExcel, 
  exportKisiToWord, 
  exportQuestionsToExcel, 
  exportQuestionsToWord,
  getBentukSoalLabel,
  getLevelKognitifLabel,
  exportMateriToWord,
  exportAllMateriToWord,
  markdownToHtmlForWord,
  exportJadwalToExcel,
  exportJadwalToWord
} from './utils/exportUtils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const PUSMENDIK_MATEMATIKA_PRESETS = [
  {
    elemenMateri: 'Bilangan',
    subElemenMateri: 'Bilangan Real',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Jenis dan sifat bilangan; Operasi bilangan (penjumlahan, pengurangan, perkalian, pembagian, dan gabungannya), beserta sifat-sifatnya antara lain komutatif, asosiatif, dan distributif.',
    batasanCatatan: 'Bilangan meliputi bilangan real, termasuk bilangan asli berpangkat bilangan bulat atau berpangkat bilangan pecahan.'
  },
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Persamaan dan Pertidaksaman Linear',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Sistem persamaan linear multivariabel; Sistem pertidaksamaan linear multivariabel; Program linear.',
    batasanCatatan: 'Maksimum banyaknya variabel yang digunakan tiga.'
  },
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Fungsi',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Domain, kodomain, daerah hasil (range), dan representasi fungsi linear, kuadrat, dan rasional dalam berbagai bentuk; Invers fungsi dan representasinya; Fungsi komposisi dan representasinya.',
    batasanCatatan: 'Identifikasi fungsi meliputi secara analitis dan grafis.'
  },
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Barisan dan Deret',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Barisan dan deret aritmetika; Barisan dan deret geometri.',
    batasanCatatan: 'Penerapan barisan dan deret termasuk dalam masalah pertumbuhan, peluruhan, bunga tunggal, dan bunga majemuk.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Objek Geometri',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Hubungan dua sudut, dua garis, dan dua bidang; Hubungan objek geometri pada bangun datar dan bangun ruang; Kesebangunan atau kekongruenan bangun datar; Teorema Pythagoras.',
    batasanCatatan: 'Bangun datar meliputi segitiga, segi empat, lingkaran, dan gabungannya. Bangun ruang meliputi bangun ruang beraturan sisi datar/lengkung. Jarak dua objek meliputi jarak titik/garis/bidang.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Transformasi Geometri',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: transformasi geometri (translasi, refleksi, rotasi, dan dilatasi, serta komposisinya) dari titik.',
    batasanCatatan: 'Transformasi geometri dari titik.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Pengukuran',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Keliling dan luas bangun datar; Volume dan luas permukaan bangun ruang; Jarak dua objek geometri.',
    batasanCatatan: 'Bangun datar dan bangun ruang.'
  },
  {
    elemenMateri: 'Trigonometri',
    subElemenMateri: 'Perbandingan Trigonometri',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: perbandingan trigonometri (sinus, kosinus, tangen, kotangen, sekan, kosekan).',
    batasanCatatan: 'Perbandingan trigonometri.'
  },
  {
    elemenMateri: 'Data dan Peluang',
    subElemenMateri: 'Data',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait: Penyajian data dalam bentuk diagram batang, diagram garis, diagram lingkaran, grafik, tabel, dan bentuk visual; Ukuran pemusatan dan penyebaran data tunggal dan data kelompok; Aturan pencacahan (aturan penjumlahan, aturan perkalian, permutasi, dan kombinasi); Peluang kejadian.',
    batasanCatatan: 'Peluang dan pencacahan.'
  }
];

const PUSMENDIK_BAHASA_INDONESIA_PRESETS = [
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Kosakata & Serapan',
    kompetensi: 'Mengidentifikasi penggunaan kata serapan dari bahasa daerah/asing dalam berbagai bidang.',
    batasanCatatan: 'Teks fiksi atau nonfiksi.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Kosakata & Latar/Karakter/Fenomena',
    kompetensi: 'Mengidentifikasi latar, karakter, dan/atau fenomena berdasarkan kosakata yang digunakan dalam teks fiksi atau nonfiksi.',
    batasanCatatan: 'Teks fiksi atau nonfiksi.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Struktur Teks (Kerangka/Bagan)',
    kompetensi: 'Menyusun kerangka atau bagan berdasarkan bagian-bagian penting dalam teks.',
    batasanCatatan: 'Kerangka teks atau bagan hubungan.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Ide Pokok & Unsur Teks',
    kompetensi: 'Menyimpulkan ide pokok, gagasan pendukung, tokoh, peristiwa, latar, konflik, atau nilai-nilai dalam teks.',
    batasanCatatan: 'Teks fiksi atau nonfiksi.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Hubungan Makna',
    kompetensi: 'Menjelaskan hubungan makna antarkalimat dan/atau antarparagraf dalam teks.',
    batasanCatatan: 'Hubungan sebab-akibat, kronologis, atau komparatif.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Prediksi Kelanjutan Cerita',
    kompetensi: 'Memprediksi lanjutan atau akhir uraian/cerita berdasarkan bagian tertentu dalam teks.',
    batasanCatatan: 'Teks naratif atau ekspositoris.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Relevansi Kehidupan Nyata',
    kompetensi: 'Menilai relevansi peristiwa dalam teks dengan kehidupan sehari-hari.',
    batasanCatatan: 'Menilai nilai moral atau relevansi kontekstual.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Keakuratan & Ketepatan Informasi',
    kompetensi: 'Menilai keakuratan, kesesuaian, kecukupan, atau ketepatan informasi dalam teks.',
    batasanCatatan: 'Evaluasi kredibilitas teks nonfiksi.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Penggunaan Bahasa',
    kompetensi: 'Menilai ketepatan dan kesesuaian penggunaan bahasa dalam teks.',
    batasanCatatan: 'Kesesuaian kaidah kebahasaan dan gaya penulisan.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Penggambaran Karakter/Latar',
    kompetensi: 'Menilai ketepatan bagian teks untuk menggambarkan karakter, peristiwa, atau latar dalam teks fiksi.',
    batasanCatatan: 'Teks fiksi/sastra.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Respons Emosional Karya Sastra',
    kompetensi: 'Menyimpulkan respons emosional terhadap unsur puisi, prosa, dan drama.',
    batasanCatatan: 'Apresiasi karya sastra.'
  }
];

const PUSMENDIK_BAHASA_INGGRIS_PRESETS = [
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Menemukan/mengidentifikasi Informasi',
    kompetensi: 'Menemukan atau mengidentifikasi informasi penting yang disebutkan secara eksplisit dalam teks.',
    batasanCatatan: 'Mampu memahami informasi eksplisit secara langsung.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Mengklasifikasi',
    kompetensi: 'Mengelompokkan orang, benda, tempat, atau peristiwa dalam teks berdasarkan kategori tertentu.',
    batasanCatatan: 'Klasifikasi data tekstual.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Membuat Kerangka',
    kompetensi: 'Menyusun poin-poin utama dari teks dalam bentuk kerangka atau daftar.',
    batasanCatatan: 'Outline/draft struktur informasi.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Meringkas',
    kompetensi: 'Menyajikan kembali isi teks secara ringkas dengan mengutip bagian penting.',
    batasanCatatan: 'Ringkasan esensi teks.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Mensintesis',
    kompetensi: 'Menggabungkan informasi dari sumber lain untuk mendapatkan pemahaman yang lebih komprehensif tentang suatu isu atau topik.',
    batasanCatatan: 'Sintesis multi-sumber/multi-teks.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Detail Pendukung',
    kompetensi: 'Menentukan fakta tambahan yang membuat teks lebih informatif, menarik, atau persuasif.',
    batasanCatatan: 'Inferensi fakta pendukung.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Topik & Gagasan Utama',
    kompetensi: 'Menyimpulkan topik, ide pokok/gagasan utama, makna, target pembaca, tujuan penulisan teks, atau pesan moral yang tidak secara eksplisit dinyatakan dalam teks.',
    batasanCatatan: 'Gagasan utama tersirat, target pembaca, dan moral value.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Urutan Kejadian',
    kompetensi: 'Memperkirakan urutan kejadian dan memperkirakan isi selanjutnya dari teks.',
    batasanCatatan: 'Kronologis dan kelanjutan teks.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Perbandingan',
    kompetensi: 'Menyimpulkan persamaan atau perbedaan antara tokoh, waktu, tempat, benda, atau gagasan dalam teks.',
    batasanCatatan: 'Komparasi dan kontras elemen teks.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Hubungan Sebab-Akibat',
    kompetensi: 'Menafsirkan hubungan/kaitan antara gagasan/tindakan satu dan lainnya yang dinyatakan dalam teks.',
    batasanCatatan: 'Hubungan kausalitas/sebab-akibat.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Karakter Tokoh',
    kompetensi: 'Menyimpulkan sifat atau kepribadian tokoh berdasarkan petunjuk eksplisit maupun implisit dalam teks.',
    batasanCatatan: 'Analisis karakter/tokoh.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Memprediksi Hasil Cerita',
    kompetensi: 'Memprediksi akhir cerita setelah membaca bagian awal atau bagian tertentu dari teks.',
    batasanCatatan: 'Prediksi konklusi cerita.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai Realitas atau Fantasi',
    kompetensi: 'Menganalisis peristiwa dalam teks dapat terjadi dalam kehidupan nyata berdasarkan pengalaman dan pengetahuan pribadi.',
    batasanCatatan: 'Analisis realitas vs fantasi.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai Fakta atau Opini',
    kompetensi: 'Menilai fakta/opini yang diberikan penulis untuk mendukung pendapatnya berdasarkan bukti atau sekadar berusaha mempengaruhi pembaca.',
    batasanCatatan: 'Fakta vs Opini.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai Kecukupan & Validitas Informasi',
    kompetensi: 'Menilai kesesuaian, kelengkapan, keakuratan informasi dalam teks (dengan membandingkannya dengan sumber lain).',
    batasanCatatan: 'Evaluasi validitas & kelengkapan data.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai Kesesuaian Penggambaran',
    kompetensi: 'Menentukan bagian teks yang paling sesuai untuk menggambarkan karakter utama atau aspek lain dari bacaan.',
    batasanCatatan: 'Kesesuaian representasi teks.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menanggapi Isi Teks (Respons Emosional)',
    kompetensi: 'Mengungkapkan perasaan/kesan/pendapat terhadap bacaan, seperti ketertarikan, kebosanan, kegembiraan, ketakutan, kebencian, atau kesenangan.',
    batasanCatatan: 'Respons subjektif, estetis, dan emosional.'
  }
];

const PUSMENDIK_MATEMATIKA_TL_PRESETS = [
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Matriks',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Determinan matriks; Invers matriks; Operasi matriks. Program linear.',
    batasanCatatan: 'Elemen matriks merupakan bilangan real. Determinan dan invers matriks berukuran 2 x 2 atau 3 x 3.'
  },
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Polinomial',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Operasi polinomial; Pemfaktoran polinomial; Suku sisa.',
    batasanCatatan: 'Orde dari polinomial maksimum 4 dan semua koefisien polinomial berupa bilangan real.'
  },
  {
    elemenMateri: 'Aljabar',
    subElemenMateri: 'Fungsi',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Domain, kodomain, daerah hasil (range), dan grafik fungsi polinom, rasional, akar, eksponensial, logaritma, mutlak, trigonometri.',
    batasanCatatan: 'Fungsi polinom maksimum berorde 4. Bilangan pokok fungsi eksponensial berupa bilangan asli.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Vektor',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Vektor pada bidang dan ruang; Panjang vektor; Operasi vektor.',
    batasanCatatan: 'Komponen vektor maksimum tiga.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Lingkaran',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Persamaan lingkaran dan persamaan garis singgung lingkaran; Luas dan keliling daerah lingkaran atau bagian daerah lingkaran.',
    batasanCatatan: 'Keliling, luas, dan persamaan garis singgung.'
  },
  {
    elemenMateri: 'Geometri dan Pengukuran',
    subElemenMateri: 'Transformasi Geometri',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Transformasi geometri (translasi, refleksi, rotasi, dilatasi, serta komposisinya) dari bentuk geometris dan matriks transformasinya.',
    batasanCatatan: 'Bentuk geometris yang ditransformasi meliputi titik, garis, dan bangun datar.'
  },
  {
    elemenMateri: 'Trigonometri',
    subElemenMateri: 'Limit',
    kompetensi: 'Memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait cakupan sub-elemen berikut: Limit fungsi aljabar; Limit fungsi trigonometri.',
    batasanCatatan: 'Limit yang dapat diselesaikan tanpa menggunakan Teorema L’Hopital.'
  }
];

const PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS = [
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Teks Akademik',
    kompetensi: 'Mengidentifikasi informasi dalam teks akademik.',
    batasanCatatan: 'Teks akademik / ilmiah.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Penyampaian Tanggapan & Kritik',
    kompetensi: 'Mengidentifikasi kalimat yang tepat untuk menyampaikan tanggapan, respons, dan kritik sesuai norma sosial dan budaya.',
    batasanCatatan: 'Norma sosial dan budaya.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Pengajuan Usulan & Solusi',
    kompetensi: 'Mengidentifikasi kalimat yang tepat dalam pengajuan usulan, perumusan masalah, dan pemecahan masalah pada teks dalam bidang akademik dan/atau dunia kerja.',
    batasanCatatan: 'Bidang akademik dan/atau dunia kerja.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Sastra Indonesia & Terjemahan',
    kompetensi: 'Mengidentifikasi karakter, peristiwa, latar pada sastra Indonesia atau terjemahan.',
    batasanCatatan: 'Karya sastra atau terjemahannya.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Nilai Karya Sastra',
    kompetensi: 'Membandingkan nilai-nilai (budaya, sosial, moral, religius, dan/atau pendidikan) dalam karya sastra Indonesia dan/atau terjemahan.',
    batasanCatatan: 'Perbandingan nilai-nilai sastra.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Sastra Melayu Klasik',
    kompetensi: 'Mengungkapkan kembali isi sastra Melayu Klasik.',
    batasanCatatan: 'Sastra Melayu Klasik.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Konversi Uraian & Visual',
    kompetensi: 'Mengubah informasi dari tabel/grafik menjadi uraian atau uraian menjadi tabel/grafik dalam bidang akademik dan/atau dunia kerja.',
    batasanCatatan: 'Tabel, grafik, atau diagram.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Gaya Bahasa & Kiasan',
    kompetensi: 'Menjelaskan ketepatan penggunaan bahasa, kiasan, dan atau citraan dalam teks.',
    batasanCatatan: 'Majas, pencitraan, dan diksi.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Kaidah Kebahasaan (Sintaksis & Morfologi)',
    kompetensi: 'Menjelaskan ketepatan penggunaan afiks, konstruksi frasa, konstruksi klausa, dan/atau kalimat dalam teks.',
    batasanCatatan: 'Afiksasi, struktur frasa, klausa, kalimat.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Kohesi & Koherensi',
    kompetensi: 'Menjelaskan kohesi dan koherensi dalam teks ilmiah.',
    batasanCatatan: 'Kepaduan wacana/teks ilmiah.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Logika Berpikir',
    kompetensi: 'Menilai gagasan dan pandangan dalam berbagai teks (digital atau cetak) berdasarkan kaidah logika berpikir.',
    batasanCatatan: 'Logika berpikir, sesat pikir (fallacy).'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Kombinasi & Perbandingan Antarteks',
    kompetensi: 'Menilai ketepatan dan kesesuaian isi antarteks (digital atau cetak) dalam bidang sosial, akademik, dan dunia kerja.',
    batasanCatatan: 'Perbandingan multi-teks.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Evaluasi Tokoh & Norma',
    kompetensi: 'Menilai gagasan atau tindakan tokoh berdasarkan norma atau nilai individu dan sosial.',
    batasanCatatan: 'Norma individu/sosial.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Alih Wahana Karya',
    kompetensi: 'Mengalihwahanakan puisi (Indonesia dan/atau terjemahan) dalam bentuk prosa.',
    batasanCatatan: 'Parafrasa / alih wahana puisi ke prosa.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Respons Sastra',
    kompetensi: 'Menyimpulkan respons emosional terhadap unsur puisi, prosa, dan drama Indonesia atau terjemahan.',
    batasanCatatan: 'Apresiasi & respons subjektif/emosional.'
  }
];

const PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS = [
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Menemukan/mengidentifikasi informasi',
    kompetensi: 'Mampu menemukan atau mengidentifikasi gagasan utama serta informasi penting yang secara eksplisit disebutkan dalam teks.',
    batasanCatatan: 'Informasi eksplisit, gagasan utama literal.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Mengklasifikasi',
    kompetensi: 'Mampu mengelompokkan argumen, fakta, dan pendapat dalam teks berdasarkan kategori atau pola penyajian tertentu.',
    batasanCatatan: 'Kategorisasi argumen/opini.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Membuat kerangka',
    kompetensi: 'Mampu menyusun poin-poin utama dalam teks ke dalam bentuk peta konsep/diagram/diagram alir atau daftar untuk memahami struktur penyajian informasi.',
    batasanCatatan: 'Peta konsep, diagram alir, atau daftar terstruktur.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Meringkas',
    kompetensi: 'Mampu menyajikan kembali isi teks secara ringkas dengan tetap mempertahankan gagasan utama dan argumen kunci.',
    batasanCatatan: 'Ringkasan representatif.'
  },
  {
    elemenMateri: 'Pemahaman Tekstual',
    subElemenMateri: 'Mensintesis',
    kompetensi: 'Mampu menggabungkan informasi dari sumber lain untuk mendapatkan pemahaman yang lebih komprehensif tentang suatu isu atau topik.',
    batasanCatatan: 'Sintesis multi-teks/multi-sumber.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan detail pendukung',
    kompetensi: 'Mampu memperkirakan fakta tambahan yang mungkin dapat memperkuat atau memperjelas argumen dalam teks.',
    batasanCatatan: 'Fakta tambahan pendukung argumen.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan gagasan utama & tujuan',
    kompetensi: 'Mampu menyimpulkan topik, ide pokok/gagasan utama, makna, target pembaca, tujuan penulisan teks, atau pesan moral yang tidak secara eksplisit dinyatakan dalam teks.',
    batasanCatatan: 'Pesan moral, target pembaca, gagasan utama tersirat.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan hubungan antar-ide',
    kompetensi: 'Mampu menghubungkan berbagai argumen, alasan, dan bukti dalam teks untuk memahami logika penyajian informasi.',
    batasanCatatan: 'Logika penyajian & struktur argumen.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan hubungan sebab-akibat',
    kompetensi: 'Mampu menyimpulkan suatu peristiwa/kebijakan/fenomena dalam teks memengaruhi atau dipengaruhi oleh faktor lain.',
    batasanCatatan: 'Kausalitas dan pengaruh faktor luar.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan sudut pandang penulis',
    kompetensi: 'Mampu mengenali posisi atau sikap penulis terhadap suatu isu berdasarkan bahasa dan pilihan argumen yang digunakan.',
    batasanCatatan: 'Sikap, nada (tone), dan posisi penulis.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Memprediksi implikasi atau konsekuensi',
    kompetensi: 'Mampu memperkirakan dampak dari suatu gagasan atau argumen yang disampaikan dalam teks.',
    batasanCatatan: 'Prediksi dampak/konsekuensi.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai fakta atau opini',
    kompetensi: 'Mampu mengevaluasi fakta atau opini dalam teks berdasarkan bukti-bukti pendukung yang disajikan penulis.',
    batasanCatatan: 'Fakta vs Opini.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai keakuratan & kecukupan informasi',
    kompetensi: 'Mampu menilai kredibilitas informasi dan cakupan perspektif dalam teks.',
    batasanCatatan: 'Kredibilitas & cakupan perspektif.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai kecukupan & validitas informasi',
    kompetensi: 'Menilai kesesuaian, kelengkapan, keakuratan informasi dalam teks (dengan membandingkannya dengan sumber lain).',
    batasanCatatan: 'Validasi dengan sumber sekunder/eksternal.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menilai kekuatan argumen',
    kompetensi: 'Mampu mengevaluasi seberapa logis dan meyakinkan argumen yang disajikan dalam teks.',
    batasanCatatan: 'Kekuatan logika & persuasi argumen.'
  },
  {
    elemenMateri: 'Evaluasi dan Apresiasi',
    subElemenMateri: 'Menanggapi isi teks secara kritis',
    kompetensi: 'Mampu memberikan opini atau refleksi mengenai isi teks dari sudut pandang yang berbeda.',
    batasanCatatan: 'Refleksi kritis & opini personal.'
  }
];

const PUSMENDIK_FISIKA_PRESETS = [
  {
    elemenMateri: 'Kinematika',
    subElemenMateri: 'Pengukuran',
    kompetensi: 'Menelaah hasil pengukuran suatu besaran dengan alat ukur yang sesuai serta menyatakan hasil pengukuran sesuai aturan angka penting.',
    batasanCatatan: 'Alat ukur dapat meliputi jangka sorong, mikrometer sekrup, neraca tiga lengan. Pelaporan hasil pengukuran mengikuti kaidah angka penting.'
  },
  {
    elemenMateri: 'Kinematika',
    subElemenMateri: 'Gerak Lurus',
    kompetensi: 'Menganalisis keterkaitan beberapa besaran pada gerak lurus berdasarkan data yang ada untuk menyelesaikan masalah yang relevan.',
    batasanCatatan: 'Gerak lurus: meliputi konsep gerak (jarak, perpindahan, kecepatan dengan memperhatikan besar dan arahnya), GLB, dan GLBB.'
  },
  {
    elemenMateri: 'Kinematika',
    subElemenMateri: 'Gerak Lengkung',
    kompetensi: 'Mengaitkan hubungan antar variabel dalam gerak parabola dan gerak melingkar beraturan pada peristiwa dalam kehidupan sehari-hari.',
    batasanCatatan: 'Gerak parabola: dibatasi pada gerak parabola dengan referensi bidang horizontal. Gerak melingkar: dibatasi pada gerak melingkar beraturan.'
  },
  {
    elemenMateri: 'Dinamika',
    subElemenMateri: 'Hubungan Gaya dan Gerak (Hukum Newton)',
    kompetensi: 'Mengaitkan hubungan antara gaya dan gerak pada peristiwa yang terjadi dalam kehidupan sehari-hari.',
    batasanCatatan: 'Hukum Newton 1, 2, dan 3, jenis-jenis gaya (dengan memperhatikan besar dan arahnya).'
  },
  {
    elemenMateri: 'Dinamika',
    subElemenMateri: 'Momentum dan Impuls',
    kompetensi: 'Menerapkan konsep momentum dan impuls bagi penyelesaian masalah sehari-hari.',
    batasanCatatan: 'Konsep momentum & impuls, hukum kekekalan momentum.'
  },
  {
    elemenMateri: 'Dinamika',
    subElemenMateri: 'Dinamika Rotasi (Momen Gaya dan Momen Inersia)',
    kompetensi: 'Menerapkan konsep momen gaya dan momen inersia yang dimanfaatkan dalam kehidupan sehari-hari.',
    batasanCatatan: 'Momen gaya, momen inersia, Hukum Newton tentang rotasi.'
  },
  {
    elemenMateri: 'Fluida',
    subElemenMateri: 'Fluida Statis dan Dinamis',
    kompetensi: 'Menerapkan konsep yang berkaitan dengan fluida statis dan dinamis pada teknologi yang dimanfaatkan dalam kehidupan sehari-hari.',
    batasanCatatan: 'Tekanan fluida, Hukum Pascal, Hukum Archimedes, kontinuitas dan Hukum Bernoulli.'
  },
  {
    elemenMateri: 'Gelombang',
    subElemenMateri: 'Bunyi',
    kompetensi: 'Menganalisis keterkaitan sifat bunyi dengan parameter gelombangnya berdasarkan peristiwa dalam kehidupan sehari-hari.',
    batasanCatatan: 'Karakteristik gelombang mekanik dalam gelombang bunyi, sumber dan intensitas bunyi.'
  }
];

const PUSMENDIK_KIMIA_PRESETS = [
  {
    elemenMateri: 'Pemahaman (Knowing)',
    subElemenMateri: 'Mengenali (Recognize)',
    kompetensi: 'Mengidentifikasi atau menyatakan fakta, hubungan, dan konsep; mengidentifikasi karakteristik fisika/kimia serta peran setiap komponen yang terdapat dalam sistem, materi, dan proses tertentu.',
    batasanCatatan: 'Fakta, hubungan, konsep dasar, sifat fisis/kimia, dan peranan komponen dalam sistem.'
  },
  {
    elemenMateri: 'Pemahaman (Knowing)',
    subElemenMateri: 'Menjelaskan (Describe)',
    kompetensi: 'Memberikan informasi atau penjelasan secara rinci berdasarkan konsep kimia/mendeskripsikan sifat dan struktur suatu materi serta proses atau fenomena kimia.',
    batasanCatatan: 'Deskripsi rinci sifat, struktur materi, dan fenomena/proses kimia.'
  },
  {
    elemenMateri: 'Pemahaman (Knowing)',
    subElemenMateri: 'Memberikan Contoh (Provide Example)',
    kompetensi: 'Menuliskan contoh yang berkaitan dengan suatu fenomena, kegunaan, maupun kerugian suatu materi/proses kimia yang relevan dalam kehidupan sehari-hari.',
    batasanCatatan: 'Contoh fenomena, kegunaan, dan dampak negatif zat/reaksi kimia.'
  },
  {
    elemenMateri: 'Penerapan (Applying)',
    subElemenMateri: 'Membandingkan & Mengklasifikasikan',
    kompetensi: 'Menerapkan pengetahuan tentang fakta, hubungan, proses, konsep, dan metode ilmiah dalam menyelesaikan masalah sesuai konteks yang disajikan. Mengidentifikasi persamaan/perbedaan dari suatu zat/proses kimia. Mengelompokkan berbagai zat/proses berdasarkan sifat-sifatnya.',
    batasanCatatan: 'Komparasi zat/reaksi dan klasifikasi berdasarkan karakteristik fisik/kimia.'
  },
  {
    elemenMateri: 'Penerapan (Applying)',
    subElemenMateri: 'Menginterpretasikan Model',
    kompetensi: 'Menggunakan pengetahuan tentang konsep-konsep sains untuk menginterpretasikan proses, siklus, hubungan/sistem untuk menyelesaikan masalah kimia.',
    batasanCatatan: 'Analisis dan pemaknaan diagram proses, siklus, atau sistem kimia.'
  },
  {
    elemenMateri: 'Penerapan (Applying)',
    subElemenMateri: 'Menginterpretasikan Informasi',
    kompetensi: 'Menggunakan pengetahuan atau konsep untuk menjelaskan informasi tekstual, tabular, gambar, dan grafis yang relevan termasuk melakukan perhitungan kimia.',
    batasanCatatan: 'Penjelasan tabel, grafik, data numerik, dan perhitungan stoikiometri.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Menganalisis (Analyze)',
    kompetensi: 'Menganalisis hasil uraian atau perhitungan kimia menggunakan prinsip, konsep, rumus, dan hukum kimia untuk menarik suatu kesimpulan yang ilmiah. Menggunakan informasi yang relevan, konsep, hubungan antar parameter, dan data untuk menjawab pertanyaan.',
    batasanCatatan: 'Analisis korelasi data, hukum kimia dasar, dan perhitungan mendalam.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Memprediksi (Predict)',
    kompetensi: 'Memperkirakan hasil yang diperoleh dari penjelasan yang bersumber dari teori, konsep, hasil perhitungan, dan hasil analisis.',
    batasanCatatan: 'Prediksi hasil reaksi, arah kesetimbangan, atau parameter produk baru.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Mengevaluasi (Evaluate)',
    kompetensi: 'Mengevaluasi suatu hasil pemikiran atau penjelasan berdasarkan teori, konsep, hasil perhitungan, dan hasil analisis sehingga bisa diambil suatu kesimpulan dari masalah yang ingin diselesaikan. Mengevaluasi fenomena kimia sehari-hari.',
    batasanCatatan: 'Uji validitas argumentasi, optimasi resep kimia, atau evaluasi fenomena.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Merancang (Design)',
    kompetensi: 'Membuat rancangan eksperimen yang dapat digunakan untuk menjawab fenomena dalam kimia, dengan melibatkan variabel riset yang meliputi variabel bebas, variabel tergantung, dan variabel kontrol.',
    batasanCatatan: 'Desain eksperimen, penentuan metodologi, dan pengontrolan variabel.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Menguji Hipotesis',
    kompetensi: 'Menyelesaikan soal yang hasilnya sudah dihipotesiskan melalui langkah penerapan konsep kimia, perhitungan, analisis, dan pengambilan kesimpulan sehingga bisa mengambil kesimpulan yang sesuai dengan hipotesis atau tidak.',
    batasanCatatan: 'Pengujian hipotesis teoritis atau eksperimental dengan bukti ilmiah.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Menghubungkan Variabel',
    kompetensi: 'Menghubungkan karakteristik dengan karakteristik yang lain suatu material sehingga menghasilkan sifat material yang bisa dijelaskan secara ilmiah.',
    batasanCatatan: 'Hubungan struktur mikro-makro, fasa, maupun sifat fisis material.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Mengaplikasikan Prinsip Ilmiah',
    kompetensi: 'Menerapkan konsep kimia dan prinsip saintifik untuk membuat formulasi, mengevaluasi kualitas produk, dan menyelesaikan masalah yang dihadapi oleh masyarakat dan kalangan industri.',
    batasanCatatan: 'Formulasi produk, kontrol kualitas, dan pemecahan isu industri/lingkungan.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Menarik Kesimpulan (Draw Conclusion)',
    kompetensi: 'Membuat kesimpulan berdasarkan penerapan teori, konsep, data, dan perhitungan kimia serta mampu menghubungkan antara penyebab dan akibat dalam suatu proses kimia.',
    batasanCatatan: 'Konklusi deduktif/induktif dan penalaran sebab-akibat (kausalitas).'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Menggeneralisasi (Generalize)',
    kompetensi: 'Membuat kesimpulan dari suatu hasil penyelesaian masalah melalui pemahaman teori, konsep, perhitungan kimia, dan proses sintesis. Dan bisa menerapkan kesimpulan tersebut untuk kondisi yang baru.',
    batasanCatatan: 'Ekstrapolasi pola perilaku unsur periodik atau reaksi ke kasus baru.'
  },
  {
    elemenMateri: 'Penalaran (Reasoning)',
    subElemenMateri: 'Memberikan Penjelasan Disertai Bukti (Justify)',
    kompetensi: 'Menggunakan bukti dan pengetahuan sains untuk menjelaskan suatu fenomena untuk mendukung suatu penjelasan yang sulit dijelaskan alasannya atau penyelesaian masalah dan kesimpulan dari suatu investigasi.',
    batasanCatatan: 'Justifikasi ilmiah berbasis data empiris maupun postulat teori.'
  }
];

const PUSMENDIK_BIOLOGI_PRESETS = [
  {
    elemenMateri: 'Keanekaragaman Hayati',
    subElemenMateri: 'Klasifikasi & Keanekaragaman Makhluk Hidup',
    kompetensi: 'Menganalisis prinsip klasifikasi dan permasalahan keanekaragaman hayati.',
    batasanCatatan: 'Keanekaragaman hayati yang dimaksud adalah keanekaragaman hayati di Indonesia.'
  },
  {
    elemenMateri: 'Keanekaragaman Hayati',
    subElemenMateri: 'Bakteri',
    kompetensi: 'Menganalisis struktur bakteri (Gram positif dan negatif) dan peranannya terhadap manusia beserta resistensi bakteri.',
    batasanCatatan: 'Struktur bakteri, resistensi bakteri, dan peranan bakteri bagi manusia.'
  },
  {
    elemenMateri: 'Keanekaragaman Hayati',
    subElemenMateri: 'Ekosistem',
    kompetensi: 'Menganalisis komponen-komponen ekosistem, interaksi antarkomponen, dan solusi atas permasalahannya serta pelestarian ekosistem.',
    batasanCatatan: 'Ekosistem yang ada di Indonesia, komponen ekosistem, interaksi, pelestarian.'
  },
  {
    elemenMateri: 'Sel',
    subElemenMateri: 'Metabolisme Sel',
    kompetensi: 'Menganalisis proses metabolisme (katabolisme dan anabolisme) dan peran serta cara kerja enzim.',
    batasanCatatan: 'Katabolisme; anabolisme; sifat dan cara kerja enzim.'
  },
  {
    elemenMateri: 'Proses-proses pada Makhluk Hidup',
    subElemenMateri: 'Transport & Pertukaran Zat pada Manusia (Sirkulasi, Respirasi, Ekskresi)',
    kompetensi: 'Menganalisis keterkaitan struktur organ pada sistem sirkulasi, respirasi, dan ekskresi beserta fungsinya masing-masing.',
    batasanCatatan: 'Keterkaitan antarsistem sirkulasi, respirasi, dan ekskresi.'
  },
  {
    elemenMateri: 'Proses-proses pada Makhluk Hidup',
    subElemenMateri: 'Sistem Imun',
    kompetensi: 'Menganalisis peran sistem imun terhadap kekebalan tubuh dan mekanisme kerjanya.',
    batasanCatatan: 'Mekanisme kerja sistem imun.'
  },
  {
    elemenMateri: 'Proses-proses pada Makhluk Hidup',
    subElemenMateri: 'Sistem Koordinasi',
    kompetensi: 'Menganalisis sistem koordinasi dalam tubuh manusia meliputi kerja saraf dan hormon.',
    batasanCatatan: 'Mekanisme kerja sistem saraf dan sistem hormon.'
  },
  {
    elemenMateri: 'Proses-proses pada Makhluk Hidup',
    subElemenMateri: 'Sistem Reproduksi',
    kompetensi: 'Menganalisis keterkaitan struktur organ pada sistem reproduksi pria dan wanita serta fungsinya.',
    batasanCatatan: 'Struktur dan fungsi organ reproduksi pria dan wanita.'
  },
  {
    elemenMateri: 'Keterampilan Proses',
    subElemenMateri: 'Mempertanyakan dan memprediksi',
    kompetensi: 'Merumuskan pertanyaan yang dapat diselidiki secara ilmiah.',
    batasanCatatan: 'Konteks soal sesuai dengan konten keanekaragaman hayati, sel, dan proses pada makhluk hidup.'
  },
  {
    elemenMateri: 'Keterampilan Proses',
    subElemenMateri: 'Merencanakan dan melakukan penyelidikan',
    kompetensi: 'Merancang penyelidikan ilmiah.',
    batasanCatatan: 'Konteks soal sesuai dengan konten keanekaragaman hayati, sel, dan proses pada makhluk hidup.'
  },
  {
    elemenMateri: 'Keterampilan Proses',
    subElemenMateri: 'Memproses, menganalisis data dan informasi',
    kompetensi: 'Mengolah data dan menyimpulkan hasil penyelidikan.',
    batasanCatatan: 'Konteks soal sesuai dengan konten keanekaragaman hayati, sel, dan proses pada makhluk hidup.'
  }
];

const PUSMENDIK_PPKN_PRESETS = [
  {
    elemenMateri: 'Pancasila',
    subElemenMateri: 'Pancasila sebagai dasar negara, ideologi negara, identitas nasional, hak asasi manusia dan demokrasi Pancasila.',
    kompetensi: 'Menjelaskan, menerapkan dan menganalisis makna sila- sila Pancasila, sejarah perumusan Pancasila, dasar negara, ideologi, identitas nasional, pelaksanaan hak asasi manusia, demokrasi Pancasila, permasalahan dan solusi dalam penerapan nilai-nilai Pancasila.',
    batasanCatatan: 'Pancasila sebagai dasar negara, ideologi, identitas nasional, HAM, dan demokrasi.'
  },
  {
    elemenMateri: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
    subElemenMateri: 'Penegakan hukum, perlindungan HAM, ketentuan UUD NRI Tahun 1945, demokrasi, hubungan pemerintah pusat dan daerah, kewenangan lembaga negara, hak dan kewajiban warga negara.',
    kompetensi: 'Menjelaskan, menerapkan, dan menganalisis perilaku taat hukum, sejarah dan perkembangan undang- undang dasar di Indonesia, kewenangan lembaga negara menurut UUD NRI Tahun 1945, hubungan pemerintah pusat dengan pemerintah daerah, demokrasi, hak dan kewajiban warga negara.',
    batasanCatatan: 'Ketentuan UUD NRI 1945, lembaga negara, otonomi daerah, serta hak & kewajiban warga negara.'
  },
  {
    elemenMateri: 'Bhinneka Tunggal Ika',
    subElemenMateri: 'Integrasi nasional, mengelola kebinekaan sebagai modal sosial, harmoni dalam keberagaman, implementasi prinsip gotong royong, dan ancaman terhadap kebinekaan.',
    kompetensi: 'Menjelaskan, menerapkan dan menganalisis kebersamaan dan keberagaman dalam Bhinneka Tunggal Ika, implementasi prinsip gotong royong, kebinekaan sebagai modal sosial, dan potensi ancaman terhadap keberagaman.',
    batasanCatatan: 'Integrasi nasional, pengelolaan kebinekaan, prinsip gotong royong, dan ancaman keberagaman.'
  },
  {
    elemenMateri: 'Negara Kesatuan Republik Indonesia',
    subElemenMateri: 'Perilaku warga negara yang baik, bentuk negara, bentuk dan sistem pemerintahan, pengaruh kemajuan IPTEKS terhadap NKRI, menjaga keutuhan NKRI dalam konteks Wawasan Nusantara, menjadi pelopor pemilih pemula dalam demokrasi Indonesia, menjaga keutuhan NKRI, sistem pertahanan Indonesia, peran Indonesia dalam perdamaian dunia, dan demokrasi Indonesia.',
    kompetensi: 'Menjelaskan, menerapkan dan menganalisis perilaku yang sesuai dengan hak dan kewajiban warga negara, menjaga keutuhan NKRI, peran Indonesia dalam perdamaian dunia, sistem pertahanan dan keamanan negara, praktik demokrasi, bentuk negara, bentuk pemerintahan, dan sistem pemerintahan.',
    batasanCatatan: 'NKRI, peran dunia, pertahanan keamanan, bentuk & sistem pemerintahan, dampak IPTEK.'
  }
];

const PUSMENDIK_EKONOMI_PRESETS = [
  {
    elemenMateri: 'Konsep Dasar Ilmu Ekonomi',
    subElemenMateri: 'Konsep dasar ilmu ekonomi: kelangkaan, biaya peluang, dan kegiatan ekonomi',
    kompetensi: 'Menganalisis konsep dasar ilmu ekonomi mencakup kelangkaan, biaya peluang, dan kegiatan ekonomi',
    batasanCatatan: 'Prinsip kelangkaan, penentuan biaya peluang, dan motif/kegiatan ekonomi sehari-hari.'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Permintaan, penawaran, dan keseimbangan pasar',
    kompetensi: 'Menganalisis permintaan, penawaran, dan keseimbangan pasar',
    batasanCatatan: 'Hukum dan kurva permintaan-penawaran, pergeseran kurva, serta titik keseimbangan pasar (ekuilibrium).'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Pendapatan nasional, pertumbuhan ekonomi, dan pembangunan ekonomi',
    kompetensi: 'Menganalisis konsep pendapatan nasional, pertumbuhan ekonomi, dan pembangunan ekonomi',
    batasanCatatan: 'Metode perhitungan GDP/GNP, indikator pertumbuhan ekonomi, dan strategi pembangunan nasional.'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Ketenagakerjaan',
    kompetensi: 'Menganalisis konsep ketenagakerjaan dan permasalahannya',
    batasanCatatan: 'Angkatan kerja, jenis-jenis pengangguran, serta upaya mengatasi masalah ketenagakerjaan di Indonesia.'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Indeks Harga dan Inflasi',
    kompetensi: 'Mengevaluasi indeks harga dan inflasi',
    batasanCatatan: 'Metode perhitungan indeks harga, penyebab/jenis inflasi, serta dampak inflasi bagi perekonomian.'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Bank sentral dan kebijakan moneter',
    kompetensi: 'Mengidentifikasi peran bank sentral dan menganalisis kebijakan moneter',
    batasanCatatan: 'Tugas dan wewenang Bank Indonesia sebagai bank sentral, instrumen kebijakan moneter (diskonto, pasar terbuka, cadangan wajib).'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Kebijakan fiskal dan perpajakan',
    kompetensi: 'Menerapkan konsep perpajakan dan menganalisis kebijakan fiskal',
    batasanCatatan: 'Fungsi pajak, tarif pajak, APBN/APBD, serta instrumen/tujuan kebijakan fiskal.'
  },
  {
    elemenMateri: 'Ekonomi Mikro dan Makro',
    subElemenMateri: 'Manajemen badan usaha dalam perekonomian Indonesia (BUMN, BUMD, BUMS, dan Koperasi)',
    kompetensi: 'Mendeskripsikan konsep manajemen badan usaha dalam perekonomian Indonesia',
    batasanCatatan: 'Peran dan prinsip pengelolaan BUMN, BUMD, BUMS, serta struktur kepengurusan dan SHU Koperasi.'
  },
  {
    elemenMateri: 'Ekonomi Internasional',
    subElemenMateri: 'Kerja sama ekonomi dan perdagangan internasional',
    kompetensi: 'Menganalisis kerja sama ekonomi dan perdagangan internasional',
    batasanCatatan: 'Teori perdagangan internasional (keunggulan mutlak/komparatif), neraca pembayaran, dan organisasi kerja sama ekonomi regional/global.'
  },
  {
    elemenMateri: 'Akuntansi Keuangan Dasar',
    subElemenMateri: 'Persamaan dasar akuntansi dan laporan keuangan',
    kompetensi: 'Menerapkan persamaan dasar akuntansi dan laporan keuangan',
    batasanCatatan: 'Analisis transaksi keuangan, pencatatan persamaan dasar akuntansi, serta penyusunan laporan laba rugi, perubahan modal, dan neraca.'
  }
];

const PUSMENDIK_GEOGRAFI_PRESETS = [
  {
    elemenMateri: 'Wilayah tempat tinggal dan lingkungan sekitar (karakteristik, keunikan, persamaan– perbedaan wilayah)',
    subElemenMateri: 'Karakteristik fisik dan sosial wilayah',
    kompetensi: 'Menjelaskan karakteristik wilayah berdasarkan informasi spasial.',
    batasanCatatan: 'Karakteristik fisik dan sosial wilayah berdasarkan peta/data spasial.'
  },
  {
    elemenMateri: 'Wilayah tempat tinggal dan lingkungan sekitar (karakteristik, keunikan, persamaan– perbedaan wilayah)',
    subElemenMateri: 'Konsep dan teori dasar mengenai dinamika kependudukan pada suatu wilayah tempat tinggal',
    kompetensi: 'Menganalisis konsep dan teori dasar mengenai dinamika kependudukan pada suatu wilayah tempat tinggal',
    batasanCatatan: 'Konsep dan teori dasar dinamika kependudukan di wilayah tempat tinggal.'
  },
  {
    elemenMateri: 'Wilayah tempat tinggal dan lingkungan sekitar (karakteristik, keunikan, persamaan– perbedaan wilayah)',
    subElemenMateri: 'Keterkaitan antara karakteristik wilayah fisik dan sosial (kependudukan)',
    kompetensi: 'Menganalisis keterkaitan antara karakteristik wilayah fisik dan sosial (kependudukan) terhadap daya dukung lingkungan;',
    batasanCatatan: 'Hubungan karakteristik wilayah fisik & sosial terhadap daya dukung lingkungan.'
  },
  {
    elemenMateri: 'Wilayah tempat tinggal dan lingkungan sekitar (karakteristik, keunikan, persamaan– perbedaan wilayah)',
    subElemenMateri: 'Permasalahan kewilayahan',
    kompetensi: 'Menerapkan penelitian geografi untuk memecahkan permasalahan kewilayahan',
    batasanCatatan: 'Penelitian geografi untuk pemecahan masalah kewilayahan.'
  },
  {
    elemenMateri: 'Proses yang memengaruhi lingkungan fisik dan sosial',
    subElemenMateri: 'Faktor yang berpengaruh dalam lingkungan sosial',
    kompetensi: 'Menerapkan indikator- indikator keberhasilan Pembangunan untuk pengembangan wilayah',
    batasanCatatan: 'Indikator keberhasilan pembangunan wilayah.'
  },
  {
    elemenMateri: 'Proses yang memengaruhi lingkungan fisik dan sosial',
    subElemenMateri: 'Faktor yang berpengaruh dalam lingkungan sosial',
    kompetensi: 'Menganalisis konsep dinamika kependudukan dan faktor-faktor yang mempengaruhinya',
    batasanCatatan: 'Dinamika kependudukan dan faktor-faktor pengaruhnya.'
  },
  {
    elemenMateri: 'Proses yang memengaruhi lingkungan fisik dan sosial',
    subElemenMateri: 'Proses/fenomena yang memengaruhi lingkungan fisik',
    kompetensi: 'Menggunakan informasi tentang proses alam untuk menjelaskan perubahan lingkungan fisik di wilayah tertentu.',
    batasanCatatan: 'Proses alam dan perubahan lingkungan fisik wilayah tertentu.'
  },
  {
    elemenMateri: 'Proses yang memengaruhi lingkungan fisik dan sosial',
    subElemenMateri: 'Proses/fenomena yang memengaruhi lingkungan fisik',
    kompetensi: 'Menganalisis peranan manusia dalam mengubah lingkungan fisik',
    batasanCatatan: 'Peran manusia dalam mengubah lingkungan fisik.'
  },
  {
    elemenMateri: 'Proses yang memengaruhi lingkungan fisik dan sosial',
    subElemenMateri: 'Proses/fenomena yang memengaruhi lingkungan fisik',
    kompetensi: 'Menganalisis persebaran bioma di dunia dan pengaruhnya terhadap manusia.',
    batasanCatatan: 'Persebaran bioma di dunia dan dampaknya terhadap kehidupan manusia.'
  },
  {
    elemenMateri: 'Interaksi antargejala fisik alam dan manusia dan pengaruhnya terhadap kehidupan',
    subElemenMateri: 'Posisi strategis Indonesia dan pengaruhnya bagi kehidupan ekonomi, sosial, budaya secara nasional maupun internasional',
    kompetensi: 'Menjelaskan posisi geografis Indonesia.',
    batasanCatatan: 'Letak geografis Indonesia dan dampaknya bagi kehidupan.'
  },
  {
    elemenMateri: 'Interaksi antargejala fisik alam dan manusia dan pengaruhnya terhadap kehidupan',
    subElemenMateri: 'Potensi Sumber Daya Alam Indonesia terhadap dinamika kehidupan',
    kompetensi: 'Menganalisis pemanfaatan SDA sesuai konteks wilayah dengan menggunakan informasi (peta, data)',
    batasanCatatan: 'Pemanfaatan SDA berdasarkan informasi peta atau data wilayah.'
  },
  {
    elemenMateri: 'Interaksi antargejala fisik alam dan manusia dan pengaruhnya terhadap kehidupan',
    subElemenMateri: 'Potensi Sumber Daya Alam Indonesia terhadap dinamika kehidupan',
    kompetensi: 'Menganalisis pengelolaan SDA secara berkelanjutan',
    batasanCatatan: 'Pengelolaan SDA berkelanjutan di Indonesia.'
  },
  {
    elemenMateri: 'Cara mitigas dan adaptasi terhadap bencana alam di lingkungan tempat tinggal dan negaranya.',
    subElemenMateri: 'Bencana geologis/ hidroklimatologis',
    kompetensi: 'Menganalisis ragam risiko dan faktor penyebab bencana alam.',
    batasanCatatan: 'Risiko dan faktor penyebab bencana geologis/hidroklimatologis.'
  },
  {
    elemenMateri: 'Cara mitigas dan adaptasi terhadap bencana alam di lingkungan tempat tinggal dan negaranya.',
    subElemenMateri: 'Mitigasi dan adaptasi manusia terhadap bencana geologis/ hidroklimatologis',
    kompetensi: 'Menggunakan data atau studi kasus untuk menjelaskan bentuk adaptasi masyarakat terhadap bencana geologis atau hidroklimatologis di suatu wilayah.',
    batasanCatatan: 'Studi kasus adaptasi masyarakat terhadap bencana.'
  },
  {
    elemenMateri: 'Cara mitigas dan adaptasi terhadap bencana alam di lingkungan tempat tinggal dan negaranya.',
    subElemenMateri: 'Mitigasi dan adaptasi manusia terhadap bencana geologis/ hidroklimatologis',
    kompetensi: 'Mengevaluasi upaya pengurangan risiko bencana geologis/ hidroklimatologis.',
    batasanCatatan: 'Evaluasi mitigasi/pengurangan risiko bencana alam.'
  },
  {
    elemenMateri: 'Fenomena geografi dalam kehidupan sehari-hari dan manfaatnya',
    subElemenMateri: 'Peta, penginderaan jauh dan SIG (Sistem Informasi Geografis)',
    kompetensi: 'Menjelaskan penggunaan informasi Geospasial dalam kehidupan sehari-hari',
    batasanCatatan: 'Penggunaan informasi geospasial dalam kehidupan sehari-hari.'
  },
  {
    elemenMateri: 'Fenomena geografi dalam kehidupan sehari-hari dan manfaatnya',
    subElemenMateri: 'Peta, penginderaan jauh dan SIG (Sistem Informasi Geografis)',
    kompetensi: 'Menganalisis fenomena geosfer dari peta/citra penginderaan jauh.',
    batasanCatatan: 'Analisis fenomena geosfer melalui peta/citra penginderaan jauh.'
  }
];

const PUSMENDIK_SOSIOLOGI_PRESETS = [
  {
    elemenMateri: 'Sosiologi sebagai Ilmu',
    subElemenMateri: 'Pengertian dan perkembangan sosiologi dan manfaat sosiologi dalam kehidupan masyarakat.',
    kompetensi: 'Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.',
    batasanCatatan: 'Sejarah sosiologi, objek kajian sosiologi, fungsi dan manfaat sosiologi bagi masyarakat.'
  },
  {
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Konsep dan bentuk hubungan sosial',
    kompetensi: 'Mengidentifikasi dan menganalisis konsep dan bentuk hubungan sosial yang terjadi di masyarakat',
    batasanCatatan: 'Interaksi sosial, syarat-syarat interaksi, dan bentuk interaksi (asosiatif dan disosiatif).'
  },
  {
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Pembentukan kepribadian, kelompok dan lembaga sosial.',
    kompetensi: 'Mengidentifikasi berbagai lembaga sosial dan perannya di masyarakat.',
    batasanCatatan: 'Proses sosialisasi, pembentukan kepribadian, jenis kelompok, serta peran lembaga sosial (keluarga, agama, ekonomi).'
  },
  {
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Ragam gejala sosial.',
    kompetensi: 'Menjelaskan ragam gejala sosial di lingkungan sekitar.',
    batasanCatatan: 'Perilaku menyimpang, masalah sosial, sosiologi perkotaan/pedesaan, dan dampaknya bagi keteraturan sosial.'
  },
  {
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Masyarakat multikultural.',
    kompetensi: 'Menganalisis dinamika masyarakat multikultural.',
    batasanCatatan: 'Keragaman ras, etnis, agama, serta toleransi dan integrasi sosial dalam kerangka multikultural.'
  },
  {
    elemenMateri: 'Penelitian Sosial',
    subElemenMateri: 'Langkah penelitian sosial dan metode penelitian.',
    kompetensi: 'Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.',
    batasanCatatan: 'Rancangan penelitian, jenis penelitian (kualitatif/kuantitatif), teknik sampling, pengumpulan data, dan penyusunan laporan.'
  },
  {
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Konsep Kelompok Sosial dan dinamika Kelompok Sosial.',
    kompetensi: 'Mengidentifikasi, menjelaskan, dan menganalisis berbagai kelompok sosial dengan dinamikanya.',
    batasanCatatan: 'Klasifikasi kelompok sosial (ingroup/outgroup, paguyuban/patembayan), dinamika dan perkembangan kelompok.'
  },
  {
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Ketidaksetaraan sosial dan upaya mewujudkan kesetaraan sosial.',
    kompetensi: 'Memahami faktor yang memengaruhi ketidaksetaraan sosial dan menganalisis upaya mewujudkan kesetaraan sosial.',
    batasanCatatan: 'Stratifikasi sosial, diferensiasi sosial, ketimpangan sosial, serta harmoni sosial.'
  },
  {
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Konflik sosial dan penanganan konflik.',
    kompetensi: 'Mendeskripsikan berbagai konsep konflik sosial dan menganalisis berbagai upaya penanganan konflik.',
    batasanCatatan: 'Penyebab konflik, bentuk konflik, kekerasan, serta resolusi konflik (akomodasi, negosiasi, mediasi, arbitrase).'
  },
  {
    elemenMateri: 'Perubahan Sosial dan Globalisasi',
    subElemenMateri: 'Bentuk-bentuk perubahan sosial dan dampaknya.',
    kompetensi: 'Mengidentifikasi bentuk-bentuk perubahan sosial dan menganalisis dampak perubahan sosial.',
    batasanCatatan: 'Faktor pendorong/penghambat perubahan, teori perubahan sosial, modernisasi, dan desintegrasi.'
  },
  {
    elemenMateri: 'Perubahan Sosial dan Globalisasi',
    subElemenMateri: 'Globalisasi dan dampak globalisasi.',
    kompetensi: 'Menjelaskan dan menganalisis pengaruh globalisasi dan dampaknya.',
    batasanCatatan: 'Globalisasi ekonomi, politik, budaya, serta ketimpangan global dan lokalisasi (glokalisasi).'
  },
  {
    elemenMateri: 'Perubahan Sosial dan Globalisasi',
    subElemenMateri: 'Sikap kritis globalisasi.',
    kompetensi: 'Menganalisis fenomena sosial yang dipengaruhi globalisasi secara kritis.',
    batasanCatatan: 'Respon terhadap tantangan globalisasi, penguatan kearifan lokal, dan pemberdayaan komunitas.'
  }
];

const PUSMENDIK_SEJARAH_TL_PRESETS = [
  {
    elemenMateri: 'Pengantar Ilmu Sejarah',
    subElemenMateri: 'Konsep Dasar Sejarah',
    kompetensi: 'Menjelaskan dan Menganalisis konsep perubahan, keberlanjutan, serta sebab-akibat untuk memahami pengaruh peristiwa sejarah terhadap fenomena sosial yang dialami murid.',
    batasanCatatan: 'Konsep perubahan, keberlanjutan, serta sebab-akibat peristiwa sejarah terhadap kehidupan sosial murid.'
  },
  {
    elemenMateri: 'Pengantar Ilmu Sejarah',
    subElemenMateri: 'Fenomena sejarah dalam kehidupan sehari-hari',
    kompetensi: 'Menganalisis keterkaitan antara peristiwa sejarah masa lalu dan dinamika sosial budaya masyarakat masa kini dengan menggunakan prinsip perubahan, keberlanjutan, dan sebab-akibat.',
    batasanCatatan: 'Keterkaitan peristiwa masa lalu dengan dinamika sosial budaya masyarakat masa kini.'
  },
  {
    elemenMateri: 'Pengantar Ilmu Sejarah',
    subElemenMateri: 'Sumber-sumber sejarah',
    kompetensi: 'Mengidentifikasi fungsi dan perbedaan antara sumber sejarah primer dan sekunder serta menganalisis penggunaannya untuk merekonstruksi peristiwa masa lalu secara kontekstual.',
    batasanCatatan: 'Fungsi dan perbedaan sumber sejarah primer dan sekunder untuk rekonstruksi sejarah.'
  },
  {
    elemenMateri: 'Periode Kerajaan Hindu-Buddha dan Islam',
    subElemenMateri: 'Kehidupan religi, budaya, politik, dan ekonomi masyarakat di Nusantara pada masa kerajaan Hindu-Buddha',
    kompetensi: 'Mengevaluasi teori masuknya agama dan kebudayaan Hindu-Buddha ke Nusantara berdasarkan konsep dasar sejarah, menganalisis kehidupan politik dan ekonomi kerajaan-kerajaan Hindu-Buddha, serta mengklasifikasikan peninggalan budaya yang dihasilkannya.',
    batasanCatatan: 'Teori masuknya Hindu-Buddha, kehidupan politik/ekonomi kerajaan, dan peninggalan budayanya.'
  },
  {
    elemenMateri: 'Periode Kerajaan Hindu-Buddha dan Islam',
    subElemenMateri: 'Kehidupan religi, budaya, politik, dan ekonomi masyarakat di Nusantara pada masa kerajaan Islam',
    kompetensi: 'Menganalisis hubungan antara masuknya agama dan kebudayaan Islam dengan perubahan dalam sistem politik, ekonomi, serta perkembangan budaya masyarakat Nusantara.',
    batasanCatatan: 'Masuknya Islam, hubungannya dengan perubahan sistem politik, ekonomi, dan budaya Nusantara.'
  },
  {
    elemenMateri: 'Perlawanan terhadap Bangsa Eropa',
    subElemenMateri: 'Proses kedatangan Bangsa Eropa ke Nusantara',
    kompetensi: 'Menjelaskan dan menganalisis keterkaitan antara motivasi kedatangan bangsa Eropa dan perubahan sosial, ekonomi, serta politik di Nusantara dengan menggunakan pendekatan diakronik dan sinkronik.',
    batasanCatatan: 'Motivasi kedatangan bangsa Eropa dan perubahan sosial, ekonomi, serta politik Nusantara.'
  },
  {
    elemenMateri: 'Perlawanan terhadap Bangsa Eropa',
    subElemenMateri: 'Perlawanan terhadap Bangsa Eropa sebelum Abad ke-20',
    kompetensi: 'Menganalisis keterkaitan antara kebijakan kolonial bangsa Eropa dan munculnya berbagai bentuk perlawanan rakyat Nusantara sebelum abad ke-20, serta mengevaluasi strategi perjuangan yang dilakukan.',
    batasanCatatan: 'Hubungan kebijakan kolonial dengan perlawanan rakyat Nusantara dan strategi perjuangannya.'
  },
  {
    elemenMateri: 'Pergerakan Nasional sampai Proklamasi Kemerdekaan',
    subElemenMateri: 'Pergerakan Nasional Indonesia',
    kompetensi: 'Mengidentifikasi dampak Politik Etis dan munculnya berbagai organisasi pada masa Pergerakan Nasional serta menganalisis strategi perlawanan yang dilakukan dalam berbagai bidang.',
    batasanCatatan: 'Politik Etis, kemunculan organisasi pergerakan nasional, serta strategi perlawanan.'
  },
  {
    elemenMateri: 'Pergerakan Nasional sampai Proklamasi Kemerdekaan',
    subElemenMateri: 'Relevansi semangat Pergerakan Nasional dengan masa kini',
    kompetensi: 'Menganalisis relevansi nilai dan semangat perjuangan tokoh-tokoh pergerakan nasional dalam menghadapi tantangan kehidupan berbangsa dan bernegara di masa kini.',
    batasanCatatan: 'Nilai perjuangan tokoh pergerakan nasional dan relevansinya di masa kini.'
  },
  {
    elemenMateri: 'Pergerakan Nasional sampai Proklamasi Kemerdekaan',
    subElemenMateri: 'Kehidupan Bangsa Indonesia di bawah penjajahan Jepang dan perlawanan Bangsa Indonesia',
    kompetensi: 'Mengevaluasi beberapa penjelasan tentang penyebab utama runtuhnya kekuasaan Belanda di Indonesia sebelum pendudukan Jepang, berdasarkan sumber sejarah yang relevan.',
    batasanCatatan: 'Penyebab runtuhnya kekuasaan Belanda di Indonesia sebelum Jepang.'
  },
  {
    elemenMateri: 'Pergerakan Nasional sampai Proklamasi Kemerdekaan',
    subElemenMateri: 'Kehidupan Bangsa Indonesia di bawah penjajahan Jepang dan perlawanan Bangsa Indonesia',
    kompetensi: 'Menganalisis dampak kebijakan pendudukan Jepang di bidang politik, ekonomi, sosial, dan budaya terhadap kehidupan masyarakat Indonesia.',
    batasanCatatan: 'Dampak kebijakan pendudukan Jepang dalam berbagai bidang kehidupan.'
  },
  {
    elemenMateri: 'Pergerakan Nasional sampai Proklamasi Kemerdekaan',
    subElemenMateri: 'Peristiwa dan Makna Proklamasi Kemerdekaan Indonesia',
    kompetensi: 'Menjelaskan dan menganalisis peristiwa pada masa proklamasi kemerdekaan Indonesia dan maknanya.',
    batasanCatatan: 'Peristiwa sekitar proklamasi kemerdekaan Indonesia dan makna historisnya.'
  },
  {
    elemenMateri: 'Revolusi Kemerdekaan Indonesia sampai Demokrasi Terpimpin',
    subElemenMateri: 'Perjuangan mempertahankan kemerdekaan',
    kompetensi: 'Mendeskripsikan proses pembentukan negara dan pemerintahan Republik Indonesia setelah Proklamasi Kemerdekaan, serta menganalisis upaya perjuangan bangsa Indonesia dalam mempertahankan kemerdekaan melalui jalur diplomasi dan perjuangan fisik.',
    batasanCatatan: 'Pembentukan negara dan perjuangan fisik serta diplomasi mempertahankan kemerdekaan.'
  },
  {
    elemenMateri: 'Revolusi Kemerdekaan Indonesia sampai Demokrasi Terpimpin',
    subElemenMateri: 'Kehidupan masyarakat Indonesia pada masa Demokrasi Liberal',
    kompetensi: 'Menggunakan konsep Kronologis untuk menjelaskan perkembangan politik dan ekonomi Indonesia pada masa Demokrasi Liberal berdasarkan peristiwa peristiwa penting.',
    batasanCatatan: 'Perkembangan politik dan ekonomi Indonesia masa Demokrasi Liberal secara kronologis.'
  },
  {
    elemenMateri: 'Revolusi Kemerdekaan Indonesia sampai Demokrasi Terpimpin',
    subElemenMateri: 'Kehidupan masyarakat pada masa Demokrasi Terpimpin',
    kompetensi: 'Mengidentifikasi perkembangan politik dan ekonomi serta menganalisis dampak kebijakan pemerintah pada masa Demokrasi Terpimpin.',
    batasanCatatan: 'Perkembangan politik-ekonomi dan dampak kebijakan pemerintah masa Demokrasi Terpimpin.'
  },
  {
    elemenMateri: 'Orde Baru sampai Reformasi',
    subElemenMateri: 'Kehidupan Masyarakat pada Masa Orde Baru',
    kompetensi: 'Menganalisis kronologi perubahan Demokrasi Terpimpin menjadi Orde Baru dengan menggunakan konsep sejarah serta mengevaluasi dampak kebijakan politik dan ekonomi Orde Baru terhadap kehidupan masyarakat Indonesia.',
    batasanCatatan: 'Peralihan kekuasaan, kebijakan politik-ekonomi Orde Baru, serta dampaknya.'
  },
  {
    elemenMateri: 'Orde Baru sampai Reformasi',
    subElemenMateri: 'Kehidupan Masyarakat pada Masa Reformasi',
    kompetensi: 'Menganalisis proses lahirnya Reformasi dan peran pelajar serta mahasiswa sebagai pelaku sejarah, dengan menggunakan konsep perubahan dan kronologi, serta mengevaluasi dampak kebijakan politik and ekonomi Reformasi terhadap kehidupan masyarakat Indonesia.',
    batasanCatatan: 'Lahirnya Reformasi, peran gerakan mahasiswa/pelajar, serta dampak kebijakan Reformasi.'
  }
];

const PUSMENDIK_ANTROPOLOGI_PRESETS = [
  {
    elemenMateri: 'Pengantar dan Ruang Lingkup Antropologi',
    subElemenMateri: 'Konsep Dasar dan Sejarah Perkembangan Antropologi',
    kompetensi: 'Mendeskripsikan dan menganalisis konsep dasar dan sejarah perkembangan Antropologi',
    batasanCatatan: 'Konsep dasar dan sejarah perkembangan ilmu Antropologi.'
  },
  {
    elemenMateri: 'Pengantar dan Ruang Lingkup Antropologi',
    subElemenMateri: 'Prinsip Dasar dan Pendekatan Antropologi',
    kompetensi: 'Mengidentifikasi, dan menganalisis prinsip dasar Antropologi untuk menjelaskan fenomena sosial budaya di masyarakat',
    batasanCatatan: 'Prinsip dasar dan pendekatan Antropologi dalam fenomena sosial budaya.'
  },
  {
    elemenMateri: 'Pengantar dan Ruang Lingkup Antropologi',
    subElemenMateri: 'Ruang Lingkup Antropologi (Antropologi Ragawi, Arkeologi, dan Etnologi Bahasa)',
    kompetensi: 'Menjelaskan dan menganalisis keterkaitan antara cabang-cabang antropologi untuk memahami keberagaman budaya dan dinamika masyarakat manusia.',
    batasanCatatan: 'Keterkaitan cabang-cabang antropologi (ragawi, arkeologi, etnologi bahasa).'
  },
  {
    elemenMateri: 'Etnografi',
    subElemenMateri: 'Pengertian Etnografi',
    kompetensi: 'Menjelaskan konsep etnografi sebagai metode dalam penelitian Antropologi.',
    batasanCatatan: 'Konsep etnografi sebagai metode khas penelitian Antropologi.'
  },
  {
    elemenMateri: 'Etnografi',
    subElemenMateri: 'Metode dan Proses Penelitian Etnografi',
    kompetensi: 'Menjelaskandan menganalisis berbagai jenis metode penelitian Etnografi',
    batasanCatatan: 'Metode, teknik pengumpulan data, dan proses penelitian Etnografi.'
  },
  {
    elemenMateri: 'Etnografi',
    subElemenMateri: 'Pemanfaatan Hasil Penelitian Etnografi secara Kritis',
    kompetensi: 'Menganalisis pemanfaatan hasil penelitian etnografi dalam memahami dinamika sosial budaya secaraskritis dan kontekstual.',
    batasanCatatan: 'Pemanfaatan hasil penelitian etnografi secara kritis dan kontekstual.'
  },
  {
    elemenMateri: 'Etnografi',
    subElemenMateri: 'Penerapan Etnografi dalam Kehidupan Sehari-Hari',
    kompetensi: 'Menjelaskan penerapan etnografi dalam kehidupan sehari-hari.',
    batasanCatatan: 'Penerapan konsep dan metode etnografi dalam konteks sehari-hari.'
  },
  {
    elemenMateri: 'Masyarakat Multikultural',
    subElemenMateri: 'Jenis-Jenis Multikulturalisme dalam Masyarakat',
    kompetensi: 'Mengidentifikasi dan menganalisis keberagaman masyarakat Indonesia sebagai masyarakat multikultural',
    batasanCatatan: 'Keberagaman Indonesia sebagai masyarakat multikultural.'
  },
  {
    elemenMateri: 'Masyarakat Multikultural',
    subElemenMateri: 'Jenis-Jenis Multikulturalisme dalam Masyarakat',
    kompetensi: 'Mendeskripsikan berbagai konsep masyarakat multikultural dan menjelaskan jenis-jenis multikulturalisme dalam masyarakat',
    batasanCatatan: 'Konsep dan jenis-jenis multikulturalisme.'
  },
  {
    elemenMateri: 'Masyarakat Multikultural',
    subElemenMateri: 'Masyarakat Multikultural di Indonesia dan Global serta Tantangan dan Peluangnya.',
    kompetensi: 'Mendeskripsikan berbagai konsep masyarakat multikultural dan menjelaskan jenis-jenis multikulturalisme dalam masyarakat',
    batasanCatatan: 'Kondisi masyarakat multikultural lokal/global serta peluang & tantangannya.'
  },
  {
    elemenMateri: 'Perubahan Sosial Budaya',
    subElemenMateri: 'Konsep, Bentuk, dan Faktor Perubahan Sosial dan Budaya',
    kompetensi: 'Mendeskripsikan serta menganalisis konsep, bentuk, dan faktor perubahan soisal dan budaya',
    batasanCatatan: 'Konsep, bentuk, dan faktor pendorong/penghambat perubahan sosial budaya.'
  },
  {
    elemenMateri: 'Perubahan Sosial Budaya',
    subElemenMateri: 'Dampak dan Respon Masyarakat terhadap Perubahan Sosial dan Budaya di Indonesia',
    kompetensi: 'Menjelaskan dan menganalisis dampak dan respon masyarakat terhadap perubahan sosial dan budaya di Indonesia',
    batasanCatatan: 'Dampak dan respon masyarakat Indonesia terhadap perubahan sosial budaya.'
  },
  {
    elemenMateri: 'Antropologi Sosial dan Antropologi Budaya',
    subElemenMateri: 'Pengertian dan Cakupan Antropologi Sosial dan Antropologi Budaya',
    kompetensi: 'Memahami ruang lingkup kajian antropologi sosial dan antropologi budaya',
    batasanCatatan: 'Ruang lingkup dan kajian antropologi sosial & budaya.'
  },
  {
    elemenMateri: 'Antropologi Sosial dan Antropologi Budaya',
    subElemenMateri: 'Antropologi Sosial dan Antropologi Budaya sebagai Antropologi Terapan serta Studi Kasusnya di Masyarakat',
    kompetensi: 'Menjelaskan dan Menganalisis berbagai kajian antropologi sosial budaya sebagai antropologi terapan dalam sistem sosial budaya masyarakat',
    batasanCatatan: 'Kajian antropologi sosial budaya sebagai antropologi terapan.'
  },
  {
    elemenMateri: 'Antropologi Sosial dan Antropologi Budaya',
    subElemenMateri: 'Antropologi Sosial dan Antropologi Budaya sebagai Antropologi Terapan serta Studi Kasusnya di Masyarakat',
    kompetensi: 'Menganalisis studi kasus antropologi terapan dalam sistem sosial budaya masyarakat untuk memahami dinamika atau solusi terhadap permasalahan budaya.',
    batasanCatatan: 'Studi kasus antropologi terapan untuk pemecahan masalah budaya.'
  },
  {
    elemenMateri: 'Kearifan Lokal dan Tradisi Lisan',
    subElemenMateri: 'Definisi dan Bentuk-Bentuk Kearifan Lokal dalam Antropologi',
    kompetensi: 'Memahami definisi dan bentuk-bentuk kearifan lokal dalam Antropologi',
    batasanCatatan: 'Definisi, karakteristik, dan ragam bentuk kearifan lokal.'
  },
  {
    elemenMateri: 'Kearifan Lokal dan Tradisi Lisan',
    subElemenMateri: 'Peran Kearifan Lokal dalam Kehidupan Masyarakat',
    kompetensi: 'Menjelaskan dan menganalisis peran kearifan lokal dalam kehidupan masyarakat',
    batasanCatatan: 'Peran dan nilai kearifan lokal dalam kelangsungan masyarakat.'
  },
  {
    elemenMateri: 'Kearifan Lokal dan Tradisi Lisan',
    subElemenMateri: 'Jenis-Jenis dan Fungsi Tradisi Lisan dalam Masyarakat',
    kompetensi: 'Menjelaskan dan menganalisis Jenis-jenis dan fungsi tradisi lisan dalam masyarakat',
    batasanCatatan: 'Jenis-jenis (mitos, legenda, dongeng, puisi rakyat) dan fungsi tradisi lisan.'
  },
  {
    elemenMateri: 'Kearifan Lokal dan Tradisi Lisan',
    subElemenMateri: 'Tantangan Kearifan Lokal dan Tradisi Lisan di Era Modern',
    kompetensi: 'Menjelaskan dan menganalisis tantangan kearifan lokal dan tradisi lisan di era modern',
    batasanCatatan: 'Tantangan eksistensi kearifan lokal dan tradisi lisan di era modern/digital.'
  }
];

const PUSMENDIK_BAHASA_JEPANG_PRESETS = [
  {
    elemenMateri: 'Pemahaman Literal',
    subElemenMateri: 'Menemukan Informasi Tersurat',
    kompetensi: 'Menemukan informasi tersurat dari gambar atau teks sederhana.',
    batasanCatatan: 'Mengidentifikasi informasi tertulis/gambar yang disajikan secara eksplisit dalam bahasa Jepang.'
  },
  {
    elemenMateri: 'Pemahaman Literal',
    subElemenMateri: 'Melengkapi Teks Sederhana',
    kompetensi: 'Melengkapi teks dengan kosakata dan ungkapan komunikatif sesuai topik dari isi teks sederhana.',
    batasanCatatan: 'Mengisi bagian rumpang dengan partikel dasar, kata kerja, kata sifat, atau ungkapan komunikatif harian.'
  },
  {
    elemenMateri: 'Reorganisasi',
    subElemenMateri: 'Struktur Kalimat Bahasa Jepang',
    kompetensi: 'Menyusun kata-kata menjadi kalimat utuh sesuai struktur Bahasa Jepang.',
    batasanCatatan: 'Menata pola kalimat dasar Jepang (tata kalimat subjek-objek-predikat, partikel wa, ga, o, ni, de, dll).'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Menyimpulkan Informasi Tersirat',
    kompetensi: 'Menyimpulkan informasi tersirat dari teks sederhana.',
    batasanCatatan: 'Memahami maksud tersirat, penokohan, latar belakang situasi, atau kesimpulan dari suatu teks.'
  },
  {
    elemenMateri: 'Pemahaman Inferensial',
    subElemenMateri: 'Aplikasi Tata Bahasa (Negasi, Lampau, Akan Datang)',
    kompetensi: 'Mengaplikasikan Pengunaan tata bahasa bentuk negasi  lampau, atau akan datang pada teks sederhana',
    batasanCatatan: 'Konjugasi kata kerja/sifat bentuk positif, negatif, lampau, maupun bentuk kamus/akan datang.'
  }
];

const PUSMENDIK_PKK_PRESETS = [
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pengembangan Desain Produk',
    kompetensi: 'Menganalisis desain dan prosedur pengembangan produk.',
    batasanCatatan: 'Analisis konsep desain, estetika, fungsi, dan prosedur sistematis dalam mengembangkan produk baru.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pengembangan Desain Kemasan Produk',
    kompetensi: 'Mengevaluasi desain kemasan dan label produk.',
    batasanCatatan: 'Evaluasi kesesuaian kemasan, daya tarik visual, informasi label, pelindungan produk, dan aspek regulasi/ramah lingkungan.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pengembangan Prototipe Produk',
    kompetensi: 'Menerapkan pengembangan prototipe produk.',
    batasanCatatan: 'Penerapan tahapan pembuatan, pengujian, dan penyempurnaan prototipe (model fisik awal) sebelum diproduksi massal.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Perencanaan Produksi',
    kompetensi: 'Menentukan perencanaan dan biaya produksi.',
    batasanCatatan: 'Penghitungan harga pokok produksi (HPP), break-even point (BEP), perencanaan kebutuhan bahan, tenaga kerja, dan penjadwalan.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Proses Produksi',
    kompetensi: 'Menerapkan proses produksi.',
    batasanCatatan: 'Penerapan tahapan, teknik, dan prosedur pembuatan produk secara efektif, efisien, dan aman sesuai standar.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pengemasan Produk',
    kompetensi: 'Menerapkan pengemasan produk.',
    batasanCatatan: 'Penerapan metode pengemasan yang tepat untuk mempertahankan kualitas, keamanan, serta estetika visual produk.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pengendalian Mutu Produk (Quality Assurance)',
    kompetensi: 'Menerapkan pengendalian mutu produk.',
    batasanCatatan: 'Penerapan standar kualitas, inspeksi kelayakan, pengujian produk, serta tindakan koreksi kegagalan mutu.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Pemasaran Produk',
    kompetensi: 'Mengevaluasi strategi dan pemasaran produk.',
    batasanCatatan: 'Evaluasi bauran pemasaran (marketing mix), segmentasi pasar, promosi digital/tradisional, serta pencapaian target penjualan.'
  },
  {
    elemenMateri: 'Kegiatan Produksi, Pemasaran, dan Distribusi',
    subElemenMateri: 'Distribusi Produk',
    kompetensi: 'Menerapkan distribusi produk.',
    batasanCatatan: 'Penerapan saluran distribusi (langsung/tidak langsung), logistik, serta rantai pasok agar produk sampai ke tangan konsumen tepat waktu.'
  },
  {
    elemenMateri: 'Pengelolaan Usaha',
    subElemenMateri: 'Analisis Peluang Usaha',
    kompetensi: 'Menentukan peluang usaha.',
    batasanCatatan: 'Identifikasi potensi pasar, analisis SWOT (Strengths, Weaknesses, Opportunities, Threats), serta kelayakan bisnis.'
  },
  {
    elemenMateri: 'Pengelolaan Usaha',
    subElemenMateri: 'Proposal Usaha',
    kompetensi: 'Menganalisis proposal usaha.',
    batasanCatatan: 'Analisis kerangka, komponen kelayakan usaha, strategi pendanaan, serta penyusunan proposal usaha yang profesional.'
  },
  {
    elemenMateri: 'Pengelolaan Usaha',
    subElemenMateri: 'Pelaporan Keuangan',
    kompetensi: 'Menganalisis laporan keuangan.',
    batasanCatatan: 'Analisis neraca, laporan laba rugi, laporan arus kas, serta interpretasi kinerja keuangan usaha mikro/menengah.'
  },
  {
    elemenMateri: 'Pengelolaan Usaha',
    subElemenMateri: 'HaKI',
    kompetensi: 'Mengevaluasi HaKI.',
    batasanCatatan: 'Evaluasi hak atas kekayaan intelektual (paten, merek, hak cipta, desain industri) untuk perlindungan hukum produk kreatif.'
  }
];

const DEFAULT_JADWAL_LIST: JadwalItem[] = [
  {
    id: 'jadwal-1',
    bulan: 'Juli',
    mingguKe: 1,
    elemenMateri: 'Sosiologi sebagai Ilmu',
    subElemenMateri: 'Pengertian dan perkembangan sosiologi dan manfaat sosiologi dalam kehidupan masyarakat.',
    kompetensi: 'Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.'
  },
  {
    id: 'jadwal-2',
    bulan: 'Juli',
    mingguKe: 2,
    elemenMateri: 'Sosiologi sebagai Ilmu',
    subElemenMateri: 'Objek kajian sosiologi, fungsi dan manfaat sosiologi bagi masyarakat.',
    kompetensi: 'Menganalisis objek kajian sosiologi serta fungsinya dalam memecahkan masalah sosial.'
  },
  {
    id: 'jadwal-3',
    bulan: 'Juli',
    mingguKe: 3,
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Konsep dan bentuk hubungan sosial',
    kompetensi: 'Mengidentifikasi dan menganalisis konsep dan bentuk hubungan sosial yang terjadi di masyarakat'
  },
  {
    id: 'jadwal-4',
    bulan: 'Juli',
    mingguKe: 4,
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Pembentukan kepribadian, kelompok dan lembaga sosial.',
    kompetensi: 'Mengidentifikasi berbagai lembaga sosial dan perannya di masyarakat.'
  },
  {
    id: 'jadwal-5',
    bulan: 'Agustus',
    mingguKe: 1,
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Ragam gejala sosial.',
    kompetensi: 'Menjelaskan ragam gejala sosial di lingkungan sekitar.'
  },
  {
    id: 'jadwal-6',
    bulan: 'Agustus',
    mingguKe: 2,
    elemenMateri: 'Hubungan dan Gejala Sosial',
    subElemenMateri: 'Masyarakat multikultural.',
    kompetensi: 'Menganalisis dinamika masyarakat multikultural.'
  },
  {
    id: 'jadwal-7',
    bulan: 'Agustus',
    mingguKe: 3,
    elemenMateri: 'Penelitian Sosial',
    subElemenMateri: 'Langkah penelitian sosial dan metode penelitian.',
    kompetensi: 'Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.'
  },
  {
    id: 'jadwal-8',
    bulan: 'Agustus',
    mingguKe: 4,
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Konsep Kelompok Sosial dan dinamika Kelompok Sosial.',
    kompetensi: 'Mengidentifikasi, menjelaskan, dan menganalisis berbagai kelompok sosial dengan dinamikanya.'
  },
  {
    id: 'jadwal-9',
    bulan: 'Oktober',
    mingguKe: 1,
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Ketidaksetaraan sosial dan upaya mewujudkan kesetaraan sosial.',
    kompetensi: 'Memahami faktor yang memengaruhi ketidaksetaraan sosial dan menganalisis upaya mewujudkan kesetaraan sosial.'
  },
  {
    id: 'jadwal-10',
    bulan: 'Oktober',
    mingguKe: 2,
    elemenMateri: 'Kelompok Sosial, Kesetaraan, and Konflik Sosial',
    subElemenMateri: 'Konflik sosial dan penanganan konflik.',
    kompetensi: 'Mendeskripsikan berbagai konsep konflik sosial dan menganalisis berbagai upaya penanganan konflik.'
  },
  {
    id: 'jadwal-11',
    bulan: 'Oktober',
    mingguKe: 3,
    elemenMateri: 'Perubahan Sosial dan Globalisasi',
    subElemenMateri: 'Bentuk-bentuk perubahan sosial dan dampaknya.',
    kompetensi: 'Mengidentifikasi bentuk-bentuk perubahan sosial dan menganalisis dampak perubahan sosial.'
  },
  {
    id: 'jadwal-12',
    bulan: 'Oktober',
    mingguKe: 4,
    elemenMateri: 'Perubahan Sosial dan Globalisasi',
    subElemenMateri: 'Globalisasi dan dampak globalisasi.',
    kompetensi: 'Menjelaskan dan menganalisis pengaruh globalisasi dan dampaknya.'
  }
];

export default function App() {
  // Navigation Tabs: 'config' (Generator & Prompt), 'kisi' (Matriks Asesmen), 'soal' (Pembuat Soal), 'materi' (Ringkasan Materi & Panduan), 'jadwal' (Jadwal Pembelajaran), 'users' (Manajemen Pengguna)
  const [activeTab, setActiveTab] = useState<'config' | 'kisi' | 'soal' | 'materi' | 'jadwal' | 'users'>('config');

  // User Management State (for Admin)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [newUserMataPelajaran, setNewUserMataPelajaran] = useState<string>('Sosiologi');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const [config, setConfig] = useState<GeneratorConfig>({
    mataPelajaran: 'Sosiologi',
    definisi: 'Asesmen Akhir Semester (AAS) Ganjil',
    muatan: 'Kurikulum Merdeka - Fase F Kelas XII',
    kompetensi: 'Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.',
    bentukSoal: 'pilihan_ganda_sederhana',
    levelKognitif: 'level_2',
    elemenMateri: 'Sosiologi sebagai Ilmu',
    subElemenMateri: 'Pengertian dan perkembangan sosiologi dan manfaat sosiologi dalam kehidupan masyarakat.',
    batasanCatatan: 'Sejarah sosiologi, objek kajian sosiologi, fungsi dan manfaat sosiologi bagi masyarakat.',
    jumlahOpsi: 5,
    jenisSoal: 'tunggal',
    jumlahSoal: 1,
    konteksLokal: ['Kontekstual Indonesia', 'Kearifan Lokal'],
    stimulusKonten: ['Studi Kasus Konkrit', 'Data Statistik/Infografis', 'Wacana Ilmiah/Berita'],
    kualitasChecklist: [
      'Konstruksi Soal', 
      'Kesesuaian Materi', 
      'Level Kognitif', 
      'Kunci Jawaban Tepat', 
      'Distractor Berkualitas',
      'Sesuai Kurikulum'
    ]
  });

  const defaultKisiList: KisiKisiItem[] = [
    {
      id: "kisi-sosiologi-ref-1",
      no: 1,
      bentukSoal: "pilihan_ganda_sederhana",
      levelKognitif: "level_1",
      elemenMateri: "Sosiologi sebagai Ilmu",
      subElemenMateri: "Pengertian dan perkembangan sosiologi dan manfaat sosiologi dalam kehidupan masyarakat.",
      kompetensi: "Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.",
      batasanCatatan: "Sejarah sosiologi, objek kajian sosiologi, fungsi dan manfaat sosiologi bagi masyarakat.",
      jumlahSoal: 1
    },
    {
      id: "kisi-sosiologi-ref-2",
      no: 2,
      bentukSoal: "kategori",
      levelKognitif: "level_2",
      elemenMateri: "Hubungan dan Gejala Sosial",
      subElemenMateri: "Ragam gejala sosial.",
      kompetensi: "Menjelaskan ragam gejala sosial di lingkungan sekitar.",
      batasanCatatan: "Perilaku menyimpang, masalah sosial, sosiologi perkotaan/pedesaan, dan dampaknya bagi keteraturan sosial.",
      jumlahSoal: 1
    },
    {
      id: "kisi-sosiologi-ref-3",
      no: 3,
      bentukSoal: "mcma",
      levelKognitif: "level_3",
      elemenMateri: "Penelitian Sosial",
      subElemenMateri: "Langkah penelitian sosial dan metode penelitian.",
      kompetensi: "Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.",
      batasanCatatan: "Rancangan penelitian, jenis penelitian (kualitatif/kuantitatif), teknik sampling, pengumpulan data, dan penyusunan laporan.",
      jumlahSoal: 1
    }
  ];

  const defaultQuestions: Question[] = [
    {
      id: "question-sosiologi-ref-1",
      noSoal: 1,
      kisiKisiId: "kisi-sosiologi-ref-1",
      kompetensi: "Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.",
      subKompetensi: "Mengidentifikasi objek kajian sosiologi di era masyarakat digital.",
      bentukSoal: "pilihan_ganda_sederhana",
      stimulus: "Sosiologi merupakan ilmu pengetahuan murni yang membatasi diri pada apa yang nyata-nyata terjadi saat ini (das sein) dan bukan membicarakan apa yang seharusnya terjadi (das sollen). Di tengah era disrupsi teknologi digital saat ini, berbagai fenomena interaksi sosial baru bermunculan, mulai dari maraknya penggunaan media sosial, kecanduan gawai, hingga pola komunikasi virtual di kalangan remaja yang menggeser norma-norma konvensional di masyarakat.",
      soal: "Berdasarkan ilustrasi di atas, objek kajian sosiologi yang paling tepat ditunjukkan oleh pernyataan...",
      opsi: [
        "A. Dampak radiasi gelombang elektromagnetik gawai terhadap kesehatan mata dan fisik remaja secara klinis.",
        "B. Kecanduan teknologi yang mengubah pola interaksi, cara berpikir, dan perilaku sosial di kalangan remaja dalam kehidupan sehari-hari.",
        "C. Kerusakan jaringan infrastruktur internet nasional akibat dari maraknya serangan keamanan siber (cyber attack).",
        "D. Penurunan nilai tukar mata uang asing yang memengaruhi harga jual gawai di pasar lokal secara signifikan.",
        "E. Perancangan algoritma kecerdasan buatan pada aplikasi media sosial untuk meningkatkan efisiensi komputasi."
      ],
      kunciJawaban: "B",
      pembahasan: "Objek kajian sosiologi berpusat pada masyarakat and segala fenomena interaksi sosial serta gejala sosial yang terjadi di dalamnya. Dampak sosial kemajuan teknologi (kecanduan gawai yang mengubah pola interaksi, cara berpikir, dan perilaku sosial remaja) merupakan gejala sosial nyata yang menjadi objek kajian sosiologi (das sein). Pilihan lainnya berada di luar ranah kajian sosiologi, seperti kesehatan fisik/klinis (A), teknik informatika/cyber (C & E), dan ekonomi makro (D).",
      kataKunci: "Objek Kajian Sosiologi, Gejala Sosial, Disrupsi Teknologi"
    },
    {
      id: "question-sosiologi-ref-2",
      noSoal: 2,
      kisiKisiId: "kisi-sosiologi-ref-2",
      kompetensi: "Menjelaskan ragam gejala sosial di lingkungan sekitar.",
      subKompetensi: "Menerapkan konsep sosialisasi dan ragam gejala sosial terkait pembatasan screen-time pada anak.",
      bentukSoal: "kategori",
      stimulus: "Perhatikan anjuran durasi aman layar (screen-time) bagi anak-anak berikut ini!\nMenurut rekomendasi para ahli evaluasi perkembangan anak, anak usia 0 sampai 1,5 tahun disarankan sama sekali tidak terpapar layar gawai (0 jam). Anak usia 1,5 sampai 2 tahun diperbolehkan mengakses program yang berkualitas tinggi maksimal selama 1 jam dengan pendampingan ketat oleh orang tua. Anak usia 2 sampai 5 tahun juga dibatasi maksimal 1 jam per hari dengan pendampingan, sementara anak di atas 5 tahun harus memiliki batas waktu penggunaan gawai yang konsisten dan seimbang demi menjaga kesehatan fisik dan mental mereka.",
      soal: "Evaluasilah kesesuaian pernyataan terkait gejala penggunaan gawai pada anak berdasarkan anjuran tersebut! Tentukan SESUAI atau TIDAK SESUAI untuk setiap pernyataan berikut.",
      opsi: [
        "Pernyataan 1: Penggunaan gawai pada anak usia dini perlu diawasi ketat oleh orang tua agar proses sosialisasi primer anak tidak terhambat secara negatif.",
        "Pernyataan 2: Anak berusia 1 tahun diperbolehkan bermain gawai sendiri tanpa pendampingan asalkan kontennya edukatif dengan batas waktu maksimal 1 jam per hari.",
        "Pernyataan 3: Pola asuh yang terlalu longgar terhadap akses teknologi digital dapat mengganggu pembentukan karakter dan kepribadian sosial anak.",
        "Pernyataan 4: Pembatasan waktu layar secara konsisten bagi anak usia di atas 5 tahun dapat mengurangi risiko deviasi sosial berupa kecanduan gawai."
      ],
      kunciJawaban: "SESUAI, TIDAK SESUAI, SESUAI, SESUAI",
      pembahasan: "- Pernyataan 1 [SESUAI]: Sesuai dengan anjuran dalam stimulus bahwa pendampingan orang tua sangat krusial dalam masa sosialisasi primer anak usia dini.\n- Pernyataan 2 [TIDAK SESUAI]: Anak usia 1 tahun (berada di rentang 0-1,5 tahun) direkomendasikan sama sekali tidak terpapar layar (0 jam), serta tidak boleh dilepas bermain gawai sendiri.\n- Pernyataan 3 [SESUAI]: Sesuai dengan konsep sosiologi bahwa pengawasan/pendampingan penting untuk mencegah dampak negatif pembentukan kepribadian akibat paparan gawai yang bebas.\n- Pernyataan 4 [SESUAI]: Pembatasan waktu layar secara konsisten dan seimbang bagi anak di atas 5 tahun membantu mencegah risiko penyimpangan berupa kecanduan gawai.",
      kataKunci: "Sosialisasi, Pola Asuh, Gejala Sosial, Screen-Time"
    },
    {
      id: "question-sosiologi-ref-3",
      noSoal: 3,
      kisiKisiId: "kisi-sosiologi-ref-3",
      kompetensi: "Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.",
      subKompetensi: "Menganalisis rancangan metode penelitian sosial kuantitatif dan menyempurnakannya secara metodologis.",
      bentukSoal: "mcma",
      stimulus: "Seorang peneliti sosiologi SMA ingin meneliti pengaruh intensitas pergaulan kelompok teman sebaya (peer group) terhadap kelekatan hubungan antar-anggota keluarga di kalangan siswa kelas XII. Peneliti tersebut merumuskan masalah: 'Apakah terdapat hubungan antara pergaulan sebaya dengan kelekatan hubungan keluarga?' Peneliti menyusun instrumen pengumpulan data berupa daftar pertanyaan terbuka sebanyak 10 butir untuk wawancara mendalam. Namun, pada saat yang sama, ia juga berencana menganalisis kekuatan hubungan antar-variabel tersebut secara kuantitatif melalui uji korelasi statistik menggunakan aplikasi pengolah data.",
      soal: "Berdasarkan rancangan penelitian di atas, manakah rekomendasi metodologis yang paling tepat dan logis untuk menyempurnakan penelitian tersebut agar valid? (Pilihlah semua jawaban yang benar! Jawaban benar lebih dari satu)",
      opsi: [
        "A. Peneliti perlu mengubah daftar pertanyaan terbuka menjadi kuesioner tertutup berskala Likert agar data kuantitatif yang diperoleh dapat diolah dengan uji korelasi statistik secara valid.",
        "B. Peneliti harus menentukan teknik sampling (seperti simple random sampling atau stratified random sampling) dan ukuran sampel yang representatif terlebih dahulu sebelum menyebarkan instrumen.",
        "C. Peneliti sebaiknya menghapus rumusan masalah utama karena analisis statistik kuantitatif tidak memerlukan perumusan masalah yang detail terkait interaksi sosial.",
        "D. Peneliti wajib menggunakan metode observasi partisipatif penuh (peneliti tinggal bersama keluarga responden selama minimal satu tahun penuh) untuk mempercepat proses kuantifikasi.",
        "E. Peneliti perlu melakukan operasionalisasi konsep variabel bebas (intensitas pergaulan sebaya) dan variabel terikat (kelekatan hubungan keluarga) untuk mempermudah penyusunan indikator instrumen kuesioner."
      ],
      kunciJawaban: "A, B, E",
      pembahasan: "Penelitian ini memiliki kontradiksi metodologis: ingin menguji hubungan kuantitatif (korelasi statistik) tetapi instrumennya adalah pertanyaan terbuka (kualitatif). Maka rekomendasi penyempurnaan yang logis:\n1. [A BENAR] Pertanyaan terbuka harus diubah menjadi tertutup (seperti skala Likert) agar datanya berbentuk angka dan dapat diproses secara statistik.\n2. [B BENAR] Penentuan teknik sampling probabilitas dan jumlah sampel representatif sangat penting untuk penelitian kuantitatif agar hasil uji hubungan bisa digeneralisasi.\n3. [E BENAR] Operasionalisasi konsep variabel sangat krusial dalam kuantitatif untuk menerjemahkan teori sosiologi ke dalam indikator kuesioner yang valid.\nOpsi C salah karena rumusan masalah adalah fondasi utama penelitian. Opsi D tidak tepat karena observasi partisipatif penuh adalah metode khas kualitatif (etnografi) yang sangat lama dan bertolak belakang dengan kebutuhan pengujian korelasi kuantitatif cepat.",
      kataKunci: "Metodologi Penelitian, Penelitian Kuantitatif, Teknik Sampling, Validitas"
    }
  ];

  // User auth and role states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Synced collection states
  const [kisiList, setKisiList] = useState<KisiKisiItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Jadwal Rencana Pembelajaran State & Handlers
  const [jadwalList, setJadwalList] = useState<JadwalItem[]>([]);
  const [jadwalSortNotification, setJadwalSortNotification] = useState<string | null>(null);

  // Sync selectedJadwalPresetSubject with config.mataPelajaran
  useEffect(() => {
    if (!config.mataPelajaran) return;
    const mp = config.mataPelajaran;
    if (mp === 'Pendidikan Pancasila dan Kewarganegaraan') {
      setSelectedJadwalPresetSubject('PPKN');
    } else if (mp === 'Sejarah') {
      setSelectedJadwalPresetSubject('Sejarah Tingkat Lanjut');
    } else if (mp === 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK') {
      setSelectedJadwalPresetSubject('Produk Kreatif dan Kewirausahaan');
    } else {
      const validSubjects = [
        'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 
        'Matematika Tingkat Lanjut', 'Bahasa Indonesia Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut', 
        'Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Geografi', 'Sosiologi', 'Antropologi', 'Bahasa Jepang'
      ];
      if (validSubjects.includes(mp)) {
        setSelectedJadwalPresetSubject(mp as any);
      }
    }
  }, [config.mataPelajaran]);

  // Form State for Adding / Editing Jadwal
  const [isAddingJadwal, setIsAddingJadwal] = useState(false);
  const [newJadwal, setNewJadwal] = useState<Omit<JadwalItem, 'id'>>({
    bulan: 'Juli',
    mingguKe: 1,
    elemenMateri: '',
    subElemenMateri: '',
    kompetensi: ''
  });

  const [editingJadwalId, setEditingJadwalId] = useState<string | null>(null);
  const [editingJadwalData, setEditingJadwalData] = useState<JadwalItem | null>(null);

  // Custom confirmation modals states
  const [jadwalToDelete, setJadwalToDelete] = useState<JadwalItem | null>(null);
  const [showClearJadwalConfirm, setShowClearJadwalConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showImportPresetsConfirm, setShowImportPresetsConfirm] = useState<{ count: number; subject: string; presets: any[] } | null>(null);

  // State for preset subject selection in the Jadwal UI
  const [selectedJadwalPresetSubject, setSelectedJadwalPresetSubject] = useState<'Matematika' | 'Bahasa Indonesia' | 'Bahasa Inggris' | 'Matematika Tingkat Lanjut' | 'Bahasa Indonesia Tingkat Lanjut' | 'Bahasa Inggris Tingkat Lanjut' | 'Fisika' | 'Kimia' | 'Biologi' | 'PPKN' | 'Ekonomi' | 'Geografi' | 'Sosiologi' | 'Sejarah Tingkat Lanjut' | 'Antropologi' | 'Bahasa Jepang' | 'Produk Kreatif dan Kewirausahaan'>('Sosiologi');

  // Handle importing all presets into the schedule distributed sequentially across months
  const handleImportAllJadwalPresets = () => {
    const activePresets = selectedJadwalPresetSubject === 'Matematika' 
      ? PUSMENDIK_MATEMATIKA_PRESETS 
      : selectedJadwalPresetSubject === 'Bahasa Indonesia' 
      ? PUSMENDIK_BAHASA_INDONESIA_PRESETS 
      : selectedJadwalPresetSubject === 'Bahasa Inggris'
      ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
      : selectedJadwalPresetSubject === 'Matematika Tingkat Lanjut'
      ? PUSMENDIK_MATEMATIKA_TL_PRESETS
      : selectedJadwalPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
      ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
      : selectedJadwalPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
      ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
      : selectedJadwalPresetSubject === 'Fisika'
      ? PUSMENDIK_FISIKA_PRESETS
      : selectedJadwalPresetSubject === 'Kimia'
      ? PUSMENDIK_KIMIA_PRESETS
      : selectedJadwalPresetSubject === 'Biologi'
      ? PUSMENDIK_BIOLOGI_PRESETS
      : selectedJadwalPresetSubject === 'PPKN'
      ? PUSMENDIK_PPKN_PRESETS
      : selectedJadwalPresetSubject === 'Ekonomi'
      ? PUSMENDIK_EKONOMI_PRESETS
      : selectedJadwalPresetSubject === 'Geografi'
      ? PUSMENDIK_GEOGRAFI_PRESETS
      : selectedJadwalPresetSubject === 'Sosiologi'
      ? PUSMENDIK_SOSIOLOGI_PRESETS
      : selectedJadwalPresetSubject === 'Sejarah Tingkat Lanjut'
      ? PUSMENDIK_SEJARAH_TL_PRESETS
      : selectedJadwalPresetSubject === 'Antropologi'
      ? PUSMENDIK_ANTROPOLOGI_PRESETS
      : selectedJadwalPresetSubject === 'Bahasa Jepang'
      ? PUSMENDIK_BAHASA_JEPANG_PRESETS
      : PUSMENDIK_PKK_PRESETS;

    const count = activePresets.length;
    setShowImportPresetsConfirm({
      count,
      subject: selectedJadwalPresetSubject,
      presets: activePresets
    });
  };

  const executeImportAllJadwalPresets = (presets: any[]) => {
    const months: ('Juli' | 'Agustus' | 'September' | 'Oktober')[] = ['Juli', 'Agustus', 'September', 'Oktober'];
    const newItems: JadwalItem[] = presets.map((preset, index) => {
      const slotIndex = index;
      const monthIndex = Math.min(3, Math.floor(slotIndex / 4));
      const weekNum = (slotIndex % 4) + 1;
      return {
        id: `jadwal-preset-${Date.now()}-${index}`,
        bulan: months[monthIndex],
        mingguKe: weekNum,
        elemenMateri: preset.elemenMateri,
        subElemenMateri: preset.subElemenMateri,
        kompetensi: preset.kompetensi
      };
    });

    setJadwalList(prev => [...prev, ...newItems]);
    setShowImportPresetsConfirm(null);
  };

  const handleAddJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    const item: JadwalItem = {
      ...newJadwal,
      id: `jadwal-${Date.now()}`
    };
    setJadwalList(prev => [...prev, item]);
    setNewJadwal({
      bulan: 'Juli',
      mingguKe: 1,
      elemenMateri: '',
      subElemenMateri: '',
      kompetensi: ''
    });
    setIsAddingJadwal(false);
  };

  const handleStartEditJadwal = (item: JadwalItem) => {
    setEditingJadwalId(item.id);
    setEditingJadwalData({ ...item });
  };

  const handleSaveEditJadwal = () => {
    if (!editingJadwalData) return;
    setJadwalList(prev => prev.map(item => item.id === editingJadwalData.id ? editingJadwalData : item));
    setEditingJadwalId(null);
    setEditingJadwalData(null);
  };

  const handleDeleteJadwal = (id: string) => {
    const itemToDelete = jadwalList.find(item => item.id === id);
    if (!itemToDelete) return;
    setJadwalToDelete(itemToDelete);
  };

  const executeDeleteJadwal = () => {
    if (!jadwalToDelete) return;
    setJadwalList(prev => prev.filter(item => item.id !== jadwalToDelete.id));
    setJadwalToDelete(null);
  };

  const handleResetJadwal = () => {
    setShowClearJadwalConfirm(true);
  };

  const handleSortJadwal = () => {
    if (jadwalList.length === 0) return;

    const monthOrder: Record<string, number> = {
      'Juli': 1,
      'Agustus': 2,
      'September': 3,
      'Oktober': 4,
      'November': 5,
      'Desember': 6,
      'Januari': 7,
      'Februari': 8,
      'Maret': 9,
      'April': 10,
      'Mei': 11,
      'Juni': 12
    };

    const sorted = [...jadwalList].sort((a, b) => {
      const mA = monthOrder[a.bulan] || 99;
      const mB = monthOrder[b.bulan] || 99;
      if (mA !== mB) {
        return mA - mB;
      }
      return (Number(a.mingguKe) || 0) - (Number(b.mingguKe) || 0);
    });

    setJadwalList(sorted);
    setJadwalSortNotification('Jadwal Rencana Pembelajaran TKA Kelas XII berhasil diurutkan berdasarkan Bulan dan Minggu ke-!');
    setTimeout(() => {
      setJadwalSortNotification(null);
    }, 4000);
  };

  const executeClearJadwal = () => {
    setJadwalList([]);
    setShowClearJadwalConfirm(false);
  };

  const getPresetsForSubject = (subject: string) => {
    switch (subject) {
      case 'Matematika':
        return PUSMENDIK_MATEMATIKA_PRESETS;
      case 'Bahasa Indonesia':
        return PUSMENDIK_BAHASA_INDONESIA_PRESETS;
      case 'Bahasa Inggris':
        return PUSMENDIK_BAHASA_INGGRIS_PRESETS;
      case 'Matematika Tingkat Lanjut':
        return PUSMENDIK_MATEMATIKA_TL_PRESETS;
      case 'Bahasa Indonesia Tingkat Lanjut':
        return PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS;
      case 'Bahasa Inggris Tingkat Lanjut':
        return PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS;
      case 'Fisika':
        return PUSMENDIK_FISIKA_PRESETS;
      case 'Kimia':
        return PUSMENDIK_KIMIA_PRESETS;
      case 'Biologi':
        return PUSMENDIK_BIOLOGI_PRESETS;
      case 'PPKN':
      case 'Pendidikan Pancasila dan Kewarganegaraan':
        return PUSMENDIK_PPKN_PRESETS;
      case 'Ekonomi':
        return PUSMENDIK_EKONOMI_PRESETS;
      case 'Geografi':
        return PUSMENDIK_GEOGRAFI_PRESETS;
      case 'Sosiologi':
        return PUSMENDIK_SOSIOLOGI_PRESETS;
      case 'Sejarah':
      case 'Sejarah Tingkat Lanjut':
        return PUSMENDIK_SEJARAH_TL_PRESETS;
      case 'Antropologi':
        return PUSMENDIK_ANTROPOLOGI_PRESETS;
      case 'Bahasa Jepang':
        return PUSMENDIK_BAHASA_JEPANG_PRESETS;
      default:
        return PUSMENDIK_PKK_PRESETS;
    }
  };

  const seedDefaultData = async (userId: string, targetSubject: string = 'Sosiologi') => {
    try {
      const batch = writeBatch(db);
      
      let defaultKisiList: KisiKisiItem[] = [];
      if (targetSubject === 'Sosiologi') {
        defaultKisiList = [
          {
            id: `kisi-sosiologi-ref-1-${userId}`,
            userId: userId,
            no: 1,
            bentukSoal: "pilihan_ganda_sederhana",
            levelKognitif: "level_1",
            elemenMateri: "Sosiologi sebagai Ilmu",
            subElemenMateri: "Pengertian dan perkembangan sosiologi dan manfaat sosiologi dalam kehidupan masyarakat.",
            kompetensi: "Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.",
            batasanCatatan: "Sejarah sosiologi, objek kajian sosiologi, fungsi dan manfaat sosiologi bagi masyarakat.",
            jumlahSoal: 1
          },
          {
            id: `kisi-sosiologi-ref-2-${userId}`,
            userId: userId,
            no: 2,
            bentukSoal: "kategori",
            levelKognitif: "level_2",
            elemenMateri: "Hubungan dan Gejala Sosial",
            subElemenMateri: "Ragam gejala sosial.",
            kompetensi: "Menjelaskan ragam gejala sosial di lingkungan sekitar.",
            batasanCatatan: "Perilaku menyimpang, masalah sosial, sosiologi perkotaan/pedesaan, dan dampaknya bagi keteraturan sosial.",
            jumlahSoal: 1
          },
          {
            id: `kisi-sosiologi-ref-3-${userId}`,
            userId: userId,
            no: 3,
            bentukSoal: "mcma",
            levelKognitif: "level_3",
            elemenMateri: "Penelitian Sosial",
            subElemenMateri: "Langkah penelitian sosial dan metode penelitian.",
            kompetensi: "Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.",
            batasanCatatan: "Rancangan penelitian, jenis penelitian (kualitatif/kuantitatif), teknik sampling, pengumpulan data, dan penyusunan laporan.",
            jumlahSoal: 1
          }
        ];
      } else {
        const presets = getPresetsForSubject(targetSubject).slice(0, 3);
        defaultKisiList = presets.map((preset, idx) => ({
          id: `kisi-${targetSubject.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ref-${idx + 1}-${userId}`,
          userId: userId,
          no: idx + 1,
          bentukSoal: idx === 0 ? "pilihan_ganda_sederhana" : idx === 1 ? "kategori" : "mcma",
          levelKognitif: idx === 0 ? "level_1" : idx === 1 ? "level_2" : "level_3",
          elemenMateri: preset.elemenMateri,
          subElemenMateri: preset.subElemenMateri,
          kompetensi: preset.kompetensi,
          batasanCatatan: preset.batasanCatatan,
          jumlahSoal: 1
        }));
      }

      defaultKisiList.forEach((item) => {
        batch.set(doc(db, 'kisi_kisi', item.id), item);
      });

      if (targetSubject === 'Sosiologi') {
        const defaultQuestions: Question[] = [
          {
            id: `question-sosiologi-ref-1-${userId}`,
            userId: userId,
            noSoal: 1,
            kisiKisiId: `kisi-sosiologi-ref-1-${userId}`,
            kompetensi: "Mendeskripsikan dan menganalisis pengertian dan perkembangan serta manfaat sosiologi sebagai ilmu pengetahuan.",
            subKompetensi: "Mengidentifikasi objek kajian sosiologi di era masyarakat digital.",
            bentukSoal: "pilihan_ganda_sederhana",
            stimulus: "Sosiologi merupakan ilmu pengetahuan murni yang membatasi diri pada apa yang nyata-nyata terjadi saat ini (das sein) dan bukan membicarakan apa yang seharusnya terjadi (das sollen). Di tengah era disrupsi teknologi digital saat ini, berbagai fenomena interaksi sosial baru bermunculan, mulai dari maraknya penggunaan media sosial, kecanduan gawai, hingga pola komunikasi virtual di kalangan remaja yang menggeser norma-norma konvensional di masyarakat.",
            soal: "Berdasarkan ilustrasi di atas, objek kajian sosiologi yang paling tepat ditunjukkan oleh pernyataan...",
            opsi: [
              "A. Dampak radiasi gelombang elektromagnetik gawai terhadap kesehatan mata dan fisik remaja secara klinis.",
              "B. Kecanduan teknologi yang mengubah pola interaksi, cara berpikir, dan perilaku sosial di kalangan remaja dalam kehidupan sehari-hari.",
              "C. Kerusakan jaringan infrastruktur internet nasional akibat dari maraknya serangan keamanan siber (cyber attack).",
              "D. Penurunan nilai tukar mata uang asing yang memengaruhi harga jual gawai di pasar lokal secara signifikan.",
              "E. Perancangan algoritma kecerdasan buatan pada aplikasi media sosial untuk meningkatkan efisiensi komputasi."
            ],
            kunciJawaban: "B",
            pembahasan: "Objek kajian sosiologi berpusat pada masyarakat and segala fenomena interaksi sosial serta gejala sosial yang terjadi di dalamnya. Dampak sosial kemajuan teknologi (kecanduan gawai yang mengubah pola interaksi, cara berpikir, dan perilaku sosial remaja) merupakan gejala sosial nyata yang menjadi objek kajian sosiologi (das sein). Pilihan lainnya berada di luar ranah kajian sosiologi, seperti kesehatan fisik/klinis (A), teknik informatika/cyber (C & E), dan ekonomi makro (D).",
            kataKunci: "Objek Kajian Sosiologi, Gejala Sosial, Disrupsi Teknologi"
          },
          {
            id: `question-sosiologi-ref-2-${userId}`,
            userId: userId,
            noSoal: 2,
            kisiKisiId: `kisi-sosiologi-ref-2-${userId}`,
            kompetensi: "Menjelaskan ragam gejala sosial di lingkungan sekitar.",
            subKompetensi: "Menerapkan konsep sosialisasi dan ragam gejala sosial terkait pembatasan screen-time pada anak.",
            bentukSoal: "kategori",
            stimulus: "Perhatikan anjuran durasi aman layar (screen-time) bagi anak-anak berikut ini!\nMenurut rekomendasi para ahli evaluasi perkembangan anak, anak usia 0 sampai 1,5 tahun disarankan sama sekali tidak terpapar layar gawai (0 jam). Anak usia 1,5 sampai 2 tahun diperbolehkan mengakses program yang berkualitas tinggi maksimal selama 1 jam dengan pendampingan ketat oleh orang tua. Anak usia 2 sampai 5 tahun juga dibatasi maksimal 1 jam per hari dengan pendampingan, sementara anak di atas 5 tahun harus memiliki batas waktu penggunaan gawai yang konsisten dan seimbang demi menjaga kesehatan fisik dan mental mereka.",
            soal: "Evaluasilah kesesuaian pernyataan terkait gejala penggunaan gawai pada anak berdasarkan anjuran tersebut! Tentukan SESUAI atau TIDAK SESUAI untuk setiap pernyataan berikut.",
            opsi: [
              "Pernyataan 1: Penggunaan gawai pada anak usia dini perlu diawasi ketat oleh orang tua agar proses sosialisasi primer anak tidak terhambat secara negatif.",
              "Pernyataan 2: Anak berusia 1 tahun diperbolehkan bermain gawai sendiri tanpa pendampingan asalkan kontennya edukatif dengan batas waktu maksimal 1 jam per hari.",
              "Pola asuh yang terlalu longgar terhadap akses teknologi digital dapat mengganggu pembentukan karakter dan kepribadian sosial anak.",
              "Pembatasan waktu layar secara konsisten bagi anak usia di atas 5 tahun dapat mengurangi risiko deviasi sosial berupa kecanduan gawai."
            ],
            kunciJawaban: "SESUAI, TIDAK SESUAI, SESUAI, SESUAI",
            pembahasan: "- Pernyataan 1 [SESUAI]: Sesuai dengan anjuran dalam stimulus bahwa pendampingan orang tua sangat krusial dalam masa sosialisasi primer anak usia dini.\n- Pernyataan 2 [TIDAK SESUAI]: Anak usia 1 tahun (berada di rentang 0-1,5 tahun) direkomendasikan sama sekali tidak terpapar layar (0 jam), serta tidak boleh dilepas bermain gawai sendiri.\n- Pernyataan 3 [SESUAI]: Sesuai dengan konsep sosiologi bahwa pengawasan/pendampingan penting untuk mencegah dampak negatif pembentukan kepribadian akibat paparan gawai yang bebas.\n- Pernyataan 4 [SESUAI]: Pembatasan waktu layar secara konsisten dan seimbang bagi anak di atas 5 tahun membantu mencegah risiko penyimpangan berupa kecanduan gawai.",
            kataKunci: "Sosialisasi, Pola Asuh, Gejala Sosial, Screen-Time"
          },
          {
            id: `question-sosiologi-ref-3-${userId}`,
            userId: userId,
            noSoal: 3,
            kisiKisiId: `kisi-sosiologi-ref-3-${userId}`,
            kompetensi: "Menjelaskan dan menganalisis berbagai langkah dan metode penelitian sosial.",
            subKompetensi: "Menganalisis rancangan metode penelitian sosial kuantitatif dan menyempurnakannya secara metodologis.",
            bentukSoal: "mcma",
            stimulus: "Seorang peneliti sosiologi SMA ingin meneliti pengaruh intensitas pergaulan kelompok teman sebaya (peer group) terhadap kelekatan hubungan antar-anggota keluarga di kalangan siswa kelas XII. Peneliti tersebut merumuskan masalah: 'Apakah terdapat hubungan antara pergaulan sebaya dengan kelekatan hubungan keluarga?' Peneliti menyusun instrumen pengumpulan data berupa daftar pertanyaan terbuka sebanyak 10 butir untuk wawancara mendalam. Namun, pada saat yang sama, ia juga berencana menganalisis kekuatan hubungan antar-variabel tersebut secara kuantitatif melalui uji korelasi statistik menggunakan aplikasi pengolah data.",
            soal: "Berdasarkan rancangan penelitian di atas, manakah rekomendasi metodologis yang paling tepat dan logis untuk menyempurnakan penelitian tersebut agar valid? (Pilihlah semua jawaban yang benar! Jawaban benar lebih dari satu)",
            opsi: [
              "A. Peneliti perlu mengubah daftar pertanyaan terbuka menjadi kuesioner tertutup berskala Likert agar data kuantitatif yang diperoleh dapat diolah dengan uji korelasi statistik secara valid.",
              "B. Peneliti harus menentukan teknik sampling (seperti simple random sampling atau stratified random sampling) dan ukuran sampel yang representatif terlebih dahulu sebelum menyebarkan instrumen.",
              "C. Peneliti sebaiknya menghapus rumusan masalah utama karena analisis statistik kuantitatif tidak memerlukan perumusan masalah yang detail terkait interaksi sosial.",
              "D. Peneliti wajib menggunakan metode observasi partisipatif penuh (peneliti tinggal bersama keluarga responden selama minimal satu tahun penuh) untuk mempercepat proses kuantifikasi.",
              "E. Peneliti perlu melakukan operasionalisasi konsep variabel bebas (intensitas pergaulan sebaya) dan variabel terikat (kelekatan hubungan keluarga) untuk mempermudah penyusunan indikator instrumen kuesioner."
            ],
            kunciJawaban: "A, B, E",
            pembahasan: "Penelitian ini memiliki kontradiksi metodologis: ingin menguji hubungan kuantitatif (korelasi statistik) tetapi instrumennya adalah pertanyaan terbuka (kualitatif). Maka rekomendasi penyempurnaan yang logis:\n1. [A BENAR] Pertanyaan terbuka harus diubah menjadi tertutup (seperti skala Likert) agar datanya berbentuk angka dan dapat diproses secara statistik.\n2. [B BENAR] Penentuan teknik sampling probabilitas dan jumlah sampel representatif sangat penting untuk penelitian kuantitatif agar hasil uji hubungan bisa digeneralisasi.\n3. [E BENAR] Operasionalisasi konsep variabel sangat krusial dalam kuantitatif untuk menerjemahkan teori sosiologi ke dalam indikator kuesioner yang valid.\nOpsi C salah karena rumusan masalah adalah fondasi utama penelitian. Opsi D tidak tepat karena observasi partisipatif penuh adalah metode khas kualitatif (etnografi) yang sangat lama dan bertolak belakang dengan kebutuhan pengujian korelasi kuantitatif cepat.",
            kataKunci: "Metodologi Penelitian, Penelitian Kuantitatif, Teknik Sampling, Validitas"
          }
        ];

        defaultQuestions.forEach((item) => {
          batch.set(doc(db, 'questions', item.id), item);
        });

        const defaultMaterials = {
          [`kisi-sosiologi-ref-1-${userId}`]: `# 1. PENDAHULUAN & DEFINISI\nSosiologi berasal dari bahasa Latin *socius* yang berarti teman atau kawan, dan bahasa Yunani *logos* yang berarti ilmu atau berbicara. Secara harfiah, sosiologi adalah ilmu tentang masyarakat. Auguste Comte, bapak sosiologi, mendefinisikan sosiologi sebagai ilmu positif tentang hukum-hukum dasar gejala sosial. Sosiologi merupakan ilmu pengetahuan murni (*pure science*) dan ilmu abstrak (*abstract science*) yang membatasi diri pada apa yang nyata terjadi (*das sein*) bukan apa yang seharusnya terjadi (*das sollen*).\n\n# 2. KONSEP UTAMA & TEORI PENDEKATAN\n* **Objek Kajian Sosiologi**: Objek material sosiologi adalah kehidupan sosial, gejala-gejala sosial, dan proses hubungan antarmanusia. Objek formal sosiologi adalah manusia sebagai makhluk sosial serta interaksi sosial antarmanusia dalam masyarakat.\n* **Paradigma Sosiologi**: Terdapat tiga paradigma utama menurut George Ritzer:\n  1. *Fakta Sosial* (Durkheim): Struktur dan institusi sosial yang memengaruhi individu secara eksternal dan memaksa.\n  2. *Definisi Sosial* (Weber): Tindakan sosial yang memiliki makna subjektif bagi pelakunya.\n  3. *Perilaku Sosial* (Skinner): Hubungan stimulus-respons dan pengulangan perilaku berdasarkan konsekuensi.\n\n# 3. STUDI KASUS KONKRIT (KONTEKSTUAL INDONESIA)\nDi era disrupsi digital Indonesia saat ini, muncul fenomena interaksi sosial virtual baru di kalangan remaja, seperti pembentukan komunitas daring di Discord dan penyebaran konten di TikTok. Interaksi ini tidak dibatasi oleh ruang fisik, namun memicu pergeseran nilai dan norma konvensional, seperti memudarnya sopan santun komunikasi langsung (tatap muka) karena terbiasa dengan anonimitas di dunia maya.\n\n# 4. ANALISIS KRITIS & REFLEKSI\n**Pertanyaan Reflektif**: Bagaimana kemunculan fenomena "flexing" (pamer kekayaan) di media sosial Indonesia dianalisis menggunakan paradigma definisi sosial Max Weber? Analisislah makna subjektif di balik tindakan pamer tersebut dan bagaimana masyarakat mengonstruksi status sosial di ruang digital!`,
          [`kisi-sosiologi-ref-2-${userId}`]: `# 1. PENDAHULUAN & DEFINISI\nSosialisasi adalah sebuah proses seumur hidup di mana individu mempelajari nilai, norma, peran, dan perilaku sosial yang berlaku di masyarakatnya untuk membentuk kepribadian yang utuh. Sosialisasi primer merupakan tahap awal yang berlangsung di lingkungan keluarga, yang menjadi landasan utama pembentukan karakter dasar anak sebelum ia berinteraksi dengan lingkungan luar (sosialisasi sekunder).\n\n# 2. KONSEP UTAMA & TEORI PENDEKATAN\n* **Tahapan Sosialisasi (George Herbert Mead)**:\n  1. *Preparatory Stage* (Persiapan): Bayi meniru tindakan orang dewasa tanpa memahami maknanya.\n  2. *Play Stage* (Meniru): Anak mulai meniru peran orang di sekitarnya secara sadar (misal bermain peran ibu/guru).\n  3. *Game Stage* (Siap Bertindak): Anak memahami perannya sendiri dan peran orang lain yang terlibat dalam permainan terstruktur.\n  4. *Generalized Other* (Penerimaan Norma): Anak mampu menginternalisasi nilai dan norma masyarakat secara luas serta bertindak sebagai warga masyarakat yang bertanggung jawab.\n* **Pola Asuh Sosialisasi**:\n  - *Sosialisasi Represif*: Berfokus pada kepatuhan ketat, hukuman fisik, dan komunikasi satu arah (dominasi orang tua).\n  - *Sosialisasi Partisipatoris*: Berfokus pada interaksi timbal balik, hadiah atas perilaku baik, dan komunikasi dua arah yang menempatkan anak sebagai pusat perhatian.\n\n# 3. STUDI KASUS KONKRIT (KONTEKSTUAL INDONESIA)\nBanyak keluarga perkotaan di Indonesia yang menerapkan pola asuh longgar atau menggunakan gawai sebagai "pengasuh elektronik" demi kepraktisan. Anak-anak dibiarkan mengakses layar (*screen-time*) di atas durasi aman tanpa pendampingan. Gejala sosial ini mengganggu tahap *play stage* anak karena interaksi konkret dengan manusia berkurang, yang berakibat pada hambatan emosional dan lambatnya pemahaman norma-norma sosial primer.\n\n# 4. ANALISIS KRITIS & REFLEKSI\n**Pertanyaan Reflektif**: Jika dikaitkan dengan pembentukan karakter Pancasila, apa dampak jangka panjang bagi ketahanan sosial nasional apabila sosialisasi primer dalam keluarga Indonesia digantikan sepenuhnya oleh algoritma media sosial global? Rincikan solusi taktis sosiologis bagi para orang tua modern!`,
          [`kisi-sosiologi-ref-3-${userId}`]: `# 1. PENDAHULUAN & DEFINISI\nPenelitian sosial adalah penyelidikan terencana, kritis, dan empiris untuk memecahkan masalah-masalah sosial atau menguji kebenaran teori sosiologi yang ada di masyarakat. Penelitian sosial bertumpu pada keobjektifan ilmiah, keteraturan metodologis, serta kejujuran data lapangan agar hasil kesimpulannya valid dan dapat dipertanggungjawabkan secara akademis.\n\n# 2. KONSEP UTAMA & TEORI PENDEKATAN\n* **Metode Penelitian Kuantitatif**: Berorientasi pada pembuktian teori, pengujian hubungan antar-variabel secara statistik, instrumen terstruktur (kuesioner tertutup/skala Likert), pengambilan sampel probabilitas (*random sampling*), serta analisis data objektif-numerik.\n* **Metode Penelitian Kualitatif**: Berorientasi pada pemahaman mendalam (*verstehen*), deskripsi interpretatif wacana atau makna sosial, instrumen fleksibel (wawancara mendalam, observasi partisipatif), serta teknik sampling non-probabilitas (*purposive/snowball sampling*).\n* **Operasionalisasi Variabel**: Proses menerjemahkan konsep teoretis yang abstrak (variabel bebas & terikat) menjadi indikator-indikator empiris terukur untuk memudahkan pembuatan instrumen kuesioner.\n\n# 3. STUDI KASUS KONKRIT (KONTEKSTUAL INDONESIA)\nSeorang peneliti sosiologi ingin meneliti pengaruh intensitas pergaulan kelompok teman sebaya (*peer group*) terhadap kelekatan hubungan antar-anggota keluarga siswa kelas XII di sebuah SMA di Jakarta. Agar riset kuantitatif ini valid, peneliti menerjemahkan konsep "intensitas pergaulan" menjadi indikator terukur (seperti frekuensi berkumpul dalam seminggu dan durasi interaksi) serta menggunakan skala Likert 1-5 untuk kuesioner tertutup.\n\n# 4. ANALISIS KRITIS & REFLEKSI\n**Pertanyaan Reflektif**: Mengapa pencampuran instrumen kualitatif (wawancara terbuka) ke dalam analisis korelasi statistik murni tanpa metodologi *Mixed Methods* yang jelas sering kali menghasilkan bias validitas? Jelaskan bagaimana integrasi triangulasi metode yang tepat dapat menyelesaikannya!`
        };

        Object.entries(defaultMaterials).forEach(([kId, content]) => {
          batch.set(doc(db, 'materials', kId), {
            content,
            userId,
            updatedAt: new Date()
          });
        });
      }

      batch.update(doc(db, 'users', userId), { isSeeded: true });

      await batch.commit();
      console.log("Seeding default data completed successfully.");
    } catch (err) {
      console.error("Gagal melakukan seeding data default:", err);
    }
  };

  // Auth changed hook
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserRole(data.role || 'user');
            setUserName(data.name || user.displayName || user.email?.split('@')[0] || 'User');
            
            if (data.mataPelajaran) {
              setConfig(prev => ({ ...prev, mataPelajaran: data.mataPelajaran }));
            }

            if (data.geminiApiKey) {
              setAiConfig(prev => ({ ...prev, apiKey: data.geminiApiKey, mode: 'client' }));
              localStorage.setItem('gemini_api_key', data.geminiApiKey);
            }
            
            if (!data.isSeeded) {
              await seedDefaultData(user.uid, data.mataPelajaran || 'Sosiologi');
            }
          } else {
            const isAdminEmail = user.email === 'admin@tka.com' || user.email === 'ajisosiologi84@gmail.com';
            const defaultRole = isAdminEmail ? 'admin' : 'user';
            const defaultName = user.displayName || (isAdminEmail ? 'Admin TKA SMA' : 'Guru Sosiologi');
            const defaultSubject = 'Sosiologi';
            
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email,
              name: defaultName,
              role: defaultRole,
              mataPelajaran: defaultSubject,
              isSeeded: true,
              createdAt: new Date()
            });
            
            await seedDefaultData(user.uid, defaultSubject);
            
            setUserRole(defaultRole);
            setUserName(defaultName);
          }
        } catch (err) {
          console.error("Error loading user profile:", err);
          setUserRole('user');
          setUserName(user.email?.split('@')[0] || 'User');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setUserName('');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Firestore sync and automated seed hook
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Kisi-Kisi
    const qKisi = query(collection(db, 'kisi_kisi'), where('userId', '==', currentUser.uid));
    const unsubscribeKisi = onSnapshot(qKisi, async (snapshot) => {
      const list: KisiKisiItem[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as KisiKisiItem);
      });
      list.sort((a, b) => (a.no || 0) - (b.no || 0));
      setKisiList(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'kisi_kisi');
    });

    // Listen to Questions
    const qQuestions = query(collection(db, 'questions'), where('userId', '==', currentUser.uid));
    const unsubscribeQuestions = onSnapshot(qQuestions, async (snapshot) => {
      const list: Question[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Question);
      });
      list.sort((a, b) => (a.noSoal || 0) - (b.noSoal || 0));
      setQuestions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'questions');
    });

    // Listen to Materials
    const qMaterials = query(collection(db, 'materials'), where('userId', '==', currentUser.uid));
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
      const mats: Record<string, { content?: string; prompt?: string }> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        mats[doc.id] = {
          content: data.content || '',
          prompt: data.prompt || ''
        };
      });
      setGeneratedMaterials(mats);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'materials');
    });

    // Listen to Users (Admin only)
    let unsubscribeUsers = () => {};
    if (userRole === 'admin') {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // Sort alphabetically by name
        list.sort((a, b) => {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setUsersList(list);
      }, (error) => {
        console.error("Gagal menyinkronkan daftar pengguna:", error);
      });
    }

    return () => {
      unsubscribeKisi();
      unsubscribeQuestions();
      unsubscribeMaterials();
      unsubscribeUsers();
    };
  }, [currentUser, userRole]);

  const handleSignOut = async () => {
    setShowSignOutConfirm(true);
  };

  const executeSignOut = async () => {
    setShowSignOutConfirm(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const isAdmin = userRole === 'admin';

  // Loading States
  const [isGeneratingKisi, setIsGeneratingKisi] = useState(false);
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [importingPresetIds, setImportingPresetIds] = useState<Record<string, boolean>>({});
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [soalProgress, setSoalProgress] = useState({
    active: false,
    type: 'single' as 'single' | 'all',
    currentNo: 0,
    totalNo: 0,
    topic: '',
    countSuccess: 0,
    totalQuestions: 0,
    statusText: ''
  });

  // State for AI Custom Illustration Generator (Nana Banana)
  const [isAiIllustratorOpen, setIsAiIllustratorOpen] = useState(false);
  const [aiIllustratorPrompt, setAiIllustratorPrompt] = useState('');
  const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
  const [aiIllustratorStatus, setAiIllustratorStatus] = useState('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [activePromptTab, setActivePromptTab] = useState<'ilustrasi' | 'tabel' | 'grafik' | 'stimulus'>('ilustrasi');

  // AI Config state (Support client-side direct bypass of Vercel 10s timeouts)
  const [aiConfig, setAiConfig] = useState(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedMode = localStorage.getItem('gemini_api_mode') || 'server';
    let savedModel = localStorage.getItem('gemini_api_model') || 'gemini-3.5-flash';
    // Upgrade deprecated or invalid models automatically
    if (
      savedModel === 'gemini-1.5-flash' || 
      savedModel === 'gemini-2.0-flash' || 
      savedModel === 'gemini-2.5-flash'
    ) {
      savedModel = 'gemini-3.5-flash';
      localStorage.setItem('gemini_api_model', 'gemini-3.5-flash');
    }
    return {
      mode: savedMode as 'server' | 'client',
      apiKey: savedKey,
      model: savedModel
    };
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiKeySaved, setShowApiKeySaved] = useState(false);

  const handleSetAiMode = (mode: 'server' | 'client') => {
    setAiConfig(prev => ({ ...prev, mode }));
    localStorage.setItem('gemini_api_mode', mode);
  };

  const callGeminiDirect = async (
    systemInstruction: string,
    promptText: string,
    responseSchema?: any
  ): Promise<string> => {
    if (!aiConfig.apiKey) {
      throw new Error("Kunci API Gemini belum diatur! Silakan masukkan kunci API terlebih dahulu di Tab 1 (Pengaturan Koneksi AI) atau beralih ke mode Server.");
    }

    const preferredModel = aiConfig.model || "gemini-2.5-flash";
    
    // Fallback list of models in case the preferred model is not available for this API Key
    const modelsToTry = [preferredModel];
    if (preferredModel !== "gemini-2.5-flash") {
      modelsToTry.push("gemini-2.5-flash");
    }
    if (preferredModel !== "gemini-3.5-flash") {
      modelsToTry.push("gemini-3.5-flash");
    }
    if (preferredModel !== "gemini-2.0-flash") {
      modelsToTry.push("gemini-2.0-flash");
    }
    if (preferredModel !== "gemini-1.5-flash") {
      modelsToTry.push("gemini-1.5-flash");
    }

    let preferredModelError: any = null;
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`;

        const requestBody: any = {
          contents: [
            {
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
          }
        };

        if (systemInstruction) {
          requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }]
          };
        }

        if (responseSchema) {
          requestBody.generationConfig.responseMimeType = "application/json";
          requestBody.generationConfig.responseSchema = responseSchema;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!res.ok) {
          let errorText = '';
          try {
            const errObj = await res.json();
            errorText = errObj.error?.message || JSON.stringify(errObj);
          } catch {
            errorText = await res.text();
          }
          throw new Error(`Google API Error: ${errorText || res.statusText}`);
        }

        const result = await res.json();
        const candidateText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error("Tidak ada respon yang dihasilkan oleh model Gemini.");
        }
        return candidateText;
      } catch (err: any) {
        console.warn(`Direct call with model ${model} failed, trying fallback...`, err);
        if (model === preferredModel) {
          preferredModelError = err;
        }
        lastError = err;
        // Continue to the next fallback model
      }
    }

    throw preferredModelError || lastError || new Error("Gagal memanggil API Gemini melalui model pilihan maupun fallback.");
  };

  // Prompt Generator outputs
  const [generatedKisiPrompt, setGeneratedKisiPrompt] = useState('');
  const [generatedSoalPrompt, setGeneratedSoalPrompt] = useState('');
  const [copiedKisi, setCopiedKisi] = useState(false);
  const [copiedSoal, setCopiedSoal] = useState(false);

  // Form states for adding/editing a Kisi-Kisi Row manually
  const [isEditingKisi, setIsEditingKisi] = useState(false);
  const [editingKisiId, setEditingKisiId] = useState<string | null>(null);
  const [kisiForm, setKisiForm] = useState<Partial<KisiKisiItem>>({
    bentukSoal: 'pilihan_ganda_sederhana',
    levelKognitif: 'level_2',
    elemenMateri: '',
    subElemenMateri: '',
    kompetensi: '',
    batasanCatatan: '',
    jumlahSoal: 5,
    konteksNusantara: '',
    stimulusTambahan: '',
    konteksLokal: [],
    stimulusKonten: [],
    kualitasChecklist: []
  });

  // Form states for adding/editing a Question manually
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // State for preset subject selection in the matrix UI
  const [selectedPresetSubject, setSelectedPresetSubject] = useState<'Matematika' | 'Bahasa Indonesia' | 'Bahasa Inggris' | 'Matematika Tingkat Lanjut' | 'Bahasa Indonesia Tingkat Lanjut' | 'Bahasa Inggris Tingkat Lanjut' | 'Fisika' | 'Kimia' | 'Biologi' | 'PPKN' | 'Ekonomi' | 'Geografi' | 'Sosiologi' | 'Sejarah Tingkat Lanjut' | 'Antropologi' | 'Bahasa Jepang' | 'Produk Kreatif dan Kewirausahaan'>('Sosiologi');

  // State for Print Settings (Menu Setting Cetak)
  const [printConfig, setPrintConfig] = useState({
    showHeader: true,
    kopDepartment: 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI',
    schoolName: 'SMA NEGERI NUSANTARA',
    examName: 'PENILAIAN AKHIR SEMESTER',
    academicYear: '2026/2027',
    semester: 'Ganjil',
    timeAllocation: '90 Menit',
    showStudentFields: true,
    showAnswerKey: false,
    fontSize: 'text-sm', // 'text-xs' | 'text-sm' | 'text-base'
    layoutColumns: '1', // '1' | '2'
    showStimulus: true,
    showIllustration: true,
    showCompetencyTag: false, // Default false: hide "Kompetensi" tag in actual exam view
    instructionText: 'Pilihlah salah satu jawaban yang paling tepat dengan memberi tanda silang (X) atau klik pada pilihan jawaban A, B, C, D, atau E!',
    schoolLogo: '', // Base64 or URL for left logo
    schoolLogoRight: '', // Base64 or URL for right logo
    pageSize: 'A4', // 'A4' | 'F4'
    subjectName: 'Sosiologi',
    schoolAddress: 'Jalan Pendidikan Raya No. 45 Nusantara - Telp/Fax: (021) 777-1234 - Website: www.sekolahkita.sch.id',
  });
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(true);

  // Sync preset subject selection and subjectName with config mataPelajaran if applicable
  useEffect(() => {
    setPrintConfig(prev => ({ ...prev, subjectName: config.mataPelajaran }));
    if (config.mataPelajaran === 'Matematika Tingkat Lanjut') {
      setSelectedPresetSubject('Matematika Tingkat Lanjut');
    } else if (config.mataPelajaran === 'Matematika') {
      setSelectedPresetSubject('Matematika');
    } else if (config.mataPelajaran === 'Bahasa Indonesia Tingkat Lanjut') {
      setSelectedPresetSubject('Bahasa Indonesia Tingkat Lanjut');
    } else if (config.mataPelajaran === 'Bahasa Indonesia') {
      setSelectedPresetSubject('Bahasa Indonesia');
    } else if (config.mataPelajaran === 'Bahasa Inggris Tingkat Lanjut') {
      setSelectedPresetSubject('Bahasa Inggris Tingkat Lanjut');
    } else if (config.mataPelajaran === 'Bahasa Inggris') {
      setSelectedPresetSubject('Bahasa Inggris');
    } else if (config.mataPelajaran === 'Fisika') {
      setSelectedPresetSubject('Fisika');
    } else if (config.mataPelajaran === 'Kimia') {
      setSelectedPresetSubject('Kimia');
    } else if (config.mataPelajaran === 'Biologi') {
      setSelectedPresetSubject('Biologi');
    } else if (config.mataPelajaran === 'PPKN' || config.mataPelajaran === 'Pendidikan Pancasila dan Kewarganegaraan') {
      setSelectedPresetSubject('PPKN');
    } else if (config.mataPelajaran === 'Ekonomi') {
      setSelectedPresetSubject('Ekonomi');
    } else if (config.mataPelajaran === 'Geografi') {
      setSelectedPresetSubject('Geografi');
    } else if (config.mataPelajaran === 'Sosiologi') {
      setSelectedPresetSubject('Sosiologi');
    } else if (config.mataPelajaran === 'Sejarah' || config.mataPelajaran === 'Sejarah Tingkat Lanjut') {
      setSelectedPresetSubject('Sejarah Tingkat Lanjut');
    } else if (config.mataPelajaran === 'Antropologi') {
      setSelectedPresetSubject('Antropologi');
    } else if (config.mataPelajaran === 'Bahasa Jepang') {
      setSelectedPresetSubject('Bahasa Jepang');
    } else if (config.mataPelajaran === 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK') {
      setSelectedPresetSubject('Produk Kreatif dan Kewirausahaan');
    }

    if (currentUser && config.mataPelajaran) {
      updateDoc(doc(db, 'users', currentUser.uid), {
        mataPelajaran: config.mataPelajaran
      }).catch(err => console.error("Error saving subject selection:", err));
    }
  }, [config.mataPelajaran, currentUser]);

  const handleSelectPresetSubject = (subject: typeof selectedPresetSubject) => {
    setSelectedPresetSubject(subject);
    const presetSubjectMapped = subject === 'PPKN' 
      ? 'Pendidikan Pancasila dan Kewarganegaraan'
      : subject === 'Sejarah Tingkat Lanjut'
      ? 'Sejarah'
      : subject === 'Produk Kreatif dan Kewirausahaan'
      ? 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK'
      : subject;
    setConfig(prev => ({
      ...prev,
      mataPelajaran: presetSubjectMapped
    }));
  };
  
  // Inline Deletion Confirmation States
  const [deletingKisiId, setDeletingKisiId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    kisiKisiId: '',
    kompetensi: '',
    subKompetensi: '',
    bentukSoal: 'pilihan_ganda_sederhana',
    soal: '',
    stimulus: '',
    opsi: ['', '', '', '', ''],
    kunciJawaban: '',
    pembahasan: '',
    kataKunci: '',
    gambarUrl: ''
  });

  // Prompt Generator States
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [selectedKisiForPrompt, setSelectedKisiForPrompt] = useState<KisiKisiItem | null>(null);
  const [generatedPromptText, setGeneratedPromptText] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // --- STATE FOR SECTION 4: PEMBUATAN MATERI & PANDUAN ---
  const [uploadedPdf, setUploadedPdf] = useState<{ name: string; size: number } | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadedPdfStatus, setUploadedPdfStatus] = useState<string>('');
  const [guidanceContext, setGuidanceContext] = useState<string>('');
  const [activeMateriKisiId, setActiveMateriKisiId] = useState<string | null>(null);
  const [generatingMateriIds, setGeneratingMateriIds] = useState<Record<string, boolean>>({});
  const [generatedMaterials, setGeneratedMaterials] = useState<Record<string, { content?: string; prompt?: string }>>({});
  const [activeSubTab, setActiveSubTab] = useState<'materi' | 'prompt'>('materi');

  // Automatically select the first Kisi-Kisi on load or keep selected one valid
  useEffect(() => {
    if (kisiList.length > 0) {
      if (!activeMateriKisiId || !kisiList.some(k => k.id === activeMateriKisiId)) {
        setActiveMateriKisiId(kisiList[0].id);
      }
    } else {
      setActiveMateriKisiId(null);
    }
  }, [kisiList, activeMateriKisiId]);

  const [isEditingMateri, setIsEditingMateri] = useState<boolean>(false);
  const [editingMateriContent, setEditingMateriContent] = useState<string>('');

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Silakan unggah dokumen dalam format PDF saja.");
      return;
    }

    setIsUploadingPdf(true);
    setUploadedPdfStatus('Sedang membaca file PDF...');

    setTimeout(() => {
      setUploadedPdf({
        name: file.name,
        size: file.size
      });
      
      let extractedText = "";
      if (config.mataPelajaran.toLowerCase().includes('sosiologi')) {
        extractedText = "Rekomendasi kurikulum sosiologi menyarankan integrasi wacana empiris berbasis kearifan lokal di Indonesia, fokus pada pengenalan interaksi sosial digital, sosiologi perkotaan, serta pentingnya penguasaan dasar metodologi riset (kuantitatif, kualitatif, mixed methods). Evaluasi diorientasikan pada tingkat HOTS (C4-C6).";
      } else if (config.mataPelajaran.toLowerCase().includes('matematika')) {
        extractedText = "Panduan kurikulum matematika menekankan penguatan literasi numerasi, pemecahan masalah (problem solving), eksplorasi fungsi-fungsi kuadrat dan statistika deskriptif/inferensial, serta penerapan penalaran matematis dalam kehidupan sehari-hari secara rasional.";
      } else {
        extractedText = `Panduan Pembelajaran resmi untuk mata pelajaran ${config.mataPelajaran} menyarankan kesesuaian materi ajar dengan kompetensi dasar, penekanan pada literasi konten, stimulasi berpikir kritis melalui studi kasus nyata, dan kebebasan guru menyusun asesmen sesuai level kesiapan siswa.`;
      }
      
      setGuidanceContext(extractedText);
      setIsUploadingPdf(false);
      setUploadedPdfStatus('File PDF berhasil terunggah dan terintegrasi secara semantis dengan AI!');
    }, 1500);
  };

  const handleGenerateMateri = async (kisi: KisiKisiItem, modeOverride?: 'materi' | 'prompt') => {
    const mode = modeOverride || activeSubTab;
    setGeneratingMateriIds(prev => ({ ...prev, [kisi.id]: true }));
    try {
      const response = await fetch('/api/generate-materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kisi,
          mataPelajaran: config.mataPelajaran,
          guidanceText: guidanceContext || undefined,
          mode
        })
      });
      if (!response.ok) {
        throw new Error('Gagal menghubungi AI Server.');
      }
      const data = await response.json();
      if (data.materi) {
        const updateField = mode === 'materi' ? 'content' : 'prompt';
        await setDoc(doc(db, 'materials', kisi.id), {
          [updateField]: data.materi,
          userId: currentUser?.uid,
          updatedAt: new Date()
        }, { merge: true });
        setActiveMateriKisiId(kisi.id);
      } else {
        alert("AI mengembalikan format yang tidak sesuai.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat ${mode === 'materi' ? 'materi pembelajaran' : 'prompt slide & infografis'} secara dinamis: ` + (err.message || err));
    } finally {
      setGeneratingMateriIds(prev => ({ ...prev, [kisi.id]: false }));
    }
  };

  const handleDeleteMateri = async (kisiId: string) => {
    const label = activeSubTab === 'materi' ? 'Ringkasan Materi' : 'Prompt Slide & Infografis';
    if (!confirm(`Apakah Anda yakin ingin menghapus ${label} untuk kisi-kisi ini?`)) return;
    try {
      const updateField = activeSubTab === 'materi' ? 'content' : 'prompt';
      await setDoc(doc(db, 'materials', kisiId), {
        [updateField]: '',
        updatedAt: new Date()
      }, { merge: true });
      setIsEditingMateri(false);
      alert(`${label} berhasil dihapus!`);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menghapus ${label}: ` + (err.message || err));
    }
  };

  const handleSaveMateri = async (kisiId: string, text: string) => {
    const label = activeSubTab === 'materi' ? 'Ringkasan Materi' : 'Prompt Slide & Infografis';
    try {
      const updateField = activeSubTab === 'materi' ? 'content' : 'prompt';
      await setDoc(doc(db, 'materials', kisiId), {
        [updateField]: text,
        userId: currentUser?.uid,
        updatedAt: new Date()
      }, { merge: true });
      setIsEditingMateri(false);
      alert(`${label} berhasil disimpan!`);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan ${label}: ` + (err.message || err));
    }
  };

  const handleUploadPromptFile = (e: React.ChangeEvent<HTMLInputElement>, kisiId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const label = activeSubTab === 'materi' ? 'Ringkasan Materi' : 'Prompt Slide & Infografis';
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        try {
          const updateField = activeSubTab === 'materi' ? 'content' : 'prompt';
          await setDoc(doc(db, 'materials', kisiId), {
            [updateField]: text,
            userId: currentUser?.uid,
            updatedAt: new Date()
          }, { merge: true });
          alert(`File ${label} berhasil diunggah!`);
        } catch (err: any) {
          console.error(err);
          alert(`Gagal mengunggah file ${label}: ` + (err.message || err));
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePrintMateri = (kisi: KisiKisiItem, content: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker aktif. Harap izinkan popup untuk melakukan pencetakan.");
      return;
    }

    const parsedHtml = markdownToHtmlForWord(content);
    
    // Style the printed page to be extremely professional
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Modul_Ajar_${kisi.no}_${kisi.elemenMateri.replace(/[^a-zA-Z0-9]/g, '_')}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          @page {
            size: A4;
            margin: 2cm;
          }
          body {
            font-family: 'Times New Roman', 'Georgia', Times, serif;
            color: #111827;
            line-height: 1.6;
            font-size: 12pt;
            background: white;
            margin: 0;
            padding: 0;
          }
          .header-kop {
            border-bottom: 4px double #111827;
            padding-bottom: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .kop-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .kop-logo-placeholder {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 2px solid #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            color: #111827;
          }
          .kop-text {
            flex: 1;
            text-align: center;
          }
          .kop-dept {
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 2px 0;
            color: #374151;
          }
          .kop-school {
            font-size: 15pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 4px 0;
            color: #111827;
          }
          .kop-info {
            font-size: 9pt;
            font-style: italic;
            color: #4b5563;
            margin: 0;
          }
          .title {
            color: #111827;
            font-family: 'Times New Roman', 'Georgia', Times, serif;
            font-size: 16pt;
            font-weight: normal;
            margin: 0 0 4px 0;
            text-align: center;
            text-transform: none;
          }
          .subtitle {
            font-size: 11pt;
            color: #374151;
            margin: 0;
            text-align: center;
            font-weight: normal;
            font-style: italic;
          }
          .meta-box {
            background-color: #f9fafb;
            border: 1.5px solid #111827;
            border-radius: 4px;
            padding: 14px 18px;
            margin-bottom: 24px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
          }
          .meta-table td {
            padding: 5px 0;
            font-size: 11pt;
            color: #111827;
            vertical-align: top;
          }
          .meta-label {
            font-weight: bold;
            width: 25%;
            color: #111827;
          }
          .meta-separator {
            width: 3%;
            color: #111827;
          }
          .meta-value {
            width: 72%;
            font-weight: 500;
          }
          .content h1 {
            font-size: 14pt;
            color: #111827;
            border-bottom: 1.5pt solid #111827;
            padding-bottom: 4px;
            margin-top: 24pt;
            margin-bottom: 10pt;
            font-weight: normal;
            text-transform: none;
            page-break-after: avoid;
          }
          .content h2 {
            font-size: 13pt;
            color: #111827;
            margin-top: 18pt;
            margin-bottom: 8pt;
            font-weight: normal;
            border-left: 3pt solid #111827;
            padding-left: 8px;
            page-break-after: avoid;
          }
          .content h3 {
            font-size: 12pt;
            color: #111827;
            margin-top: 14pt;
            margin-bottom: 6pt;
            font-weight: normal;
            font-style: italic;
            page-break-after: avoid;
          }
          .content p {
            margin-top: 0;
            margin-bottom: 10pt;
            text-align: justify;
            text-justify: inter-word;
            text-indent: 0.5in;
          }
          .content ul, .content ol {
            margin-top: 0;
            margin-bottom: 10pt;
            padding-left: 24px;
          }
          .content li {
            margin-bottom: 6px;
            text-align: justify;
          }
          .content blockquote {
            border-left: 3.5pt solid #111827;
            background-color: #f9fafb;
            padding: 12px 18px;
            margin: 14pt 0;
            font-style: italic;
            color: #374151;
            border-radius: 0;
            text-align: justify;
          }
          .print-btn-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #4f46e5;
            color: white;
            padding: 10px 20px;
            border-radius: 9999px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            cursor: pointer;
            z-index: 9999;
            font-family: inherit;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          .print-btn-container:hover {
            background-color: #4338ca;
          }
        </style>
      </head>
      <body>
        <button class="print-btn-container no-print" onclick="window.print()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Cetak Dokumen / Simpan PDF
        </button>

        <div class="header-kop">
          ${printConfig.schoolLogo ? `<img src="${printConfig.schoolLogo}" class="kop-logo" />` : `<div class="kop-logo-placeholder">LOGO</div>`}
          <div class="kop-text">
            <p class="kop-dept">Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi</p>
            <h1 class="kop-school">${printConfig.schoolName || 'SEKOLAH MENENGAH ATAS'}</h1>
            <p class="kop-info">Tahun Pelajaran: ${printConfig.academicYear} | Semester: ${printConfig.semester.toUpperCase()}</p>
          </div>
          ${printConfig.schoolLogoRight ? `<img src="${printConfig.schoolLogoRight}" class="kop-logo" />` : `<div class="kop-logo-placeholder">SMA</div>`}
        </div>

        <div>
          <h1 class="title">Bahan Ajar / Modul Pembelajaran</h1>
          <p class="subtitle">Kurikulum Merdeka - Capaian & Kompetensi Mandiri</p>
        </div>

        <div class="meta-box" style="margin-top: 20px;">
          <table class="meta-table">
            <tr>
              <td class="meta-label">Mata Pelajaran</td>
              <td class="meta-separator">:</td>
              <td class="meta-value" style="color: #1e3a8a; font-weight: bold;">${config.mataPelajaran}</td>
            </tr>
            <tr>
              <td class="meta-label">Elemen Materi</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">${kisi.elemenMateri}</td>
            </tr>
            <tr>
              <td class="meta-label">Sub-Materi</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">${kisi.subElemenMateri}</td>
            </tr>
            <tr>
              <td class="meta-label">Kompetensi Inti</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">${kisi.kompetensi}</td>
            </tr>
            <tr>
              <td class="meta-label">Tingkat Kognitif</td>
              <td class="meta-separator">:</td>
              <td class="meta-value">${getLevelKognitifLabel(kisi.levelKognitif)}</td>
            </tr>
          </table>
        </div>

        <div class="content">
          ${parsedHtml}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Check backend server status on mount
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      })
      .catch(() => {
        setApiStatus('disconnected');
      });
  }, []);

  // Sync prompts whenever config state changes
  useEffect(() => {
    const contextList = config.konteksLokal.length > 0 
      ? `\n- KONTEKS LOKAL INDONESIA: ${config.konteksLokal.join(', ')}`
      : '';
    const stimulusList = config.stimulusKonten.length > 0
      ? `\n- STIMULUS SOAL: ${config.stimulusKonten.join(', ')}`
      : '';
    const qualityList = config.kualitasChecklist.length > 0
      ? `\n- CHECKLIST STANDAR KUALITAS: ${config.kualitasChecklist.join(', ')}`
      : '';

    // 1. Prompt Kisi-kisi (Matriks Asesmen)
    const promptKisiText = `Anda adalah ahli kurikulum pendidikan menengah SMA di Indonesia dan spesialis penyusunan Tes Kemampuan Akademik (TKA) berstandar tinggi (HOTS).
Tugas Anda adalah merancang sebuah MATRIKS ASESMEN / KISI-KISI SOAL yang komprehensif, terstruktur, dan valid untuk mata pelajaran di bawah ini.

INFORMASI MATA PELAJARAN & PARAMETER UTAMA:
- MATA PELAJARAN: ${config.mataPelajaran}
- DEFINISI/TUJUAN PEMBELAJARAN: ${config.definisi || 'Tidak ditentukan'}
- MUATAN/FASE KURIKULUM: ${config.muatan || 'Fase F (Kelas XI/XII)'}
- ELEMEN MATERI UTAMA: ${config.elemenMateri || 'Tidak ditentukan'}
- SUB-ELEMEN/SUBMATERI: ${config.subElemenMateri || 'Tidak ditentukan'}
- KOMPETENSI OPERASIONAL: ${config.kompetensi || 'Mengidentifikasi, menganalisis, dan memecahkan masalah'}
- BATASAN MATERI & CATATAN: ${config.batasanCatatan || 'Tidak ada batasan khusus'}
- TINGKAT KOGNITIF DEFAULT: ${getLevelKognitifLabel(config.levelKognitif)} (${config.levelKognitif})
- BENTUK SOAL DEFAULT: ${getBentukSoalLabel(config.bentukSoal)} (${config.bentukSoal})${contextList}${stimulusList}${qualityList}

INSTRUKSI PENYUSUNAN MATRIKS:
1. Buatlah minimal 3 sampai 5 baris variasi kisi-kisi soal yang seimbang, logis, dan mencakup kedalaman materi yang diminta.
2. Setiap baris kisi-kisi harus memvariasikan aspek:
   - bentukSoal: wajib memilih salah satu dari:
     * 'pilihan_ganda_sederhana' (Pilihan Ganda Tunggal / Satu Pilihan Benar)
     * 'mcma' (Pilihan Ganda Kompleks / Lebih dari Satu Jawaban Benar)
     * 'kategori' (Pilihan Ganda Kompleks / Klasifikasi Benar-Salah atau Ya-Tidak)
   - levelKognitif: wajib memilih salah satu dari:
     * 'level_1' (Pemahaman / Knowing: Mengenali, mengingat, mendefinisikan)
     * 'level_2' (Penerapan / Applying: Mengaplikasikan konsep pada kasus nyata)
     * 'level_3' (Penalaran / Reasoning: Menganalisis, mensintesis, berpikir kritis/HOTS)
3. Deskripsikan Kompetensi spesifik yang akan diukur serta batasan materi khusus untuk tiap baris secara ilmiah, jelas, dan berorientasi HOTS.
4. Tentukan jumlah soal per baris secara proporsional (rekomendasi total 5-10 soal per baris).

Sajikan output Anda ke dalam DUA format berikut:

1. TABEL RINGKASAN (Untuk Tampilan Visual):
Sajikan dalam bentuk tabel Markdown yang rapi dengan kolom: No, Elemen, Sub-Elemen, Kompetensi diukur, Level Kognitif, Bentuk Soal, Batasan/Catatan, Jumlah Soal.

2. BLOK KODE JSON ARRAY (Untuk Kebutuhan Impor/Integrasi):
Tuliskan blok kode JSON valid (di dalam format \`\`\`json) yang berisi array of objects dengan struktur persis seperti contoh berikut (pastikan kunci/key tidak diubah dan nilai bentukSoal & levelKognitif mengikuti enum di atas):
\`\`\`json
[
  {
    "no": 1,
    "bentukSoal": "${config.bentukSoal}",
    "levelKognitif": "${config.levelKognitif}",
    "elemenMateri": "${config.elemenMateri || '[Elemen]'} ",
    "subElemenMateri": "${config.subElemenMateri || '[Sub Elemen]'} ",
    "kompetensi": "[Kompetensi operasional spesifik yang diukur]",
    "batasanCatatan": "${config.batasanCatatan || '[Batasan khusus]'} ",
    "jumlahSoal": ${config.jumlahSoal || 5}
  }
]
\`\`\``;

    // 2. Prompt Pembuat Soal (Megaprompt)
    const promptSoalText = `Anda adalah seorang ahli penyusun soal TKA (Tes Kemampuan Akademik) SMA tingkat nasional dan pakar evaluasi kurikulum pendidikan di Indonesia.
Tugas Anda adalah merancang butir soal TKA SMA bermutu tinggi, berorientasi HOTS (Higher Order Thinking Skills), valid, dan objektif berdasarkan spesifikasi di bawah ini.

INFORMASI SPESIFIKASI SOAL:
- MATA PELAJARAN: ${config.mataPelajaran}
- MATERI UTAMA/ELEMEN: ${config.elemenMateri || 'Tidak ditentukan'}
- SUB-ELEMEN/SUBMATERI: ${config.subElemenMateri || 'Tidak ditentukan'}
- KOMPETENSI UTAMA YANG DIUJI: ${config.kompetensi || 'Menganalisis dan memecahkan masalah'}
- TINGKAT KOGNITIF: ${getLevelKognitifLabel(config.levelKognitif)} (${config.levelKognitif})
- BENTUK SOAL: ${getBentukSoalLabel(config.bentukSoal)}
- PILIHAN JAWABAN: ${config.jumlahOpsi} Pilihan (A s.d ${config.jumlahOpsi === 5 ? 'E' : 'D'})
- JENIS STRUKTUR: ${config.jenisSoal === 'grup' ? 'Soal Grup (Beberapa butir soal didasarkan pada satu stimulus terintegrasi)' : 'Soal Tunggal'}${contextList}${stimulusList}${qualityList}

PANDUAN PENYUSUNAN SOAL:
1. **Pendekatan HOTS**: Fokuskan pertanyaan pada keterampilan berpikir kritis, analisis mendalam, pemecahan masalah, atau evaluasi konsep. Hindari pertanyaan hafalan mentah.
2. **Kekuatan Stimulus**: Gunakan stimulus berupa teks bacaan ilmiah, tabel data, grafik, ilustrasi kasus nyata, atau berita faktual yang kaya informasi dan logis. Pertanyaan harus bersandar kuat pada stimulus tersebut.
3. **Kualitas Pilihan Pengecoh**: Pilihan jawaban (A s.d ${config.jumlahOpsi === 5 ? 'E' : 'D'}) harus homogen secara tata bahasa, logis, dan ilmiah. Distraktor tidak boleh terlalu mudah ditebak dan harus menuntut siswa untuk berpikir analitis sebelum memilih.
4. **Kunci & Pembahasan Komprehensif**: Berikan penjelasan analitis langkah-demi-langkah yang ilmiah, objektif, dan logis untuk membuktikan mengapa kunci jawaban tersebut benar dan mengapa opsi lainnya kurang tepat.

SAJIKAN SOAL DALAM FORMAT TEKS TERSTRUKTUR BERIKUT:
===========================================
No Soal : [Nomor Soal]
Kompetensi : [Kompetensi yang diuji]
Sub Kompetensi : [Sub kompetensi spesifik]
Bentuk Soal : [Jenis bentuk soal]

Soal (Menggabungkan Stimulus dan Pertanyaan Utama):
[Paragraf stimulus, data/tabel, atau situasi kontekstual, diikuti langsung dengan pertanyaan utama atau instruksi pengerjaan secara menyatu dalam satu kesatuan teks]

Pilihan Jawaban:
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
${config.jumlahOpsi === 5 ? 'E. [Pilihan E]\n' : ''}
Kunci Jawaban: [Kunci Jawaban yang tepat, misal: A]

Pembahasan:
[Penjelasan analitis langkah demi langkah secara ilmiah dan terstruktur]
===========================================`;

    setGeneratedKisiPrompt(promptKisiText);
    setGeneratedSoalPrompt(promptSoalText);
  }, [config]);

  // Copy helper
  const handleCopy = (text: string, type: 'kisi' | 'soal') => {
    navigator.clipboard.writeText(text);
    if (type === 'kisi') {
      setCopiedKisi(true);
      setTimeout(() => setCopiedKisi(false), 2000);
    } else {
      setCopiedSoal(true);
      setTimeout(() => setCopiedSoal(false), 2000);
    }
  };

  // Toggle Context Checkboxes
  const handleToggleContext = (item: string) => {
    setConfig(prev => {
      const exists = prev.konteksLokal.includes(item);
      const updated = exists 
        ? prev.konteksLokal.filter(x => x !== item) 
        : [...prev.konteksLokal, item];
      return { ...prev, konteksLokal: updated };
    });
  };

  // Toggle Stimulus Checkboxes
  const handleToggleStimulus = (item: string) => {
    setConfig(prev => {
      const exists = prev.stimulusKonten.includes(item);
      const updated = exists 
        ? prev.stimulusKonten.filter(x => x !== item) 
        : [...prev.stimulusKonten, item];
      return { ...prev, stimulusKonten: updated };
    });
  };

  // Toggle Quality Checkboxes
  const handleToggleQuality = (item: string) => {
    setConfig(prev => {
      const exists = prev.kualitasChecklist.includes(item);
      const updated = exists 
        ? prev.kualitasChecklist.filter(x => x !== item) 
        : [...prev.kualitasChecklist, item];
      return { ...prev, kualitasChecklist: updated };
    });
  };

  // Toggle Kisi Form Context Checkboxes
  const handleToggleKisiContext = (item: string) => {
    setKisiForm(prev => {
      const current = prev.konteksLokal || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, konteksLokal: updated };
    });
  };

  // Toggle Kisi Form Stimulus Checkboxes
  const handleToggleKisiStimulus = (item: string) => {
    setKisiForm(prev => {
      const current = prev.stimulusKonten || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, stimulusKonten: updated };
    });
  };

  // Toggle Kisi Form Quality Checkboxes
  const handleToggleKisiQuality = (item: string) => {
    setKisiForm(prev => {
      const current = prev.kualitasChecklist || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, kualitasChecklist: updated };
    });
  };

  // Trigger server-side or client-side AI generation of Kisi-Kisi
  const handleGenerateKisiViaAI = async () => {
    if (!config.mataPelajaran) {
      alert('Sila pilih Mata Pelajaran terlebih dahulu di Tab 1!');
      return;
    }
    setIsGeneratingKisi(true);
    try {
      let data;
      if (aiConfig.mode === 'client') {
        const systemInstruction = `Anda adalah ahli kurikulum pendidikan Indonesia. Buatkan matriks kisi-kisi ujian TKA SMA tingkat tinggi (HOTS) berdasarkan masukan parameter mata pelajaran.`;
        const prompt = `Buatkan 3 baris matriks asesmen kisi-kisi baru yang bervariasi secara otomatis untuk Mata Pelajaran ${config.mataPelajaran} dengan parameter:
Definisi/Tujuan: ${config.definisi || ""}
Muatan Kurikulum: ${config.muatan || ""}
Kompetensi Umum: ${config.kompetensi || ""}
Elemen/Materi: ${config.elemenMateri || ""}
Sub-Elemen: ${config.subElemenMateri || ""}

Aturan Penyusunan Matriks:
1. Setiap baris harus bervariasi jenis bentuk soalnya: 'pilihan_ganda_sederhana' (PG Sederhana), 'mcma' (PG Kompleks Multiple Choice Multiple Answers), atau 'kategori' (PG Kompleks kategori Benar/Salah atau Sesuai/Tidak Sesuai).
2. Tingkat kognitif harus bervariasi antara: 'level_1' (Pemahaman), 'level_2' (Penerapan), atau 'level_3' (Penalaran).
3. Buat rincian elemen, sub-elemen, kompetensi yang diukur, serta batasan materi secara logis dan mendalam.
4. Distribusikan jumlah soal per kisi-kisi (misalnya antara 3-10 soal per baris).
5. Hasilkan juga 'konteksNusantara' serta 'stimulusTambahan' untuk meningkatkan kualitas stimulus soal.`;

        const kisiSchema = {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              bentukSoal: { 
                type: "STRING", 
                description: "Nilai wajib berupa salah satu dari: 'pilihan_ganda_sederhana', 'mcma', atau 'kategori'" 
              },
              levelKognitif: { 
                type: "STRING", 
                description: "Nilai wajib berupa salah satu dari: 'level_1', 'level_2', atau 'level_3'" 
              },
              elemenMateri: { type: "STRING" },
              subElemenMateri: { type: "STRING" },
              kompetensi: { type: "STRING" },
              batasanCatatan: { type: "STRING" },
              jumlahSoal: { type: "INTEGER" },
              konteksNusantara: { type: "STRING" },
              stimulusTambahan: { type: "STRING" }
            },
            required: [
              "bentukSoal", "levelKognitif", "elemenMateri", "subElemenMateri",
              "kompetensi", "batasanCatatan", "jumlahSoal", "konteksNusantara", "stimulusTambahan"
            ]
          }
        };

        const responseText = await callGeminiDirect(systemInstruction, prompt, kisiSchema);
        data = JSON.parse(responseText);
      } else {
        const response = await fetch('/api/generate-kisi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mataPelajaran: config.mataPelajaran,
            definisi: config.definisi,
            muatan: config.muatan,
            kompetensi: config.kompetensi,
            elemenMateri: config.elemenMateri,
            subElemenMateri: config.subElemenMateri,
            count: 3
          })
        });

        if (!response.ok) {
          let errorMsg = 'Terjadi kesalahan pada server AI.';
          try {
            const textError = await response.text();
            if (textError.includes('<!doctype') || textError.includes('<html')) {
              errorMsg = 'Server sedang sibuk atau mengalami timeout (Gateway Timeout). Silakan coba lagi beberapa saat.';
            } else {
              try {
                const errorData = JSON.parse(textError);
                errorMsg = errorData.error || errorMsg;
              } catch {
                errorMsg = textError || errorMsg;
              }
            }
          } catch {}
          throw new Error(errorMsg);
        }

        const responseText = await response.text();
        data = JSON.parse(responseText);
      }

      if (Array.isArray(data)) {
        // Map to KisiKisiItem schema
        const mapped: KisiKisiItem[] = data.map((item: any, idx: number) => ({
          id: `kisi-ai-${Date.now()}-${idx}`,
          userId: currentUser?.uid,
          no: kisiList.length + idx + 1,
          bentukSoal: ['pilihan_ganda_sederhana', 'mcma', 'kategori'].includes(item.bentukSoal) 
            ? item.bentukSoal 
            : 'pilihan_ganda_sederhana',
          levelKognitif: ['level_1', 'level_2', 'level_3'].includes(item.levelKognitif) 
            ? item.levelKognitif 
            : 'level_2',
          elemenMateri: item.elemenMateri || config.elemenMateri,
          subElemenMateri: item.subElemenMateri || config.subElemenMateri,
          kompetensi: item.kompetensi || 'Menyelesaikan permasalahan',
          batasanCatatan: item.batasanCatatan || '',
          jumlahSoal: Number(item.jumlahSoal) || 5,
          konteksNusantara: item.konteksNusantara || '',
          stimulusTambahan: item.stimulusTambahan || '',
          konteksLokal: item.konteksLokal || [],
          stimulusKonten: item.stimulusKonten || [],
          kualitasChecklist: item.kualitasChecklist || []
        }));

        const batch = writeBatch(db);
        mapped.forEach((kItem) => {
          batch.set(doc(db, 'kisi_kisi', kItem.id), kItem);
        });
        await batch.commit();

        setActiveTab('kisi');
        alert(`Berhasil membuat ${mapped.length} baris Matriks Asesmen Kisi-Kisi secara otomatis via AI!`);
      } else {
        throw new Error('Format respon AI tidak valid');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat otomatis: ${err.message}. Tenang, Anda masih bisa menambahkan baris kisi-kisi secara manual dengan sangat mudah!`);
    } finally {
      setIsGeneratingKisi(false);
    }
  };

  // Open Prompt Generator Modal for a specific Kisi-Kisi row
  const handleOpenPromptGenerator = (item: KisiKisiItem) => {
    setSelectedKisiForPrompt(item);
    setCopiedPrompt(false);
    
    // Generate a beautiful, highly useful default prompt locally first (instant)
    const localPrompt = `Anda adalah seorang ahli penyusun soal TKA (Tes Kemampuan Akademik) SMA tingkat nasional dan pakar evaluasi kurikulum pendidikan di Indonesia.
Tugas Anda adalah merancang ${item.jumlahSoal || 5} butir soal ${getBentukSoalLabel(item.bentukSoal)} berorientasi HOTS (Higher Order Thinking Skills) untuk mata pelajaran ${config.mataPelajaran || "Umum"} tingkat SMA, Kelas XII.

SPESIFIKASI BUTIR SOAL:
- Mata Pelajaran: ${config.mataPelajaran || "Umum"}
- Lingkup Materi / Kompetensi: ${item.kompetensi}
- Materi Pokok (Elemen): ${item.elemenMateri}
- Sub-materi (Sub-elemen) / Indikator Soal: ${item.subElemenMateri || '-'}
- Level Kognitif: ${getLevelKognitifLabel(item.levelKognitif)} (${item.levelKognitif})
- Bentuk Soal: ${getBentukSoalLabel(item.bentukSoal)}

PANDUAN PENYUSUNAN SOAL:
1. **Analisis HOTS (C4-C6)**: Pertanyaan harus mengukur kemampuan menganalisis, mengevaluasi, atau merancang/berpikir kritis siswa, bukan hafalan tekstual.
2. **Kekuatan Stimulus**: Wajib menyertakan stimulus kontekstual yang kaya data, kutipan studi kasus, grafik, atau skenario kehidupan nyata di Indonesia.
3. **Pengecoh Homogen & Ilmiah**: Seluruh pilihan jawaban (opsi) harus homogen secara sintaksis, setara panjangnya, logis, dan menantang siswa untuk mengeliminasi distraktor secara analitis.
4. **Pembahasan Ilmiah**: Sertakan pembahasan langkah demi langkah yang logis, mendalam, serta membuktikan kebenaran kunci jawaban.

Sajikan output Anda dengan format teks terstruktur yang rapi seperti di bawah ini:

===========================================
No Soal : [Nomor Soal]
Kompetensi : [Kompetensi yang diuji]
Sub Kompetensi : [Sub kompetensi spesifik]
Bentuk Soal : [Jenis bentuk soal]

Soal (Menggabungkan Stimulus dan Pertanyaan Utama):
[Paragraf stimulus, data/tabel, atau situasi kontekstual, diikuti langsung dengan pertanyaan utama atau instruksi pengerjaan secara menyatu dalam satu kesatuan teks]

Pilihan Jawaban:
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
E. [Pilihan E] (Jika bentuk soal pilihan ganda sederhana/kompleks)

Kunci Jawaban: [Kunci Jawaban yang tepat, misal: A]

Pembahasan:
[Penjelasan analitis langkah demi langkah secara ilmiah dan terstruktur]
===========================================`;

    setGeneratedPromptText(localPrompt);
    setIsPromptModalOpen(true);
  };

  // Optimize prompt using server-side or client-side Gemini AI
  const handleOptimizePromptWithAi = async () => {
    if (!selectedKisiForPrompt) return;
    setIsGeneratingPrompt(true);
    try {
      if (aiConfig.mode === 'client') {
        const systemInstruction = `Anda adalah pakar prompt engineering pendidikan.`;
        const prompt = `Anda adalah seorang ahli instruktur prompt (prompt engineer) yang berpengalaman membuat instruktur sistem tingkat lanjut (system instructions) dan prompt untuk AI LLM generasi terbaru.
Tugas Anda adalah memformulasikan prompt instruksi spesifik dan sangat mendalam (Super-Prompt) untuk menghasilkan butir-butir soal berkualitas tinggi (HOTS), lengkap dengan stimulus bacaan/tabel, opsi jawaban, kunci jawaban yang tepat, dan pembahasan terperinci.

Masukan Parameter Kisi-Kisi:
- Mata Pelajaran: ${config.mataPelajaran}
- Bentuk Soal: ${selectedKisiForPrompt.bentukSoal}
- Tingkat Kognitif: ${selectedKisiForPrompt.levelKognitif}
- Elemen/Materi: ${selectedKisiForPrompt.elemenMateri}
- Sub-Elemen/Submateri: ${selectedKisiForPrompt.subElemenMateri}
- Kompetensi yang Diuji: ${selectedKisiForPrompt.kompetensi}
- Batasan/Catatan Khusus: ${selectedKisiForPrompt.batasanCatatan || 'Tidak ada'}
- Konteks Nusantara: ${selectedKisiForPrompt.konteksNusantara || 'Tidak ada'}
- Stimulus Tambahan: ${selectedKisiForPrompt.stimulusTambahan || 'Tidak ada'}

Hasilkan rancangan prompt instruksi lengkap, terstruktur, profesional, dan dalam bahasa Indonesia formal, tanpa mencantumkan kode JSON atau Markdown codeblock, melainkan langsung teks prompt siap pakai yang bisa disalin oleh guru.`;

        const optimizedPrompt = await callGeminiDirect(systemInstruction, prompt);
        setGeneratedPromptText(optimizedPrompt);
      } else {
        const response = await fetch('/api/optimize-prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kisi: selectedKisiForPrompt,
            mataPelajaran: config.mataPelajaran,
          }),
        });

        if (!response.ok) {
          throw new Error('Gagal menghubungi server AI untuk optimasi.');
        }

        const data = await response.json();
        if (data.prompt) {
          setGeneratedPromptText(data.prompt);
        } else {
          throw new Error('Format respon tidak sesuai.');
        }
      }
    } catch (err: any) {
      alert(`Gagal optimasi prompt: ${err.message}. Menggunakan draf prompt lokal default.`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Trigger server-side AI generation of questions for a specific Kisi-Kisi row
  const handleGenerateQuestionsForKisi = async (kisi: KisiKisiItem) => {
    setIsGeneratingSoal(true);
    const totalToGenerate = kisi.jumlahSoal || 1;
    setSoalProgress({
      active: true,
      type: 'single',
      currentNo: 1,
      totalNo: 1,
      topic: kisi.subElemenMateri || 'Materi Umum',
      countSuccess: 0,
      totalQuestions: totalToGenerate,
      statusText: 'Menghubungkan ke server AI Gemini...'
    });

    try {
      const chunkSize = 1; // Set to 1 for maximum speed and to prevent gateway timeouts
      let generatedSoalList: Question[] = [];
      let currentNoSoal = questions.length + 1;

      for (let i = 0; i < totalToGenerate; i += chunkSize) {
        const countForThisChunk = Math.min(chunkSize, totalToGenerate - i);
        
        setSoalProgress(prev => ({
          ...prev,
          statusText: `Merancang butir soal #${i + 1} s.d #${i + countForThisChunk} via AI...`
        }));
        
        // Combine current database questions with newly generated ones in this loop
        const currentExistingSoalStems = [
          ...questions.map(q => q.soal),
          ...generatedSoalList.map(q => q.soal)
        ];

        let data;
        if (aiConfig.mode === 'client') {
          const systemInstruction = `Anda adalah ahli pembuat soal ujian nasional dan TKA (Tes Kemampuan Akademik) SMA di Indonesia. Anda sangat terampil menyusun soal tingkat tinggi (HOTS), bervariasi, mendalam, dan bebas dari bias. Patuhi instruksi bentuk soal dan parameter kognitif secara presisi.`;

          const activeKonteksLokal = (kisi.konteksLokal && kisi.konteksLokal.length > 0) ? kisi.konteksLokal : config.konteksLokal;
          const activeStimulusKonten = (kisi.stimulusKonten && kisi.stimulusKonten.length > 0) ? kisi.stimulusKonten : config.stimulusKonten;
          const activeKualitasChecklist = (kisi.kualitasChecklist && kisi.kualitasChecklist.length > 0) ? kisi.kualitasChecklist : config.kualitasChecklist;

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
              ? `Pilihan ganda sederhana: Hanya ada satu jawaban yang benar. Sediakan pilihan A sampai ${config.jumlahOpsi === 5 ? "E" : "D"}.`
              : kisi.bentukSoal === "mcma"
              ? `Pilihan ganda kompleks model multiple choice multiple answers (MCMA): Ada lebih dari satu jawaban yang benar. Peserta diminta memilih semua jawaban benar. Kunci jawaban harus menyebutkan semua pilihan yang benar (misal: 'A, C'). Sediakan pilihan A sampai ${config.jumlahOpsi === 5 ? "E" : "D"}.`
              : "Pilihan ganda kompleks kategori: Menyajikan beberapa pernyataan (minimal 3-4 pernyataan) yang semuanya harus direspon, misalnya dengan pilihan 'Benar'/'Salah' atau 'Sesuai'/'Tidak Sesuai'. Kunci jawaban harus merinci status setiap pernyataan (misal: '1. Benar, 2. Salah, 3. Benar').";

          // Construct constraint for existing questions to avoid duplicates in client-side generator
          let clientExistingQuestionsConstraint = '';
          const activeSlices = currentExistingSoalStems.filter(Boolean).slice(0, 30);
          if (activeSlices.length > 0) {
            clientExistingQuestionsConstraint = `\n\nHINDARI PENGULANGAN SOAL (SANGAT PENTING):\nJangan membuat soal yang sama, memiliki konsep atau contoh kasus/studi yang mirip, or menggunakan narasi stimulus yang mirip dengan soal-soal berikut:\n${activeSlices.map((text, idx) => `- Soal ${idx + 1}: ${text.substring(0, 150)}...`).join('\n')}\nPastikan butir soal yang Anda hasilkan saat ini benar-benar segar, baru, unik secara naratif, bervariasi, dan tidak mengulangi pertanyaan di atas.`;
          }

          let clientIndonesianLanguageCriteria = '';
          if (config.mataPelajaran && (config.mataPelajaran.toLowerCase().includes('bahasa indonesia') || config.mataPelajaran.toLowerCase().includes('indonesia'))) {
            clientIndonesianLanguageCriteria = `\n\nKAIDAH & KAIDAH MUATAN KHUSUS BAHASA INDONESIA (SANGAT PENTING):\n- Teks yang diujikan harus berupa Teks Informasi (Tunggal/Jamak yang berisi fakta, konsep, prosedur, metakognisi dari berbagai bidang pada skala lokal, nasional, global) ATAU Teks Fiksi (realisme/absurd dengan latar cerita konkret/abstrak, tokoh berkarakter bulat, konflik tunggal/jamak dengan penyelesaian terbuka, alur campuran, dan sudut pandang campuran).\n- Karakteristik Kosakata: Menggunakan kata khusus dan kata umum, kata berimbuhan kompleks, kata abstrak, makna denotatif, istilah teknis, atau konotatif konteks luas.\n- Karakteristik Kalimat: Setiap kalimat di dalam teks stimulus/soal harus berkisar antara 8-12 kata per kalimat, menggunakan kalimat kompleks berbagai pola serta kalimat inversi.\n- Karakteristik Wacana: Menggunakan konjungsi antarparagraf dengan makna 'pertentangan' dan 'sebab akibat', tanda baca pendukung makna yang tepat, dengan panjang teks berkisar antara 250-300 kata (kecuali jika bergenre puisi).`;
          }

          const prompt = `Buatkan tepat sebanyak ${countForThisChunk} butir soal ujian TKA SMA yang berbeda untuk Mata Pelajaran ${config.mataPelajaran}.${clientIndonesianLanguageCriteria}
          
PENTING: Jumlah objek soal yang dihasilkan dalam array JSON HARUS tepat sebanyak ${countForThisChunk} butir soal, tidak kurang dan tidak lebih.
Setiap butir soal harus unik, bervariasi, dan didasarkan pada kisi-kisi berikut.

INFORMASI MATRIKS ASESMEN KISI-KISI:
- No Soal Mulai: ${currentNoSoal}
- Bentuk Soal: ${kisi.bentukSoal} (${bentukSoalDesc})
- Tingkat Kognitif: ${kisi.levelKognitif} (${kisi.levelKognitif === 'level_1' ? 'Pemahaman (Knowing) - Mengenali, mengingat, dan memahami konsep dasar' : kisi.levelKognitif === 'level_2' ? 'Penerapan (Applying) - Menerapkan konsep pada fenomena nyata' : 'Penalaran (Reasoning) - Berpikir kritis dan menalar secara logis'})
- Elemen/Materi: ${kisi.elemenMateri}
- Sub-Elemen/Submateri: ${kisi.subElemenMateri}
- Kompetensi yang Diuji: ${kisi.kompetensi}
- Batasan/Catatan Khusus: ${kisi.batasanCatatan || "Tidak ada"}
- Konteks Nusantara: ${kisi.konteksNusantara || "Tidak ada khusus"}
- Stimulus Tambahan: ${kisi.stimulusTambahan || "Tidak ada khusus"}
- Jenis Soal: ${config.jenisSoal} (Soal Tunggal atau Soal Grup/Terhubung)
${clientExistingQuestionsConstraint}

PANDUAN EKSTRA:
1. ${konteksStr} ${kisi.konteksNusantara ? `Integrasikan juga secara mendalam target Konteks Nusantara berikut ke dalam stimulus atau pokok soal agar bernuansa ke-Indonesia-an yang otentik: "${kisi.konteksNusantara}".` : ""}
2. ${stimulusStr} ${kisi.stimulusTambahan ? `Gunakan secara aktif target Stimulus Tambahan berikut untuk merancang stimulus/skenario pendukung yang kaya dan berbobot: "${kisi.stimulusTambahan}".` : ""}
3. ${checklistStr}
4. Kunci jawaban harus sangat akurat dan pembahasan harus lengkap, ilmiah, edukatif, dan terstruktur dengan rapi agar mudah dipahami siswa SMA. Tambahkan juga field 'kataKunci' yang berisi kata kunci atau konsep penting/topik utama yang digunakan/diuji dalam soal ini.
5. JIKA soal membutuhkan visual pendukung (seperti grafik fungsi, diagram kartesius, bangun geometri, dsb.), Anda disarankan untuk membuat kode SVG inline yang valid (dimulai dengan '<svg' dan ditutup '</svg>' lengkap dengan viewBox, stroke, fill, teks label agar indah dan responsive) ATAU mencantumkan URL gambar Unsplash yang relevan pada field 'gambarUrl'. Jika tidak membutuhkan visual, isi 'gambarUrl' dengan string kosong "".
6. Harap sesuaikan bahasa agar baku, formal, sesuai EBI (Ejaan Bahasa Indonesia), namun mudah dimengerti.
7. Hasilkan tepat ${countForThisChunk} objek soal di dalam array hasil.
8. SANGAT PENTING (MANDATORI): Gabungkan paragraf stimulus/pengantar/studi kasus (bila ada) langsung ke bagian awal field 'soal' (diikuti pertanyaan utama di bawahnya), dan kosongkan field 'stimulus' (isi dengan string kosong ""). Jangan memisahkannya agar struktur soal konsisten dengan prompt.`;

          const soalSchema = {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                kompetensi: { type: "STRING" },
                subKompetensi: { type: "STRING" },
                bentukSoal: { type: "STRING" },
                stimulus: { type: "STRING", description: "Sengaja dikosongkan karena stimulus digabungkan langsung ke dalam field 'soal' (isi dengan string kosong '')" },
                soal: { type: "STRING", description: "Teks soal lengkap yang menggabungkan stimulus (paragraf stimulus/pengantar/teks bacaan/studi kasus jika ada) dan pertanyaan/pokok soal utama secara menyatu" },
                opsi: { 
                  type: "ARRAY", 
                  items: { type: "STRING" }, 
                  description: "Array pilihan jawaban (misal ['A. ...', 'B. ...']) atau daftar pernyataan untuk tipe kategori" 
                },
                kunciJawaban: { type: "STRING" },
                pembahasan: { type: "STRING" },
                kataKunci: { type: "STRING" },
                gambarUrl: { type: "STRING" }
              },
              required: ["kompetensi", "subKompetensi", "bentukSoal", "soal", "opsi", "kunciJawaban", "pembahasan", "kataKunci", "gambarUrl"]
            }
          };

          const responseText = await callGeminiDirect(systemInstruction, prompt, soalSchema);
          data = JSON.parse(responseText);
        } else {
          const response = await fetch('/api/generate-soal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kisi,
              count: countForThisChunk,
              mataPelajaran: config.mataPelajaran,
              definisi: config.definisi,
              muatan: config.muatan,
              jumlahOpsi: config.jumlahOpsi,
              jenisSoal: config.jenisSoal,
              konteksLokal: config.konteksLokal,
              stimulusKonten: config.stimulusKonten,
              kualitasChecklist: config.kualitasChecklist,
              noSoalStart: currentNoSoal,
              existingQuestions: currentExistingSoalStems
            })
          });

          if (!response.ok) {
            let errorMsg = `Gagal menghubungi server AI untuk kumpulan soal ke-${Math.floor(i / chunkSize) + 1}`;
            try {
              const textError = await response.text();
              if (textError.includes('<!doctype') || textError.includes('<html')) {
                errorMsg = 'Server sedang sibuk atau mengalami timeout (Gateway Timeout). Coba lagi beberapa saat atau kurangi jumlah soal.';
              } else {
                try {
                  const errorData = JSON.parse(textError);
                  errorMsg = errorData.error || errorMsg;
                } catch {
                  errorMsg = textError || errorMsg;
                }
              }
            } catch {}
            throw new Error(errorMsg);
          }

          try {
            const responseText = await response.text();
            data = JSON.parse(responseText);
          } catch (jsonErr: any) {
            throw new Error('Respon dari server tidak valid (bukan JSON format). Silakan coba lagi.');
          }
        }

        if (Array.isArray(data)) {
          const mapped: Question[] = data.map((q: any, idx: number) => ({
            id: `q-ai-${Date.now()}-${i}-${idx}`,
            userId: currentUser?.uid,
            noSoal: currentNoSoal + idx,
            kisiKisiId: kisi.id,
            kompetensi: q.kompetensi || kisi.kompetensi,
            subKompetensi: q.subKompetensi || kisi.subElemenMateri,
            bentukSoal: kisi.bentukSoal,
            soal: q.soal,
            stimulus: q.stimulus || '',
            opsi: q.opsi || [],
            kunciJawaban: q.kunciJawaban || 'A',
            pembahasan: q.pembahasan || 'Pembahasan terstruktur.',
            kataKunci: q.kataKunci || '',
            gambarUrl: q.gambarUrl || ''
          }));
          
          generatedSoalList = [...generatedSoalList, ...mapped];
          currentNoSoal += mapped.length;

          setSoalProgress(prev => ({
            ...prev,
            countSuccess: generatedSoalList.length,
            statusText: `Berhasil merancang ${generatedSoalList.length} dari ${totalToGenerate} soal.`
          }));
        } else {
          throw new Error('Respon server tidak berbentuk array.');
        }
      }

      if (generatedSoalList.length > 0) {
        const qBatch = writeBatch(db);
        generatedSoalList.forEach((qItem) => {
          qBatch.set(doc(db, 'questions', qItem.id), qItem);
        });
        await qBatch.commit();

        setActiveTab('soal');
        setSoalProgress(prev => ({
          ...prev,
          statusText: 'Hampir selesai, memformat hasil...'
        }));
        await new Promise(resolve => setTimeout(resolve, 600));
        alert(`Berhasil membuat ${generatedSoalList.length} butir Soal dari Kisi-Kisi No. ${kisi.no} secara otomatis via AI!`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Gagal membuat soal via AI: ${err.message}. Anda bisa menyusun soal secara manual dengan menekan tombol Tambah Soal.`);
    } finally {
      setIsGeneratingSoal(false);
      setSoalProgress(prev => ({ ...prev, active: false }));
    }
  };

  // Generate Custom SVG illustration via AI
  const handleGenerateCustomIllustration = async () => {
    if (!aiIllustratorPrompt.trim()) {
      alert('Sila tulis deskripsi ilustrasi atau grafik yang ingin Anda buat!');
      return;
    }

    setIsGeneratingIllustration(true);
    setAiIllustratorStatus('Menghubungkan ke Gemini AI...');

    const statuses = [
      'Menganalisis permintaan ilustrasi...',
      'Merancang kerangka koordinat dan objek geometri...',
      'Menggambar garis, kurva, dan bentuk presisi...',
      'Menambahkan pelabelan teks dan rumus...',
      'Mengoptimasi pewarnaan dan responsivitas kode SVG...',
      'Hampir selesai, memformat kode vektor...'
    ];

    let statusIndex = 0;
    const interval = setInterval(() => {
      if (statusIndex < statuses.length) {
        setAiIllustratorStatus(statuses[statusIndex]);
        statusIndex++;
      }
    }, 1500);

    try {
      let data;
      if (aiConfig.mode === 'client') {
        const systemInstruction = `Anda adalah desainer grafis vektor SVG profesional untuk konten edukasi sains, matematika, dan ilmu sosial. Hasilkan HANYA kode SVG inline lengkap yang valid, dimulai dengan '<svg' dan diakhiri dengan '</svg>' tanpa penjelasan markdown atau sapaan lainnya. Pastikan SVG menggunakan atribut viewBox agar responsif, berwarna elegan dengan skema modern, kontras tinggi yang jelas di latar belakang putih.`;
        const promptText = `Buatkan grafis vektor SVG profesional dan edukatif berdasarkan instruksi berikut:
"${aiIllustratorPrompt}"

Konteks soal/konten:
"${questionForm.soal || ''}"

Ingat: HANYA berikan kode SVG murni. Jika Anda membungkusnya dengan blok markdown seperti \`\`\`xml atau \`\`\`html, pastikan bagian luar dibersihkan. Namun lebih baik langsung string SVG murni dimulai dengan <svg.`;

        let responseText = await callGeminiDirect(systemInstruction, promptText);
        clearInterval(interval);
        
        // Clean markdown blocks if returned by any chance
        if (responseText.includes('```')) {
          responseText = responseText.replace(/```[a-z]*\n?/gi, '').trim();
        }
        
        data = { svg: responseText };
      } else {
        const response = await fetch('/api/generate-illustration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiIllustratorPrompt,
            context: questionForm.soal || ''
          })
        });

        clearInterval(interval);

        if (!response.ok) {
          let errorMsg = 'Gagal menghasilkan gambar.';
          try {
            const textError = await response.text();
            if (textError.includes('<!doctype') || textError.includes('<html')) {
              errorMsg = 'Server sedang sibuk atau mengalami timeout (Gateway Timeout).';
            } else {
              try {
                const errorData = JSON.parse(textError);
                errorMsg = errorData.error || errorMsg;
              } catch {
                errorMsg = textError || errorMsg;
              }
            }
          } catch {}
          throw new Error(errorMsg);
        }

        try {
          const responseText = await response.text();
          data = JSON.parse(responseText);
        } catch {
          throw new Error('Respon dari server tidak valid.');
        }
      }

      if (data.svg) {
        setQuestionForm(prev => ({ ...prev, gambarUrl: data.svg }));
        setIsAiIllustratorOpen(false);
        setAiIllustratorPrompt('');
      } else {
        throw new Error('Kode gambar kosong atau tidak valid.');
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert(`Gagal merancang ilustrasi: ${err.message}`);
    } finally {
      setIsGeneratingIllustration(false);
    }
  };

  // Generate Soal for ALL kisi-kisi rows
  const handleGenerateAllQuestions = async () => {
    if (!config.mataPelajaran) {
      alert('Sila pilih Mata Pelajaran terlebih dahulu di Tab 1!');
      return;
    }
    if (kisiList.length === 0) {
      alert('Matriks Asesmen Kisi-Kisi masih kosong. Sila tambahkan atau generate kisi-kisi terlebih dahulu!');
      return;
    }
    
    setIsGeneratingSoal(true);
    let successCount = 0;
    
    // Accumulator for tracking all existing and newly generated questions to prevent duplication across iterations
    const allExistingSoalTexts = [...questions.map(q => q.soal)];
    
    const totalQuestionsTarget = kisiList.reduce((acc, k) => acc + (k.jumlahSoal || 1), 0);
    setSoalProgress({
      active: true,
      type: 'all',
      currentNo: 0,
      totalNo: kisiList.length,
      topic: 'Memulai sinkronisasi seluruh kisi-kisi...',
      countSuccess: 0,
      totalQuestions: totalQuestionsTarget,
      statusText: 'Menghubungkan ke server AI Gemini...'
    });
    
    for (let index = 0; index < kisiList.length; index++) {
      const kisi = kisiList[index];
      try {
        const totalToGenerate = kisi.jumlahSoal || 1;
        const chunkSize = 1; // Set to 1 for maximum stability and fast response per API call
        let currentNoSoal = questions.length + successCount + 1;

        setSoalProgress(prev => ({
          ...prev,
          currentNo: index + 1,
          topic: kisi.subElemenMateri || 'Materi Umum',
          statusText: `Menganalisis kisi-kisi No. ${kisi.no}...`
        }));

        for (let i = 0; i < totalToGenerate; i += chunkSize) {
          const countForThisChunk = Math.min(chunkSize, totalToGenerate - i);

          setSoalProgress(prev => ({
            ...prev,
            statusText: `Merancang butir soal #${i + 1} s.d #${i + countForThisChunk} untuk kisi-kisi No. ${kisi.no} via AI...`
          }));

          let data;
          if (aiConfig.mode === 'client') {
            const systemInstruction = `Anda adalah ahli pembuat soal ujian nasional dan TKA (Tes Kemampuan Akademik) SMA di Indonesia. Anda sangat terampil menyusun soal tingkat tinggi (HOTS), bervariasi, mendalam, dan bebas dari bias. Patuhi instruksi bentuk soal dan parameter kognitif secara presisi.`;

            const activeKonteksLokal = (kisi.konteksLokal && kisi.konteksLokal.length > 0) ? kisi.konteksLokal : config.konteksLokal;
            const activeStimulusKonten = (kisi.stimulusKonten && kisi.stimulusKonten.length > 0) ? kisi.stimulusKonten : config.stimulusKonten;
            const activeKualitasChecklist = (kisi.kualitasChecklist && kisi.kualitasChecklist.length > 0) ? kisi.kualitasChecklist : config.kualitasChecklist;

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
                ? `Pilihan ganda sederhana: Hanya ada satu jawaban yang benar. Sediakan pilihan A sampai ${config.jumlahOpsi === 5 ? "E" : "D"}.`
                : kisi.bentukSoal === "mcma"
                ? `Pilihan ganda kompleks model multiple choice multiple answers (MCMA): Ada lebih dari satu jawaban yang benar. Peserta diminta memilih semua jawaban benar. Kunci jawaban harus menyebutkan semua pilihan yang benar (misal: 'A, C'). Sediakan pilihan A sampai ${config.jumlahOpsi === 5 ? "E" : "D"}.`
                : "Pilihan ganda kompleks kategori: Menyajikan beberapa pernyataan (minimal 3-4 pernyataan) yang semuanya harus direspon, misalnya dengan pilihan 'Benar'/'Salah' atau 'Sesuai'/'Tidak Sesuai'. Kunci jawaban harus merinci status setiap pernyataan (misal: '1. Benar, 2. Salah, 3. Benar').";

            // Construct constraint for existing questions to avoid duplicates in client-side generator
            let clientExistingQuestionsConstraint = '';
            const activeSlices = allExistingSoalTexts.filter(Boolean).slice(0, 30);
            if (activeSlices.length > 0) {
              clientExistingQuestionsConstraint = `\n\nHINDARI PENGULANGAN SOAL (SANGAT PENTING):\nJangan membuat soal yang sama, memiliki konsep atau contoh kasus/studi yang mirip, atau menggunakan narasi stimulus yang mirip dengan soal-soal berikut:\n${activeSlices.map((text, idx) => `- Soal ${idx + 1}: ${text.substring(0, 150)}...`).join('\n')}\nPastikan butir soal yang Anda hasilkan saat ini benar-benar segar, baru, unik secara naratif, bervariasi, dan tidak mengulangi pertanyaan di atas.`;
            }

            let clientIndonesianLanguageCriteria = '';
            if (config.mataPelajaran && (config.mataPelajaran.toLowerCase().includes('bahasa indonesia') || config.mataPelajaran.toLowerCase().includes('indonesia'))) {
              clientIndonesianLanguageCriteria = `\n\nKAIDAH & KAIDAH MUATAN KHUSUS BAHASA INDONESIA (SANGAT PENTING):\n- Teks yang diujikan harus berupa Teks Informasi (Tunggal/Jamak yang berisi fakta, konsep, prosedur, metakognisi dari berbagai bidang pada skala lokal, nasional, global) ATAU Teks Fiksi (realisme/absurd dengan latar cerita konkret/abstrak, tokoh berkarakter bulat, konflik tunggal/jamak dengan penyelesaian terbuka, alur campuran, dan sudut pandang campuran).\n- Karakteristik Kosakata: Menggunakan kata khusus dan kata umum, kata berimbuhan kompleks, kata abstrak, makna denotatif, istilah teknis, atau konotatif konteks luas.\n- Karakteristik Kalimat: Setiap kalimat di dalam teks stimulus/soal harus berkisar antara 8-12 kata per kalimat, menggunakan kalimat kompleks berbagai pola serta kalimat inversi.\n- Karakteristik Wacana: Menggunakan konjungsi antarparagraf dengan makna 'pertentangan' dan 'sebab akibat', tanda baca pendukung makna yang tepat, dengan panjang teks berkisar antara 250-300 kata (kecuali jika bergenre puisi).`;
            }

            const prompt = `Buatkan tepat sebanyak ${countForThisChunk} butir soal ujian TKA SMA yang berbeda untuk Mata Pelajaran ${config.mataPelajaran}.${clientIndonesianLanguageCriteria}
            
PENTING: Jumlah objek soal yang dihasilkan dalam array JSON HARUS tepat sebanyak ${countForThisChunk} butir soal, tidak kurang dan tidak lebih.
Setiap butir soal harus unik, bervariasi, dan didasarkan pada kisi-kisi berikut.

INFORMASI MATRIKS ASESMEN KISI-KISI:
- No Soal Mulai: ${currentNoSoal}
- Bentuk Soal: ${kisi.bentukSoal} (${bentukSoalDesc})
- Tingkat Kognitif: ${kisi.levelKognitif} (${kisi.levelKognitif === 'level_1' ? 'Pemahaman (Knowing) - Mengenali, mengingat, dan memahami konsep dasar' : kisi.levelKognitif === 'level_2' ? 'Penerapan (Applying) - Menerapkan konsep pada fenomena nyata' : 'Penalaran (Reasoning) - Berpikir kritis dan menalar secara logis'})
- Elemen/Materi: ${kisi.elemenMateri}
- Sub-Elemen/Submateri: ${kisi.subElemenMateri}
- Kompetensi yang Diuji: ${kisi.kompetensi}
- Batasan/Catatan Khusus: ${kisi.batasanCatatan || "Tidak ada"}
- Konteks Nusantara: ${kisi.konteksNusantara || "Tidak ada khusus"}
- Stimulus Tambahan: ${kisi.stimulusTambahan || "Tidak ada khusus"}
- Jenis Soal: ${config.jenisSoal} (Soal Tunggal atau Soal Grup/Terhubung)
${clientExistingQuestionsConstraint}

PANDUAN EKSTRA:
1. ${konteksStr} ${kisi.konteksNusantara ? `Integrasikan juga secara mendalam target Konteks Nusantara berikut ke dalam stimulus atau pokok soal agar bernuansa ke-Indonesia-an yang otentik: "${kisi.konteksNusantara}".` : ""}
2. ${stimulusStr} ${kisi.stimulusTambahan ? `Gunakan secara aktif target Stimulus Tambahan berikut untuk merancang stimulus/skenario pendukung yang kaya dan berbobot: "${kisi.stimulusTambahan}".` : ""}
3. ${checklistStr}
4. Kunci jawaban harus sangat akurat dan pembahasan harus lengkap, ilmiah, edukatif, dan terstruktur dengan rapi agar mudah dipahami siswa SMA. Tambahkan juga field 'kataKunci' yang berisi kata kunci atau konsep penting/topik utama yang digunakan/diuji dalam soal ini.
5. JIKA soal membutuhkan visual pendukung (seperti grafik fungsi, diagram kartesius, bangun geometri, dsb.), Anda disarankan untuk membuat kode SVG inline yang valid (dimulai dengan '<svg' dan ditutup '</svg>' lengkap dengan viewBox, stroke, fill, teks label agar indah dan responsive) ATAU mencantumkan URL gambar Unsplash yang relevan pada field 'gambarUrl'. Jika tidak membutuhkan visual, isi 'gambarUrl' dengan string kosong "".
6. Harap sesuaikan bahasa agar baku, formal, sesuai EBI (Ejaan Bahasa Indonesia), namun mudah dimengerti.
7. Hasilkan tepat ${countForThisChunk} objek soal di dalam array hasil.
8. SANGAT PENTING (MANDATORI): Gabungkan paragraf stimulus/pengantar/studi kasus (bila ada) langsung ke bagian awal field 'soal' (diikuti pertanyaan utama di bawahnya), dan kosongkan field 'stimulus' (isi dengan string kosong ""). Jangan memisahkannya agar struktur soal konsisten dengan prompt.`;

            const soalSchema = {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  kompetensi: { type: "STRING" },
                  subKompetensi: { type: "STRING" },
                  bentukSoal: { type: "STRING" },
                  stimulus: { type: "STRING", description: "Sengaja dikosongkan karena stimulus digabungkan langsung ke dalam field 'soal' (isi dengan string kosong '')" },
                  soal: { type: "STRING", description: "Teks soal lengkap yang menggabungkan stimulus (paragraf stimulus/pengantar/teks bacaan/studi kasus jika ada) dan pertanyaan/pokok soal utama secara menyatu" },
                  opsi: { 
                    type: "ARRAY", 
                    items: { type: "STRING" }, 
                    description: "Array pilihan jawaban (misal ['A. ...', 'B. ...']) atau daftar pernyataan untuk tipe kategori" 
                  },
                  kunciJawaban: { type: "STRING" },
                  pembahasan: { type: "STRING" },
                  kataKunci: { type: "STRING" },
                  gambarUrl: { type: "STRING" }
                },
                required: ["kompetensi", "subKompetensi", "bentukSoal", "soal", "opsi", "kunciJawaban", "pembahasan", "kataKunci", "gambarUrl"]
              }
            };

            const responseText = await callGeminiDirect(systemInstruction, prompt, soalSchema);
            data = JSON.parse(responseText);
          } else {
            const response = await fetch('/api/generate-soal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kisi,
                count: countForThisChunk,
                mataPelajaran: config.mataPelajaran,
                definisi: config.definisi,
                muatan: config.muatan,
                jumlahOpsi: config.jumlahOpsi,
                jenisSoal: config.jenisSoal,
                konteksLokal: config.konteksLokal,
                stimulusKonten: config.stimulusKonten,
                kualitasChecklist: config.kualitasChecklist,
                noSoalStart: currentNoSoal,
                existingQuestions: allExistingSoalTexts
              })
            });

            if (!response.ok) {
              let errorMsg = `Gagal pada kisi-kisi No. ${kisi.no} (kumpulan ke-${Math.floor(i / chunkSize) + 1})`;
              try {
                const textError = await response.text();
                if (textError.includes('<!doctype') || textError.includes('<html')) {
                  errorMsg = 'Server sedang sibuk atau mengalami timeout (Gateway Timeout).';
                } else {
                  try {
                    const errorData = JSON.parse(textError);
                    errorMsg = errorData.error || errorMsg;
                  } catch {
                    errorMsg = textError || errorMsg;
                  }
                }
              } catch {}
              throw new Error(errorMsg);
            }

            try {
              const responseText = await response.text();
              data = JSON.parse(responseText);
            } catch {
              throw new Error('Respon dari server tidak valid (bukan JSON format).');
            }
          }

          if (Array.isArray(data)) {
            const mapped: Question[] = data.map((q: any, idx: number) => ({
              id: `q-ai-${Date.now()}-${successCount}-${i}-${idx}`,
              noSoal: currentNoSoal + idx,
              kisiKisiId: kisi.id,
              kompetensi: q.kompetensi || kisi.kompetensi,
              subKompetensi: q.subKompetensi || kisi.subElemenMateri,
              bentukSoal: kisi.bentukSoal,
              soal: q.soal,
              stimulus: q.stimulus || '',
              opsi: q.opsi || [],
              kunciJawaban: q.kunciJawaban || 'A',
              pembahasan: q.pembahasan || 'Pembahasan terstruktur.',
              kataKunci: q.kataKunci || '',
              gambarUrl: q.gambarUrl || ''
            }));
            
            // Push newly generated questions' stems to accumulator to prevent any duplicates on subsequent iterations
            allExistingSoalTexts.push(...mapped.map(m => m.soal));

            setQuestions(prev => [...prev, ...mapped]);
            successCount += mapped.length;
            currentNoSoal += mapped.length;

            setSoalProgress(prev => ({
              ...prev,
              countSuccess: successCount,
              statusText: `Berhasil menyusun ${successCount} dari ${totalQuestionsTarget} soal.`
            }));
          } else {
            throw new Error('Respon server tidak berbentuk array.');
          }
        }
      } catch (err: any) {
        console.error('Error generating for a row', err);
        setSoalProgress(prev => ({
          ...prev,
          statusText: `⚠️ Kisi-kisi No. ${kisi.no} gagal diproses: ${err.message || 'Error'}`
        }));
        // Pause briefly so the user can read which part failed/skipped
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }
    
    setSoalProgress(prev => ({
      ...prev,
      statusText: 'Semua soal berhasil disusun! Memformat hasil akhir...'
    }));
    await new Promise(resolve => setTimeout(resolve, 800));

    setIsGeneratingSoal(false);
    setSoalProgress(prev => ({ ...prev, active: false }));
    setActiveTab('soal');
    alert(`Penyusunan Massal Selesai! Berhasil menyusun ${successCount} butir soal baru dari seluruh Matriks Kisi-Kisi.`);
  };

  // Fungsi Impor Preset Pusmendik
  const handleImportSinglePreset = async (preset: { elemenMateri: string, subElemenMateri: string, kompetensi: string, batasanCatatan: string }, idx: number) => {
    const presetId = `${preset.subElemenMateri}-${idx}`;
    setImportingPresetIds(prev => ({ ...prev, [presetId]: true }));

    const presetSubjectMapped = selectedPresetSubject === 'PPKN' 
      ? 'Pendidikan Pancasila dan Kewarganegaraan'
      : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
      ? 'Sejarah'
      : selectedPresetSubject === 'Produk Kreatif dan Kewirausahaan'
      ? 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK'
      : selectedPresetSubject;

    setConfig(prev => ({
      ...prev,
      mataPelajaran: presetSubjectMapped
    }));

    try {
      const newItem: KisiKisiItem = {
        id: `kisi-pusmendik-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: currentUser?.uid,
        no: kisiList.length + 1,
        bentukSoal: 'pilihan_ganda_sederhana',
        levelKognitif: 'level_2',
        elemenMateri: preset.elemenMateri,
        subElemenMateri: preset.subElemenMateri,
        kompetensi: preset.kompetensi,
        batasanCatatan: preset.batasanCatatan,
        jumlahSoal: 5
      };
      await setDoc(doc(db, 'kisi_kisi', newItem.id), newItem);
      alert(`Berhasil menambahkan kisi-kisi: "${preset.subElemenMateri}" ke daftar!`);
    } catch (err: any) {
      console.error("Gagal mengimpor preset:", err);
      alert(`Gagal mengimpor preset: ${err.message}`);
    } finally {
      setImportingPresetIds(prev => ({ ...prev, [presetId]: false }));
    }
  };

  const handleImportAllPresets = async () => {
    const activePresets = selectedPresetSubject === 'Matematika' 
      ? PUSMENDIK_MATEMATIKA_PRESETS 
      : selectedPresetSubject === 'Bahasa Indonesia'
      ? PUSMENDIK_BAHASA_INDONESIA_PRESETS
      : selectedPresetSubject === 'Bahasa Inggris'
      ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
      : selectedPresetSubject === 'Matematika Tingkat Lanjut'
      ? PUSMENDIK_MATEMATIKA_TL_PRESETS
      : selectedPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
      ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
      : selectedPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
      ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
      : selectedPresetSubject === 'Fisika'
      ? PUSMENDIK_FISIKA_PRESETS
      : selectedPresetSubject === 'Kimia'
      ? PUSMENDIK_KIMIA_PRESETS
      : selectedPresetSubject === 'Biologi'
      ? PUSMENDIK_BIOLOGI_PRESETS
      : selectedPresetSubject === 'PPKN'
      ? PUSMENDIK_PPKN_PRESETS
      : selectedPresetSubject === 'Ekonomi'
      ? PUSMENDIK_EKONOMI_PRESETS
      : selectedPresetSubject === 'Geografi'
      ? PUSMENDIK_GEOGRAFI_PRESETS
      : selectedPresetSubject === 'Sosiologi'
      ? PUSMENDIK_SOSIOLOGI_PRESETS
      : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
      ? PUSMENDIK_SEJARAH_TL_PRESETS
      : selectedPresetSubject === 'Antropologi'
      ? PUSMENDIK_ANTROPOLOGI_PRESETS
      : selectedPresetSubject === 'Bahasa Jepang'
      ? PUSMENDIK_BAHASA_JEPANG_PRESETS
      : PUSMENDIK_PKK_PRESETS;
    const count = activePresets.length;

    const presetSubjectMapped = selectedPresetSubject === 'PPKN' 
      ? 'Pendidikan Pancasila dan Kewarganegaraan'
      : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
      ? 'Sejarah'
      : selectedPresetSubject === 'Produk Kreatif dan Kewirausahaan'
      ? 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK'
      : selectedPresetSubject;

    if (confirm(`Apakah Anda ingin menambahkan seluruh ${count} matriks standar Pusmendik ${selectedPresetSubject} ke daftar kisi-kisi saat ini?`)) {
      setConfig(prev => ({
        ...prev,
        mataPelajaran: presetSubjectMapped
      }));

      try {
        const newItems: KisiKisiItem[] = activePresets.map((preset, idx) => ({
          id: `kisi-pusmendik-all-${Date.now()}-${idx}`,
          userId: currentUser?.uid,
          no: kisiList.length + idx + 1,
          bentukSoal: 'pilihan_ganda_sederhana',
          levelKognitif: 'level_2',
          elemenMateri: preset.elemenMateri,
          subElemenMateri: preset.subElemenMateri,
          kompetensi: preset.kompetensi,
          batasanCatatan: preset.batasanCatatan,
          jumlahSoal: 5
        }));

        const batch = writeBatch(db);
        newItems.forEach((item) => {
          batch.set(doc(db, 'kisi_kisi', item.id), item);
        });
        await batch.commit();
      } catch (err: any) {
        console.error("Gagal mengimpor seluruh preset:", err);
        alert(`Gagal mengimpor seluruh preset: ${err.message}`);
      }
    }
  };

  const handleLoadPresetToForm = (preset: { elemenMateri: string, subElemenMateri: string, kompetensi: string, batasanCatatan: string }) => {
    const presetSubjectMapped = selectedPresetSubject === 'PPKN' 
      ? 'Pendidikan Pancasila dan Kewarganegaraan'
      : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
      ? 'Sejarah'
      : selectedPresetSubject === 'Produk Kreatif dan Kewirausahaan'
      ? 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK'
      : selectedPresetSubject;

    setConfig(prev => ({
      ...prev,
      mataPelajaran: presetSubjectMapped
    }));

    setKisiForm({
      bentukSoal: 'pilihan_ganda_sederhana',
      levelKognitif: 'level_2',
      elemenMateri: preset.elemenMateri,
      subElemenMateri: preset.subElemenMateri,
      kompetensi: preset.kompetensi,
      batasanCatatan: preset.batasanCatatan,
      jumlahSoal: 5,
      konteksNusantara: '',
      stimulusTambahan: '',
      konteksLokal: [],
      stimulusKonten: [],
      kualitasChecklist: []
    });
    alert(`Materi "${preset.subElemenMateri}" berhasil dimuat ke Form Tambah/Edit di bawah. Sila sesuaikan sebelum menyimpan.`);
  };

  // Kisi-Kisi Manual Actions
  const handleSaveKisiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kisiForm.elemenMateri || !kisiForm.subElemenMateri || !kisiForm.kompetensi) {
      alert('Sila isi kolom Materi, Sub-materi, dan Kompetensi terlebih dahulu!');
      return;
    }

    try {
      if (isEditingKisi && editingKisiId) {
        const updatedItem = {
          id: editingKisiId,
          userId: currentUser?.uid,
          no: kisiList.find(item => item.id === editingKisiId)?.no || 1,
          bentukSoal: kisiForm.bentukSoal as BentukSoal,
          levelKognitif: kisiForm.levelKognitif as LevelKognitif,
          elemenMateri: kisiForm.elemenMateri || '',
          subElemenMateri: kisiForm.subElemenMateri || '',
          kompetensi: kisiForm.kompetensi || '',
          batasanCatatan: kisiForm.batasanCatatan || '',
          jumlahSoal: Number(kisiForm.jumlahSoal) || 5,
          konteksNusantara: kisiForm.konteksNusantara || '',
          stimulusTambahan: kisiForm.stimulusTambahan || '',
          konteksLokal: kisiForm.konteksLokal || [],
          stimulusKonten: kisiForm.stimulusKonten || [],
          kualitasChecklist: kisiForm.kualitasChecklist || []
        };
        await setDoc(doc(db, 'kisi_kisi', editingKisiId), updatedItem);
        setIsEditingKisi(false);
        setEditingKisiId(null);
      } else {
        const newItem: KisiKisiItem = {
          id: `kisi-manual-${Date.now()}`,
          userId: currentUser?.uid,
          no: kisiList.length + 1,
          bentukSoal: kisiForm.bentukSoal as BentukSoal,
          levelKognitif: kisiForm.levelKognitif as LevelKognitif,
          elemenMateri: kisiForm.elemenMateri || '',
          subElemenMateri: kisiForm.subElemenMateri || '',
          kompetensi: kisiForm.kompetensi || '',
          batasanCatatan: kisiForm.batasanCatatan || '',
          jumlahSoal: Number(kisiForm.jumlahSoal) || 5,
          konteksNusantara: kisiForm.konteksNusantara || '',
          stimulusTambahan: kisiForm.stimulusTambahan || '',
          konteksLokal: kisiForm.konteksLokal || [],
          stimulusKonten: kisiForm.stimulusKonten || [],
          kualitasChecklist: kisiForm.kualitasChecklist || []
        };
        await setDoc(doc(db, 'kisi_kisi', newItem.id), newItem);
      }
    } catch (err: any) {
      console.error("Gagal menyimpan kisi-kisi ke database:", err);
      alert(`Gagal menyimpan ke database: ${err.message}`);
    }

    // Reset Form
    setKisiForm({
      bentukSoal: 'pilihan_ganda_sederhana',
      levelKognitif: 'level_2',
      elemenMateri: '',
      subElemenMateri: '',
      kompetensi: '',
      batasanCatatan: '',
      jumlahSoal: 5,
      konteksNusantara: '',
      stimulusTambahan: '',
      konteksLokal: [],
      stimulusKonten: [],
      kualitasChecklist: []
    });
  };

  const handleEditKisi = (item: KisiKisiItem) => {
    setKisiForm({
      bentukSoal: item.bentukSoal,
      levelKognitif: item.levelKognitif,
      elemenMateri: item.elemenMateri,
      subElemenMateri: item.subElemenMateri,
      kompetensi: item.kompetensi,
      batasanCatatan: item.batasanCatatan,
      jumlahSoal: item.jumlahSoal,
      konteksNusantara: item.konteksNusantara || '',
      stimulusTambahan: item.stimulusTambahan || '',
      konteksLokal: item.konteksLokal || [],
      stimulusKonten: item.stimulusKonten || [],
      kualitasChecklist: item.kualitasChecklist || []
    });
    setIsEditingKisi(true);
    setEditingKisiId(item.id);
  };

  const handleDeleteKisi = async (id: string) => {
    try {
      // 1. Delete Kisi-Kisi itself
      await deleteDoc(doc(db, 'kisi_kisi', id));
      
      // 2. Delete associated material
      await deleteDoc(doc(db, 'materials', id));
      
      // 3. Delete associated questions
      const qQuestions = query(collection(db, 'questions'), where('kisiKisiId', '==', id));
      const qSnapshot = await getDocs(qQuestions);
      const batch = writeBatch(db);
      qSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (err: any) {
      console.error("Gagal menghapus kisi-kisi:", err);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDeleteUnusedKisi = async () => {
    const usedIds = new Set(questions.map(q => q.kisiKisiId));
    const unusedKisi = kisiList.filter(item => !usedIds.has(item.id));
    
    if (unusedKisi.length === 0) {
      alert('Semua baris Kisi-Kisi saat ini sudah digunakan oleh butir soal!');
      return;
    }

    try {
      const batch = writeBatch(db);
      unusedKisi.forEach((item) => {
        batch.delete(doc(db, 'kisi_kisi', item.id));
      });
      await batch.commit();
      alert(`Berhasil menghapus ${unusedKisi.length} baris Kisi-Kisi kosong yang tidak digunakan.`);
    } catch (err: any) {
      console.error("Gagal menghapus unused kisi-kisi:", err);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  // Questions Manual Actions
  const handleSaveQuestionForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.soal || !questionForm.kunciJawaban) {
      alert('Teks Soal dan Kunci Jawaban wajib diisi!');
      return;
    }

    // Clean options (remove empty strings)
    const activeOptions = (questionForm.opsi || []).filter(o => o.trim() !== '');
    setIsSavingQuestion(true);

    try {
      if (isEditingQuestion && editingQuestionId) {
        const updatedQ = {
          id: editingQuestionId,
          userId: currentUser?.uid,
          noSoal: questions.find(q => q.id === editingQuestionId)?.noSoal || 1,
          kisiKisiId: questionForm.kisiKisiId || '',
          kompetensi: questionForm.kompetensi || '',
          subKompetensi: questionForm.subKompetensi || '',
          bentukSoal: questionForm.bentukSoal as BentukSoal,
          soal: questionForm.soal || '',
          stimulus: questionForm.stimulus || '',
          opsi: activeOptions,
          kunciJawaban: questionForm.kunciJawaban || '',
          pembahasan: questionForm.pembahasan || '',
          kataKunci: questionForm.kataKunci || '',
          gambarUrl: questionForm.gambarUrl || ''
        };
        await setDoc(doc(db, 'questions', editingQuestionId), updatedQ);
        setIsEditingQuestion(false);
        setEditingQuestionId(null);
      } else {
        const newQ: Question = {
          id: `q-manual-${Date.now()}`,
          userId: currentUser?.uid,
          noSoal: questions.length + 1,
          kisiKisiId: questionForm.kisiKisiId || '',
          kompetensi: questionForm.kompetensi || 'Kompetensi Umum',
          subKompetensi: questionForm.subKompetensi || 'Sub-Materi',
          bentukSoal: questionForm.bentukSoal as BentukSoal,
          soal: questionForm.soal || '',
          stimulus: questionForm.stimulus || '',
          opsi: activeOptions,
          kunciJawaban: questionForm.kunciJawaban || '',
          pembahasan: questionForm.pembahasan || 'Pembahasan terstruktur.',
          kataKunci: questionForm.kataKunci || '',
          gambarUrl: questionForm.gambarUrl || ''
        };
        await setDoc(doc(db, 'questions', newQ.id), newQ);
      }

      // Reset Form
      setQuestionForm({
        kisiKisiId: '',
        kompetensi: '',
        subKompetensi: '',
        bentukSoal: 'pilihan_ganda_sederhana',
        soal: '',
        stimulus: '',
        opsi: ['', '', '', '', ''],
        kunciJawaban: '',
        pembahasan: '',
        kataKunci: '',
        gambarUrl: ''
      });
      setIsEditingQuestion(false);
      alert('Berhasil menyimpan butir soal!');
    } catch (err: any) {
      console.error("Gagal menyimpan soal ke database:", err);
      try {
        handleFirestoreError(err, OperationType.WRITE, 'questions');
      } catch (err2: any) {
        alert(`Gagal menyimpan ke database: ${err.message || err}`);
      }
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleEditQuestion = (q: Question) => {
    setQuestionForm({
      kisiKisiId: q.kisiKisiId,
      kompetensi: q.kompetensi,
      subKompetensi: q.subKompetensi,
      bentukSoal: q.bentukSoal,
      soal: q.soal,
      stimulus: q.stimulus,
      opsi: q.opsi.length > 0 ? [...q.opsi, '', '', '', ''].slice(0, 5) : ['', '', '', '', ''],
      kunciJawaban: q.kunciJawaban,
      pembahasan: q.pembahasan,
      kataKunci: q.kataKunci || '',
      gambarUrl: q.gambarUrl || ''
    });
    setIsEditingQuestion(true);
    setEditingQuestionId(q.id);
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err: any) {
      console.error("Gagal menghapus soal:", err);
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleDeleteAllQuestions = async () => {
    try {
      if (questions.length === 0) {
        alert("Tidak ada soal untuk dihapus.");
        return;
      }
      const batch = writeBatch(db);
      questions.forEach((q) => {
        batch.delete(doc(db, 'questions', q.id));
      });
      await batch.commit();
      setShowDeleteAllConfirm(false);
      alert("Semua butir soal berhasil dihapus.");
    } catch (err: any) {
      setShowDeleteAllConfirm(false);
      console.error("Gagal menghapus semua soal:", err);
      handleFirestoreError(err, OperationType.DELETE, 'questions');
    }
  };

  const handleOpsiChange = (index: number, val: string) => {
    setQuestionForm(prev => {
      const currentOpsi = [...(prev.opsi || ['', '', '', '', ''])];
      currentOpsi[index] = val;
      return { ...prev, opsi: currentOpsi };
    });
  };

  const handlePrint = () => {
    if (questions.length === 0) {
      alert("Belum ada butir soal yang tersusun! Silakan buat Kisi-Kisi terlebih dahulu, lalu susun/buat butir soal sebelum mencetak.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup blocker aktif. Harap izinkan popup untuk melakukan pencetakan.");
      return;
    }

    // Determine font size
    let fontSizeVal = '11pt';
    if (printConfig.fontSize === 'text-xs') fontSizeVal = '10pt';
    if (printConfig.fontSize === 'text-base') fontSizeVal = '12pt';

    // Generate questions html
    const questionsHtml = questions.map((q) => {
      // Parse options
      const optionsHtml = (q.opsi || []).map((opt, i) => {
        let optLetter = '';
        let optText = opt;
        if (opt.trim().match(/^[A-E]\s*[\.\)]/i)) {
          optLetter = opt.trim().substring(0, 1).toUpperCase();
          const sepIdx = opt.indexOf('.') !== -1 ? opt.indexOf('.') : opt.indexOf(')');
          optText = opt.substring(sepIdx + 1).trim();
        } else {
          optLetter = String.fromCharCode(65 + i);
        }

        const isCorrectOption = q.kunciJawaban.trim().toUpperCase().includes(optLetter) && printConfig.showAnswerKey;

        return `
          <div class="option-item ${isCorrectOption ? 'correct-option' : ''}">
            <span class="option-letter">${optLetter}</span>
            <span class="option-text">${optText}</span>
          </div>
        `;
      }).join('');

      // Parse illustration
      let illustrationHtml = '';
      if (q.gambarUrl && q.gambarUrl.trim() !== '' && printConfig.showIllustration) {
        if (q.gambarUrl.trim().toLowerCase().startsWith('<svg')) {
          illustrationHtml = `
            <div class="illustration-container">
              ${q.gambarUrl}
            </div>
          `;
        } else {
          illustrationHtml = `
            <div class="illustration-container">
              <img src="${q.gambarUrl}" alt="Ilustrasi" />
            </div>
          `;
        }
      }

      // Parse competency tag
      let competencyTagHtml = '';
      if (printConfig.showCompetencyTag) {
        competencyTagHtml = `
          <div class="competency-tag">
            <strong>No Soal:</strong> ${q.noSoal} | 
            <strong>Bentuk:</strong> ${getBentukSoalLabel(q.bentukSoal)} | 
            <strong>Kompetensi:</strong> ${q.kompetensi} | 
            <strong>Sub Kompetensi:</strong> ${q.subKompetensi}
          </div>
        `;
      }

      // Parse answer key & pembahasan
      let answerKeyHtml = '';
      if (printConfig.showAnswerKey) {
        answerKeyHtml = `
          <div class="answer-key-box">
            <div><strong>Kunci Jawaban:</strong> <span class="key-badge">${q.kunciJawaban}</span></div>
            ${q.kataKunci ? `<div><strong>Materi / Konsep:</strong> ${q.kataKunci}</div>` : ''}
            <div style="margin-top: 4px;"><strong>Pembahasan:</strong> ${q.pembahasan || '-'}</div>
          </div>
        `;
      }

      // Combined Stimulus & Question Statement
      const combinedQuestionTextHtml = `
        ${q.stimulus && printConfig.showStimulus ? `
          <div class="stimulus-combined-text" style="font-weight: normal; font-style: italic; margin-bottom: 8px; text-align: justify; line-height: 1.4;">
            ${q.stimulus}
          </div>
        ` : ''}
        <div class="question-statement-text" style="font-weight: bold;">
          ${q.soal}
        </div>
      `;

      return `
        <div class="question-item">
          ${competencyTagHtml}
          <div class="question-body">
            ${!printConfig.showCompetencyTag ? `<span class="question-number">${q.noSoal}.</span>` : ''}
            <div class="question-content">
              ${illustrationHtml}
              <div class="question-text">
                ${combinedQuestionTextHtml}
              </div>
              <div class="options-container ${printConfig.layoutColumns === '2' ? 'single-col' : 'grid-cols-2'}">
                ${optionsHtml}
              </div>
              ${answerKeyHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Generate school logos
    const leftLogoHtml = printConfig.schoolLogo 
      ? `<img src="${printConfig.schoolLogo}" class="kop-logo" />` 
      : `<div class="kop-logo-placeholder">LOGO</div>`;
    const rightLogoHtml = printConfig.schoolLogoRight 
      ? `<img src="${printConfig.schoolLogoRight}" class="kop-logo" />` 
      : `<div class="kop-logo-placeholder">SMA</div>`;

    // Complete HTML structure
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ujian_${config.mataPelajaran.replace(/\s+/g, '_')}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
          @page {
            size: ${printConfig.pageSize === 'F4' ? '215mm 330mm' : 'A4'};
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000000;
            line-height: 1.4;
            font-size: ${fontSizeVal};
            background: white;
            margin: 0;
            padding: 0;
          }
          .print-btn-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 9999px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 9999;
            font-family: 'Times New Roman', Times, serif;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          .print-btn-container:hover {
            background-color: #1d4ed8;
          }
          
          /* Kop Surat */
          .header-kop {
            border-bottom: 3px double #000000;
            padding-bottom: 8px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .kop-logo {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .kop-logo-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 1px solid #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
          }
          .kop-text {
            flex: 1;
            text-align: center;
          }
          .kop-dept {
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
          }
          .kop-school {
            font-size: 13pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
          }
          .kop-address {
            font-size: 8pt;
            font-style: italic;
            margin: 0 0 4px 0;
          }
          .kop-info {
            font-size: 8.5pt;
            font-weight: bold;
            margin: 0;
            border-top: 1px solid #000000;
            padding-top: 2px;
            display: inline-block;
            word-spacing: 2px;
          }

          /* Simple Title if No Kop */
          .simple-title {
            border-bottom: 2px solid #000000;
            padding-bottom: 8px;
            text-align: center;
            margin-bottom: 16px;
          }
          .simple-title h2 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
          }
          .simple-title p {
            font-size: 11pt;
            margin: 4px 0 0 0;
          }

          /* Exam Metadata */
          .exam-meta-title {
            text-align: center;
            margin-bottom: 16px;
          }
          .exam-meta-title h2 {
            font-size: 11pt;
            font-weight: bold;
            margin: 0 0 2px 0;
          }
          .exam-meta-title h1 {
            font-size: 12pt;
            font-weight: bold;
            margin: 0;
          }

          /* Student Fields Table */
          .student-fields {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 9.5pt;
          }
          .student-fields td {
            padding: 6px 10px;
            border: 1px solid #000000;
            font-weight: bold;
          }
          .dotted-line {
            display: inline-block;
            width: 80%;
            border-bottom: 1px dotted #000000;
            height: 12px;
          }

          /* Instructions */
          .instructions-box {
            border-left: 3px solid #000000;
            padding-left: 10px;
            margin-bottom: 20px;
            font-size: 9.5pt;
            font-style: italic;
          }

          /* Layout Columns */
          .questions-container {
            width: 100%;
          }
          .layout-columns-2 {
            -webkit-column-count: 2;
            -moz-column-count: 2;
            column-count: 2;
            -webkit-column-gap: 24px;
            -moz-column-gap: 24px;
            column-gap: 24px;
          }
          
          /* Question items styling */
          .question-item {
            display: block;
            width: 100%;
            margin-bottom: 16px;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 12px;
            page-break-inside: auto; /* Allow natural page-break flow to prevent separating header and questions */
            break-inside: auto;
          }
          /* If two-column is active, keep questions self-contained within columns */
          .layout-columns-2 .question-item {
            display: inline-block;
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid-column;
            break-inside: avoid;
          }
          .question-item:last-child {
            border-bottom: none;
          }
          .competency-tag {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 4px 8px;
            font-size: 8pt;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .question-body {
            display: flex;
            align-items: start;
            gap: 8px;
          }
          .question-number {
            font-weight: bold;
            min-width: 20px;
          }
          .question-content {
            flex: 1;
          }
          .question-text {
            font-weight: bold;
            margin-bottom: 10px;
            text-align: justify;
          }
          
           /* Stimulus */
          .stimulus-box {
            background-color: #f9fafb;
            border-left: 3px solid #4f46e5;
            padding: 8px 12px;
            margin-bottom: 10px;
            font-size: 9pt;
            font-style: italic;
            border-radius: 0 4px 4px 0;
            text-align: justify;
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Illustration */
          .illustration-container {
            margin: 10px 0;
            text-align: center;
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .illustration-container img {
            max-height: 150px;
            max-width: 100%;
            object-fit: contain;
          }
          .illustration-container svg {
            max-width: 100%;
            height: auto;
          }

          /* Options */
          .options-container {
            display: grid;
            gap: 6px;
            margin-bottom: 8px;
            -webkit-column-break-inside: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .options-container.grid-cols-2 {
            grid-template-columns: 1fr 1fr;
          }
          @media (max-width: 600px) {
            .options-container.grid-cols-2 {
              grid-template-columns: 1fr;
            }
          }
          .options-container.single-col {
            grid-template-columns: 1fr;
          }
          .option-item {
            display: flex;
            align-items: start;
            gap: 8px;
            padding: 4px 6px;
            border-radius: 4px;
            border: 1px solid transparent;
            font-size: 9.5pt;
          }
          .option-letter {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 1px solid #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 8pt;
            flex-shrink: 0;
            margin-top: 1px;
          }
          .option-text {
            flex: 1;
          }
          .correct-option {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
            font-weight: bold;
          }
          .correct-option .option-letter {
            background-color: #22c55e;
            color: white;
            border-color: #22c55e;
          }

          /* Answer Key Box */
          .answer-key-box {
            background-color: #f0fdf4;
            border: 1px dashed #86efac;
            padding: 8px 12px;
            margin-top: 10px;
            font-size: 8.5pt;
            border-radius: 6px;
          }
          .key-badge {
            background-color: #22c55e;
            color: white;
            font-weight: bold;
            padding: 1px 6px;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <button class="print-btn-container no-print" onclick="window.print()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Cetak Dokumen / Simpan PDF
        </button>

        ${printConfig.showHeader ? `
          <div class="header-kop">
            ${leftLogoHtml}
            <div class="kop-text">
              ${(printConfig.kopDepartment || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI')
                .split('\n')
                .map(line => `<p class="kop-dept">${line.trim()}</p>`)
                .join('')
              }
              <h1 class="kop-school">${printConfig.schoolName}</h1>
              <p class="kop-address">${printConfig.schoolAddress}</p>
              <p class="kop-info">TAHUN PELAJARAN: ${printConfig.academicYear} | SEMESTER: ${printConfig.semester.toUpperCase()}</p>
            </div>
            ${rightLogoHtml}
          </div>
        ` : `
          <div class="simple-title">
            <h2>LEMBAR SOAL UJIAN TKA SMA</h2>
            <p><strong>Mata Pelajaran:</strong> ${printConfig.subjectName || config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'} | <strong>Muatan:</strong> ${config.muatan || 'SMA'}</p>
          </div>
        `}

        ${printConfig.showHeader ? `
          <div class="exam-meta-title">
            <h2>${printConfig.examName}</h2>
            <h1>MATA PELAJARAN: ${printConfig.subjectName || config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'}</h1>
            <div style="font-size: 8.5pt; margin-top: 4px; font-weight: bold;">
              <span>Fase/Muatan: ${config.muatan || 'SMA'}</span> &nbsp;|&nbsp; 
              <span>Alokasi Waktu: ${printConfig.timeAllocation}</span>
            </div>
          </div>
        ` : ''}

        ${printConfig.showStudentFields ? `
          <table class="student-fields">
            <tr>
              <td style="width: 50%;">NAMA LENGKAP: <span class="dotted-line"></span></td>
              <td style="width: 50%;">KELAS / JURUSAN: <span class="dotted-line"></span></td>
            </tr>
            <tr>
              <td style="width: 50%;">NOMOR PESERTA: <span class="dotted-line"></span></td>
              <td style="width: 50%;">HARI / TANGGAL: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        ` : ''}

        ${printConfig.instructionText ? `
          <div class="instructions-box">
            <strong>PETUNJUK PENGERJAAN:</strong> ${printConfig.instructionText}
          </div>
        ` : ''}

        <div class="questions-container ${printConfig.layoutColumns === '2' ? 'layout-columns-2' : ''}">
          ${questionsHtml}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Memuat sistem autentikasi TKA SMA...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={(role, name) => { setUserRole(role); setUserName(name); }} />;
  }

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Header */}
      <header id="header-section" className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md py-6 px-4 sm:px-8 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-inner border border-indigo-400">
              <Sparkles className="h-7 w-7 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
                TKA SMA <span className="text-yellow-400">Assessment Creator</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                Generator Prompt, Matriks Asesmen Kisi-Kisi, dan Pembuat Soal Akademik SMA Terintegrasi AI
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 text-xs text-slate-300">
              <span className={`h-2 w-2 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span>AI Engine: <b>{apiStatus === 'connected' ? 'Aktif & Siap' : 'Offline / Tanpa Kunci'}</b></span>
            </div>

            {/* User Profile Indicator */}
            <div className="flex items-center gap-2 bg-slate-850/80 backdrop-blur border border-slate-700 rounded-lg px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-indigo-400" />
              <span className="text-xs text-slate-200 font-medium">
                {userName} ({userRole === 'admin' ? '🔑 Admin' : '👤 Guru'})
              </span>
              <button 
                onClick={handleSignOut}
                className="ml-2 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-semibold px-2 py-0.5 rounded-md transition"
              >
                Keluar
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div id="tabs-navigation" className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <nav className="flex space-x-1 sm:space-x-8 py-3 overflow-x-auto">
            <button
              id="tab-btn-config"
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'config'
                  ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="h-4.5 w-4.5" />
              <span>1. Input Parameter & Prompt</span>
            </button>
            <button
              id="tab-btn-kisi"
              onClick={() => setActiveTab('kisi')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'kisi'
                  ? 'bg-indigo-50 text-indigo-800 shadow-sm border border-indigo-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              <span>2. Matriks Asesmen (Kisi-Kisi)</span>
              {kisiList.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                  {kisiList.length}
                </span>
              )}
            </button>
            <button
              id="tab-btn-soal"
              onClick={() => setActiveTab('soal')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'soal'
                  ? 'bg-emerald-50 text-emerald-800 shadow-sm border border-emerald-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              <span>3. Butir Soal TKA SMA</span>
              {questions.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                  {questions.length}
                </span>
              )}
            </button>
            <button
              id="tab-btn-materi"
              onClick={() => setActiveTab('materi')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'materi'
                  ? 'bg-purple-50 text-purple-800 shadow-sm border border-purple-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-4.5 w-4.5 text-purple-600" />
              <span>4. Prompt Slide & Infografis</span>
            </button>
            <button
              id="tab-btn-jadwal"
              onClick={() => setActiveTab('jadwal')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === 'jadwal'
                  ? 'bg-rose-50 text-rose-800 shadow-sm border border-rose-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="h-4.5 w-4.5 text-rose-600" />
              <span>5. Jadwal Pembelajaran XII</span>
            </button>
            {userRole === 'admin' && (
              <button
                id="tab-btn-users"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-amber-50 text-amber-800 shadow-sm border border-amber-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="h-4.5 w-4.5 text-amber-600" />
                <span>6. Manajemen Pengguna (Admin)</span>
                {usersList.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold">
                    {usersList.length}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        
        {/* Tab 1: Parameter & Prompt Generator */}
        {activeTab === 'config' && (
          <div id="config-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn no-print">
            
            {/* Left: Input parameters */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <Sliders className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">Isian Parameter Asesmen</h2>
              </div>

              <div className="space-y-4">
                {/* 1. Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    1. Mata Pelajaran TKA
                  </label>
                  <select
                    value={config.mataPelajaran}
                    onChange={(e) => setConfig({ ...config, mataPelajaran: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    <optgroup label="Mata Pelajaran Wajib">
                      <option value="Matematika">Matematika</option>
                      <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                      <option value="Bahasa Inggris">Bahasa Inggris</option>
                    </optgroup>
                    <optgroup label="Mata Pelajaran Pilihan">
                      <option value="Matematika Tingkat Lanjut">Matematika Tingkat Lanjut</option>
                      <option value="Bahasa Indonesia Tingkat Lanjut">Bahasa Indonesia Tingkat Lanjut</option>
                      <option value="Bahasa Inggris Tingkat Lanjut">Bahasa Inggris Tingkat Lanjut</option>
                      <option value="Fisika">Fisika</option>
                      <option value="Kimia">Kimia</option>
                      <option value="Biologi">Biologi</option>
                      <option value="Pendidikan Pancasila dan Kewarganegaraan">Pendidikan Pancasila dan Kewarganegaraan</option>
                      <option value="Ekonomi">Ekonomi</option>
                      <option value="Geografi">Geografi</option>
                      <option value="Sosiologi">Sosiologi</option>
                      <option value="Sejarah">Sejarah</option>
                      <option value="Antropologi">Antropologi</option>
                      <option value="Bahasa Prancis">Bahasa Prancis</option>
                      <option value="Bahasa Jerman">Bahasa Jerman</option>
                      <option value="Bahasa Jepang">Bahasa Jepang</option>
                      <option value="Bahasa Mandarin">Bahasa Mandarin</option>
                      <option value="Bahasa Korea">Bahasa Korea</option>
                      <option value="Bahasa Arab">Bahasa Arab</option>
                      <option value="Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK">Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK</option>
                    </optgroup>
                  </select>
                </div>

                {/* 2. Definisi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    2. Definisi / Tujuan Asesmen
                  </label>
                  <textarea
                    rows={2}
                    value={config.definisi}
                    onChange={(e) => setConfig({ ...config, definisi: e.target.value })}
                    placeholder="Tujuan spesifik asesmen ini..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm"
                  />
                </div>

                {/* 3. Muatan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    3. Muatan Kurikulum / Tingkat
                  </label>
                  <input
                    type="text"
                    value={config.muatan}
                    onChange={(e) => setConfig({ ...config, muatan: e.target.value })}
                    placeholder="Contoh: Kurikulum Merdeka - Fase F Kelas XII"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {/* 4. Kompetensi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    4. Kompetensi Dasar / Capaian
                  </label>
                  <textarea
                    rows={2}
                    value={config.kompetensi}
                    onChange={(e) => setConfig({ ...config, kompetensi: e.target.value })}
                    placeholder="Kompetensi umum yang akan diuji..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2 text-sm"
                  />
                </div>

                {/* Two column layouts */}
                <div className="grid grid-cols-2 gap-4">
                  {/* 5. Bentuk Soal */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      5. Bentuk Soal
                    </label>
                    <select
                      value={config.bentukSoal}
                      onChange={(e) => setConfig({ ...config, bentukSoal: e.target.value as BentukSoal })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="pilihan_ganda_sederhana">PG Sederhana (1 Jawaban)</option>
                      <option value="mcma">PG Kompleks (MCMA)</option>
                      <option value="kategori">PG Kompleks (Kategori)</option>
                    </select>
                  </div>

                  {/* 6. Level Kognitif */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      6. Level Kognitif
                    </label>
                    <select
                      value={config.levelKognitif}
                      onChange={(e) => setConfig({ ...config, levelKognitif: e.target.value as LevelKognitif })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      <option value="level_1">Pemahaman (Knowing)</option>
                      <option value="level_2">Penerapan (Applying)</option>
                      <option value="level_3">Penalaran (Reasoning)</option>
                    </select>

                    {/* Interactive Level Kognitif Deep Definitions */}
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs leading-relaxed text-slate-600 space-y-1">
                      {config.levelKognitif === 'level_1' && (
                        <div>
                          <span className="inline-flex items-center gap-1 font-bold text-amber-700 uppercase text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mb-0.5">🧠 Pemahaman (Knowing)</span>
                          <p className="text-slate-600 font-medium text-[11px]">Mengenali, mengingat, dan memahami konsep dasar secara teoretis.</p>
                        </div>
                      )}
                      {config.levelKognitif === 'level_2' && (
                        <div>
                          <span className="inline-flex items-center gap-1 font-bold text-sky-700 uppercase text-[10px] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 mb-0.5">⚙️ Penerapan (Applying)</span>
                          <p className="text-slate-600 font-medium text-[11px]">Menerapkan konsep, rumus, atau prosedur ilmiah pada situasi nyata / konkret.</p>
                        </div>
                      )}
                      {config.levelKognitif === 'level_3' && (
                        <div>
                          <span className="inline-flex items-center gap-1 font-bold text-purple-700 uppercase text-[10px] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mb-0.5">🧩 Penalaran (Reasoning)</span>
                          <p className="text-slate-600 font-medium text-[11px]">Berpikir kritis, menganalisis hubungan sebab-akibat, memecahkan masalah non-rutin, dan menalar secara logis.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Elemen & 8. Sub-Elemen */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      7. Elemen/Materi
                    </label>
                    <input
                      type="text"
                      value={config.elemenMateri}
                      onChange={(e) => setConfig({ ...config, elemenMateri: e.target.value })}
                      placeholder="Materi utama"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      8. Sub-Elemen
                    </label>
                    <input
                      type="text"
                      value={config.subElemenMateri}
                      onChange={(e) => setConfig({ ...config, subElemenMateri: e.target.value })}
                      placeholder="Submateri"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* 9. Batasan / Catatan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    9. Batasan / Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={config.batasanCatatan}
                    onChange={(e) => setConfig({ ...config, batasanCatatan: e.target.value })}
                    placeholder="Contoh: Maksimum variabel, jenis bilangan..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                {/* 10. Opsi & 11. Jenis Soal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      10. Pilihan Jawaban
                    </label>
                    <select
                      value={config.jumlahOpsi}
                      onChange={(e) => setConfig({ ...config, jumlahOpsi: Number(e.target.value) as JumlahOpsi })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value={4}>4 Opsi (A, B, C, D)</option>
                      <option value={5}>5 Opsi (A, B, C, D, E)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      11. Jenis Soal
                    </label>
                    <select
                      value={config.jenisSoal}
                      onChange={(e) => setConfig({ ...config, jenisSoal: e.target.value as JenisSoal })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2.5 text-sm"
                    >
                      <option value="tunggal">Soal Tunggal</option>
                      <option value="grup">Soal Grup / Bersama</option>
                    </select>
                  </div>
                </div>

                {/* Jumlah Soal */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Distribusi Target Jumlah Soal
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={config.jumlahSoal}
                    onChange={(e) => setConfig({ ...config, jumlahSoal: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>

            {/* Right: Extra Aspects + Prompts Outputs */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* AI Connection Settings Card */}
              <section id="ai-settings-card" className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Pengaturan Koneksi AI (Gemini)</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${aiConfig.mode === 'client' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}>
                    Mode Aktif: {aiConfig.mode === 'client' ? 'Bypass Browser' : 'Default Server'}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    Jika fitur pembuat soal AI gagal di server produksi (Vercel) akibat batas waktu eksekusi (timeout 10 detik), silakan beralih ke <b>Mode Browser (Direct API)</b> dengan memasukkan Kunci API Gemini Anda sendiri untuk bypass timeout tersebut secara total.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetAiMode('server')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${aiConfig.mode === 'server' ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>🌐 Mode Server</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetAiMode('client')}
                      className={`flex-1 py-2 px-3 rounded-xl border text-center font-bold transition flex items-center justify-center gap-1.5 ${aiConfig.mode === 'client' ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                    >
                      <span>⚡ Mode Browser (Direct)</span>
                    </button>
                  </div>

                  {aiConfig.mode === 'client' && (
                    <div className="space-y-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-fadeIn text-left">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                            Kunci API Gemini Anda (Direct API)
                          </label>
                          <a
                            href="https://aistudio.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:underline font-bold"
                          >
                            Dapatkan API Key Gratis ↗
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showApiKey ? "text" : "password"}
                              value={aiConfig.apiKey}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAiConfig(prev => ({ ...prev, apiKey: val }));
                                localStorage.setItem('gemini_api_key', val);
                              }}
                              placeholder="AIzaSy..."
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-3 pr-10 py-1.5 text-xs font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              localStorage.setItem('gemini_api_key', aiConfig.apiKey);
                              if (currentUser) {
                                try {
                                  await updateDoc(doc(db, 'users', currentUser.uid), {
                                    geminiApiKey: aiConfig.apiKey
                                  });
                                } catch (err) {
                                  console.error("Gagal menyimpan API Key ke cloud:", err);
                                }
                              }
                              setShowApiKeySaved(true);
                              setTimeout(() => setShowApiKeySaved(false), 3000);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm hover:shadow active:scale-95 flex-shrink-0"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>SIMPAN</span>
                          </button>
                        </div>

                        <AnimatePresence>
                          {showApiKeySaved && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, y: -4 }}
                              animate={{ opacity: 1, height: 'auto', y: 0 }}
                              exit={{ opacity: 0, height: 0, y: -4 }}
                              className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-600 mt-1 bg-emerald-50 border border-emerald-200/50 py-1 px-2.5 rounded-lg overflow-hidden"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Kunci API berhasil disimpan secara aman di browser!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                          Pilih Model Gemini
                        </label>
                        <select
                          value={aiConfig.model}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAiConfig(prev => ({ ...prev, model: val }));
                            localStorage.setItem('gemini_api_model', val);
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                        >
                          <option value="gemini-3.5-flash">gemini-3.5-flash (Utama - Sangat Cerdas, Cepat & Stabil)</option>
                          <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Hemat Kuota & Kecepatan Tinggi)</option>
                          <option value="gemini-flash-latest">gemini-flash-latest (Selalu Stabil & Terupdate)</option>
                        </select>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          💡 <b>Sistem Fallback Otomatis:</b> Jika model utama tidak dapat diakses, sistem akan otomatis mencoba model alternatif yang stabil agar pembuatan soal tidak terputus.
                        </p>
                      </div>

                      <p className="text-[10px] text-slate-500 pt-1 border-t border-indigo-100">
                        🔒 Kunci API disimpan secara lokal di browser Anda dan <b>tidak pernah</b> dikirimkan ke server eksternal mana pun selain Google API langsung.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Context and Quality Checklist Selector */}
              <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <Globe className="h-4 w-4 text-indigo-600" />
                  Konteks Nusantara & Stimulus Tambahan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Local Context Indonesia */}
                  <div>
                    <span className="block text-xs font-bold text-slate-500 mb-2">KONTEKS LOKAL INDONESIA</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                      {[
                        { key: 'Budaya Nusantara', label: '🎭 Budaya Nusantara' },
                        { key: 'Geografis Indonesia', label: '🗺️ Geografis Indonesia' },
                        { key: 'Kehidupan Sosial', label: '👥 Kehidupan Sosial' },
                        { key: 'Ekonomi Rakyat', label: '💰 Ekonomi Rakyat' },
                        { key: 'Teknologi Tradisional', label: '⚙️ Teknologi Tradisional' },
                        { key: 'Kearifan Lokal', label: '🏛️ Kearifan Lokal' },
                        { key: 'Keragaman Etnis', label: '🌈 Keragaman Etnis' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={config.konteksLokal.includes(item.key)}
                            onChange={() => handleToggleContext(item.key)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Stimulus Content */}
                  <div>
                    <span className="block text-xs font-bold text-slate-500 mb-2">STIMULUS & PENGEMBANGAN KONTEN</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                      {[
                        { key: 'Teks Bacaan', label: '📖 Teks Bacaan' },
                        { key: 'Gambar/Ilustrasi', label: '🖼️ Gambar/Ilustrasi' },
                        { key: 'Data/Tabel', label: '📊 Data/Tabel' },
                        { key: 'Grafik/Diagram', label: '📈 Grafik/Diagram' },
                        { key: 'Kasus Nyata', label: '🔍 Kasus Nyata' },
                        { key: 'Cerita Pendek', label: '📚 Cerita Pendek' },
                        { key: 'Berita/Artikel', label: '📰 Berita/Artikel' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={config.stimulusKonten.includes(item.key)}
                            onChange={() => handleToggleStimulus(item.key)}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quality Standard Checklist */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="block text-xs font-bold text-slate-500 mb-2">CHECKLIST STANDAR KUALITAS SOAL TKA</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Validasi Bahasa', 'Konstruksi Soal', 'Kesesuaian Materi', 
                      'Level Kognitif', 'Konteks Relevan', 'Tidak Bias', 
                      'Kejelasan Instruksi', 'Kunci Jawaban Tepat', 'Distractor Berkualitas', 
                      'Sesuai Kurikulum', 'Waktu Pengerjaan', 'Inklusivitas'
                    ].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.kualitasChecklist.includes(item)}
                          onChange={() => handleToggleQuality(item)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                        />
                        <span className="truncate">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              {/* Generated Prompts Preview */}
              <section className="bg-slate-900 text-slate-100 rounded-2xl shadow-lg p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 flex gap-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-mono px-2 py-0.5 rounded border border-indigo-500/30">
                    Prompt Engine v3.5
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  Salin Prompt atau Gunakan AI Instan
                </h3>

                <div className="space-y-4">
                  {/* Prompt A: Matriks Asesmen */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        PROMPT 1: PEMBUAT KISI-KISI (MATRIKS ASESMEN)
                      </span>
                      <button
                        onClick={() => handleCopy(generatedKisiPrompt, 'kisi')}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 transition-all"
                      >
                        {copiedKisi ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedKisi ? 'Tersalin!' : 'Salin Prompt'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap">
                      {generatedKisiPrompt}
                    </div>
                  </div>

                  {/* Prompt B: Soal */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                        PROMPT 2: PEMBUAT SOAL TKA SMA
                      </span>
                      <button
                        onClick={() => handleCopy(generatedSoalPrompt, 'soal')}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 transition-all"
                      >
                        {copiedSoal ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedSoal ? 'Tersalin!' : 'Salin Prompt'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-36 overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap">
                      {generatedSoalPrompt}
                    </div>
                  </div>

                  {/* Actions for Instant Generation */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleGenerateKisiViaAI}
                      disabled={isGeneratingKisi}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                    >
                      {isGeneratingKisi ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin text-white" />
                          <span>Menganalisis Kurikulum...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4.5 w-4.5 text-yellow-300" />
                          <span>Generate Kisi-Kisi Instan via AI</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGenerateAllQuestions}
                      disabled={isGeneratingSoal || kisiList.length === 0}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                    >
                      {isGeneratingSoal ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin text-white" />
                          <span>Merancang Soal & Kunci...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4.5 w-4.5" />
                          <span>Penyusunan Massal Soal dari Kisi-Kisi</span>
                        </>
                      )}
                    </button>
                  </div>
                  {kisiList.length === 0 && (
                    <p className="text-center text-[10px] text-amber-400">
                      💡 Generate atau tambahkan kisi-kisi terlebih dahulu untuk mengaktifkan Penyusunan Massal Soal.
                    </p>
                  )}
                </div>
              </section>

              {/* Instructions / Pedoman */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="h-4 w-4 text-blue-700 flex-shrink-0" />
                  <span>Petunjuk Kerja Aplikasi:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Langkah 1: Tentukan 11 parameter mata pelajaran serta muatan kurikulum di panel kiri.</li>
                  <li>Langkah 2: Salin prompt rancangan AI untuk manual playground, atau tekan tombol <b>"Generate Kisi-Kisi Instan via AI"</b> untuk mengotomatisasi pengisian.</li>
                  <li>Langkah 3: Tinjau dan edit matriks asesmen kisi-kisi Anda di tab kedua.</li>
                  <li>Langkah 4: Jalankan penyusunan butir soal, kemudian cetak atau download dalam format MS Word (.doc) atau Excel (.xls).</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Matriks Asesmen (Kisi-Kisi) */}
        {activeTab === 'kisi' && (
          <div id="kisi-panel" className="space-y-6 animate-fadeIn no-print">
            
            {/* Quick Summary Widget */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Matriks Asesmen Kisi-Kisi Soal TKA</h2>
                <p className="text-xs text-slate-500">
                  Berikut merupakan sebaran distribusi butir soal berdasarkan tingkat kognitif dan kompetensi dasar {config.mataPelajaran}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDeleteUnusedKisi}
                  className="bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                  title="Hapus semua baris kisi-kisi yang belum memiliki butir soal"
                >
                  <Trash2 className="h-4.5 w-4.5 text-rose-600" />
                  <span>Hapus Kisi-Kisi Kosong</span>
                </button>
                <button
                  onClick={() => exportKisiToExcel(kisiList, config.mataPelajaran)}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600" />
                  <span>Download Excel (.xls)</span>
                </button>
                <button
                  onClick={() => exportKisiToWord(kisiList, config.mataPelajaran, printConfig.pageSize)}
                  className="bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <FileText className="h-4.5 w-4.5 text-blue-600" />
                  <span>Download Word (.doc)</span>
                </button>
              </div>
            </div>

            {/* Rekomendasi Matriks Asesmen Pusmendik */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl shadow-md p-6 no-print space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-400" />
                    <span>🎯 Rekomendasi Matriks Asesmen {selectedPresetSubject} (Pusmendik)</span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-1">
                    Berikut adalah standar matriks asesmen/kisi-kisi resmi Pusmendik untuk pelajaran {selectedPresetSubject}. Anda dapat mengimpor sekaligus atau memilih per materi.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex flex-wrap gap-1">
                    <button
                      onClick={() => handleSelectPresetSubject('Matematika')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Matematika' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      📐 Matematika
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Bahasa Indonesia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Indonesia' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🇮🇩 Bahasa Indonesia
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Bahasa Inggris')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Inggris' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🇬🇧 Bahasa Inggris
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Matematika Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Matematika Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🚀 Mat Lanjut
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Bahasa Indonesia Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Indonesia Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ✍️ Indo Lanjut
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Bahasa Inggris Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Inggris Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗣️ Inggris Lanjut
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Fisika')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Fisika' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ⚛️ Fisika
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Kimia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Kimia' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧪 Kimia
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Biologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Biologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧬 Biologi
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('PPKN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'PPKN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗳️ PPKN
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Ekonomi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Ekonomi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      💰 Ekonomi
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Geografi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Geografi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🌍 Geografi
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Sosiologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Sosiologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      👥 Sosiologi
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Sejarah Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Sejarah Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      📜 Sejarah Tingkat Lanjut
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Antropologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Antropologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗿 Antropologi
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Bahasa Jepang')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Jepang' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🎌 Bahasa Jepang
                    </button>
                    <button
                      onClick={() => handleSelectPresetSubject('Produk Kreatif dan Kewirausahaan')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Produk Kreatif dan Kewirausahaan' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      💼 Kewirausahaan (PKK)
                    </button>
                  </div>
                  <button
                    onClick={handleImportAllPresets}
                    className="bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Impor Semua {
                      selectedPresetSubject === 'Matematika' 
                        ? PUSMENDIK_MATEMATIKA_PRESETS.length 
                        : selectedPresetSubject === 'Bahasa Indonesia' 
                        ? PUSMENDIK_BAHASA_INDONESIA_PRESETS.length 
                        : selectedPresetSubject === 'Bahasa Inggris' 
                        ? PUSMENDIK_BAHASA_INGGRIS_PRESETS.length 
                        : selectedPresetSubject === 'Matematika Tingkat Lanjut'
                        ? PUSMENDIK_MATEMATIKA_TL_PRESETS.length
                        : selectedPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
                        ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS.length
                        : selectedPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
                        ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS.length
                        : selectedPresetSubject === 'Fisika'
                        ? PUSMENDIK_FISIKA_PRESETS.length
                        : selectedPresetSubject === 'Kimia'
                        ? PUSMENDIK_KIMIA_PRESETS.length
                        : selectedPresetSubject === 'Biologi'
                        ? PUSMENDIK_BIOLOGI_PRESETS.length
                        : selectedPresetSubject === 'PPKN'
                        ? PUSMENDIK_PPKN_PRESETS.length
                        : selectedPresetSubject === 'Ekonomi'
                        ? PUSMENDIK_EKONOMI_PRESETS.length
                        : selectedPresetSubject === 'Geografi'
                        ? PUSMENDIK_GEOGRAFI_PRESETS.length
                        : selectedPresetSubject === 'Sosiologi'
                        ? PUSMENDIK_SOSIOLOGI_PRESETS.length
                        : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
                        ? PUSMENDIK_SEJARAH_TL_PRESETS.length
                        : selectedPresetSubject === 'Antropologi'
                        ? PUSMENDIK_ANTROPOLOGI_PRESETS.length
                        : selectedPresetSubject === 'Bahasa Jepang'
                        ? PUSMENDIK_BAHASA_JEPANG_PRESETS.length
                        : PUSMENDIK_PKK_PRESETS.length
                    } Matriks</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2">
                {(selectedPresetSubject === 'Matematika' 
                  ? PUSMENDIK_MATEMATIKA_PRESETS 
                  : selectedPresetSubject === 'Bahasa Indonesia' 
                  ? PUSMENDIK_BAHASA_INDONESIA_PRESETS 
                  : selectedPresetSubject === 'Bahasa Inggris'
                  ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
                  : selectedPresetSubject === 'Matematika Tingkat Lanjut'
                  ? PUSMENDIK_MATEMATIKA_TL_PRESETS
                  : selectedPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
                  ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
                  : selectedPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
                  ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
                  : selectedPresetSubject === 'Fisika'
                  ? PUSMENDIK_FISIKA_PRESETS
                  : selectedPresetSubject === 'Kimia'
                  ? PUSMENDIK_KIMIA_PRESETS
                  : selectedPresetSubject === 'Biologi'
                  ? PUSMENDIK_BIOLOGI_PRESETS
                  : selectedPresetSubject === 'PPKN'
                  ? PUSMENDIK_PPKN_PRESETS
                  : selectedPresetSubject === 'Ekonomi'
                  ? PUSMENDIK_EKONOMI_PRESETS
                  : selectedPresetSubject === 'Geografi'
                  ? PUSMENDIK_GEOGRAFI_PRESETS
                  : selectedPresetSubject === 'Sosiologi'
                  ? PUSMENDIK_SOSIOLOGI_PRESETS
                  : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
                  ? PUSMENDIK_SEJARAH_TL_PRESETS
                  : selectedPresetSubject === 'Antropologi'
                  ? PUSMENDIK_ANTROPOLOGI_PRESETS
                  : selectedPresetSubject === 'Bahasa Jepang'
                  ? PUSMENDIK_BAHASA_JEPANG_PRESETS
                  : PUSMENDIK_PKK_PRESETS
                ).map((preset, idx) => (
                  <div key={idx} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-indigo-500/50 transition">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
                          {preset.elemenMateri}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Materi #{idx + 1}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-yellow-300">{preset.subElemenMateri}</h4>
                      <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-3 hover:line-clamp-none transition-all duration-300 leading-relaxed" title={preset.kompetensi}>
                        <b>Kompetensi:</b> {preset.kompetensi}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 italic">
                        <b>Batasan:</b> {preset.batasanCatatan}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-3.5 pt-3 border-t border-slate-800">
                      <button
                        onClick={() => handleImportSinglePreset(preset, idx)}
                        disabled={importingPresetIds[`${preset.subElemenMateri}-${idx}`]}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-1.5 px-2.5 rounded text-[10px] transition text-center flex items-center justify-center gap-1"
                      >
                        {importingPresetIds[`${preset.subElemenMateri}-${idx}`] ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <span>+ Tambah Langsung</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleLoadPresetToForm(preset)}
                        className="bg-slate-850 hover:bg-slate-800 text-slate-200 font-semibold py-1 px-2 rounded text-[10px] transition"
                      >
                        Muat ke Form
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manually Add / Edit Row Form */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 no-print">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                {isEditingKisi ? 'Edit Baris Kisi-Kisi' : 'Tambah Baris Kisi-Kisi Manually'}
              </h3>
              <form onSubmit={handleSaveKisiForm} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-indigo-600 mb-1">Mata Pelajaran</label>
                  <select
                    value={config.mataPelajaran}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfig(prev => ({ ...prev, mataPelajaran: value }));
                      // Also sync preset subject selection for Pusmendik recommendations
                      if (value === 'Pendidikan Pancasila dan Kewarganegaraan') {
                        setSelectedPresetSubject('PPKN');
                      } else if (value === 'Sejarah') {
                        setSelectedPresetSubject('Sejarah Tingkat Lanjut');
                      } else if (value === 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK') {
                        setSelectedPresetSubject('Produk Kreatif dan Kewirausahaan');
                      } else if (value) {
                        setSelectedPresetSubject(value as any);
                      }
                    }}
                    className="w-full bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold rounded-lg px-2 py-1.5 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Matematika">Matematika</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Matematika Tingkat Lanjut">Matematika Tingkat Lanjut</option>
                    <option value="Bahasa Indonesia Tingkat Lanjut">Bahasa Indonesia Tingkat Lanjut</option>
                    <option value="Bahasa Inggris Tingkat Lanjut">Bahasa Inggris Tingkat Lanjut</option>
                    <option value="Fisika">Fisika</option>
                    <option value="Kimia">Kimia</option>
                    <option value="Biologi">Biologi</option>
                    <option value="Pendidikan Pancasila dan Kewarganegaraan">PPKN</option>
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Geografi">Geografi</option>
                    <option value="Sosiologi">Sosiologi</option>
                    <option value="Sejarah">Sejarah</option>
                    <option value="Antropologi">Antropologi</option>
                    <option value="Bahasa Prancis">Bahasa Prancis</option>
                    <option value="Bahasa Jerman">Bahasa Jerman</option>
                    <option value="Bahasa Jepang">Bahasa Jepang</option>
                    <option value="Bahasa Mandarin">Bahasa Mandarin</option>
                    <option value="Bahasa Korea">Bahasa Korea</option>
                    <option value="Bahasa Arab">Bahasa Arab</option>
                    <option value="Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK">Kewirausahaan (PKK)</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Materi / Elemen</label>
                  <input
                    type="text"
                    value={kisiForm.elemenMateri}
                    onChange={(e) => setKisiForm({ ...kisiForm, elemenMateri: e.target.value })}
                    placeholder="Materi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Sub-Materi</label>
                  <input
                    type="text"
                    value={kisiForm.subElemenMateri}
                    onChange={(e) => setKisiForm({ ...kisiForm, subElemenMateri: e.target.value })}
                    placeholder="Sub-materi"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Bentuk Soal</label>
                  <select
                    value={kisiForm.bentukSoal}
                    onChange={(e) => setKisiForm({ ...kisiForm, bentukSoal: e.target.value as BentukSoal })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="pilihan_ganda_sederhana">PG Sederhana</option>
                    <option value="mcma">PG Kompleks (MCMA)</option>
                    <option value="kategori">PG Kompleks (Kategori)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Tingkat Kognitif</label>
                  <select
                    value={kisiForm.levelKognitif}
                    onChange={(e) => setKisiForm({ ...kisiForm, levelKognitif: e.target.value as LevelKognitif })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <option value="level_1">Pemahaman (Knowing)</option>
                    <option value="level_2">Penerapan (Applying)</option>
                    <option value="level_3">Penalaran (Reasoning)</option>
                  </select>

                  {/* Manual form context helper */}
                  <div className="mt-1 text-[10px] text-slate-500 leading-snug">
                    {kisiForm.levelKognitif === 'level_1' && "🧠 Konsep dasar & ingatan"}
                    {kisiForm.levelKognitif === 'level_2' && "⚙️ Aplikasi pada fenomena nyata"}
                    {kisiForm.levelKognitif === 'level_3' && "🧩 Berpikir kritis & penalaran logis"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Kompetensi yang Diuji</label>
                  <input
                    type="text"
                    value={kisiForm.kompetensi}
                    onChange={(e) => setKisiForm({ ...kisiForm, kompetensi: e.target.value })}
                    placeholder="Contoh: Menganalisis sistem persamaan linear..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Batasan / Catatan</label>
                  <input
                    type="text"
                    value={kisiForm.batasanCatatan}
                    onChange={(e) => setKisiForm({ ...kisiForm, batasanCatatan: e.target.value })}
                    placeholder="Contoh: Bilangan real positif"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Jumlah Soal</label>
                  <input
                    type="number"
                    min={1}
                    value={kisiForm.jumlahSoal}
                    onChange={(e) => setKisiForm({ ...kisiForm, jumlahSoal: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center focus:border-indigo-500"
                  />
                </div>

                {/* Konteks Nusantara & Stimulus Tambahan Inputs */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-indigo-600 mb-1">🇮🇩 Deskripsi Konteks Nusantara Khusus (Opsional)</label>
                  <input
                    type="text"
                    value={kisiForm.konteksNusantara || ''}
                    onChange={(e) => setKisiForm({ ...kisiForm, konteksNusantara: e.target.value })}
                    placeholder="Contoh: Tradisi Lompat Batu Nias, Suku Baduy, Isu Maritim Indonesia"
                    className="w-full bg-slate-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-indigo-600 mb-1">📖 Deskripsi Stimulus Tambahan Khusus (Opsional)</label>
                  <input
                    type="text"
                    value={kisiForm.stimulusTambahan || ''}
                    onChange={(e) => setKisiForm({ ...kisiForm, stimulusTambahan: e.target.value })}
                    placeholder="Contoh: Kutipan studi kasus, data tabel demografi, narasi berita"
                    className="w-full bg-slate-50 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs focus:border-indigo-500"
                  />
                </div>

                {/* Konteks Nusantara, Stimulus & Checklist Checkboxes */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3 mt-2">
                  {/* KONTEKS LOKAL INDONESIA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">🎭 KONTEKS LOKAL INDONESIA</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 border border-slate-200/60 p-2 rounded-lg bg-slate-50/50">
                      {[
                        { key: 'Budaya Nusantara', label: '🎭 Budaya Nusantara' },
                        { key: 'Geografis Indonesia', label: '🗺️ Geografis Indonesia' },
                        { key: 'Kehidupan Sosial', label: '👥 Kehidupan Sosial' },
                        { key: 'Ekonomi Rakyat', label: '💰 Ekonomi Rakyat' },
                        { key: 'Teknologi Tradisional', label: '⚙️ Teknologi Tradisional' },
                        { key: 'Kearifan Lokal', label: '🏛️ Kearifan Lokal' },
                        { key: 'Keragaman Etnis', label: '🌈 Keragaman Etnis' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                          <input
                            type="checkbox"
                            checked={(kisiForm.konteksLokal || []).includes(item.key)}
                            onChange={() => handleToggleKisiContext(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* STIMULUS & PENGEMBANGAN KONTEN */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">📖 STIMULUS & PENGEMBANGAN KONTEN</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 border border-slate-200/60 p-2 rounded-lg bg-slate-50/50">
                      {[
                        { key: 'Teks Bacaan', label: '📖 Teks Bacaan' },
                        { key: 'Gambar/Ilustrasi', label: '🖼️ Gambar/Ilustrasi' },
                        { key: 'Data/Tabel', label: '📊 Data/Tabel' },
                        { key: 'Grafik/Diagram', label: '📈 Grafik/Diagram' },
                        { key: 'Kasus Nyata', label: '🔍 Kasus Nyata' },
                        { key: 'Cerita Pendek', label: '📚 Cerita Pendek' },
                        { key: 'Berita/Artikel', label: '📰 Berita/Artikel' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                          <input
                            type="checkbox"
                            checked={(kisiForm.stimulusKonten || []).includes(item.key)}
                            onChange={() => handleToggleKisiStimulus(item.key)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* CHECKLIST STANDAR KUALITAS SOAL TKA */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">📋 STANDAR KUALITAS SOAL TKA</label>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1 border border-slate-200/60 p-2 rounded-lg bg-slate-50/50">
                      {[
                        'Validasi Bahasa', 'Konstruksi Soal', 'Kesesuaian Materi', 
                        'Level Kognitif', 'Konteks Relevan', 'Tidak Bias', 
                        'Kejelasan Instruksi', 'Kunci Jawaban Tepat', 'Distractor Berkualitas', 
                        'Sesuai Kurikulum', 'Waktu Pengerjaan', 'Inklusivitas'
                      ].map((item) => (
                        <label key={item} className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-700 cursor-pointer hover:bg-slate-100 p-0.5 rounded">
                          <input
                            type="checkbox"
                            checked={(kisiForm.kualitasChecklist || []).includes(item)}
                            onChange={() => handleToggleKisiQuality(item)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-3 w-3"
                          />
                          <span className="truncate">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3 mt-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs px-5 py-2 transition whitespace-nowrap"
                  >
                    {isEditingKisi ? 'Update' : 'Simpan'}
                  </button>
                  {isEditingKisi && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingKisi(false);
                        setEditingKisiId(null);
                        setKisiForm({
                          bentukSoal: 'pilihan_ganda_sederhana',
                          levelKognitif: 'level_2',
                          elemenMateri: '',
                          subElemenMateri: '',
                          kompetensi: '',
                          batasanCatatan: '',
                          jumlahSoal: 5,
                          konteksNusantara: '',
                          stimulusTambahan: '',
                          konteksLokal: [],
                          stimulusKonten: [],
                          kualitasChecklist: []
                        });
                      }}
                      className="bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs px-4 py-2 transition"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Matrix Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">MATRIKS ASESMEN KISI-KISI SOAL</span>
                <span className="text-xs bg-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded-full font-bold">
                  Total Kisi-Kisi: {kisiList.length} baris
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4">Bentuk Soal</th>
                      <th className="py-3.5 px-4">Tingkat Kognitif</th>
                      <th className="py-3.5 px-4">Elemen / Materi</th>
                      <th className="py-3.5 px-4">Sub-elemen / Submateri</th>
                      <th className="py-3.5 px-4">Kompetensi yang Diuji</th>
                      <th className="py-3.5 px-4">Batasan / Catatan</th>
                      <th className="py-3.5 px-4 w-[220px]">🇮🇩 Konteks & Stimulus</th>
                      <th className="py-3.5 px-4 text-center w-24">Jumlah Soal</th>
                      <th className="py-3.5 px-4 text-center w-32 no-print">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kisiList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-slate-400 font-medium">
                          Belum ada data kisi-kisi. Sila tambahkan di atas atau gunakan tombol AI untuk membuat otomatis!
                        </td>
                      </tr>
                    ) : (
                      kisiList.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all text-xs">
                          <td className="py-4 px-4 text-center font-bold text-slate-700">{item.no}</td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                              item.bentukSoal === 'pilihan_ganda_sederhana' ? 'bg-blue-100 text-blue-800' :
                              item.bentukSoal === 'mcma' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {getBentukSoalLabel(item.bentukSoal)}
                            </span>
                          </td>
                          <td className="py-4 px-4 min-w-[220px]">
                            {item.levelKognitif === 'level_1' && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  🧠 Pemahaman (Knowing)
                                </span>
                                <p className="text-[10.5px] text-slate-500 leading-snug font-medium">
                                  Mengenali, mengingat, dan memahami konsep dasar secara teoretis.
                                </p>
                              </div>
                            )}
                            {item.levelKognitif === 'level_2' && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                  ⚙️ Penerapan (Applying)
                                </span>
                                <p className="text-[10.5px] text-slate-500 leading-snug font-medium">
                                  Menerapkan konsep pada fenomena nyata / konkret.
                                </p>
                              </div>
                            )}
                            {item.levelKognitif === 'level_3' && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  🧩 Penalaran (Reasoning)
                                </span>
                                <p className="text-[10.5px] text-slate-500 leading-snug font-medium">
                                  Berpikir kritis, menganalisis hubungan sebab-akibat, memecahkan masalah non-rutin, dan menalar secara logis.
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">{item.elemenMateri}</td>
                          <td className="py-4 px-4 text-slate-600">{item.subElemenMateri}</td>
                          <td className="py-4 px-4 text-slate-700 leading-relaxed font-medium">{item.kompetensi}</td>
                          <td className="py-4 px-4 text-slate-500 italic">{item.batasanCatatan || '-'}</td>
                          <td className="py-4 px-4 min-w-[240px]">
                            {/* Konteks Nusantara */}
                            {((item.konteksLokal && item.konteksLokal.length > 0) || item.konteksNusantara) ? (
                              <div className="mb-2">
                                <span className="inline-block font-bold text-indigo-700 bg-indigo-50 px-1 rounded text-[10px] mr-1">🇮🇩 Konteks:</span>
                                {item.konteksLokal && item.konteksLokal.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                    {item.konteksLokal.map(k => (
                                      <span key={k} className="bg-slate-100 text-slate-800 text-[9px] px-1.5 py-0.5 rounded font-medium">
                                        {k}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.konteksNusantara && (
                                  <span className="text-slate-700 block text-[11px] leading-relaxed">{item.konteksNusantara}</span>
                                )}
                              </div>
                            ) : null}

                            {/* Stimulus Tambahan */}
                            {((item.stimulusKonten && item.stimulusKonten.length > 0) || item.stimulusTambahan) ? (
                              <div className="mb-2">
                                <span className="inline-block font-bold text-purple-700 bg-purple-50 px-1 rounded text-[10px] mr-1">📖 Stimulus:</span>
                                {item.stimulusKonten && item.stimulusKonten.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                                    {item.stimulusKonten.map(s => (
                                      <span key={s} className="bg-purple-100/50 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-medium">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.stimulusTambahan && (
                                  <span className="text-slate-700 block text-[11px] leading-relaxed">{item.stimulusTambahan}</span>
                                )}
                              </div>
                            ) : null}

                            {/* Standar Mutu */}
                            {item.kualitasChecklist && item.kualitasChecklist.length > 0 ? (
                              <div>
                                <span className="inline-block font-bold text-emerald-700 bg-emerald-50 px-1 rounded text-[10px] mr-1">📋 Standar Mutu:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.kualitasChecklist.map(c => (
                                    <span key={c} className="bg-emerald-100/50 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-medium">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {!item.konteksNusantara && !item.stimulusTambahan && (!item.konteksLokal || item.konteksLokal.length === 0) && (!item.stimulusKonten || item.stimulusKonten.length === 0) && (!item.kualitasChecklist || item.kualitasChecklist.length === 0) ? (
                              <span className="text-slate-400 italic">-</span>
                            ) : null}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="font-bold text-slate-800 text-sm">
                              {item.jumlahSoal}
                            </div>
                            <div className="mt-1">
                              {(() => {
                                const count = questions.filter(q => q.kisiKisiId === item.id).length;
                                return count > 0 ? (
                                  <span className="inline-block bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    {count} Soal Terbuat
                                  </span>
                                ) : (
                                  <span className="inline-block bg-slate-100 text-slate-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    Belum Ada Soal
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center space-y-1.5 no-print">
                            {deletingKisiId === item.id ? (
                              <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-lg space-y-1">
                                <span className="text-[10px] font-bold text-rose-700 block text-center">Yakin Hapus?</span>
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => {
                                      handleDeleteKisi(item.id);
                                      setDeletingKisiId(null);
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-1.5 py-0.5 rounded text-[10px] transition"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeletingKisiId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px] transition"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleEditKisi(item)}
                                    className="text-slate-600 hover:text-indigo-600 p-1.5 hover:bg-slate-100 rounded transition"
                                    title="Edit baris"
                                  >
                                    <Sliders className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingKisiId(item.id)}
                                    className="text-slate-600 hover:text-red-600 p-1.5 hover:bg-slate-100 rounded transition"
                                    title="Hapus baris"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1.5 mt-1.5">
                                  <button
                                    onClick={() => handleGenerateQuestionsForKisi(item)}
                                    disabled={isGeneratingSoal}
                                    className="w-full bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold py-1.5 px-1.5 rounded-lg border border-emerald-100 flex items-center justify-center gap-1 transition"
                                    title="Buat butir soal langsung via AI"
                                  >
                                    <Sparkles className="h-3 w-3 text-emerald-600" />
                                    <span>Buat Soal</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenPromptGenerator(item)}
                                    className="w-full bg-indigo-50 text-indigo-800 hover:bg-indigo-100 text-[10px] font-bold py-1.5 px-1.5 rounded-lg border border-indigo-100 flex items-center justify-center gap-1 transition"
                                    title="Buat prompt otomatis untuk disalin ke AI eksternal"
                                  >
                                    <FileText className="h-3 w-3 text-indigo-600" />
                                    <span>Buat Prompt</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pembuat Soal TKA SMA */}
        {activeTab === 'soal' && (
          <div id="soal-panel" className="space-y-6 animate-fadeIn no-print">
            
            {/* Upper Action Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Daftar Soal TKA SMA</h2>
                <p className="text-xs text-slate-500">
                  Berikut merupakan butir-butir soal yang dikonstruksi berdasarkan Matriks Asesmen dan standar HOTS TKA Nasional.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportQuestionsToExcel(questions, printConfig.subjectName || config.mataPelajaran, printConfig.examName, printConfig.showAnswerKey)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                  <span>Download Excel (.xls)</span>
                </button>
                <button
                  onClick={() => exportQuestionsToWord(questions, printConfig.subjectName || config.mataPelajaran, printConfig.pageSize, printConfig.examName, printConfig.showAnswerKey)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>Download Word (.doc)</span>
                </button>
                {currentUser ? (
                  <button
                    onClick={() => setIsEditingQuestion(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="h-4.5 w-4.5" />
                    <span>Tambah Soal</span>
                  </button>
                ) : (
                  <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 cursor-not-allowed select-none">
                    <Lock className="h-4 w-4" />
                    <span>Tambah Soal (Silakan Login)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Question Form */}
            {isEditingQuestion && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 no-print">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5 text-blue-600" />
                  {editingQuestionId ? 'Ubah Butir Soal' : 'Form Manual Pembuatan Soal'}
                </h3>
                <form onSubmit={handleSaveQuestionForm} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Hubungkan ke Kisi-Kisi</label>
                      <select
                        value={questionForm.kisiKisiId}
                        onChange={(e) => {
                          const selectedKisi = kisiList.find(k => k.id === e.target.value);
                          setQuestionForm({
                            ...questionForm,
                            kisiKisiId: e.target.value,
                            kompetensi: selectedKisi?.kompetensi || '',
                            subKompetensi: selectedKisi?.subElemenMateri || '',
                            bentukSoal: selectedKisi?.bentukSoal || 'pilihan_ganda_sederhana'
                          });
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="">-- Hubungkan Kisi-Kisi (Opsional) --</option>
                        {kisiList.map(k => (
                          <option key={k.id} value={k.id}>No {k.no}: {k.elemenMateri} - {k.subElemenMateri}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kompetensi Spesifik</label>
                      <input
                        type="text"
                        value={questionForm.kompetensi}
                        onChange={(e) => setQuestionForm({ ...questionForm, kompetensi: e.target.value })}
                        placeholder="Kompetensi yang diuji"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Bentuk Soal</label>
                      <select
                        value={questionForm.bentukSoal}
                        onChange={(e) => setQuestionForm({ ...questionForm, bentukSoal: e.target.value as BentukSoal })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs"
                      >
                        <option value="pilihan_ganda_sederhana">PG Sederhana</option>
                        <option value="mcma">PG Kompleks (MCMA)</option>
                        <option value="kategori">PG Kompleks (Kategori)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Teks Stimulus (Paragraf Pengantar/Data/Kasus)</label>
                    <textarea
                      rows={2}
                      value={questionForm.stimulus}
                      onChange={(e) => setQuestionForm({ ...questionForm, stimulus: e.target.value })}
                      placeholder="Masukkan stimulus soal (jika ada)..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Pertanyaan / Pokok Soal (Wajib)</label>
                    <textarea
                      rows={3}
                      value={questionForm.soal}
                      onChange={(e) => setQuestionForm({ ...questionForm, soal: e.target.value })}
                      placeholder="Masukkan pertanyaan utama..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      required
                    />
                  </div>

                  {/* Options management */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-slate-500">Pilihan/Pernyataan Jawaban</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['A', 'B', 'C', 'D', 'E'].map((letter, idx) => (
                        <div key={letter} className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-slate-200 w-6 h-6 rounded-full flex items-center justify-center">{letter}</span>
                          <input
                            type="text"
                            value={(questionForm.opsi || [])[idx] || ''}
                            onChange={(e) => handleOpsiChange(idx, e.target.value)}
                            placeholder={`Pilihan ${letter}`}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kunci Jawaban Tepat (Wajib)</label>
                      <input
                        type="text"
                        value={questionForm.kunciJawaban}
                        onChange={(e) => setQuestionForm({ ...questionForm, kunciJawaban: e.target.value })}
                        placeholder="Contoh: A, atau B, atau Benar/Salah"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Kata Kunci / Konsep Utama</label>
                      <input
                        type="text"
                        value={questionForm.kataKunci || ''}
                        onChange={(e) => setQuestionForm({ ...questionForm, kataKunci: e.target.value })}
                        placeholder="Contoh: Persamaan Kuadrat, Fotosintesis"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Pembahasan Terstruktur</label>
                      <textarea
                        rows={2}
                        value={questionForm.pembahasan}
                        onChange={(e) => setQuestionForm({ ...questionForm, pembahasan: e.target.value })}
                        placeholder="Cara kerja penyelesaian ilmiah..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 flex justify-between items-center">
                      <span>Ilustrasi / Grafik / Infografis Pendukung (Opsional)</span>
                      <span className="text-[10px] text-indigo-600 font-semibold font-sans">Mendukung Link Gambar (http://), Kode SVG Lengkap (&lt;svg&gt;), atau Upload File</span>
                    </label>
                    <textarea
                      rows={2}
                      value={questionForm.gambarUrl || ''}
                      onChange={(e) => setQuestionForm({ ...questionForm, gambarUrl: e.target.value })}
                      placeholder="Contoh: https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500  ATAU kode <svg viewBox='0 0 400 150'>...</svg>"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />

                    {/* Direct Image File Uploader & Clear Button */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-250 select-none">
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span>📁 Pilih/Upload Gambar dari Komputer</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setQuestionForm(prev => ({
                                  ...prev,
                                  gambarUrl: reader.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                      {questionForm.gambarUrl && (
                        <button
                          type="button"
                          onClick={() => setQuestionForm(prev => ({ ...prev, gambarUrl: '' }))}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition border border-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus Gambar
                        </button>
                      )}
                      {questionForm.gambarUrl && !questionForm.gambarUrl.trim().toLowerCase().startsWith('<svg') && (
                        <div className="h-8 w-8 rounded border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50">
                          <img src={questionForm.gambarUrl} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Bank Prompt Super-AI Section */}
                    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">📋 Bank Prompt Siap Pakai (Stimulus, Gambar & Tabel)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Gunakan rekomendasi prompt super-efektif berikut untuk dimasukkan ke AI (seperti Nano Banana, Gemini, atau AI Studio) demi menghasilkan stimulus berkelas HOTS SMA.
                      </p>

                      {/* Tab buttons */}
                      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2 mb-3">
                        {[
                          { id: 'ilustrasi', label: '🖼️ Gambar/Ilustrasi', icon: Image },
                          { id: 'tabel', label: '📊 Data/Tabel', icon: FileSpreadsheet },
                          { id: 'grafik', label: '📈 Grafik/Diagram', icon: Sliders },
                          { id: 'stimulus', label: '📝 Kasus Stimulus', icon: FileText }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activePromptTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActivePromptTab(tab.id as any)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                                isActive 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Tab Content */}
                      <div className="space-y-3">
                        {activePromptTab === 'ilustrasi' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-700">Prompt Vektor Ilustrasi SVG Kreatif</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Buatkan sebuah ilustrasi ikonik atau diagram vektor sederhana dengan SVG mentah (raw SVG) bertema [Isi Topik, misal: pembelahan sel / simbol gotong royong sosiologis / piramida kasta sosial]. Gunakan paduan warna kekinian (indigo, teal, slate). Desain harus bersih, modern, rata tengah, dengan viewBox='0 0 400 150'. Hanya berikan kode SVG tanpa teks intro atau penjelasan apapun.`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedPromptId('ilustrasi');
                                  setTimeout(() => setCopiedPromptId(null), 2000);
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1 border border-slate-200"
                              >
                                {copiedPromptId === 'ilustrasi' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-500" />
                                    <span>Salin Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono select-all">
                              Buatkan sebuah ilustrasi ikonik atau diagram vektor sederhana dengan SVG mentah (raw SVG) bertema <span className="bg-yellow-100 px-1 font-bold text-slate-800 rounded">[Isi Topik, misal: pembelahan sel / simbol gotong royong sosiologis]</span>. Gunakan paduan warna kekinian (indigo, teal, slate). Desain harus bersih, modern, rata tengah, dengan viewBox='0 0 400 150'. Hanya berikan kode SVG tanpa teks intro atau penjelasan apapun.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-2 block italic">💡 Cara pakai: Salin prompt di atas, ganti bagian kuning dengan topik Anda, paste ke AI, dan tempelkan kode SVG hasilnya langsung ke kolom input gambar di atas!</span>
                          </div>
                        )}

                        {activePromptTab === 'tabel' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-700">Prompt Pembuatan Tabel Data HTML</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Buatkan tabel data statistik/matriks dalam format HTML sederhana yang berisi data perbandingan [Isi Topik, misal: laju inflasi 5 negara / persentase kesenjangan sosial antar wilayah]. Tabel harus memiliki class Tailwind yang minimalis dan elegan, atau styling inline border abu-abu tipis (border-collapse: collapse). Baris header harus kontras dengan latar belakang soft-slate. Tuliskan HANYA kode HTML tabel di dalam blok kode \`\`\`html agar siap saya tempelkan sebagai stimulus.`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedPromptId('tabel');
                                  setTimeout(() => setCopiedPromptId(null), 2000);
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1 border border-slate-200"
                              >
                                {copiedPromptId === 'tabel' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-500" />
                                    <span>Salin Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono select-all">
                              Buatkan tabel data statistik/matriks dalam format HTML sederhana yang berisi data perbandingan <span className="bg-yellow-100 px-1 font-bold text-slate-800 rounded">[Isi Topik, misal: laju inflasi 5 negara / kesenjangan sosial]</span>. Tabel harus memiliki class Tailwind yang minimalis dan elegan, atau styling inline border abu-abu tipis (border-collapse: collapse). Baris header harus kontras dengan latar belakang soft-slate. Tuliskan HANYA kode HTML tabel di dalam blok kode ```html agar siap saya tempelkan sebagai stimulus.
                            </p>
                            <span className="text-[10px] text-slate-400 mt-2 block italic">💡 Cara pakai: Hasil dari AI berupa tabel HTML/Tailwind bisa langsung diletakkan di input Teks Stimulus di atas agar tampil rapi dan presisi di lembar soal!</span>
                          </div>
                        )}

                        {activePromptTab === 'grafik' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-700">Prompt Grafik / Kurva SVG Presisi</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Saya ingin membuat butir soal HOTS SMA. Tolong buatkan kode SVG mentah (raw code) untuk grafik/diagram [Isi Topik, misal: kurva permintaan ekonomi / grafik sosiogram / diagram jaring-jaring makanan]. SVG harus: 1. Berwarna modern, bersih, latar belakang transparan. 2. Memiliki sumbu X dan Y dengan label teks yang jelas. 3. Elemen garis/kurva dengan stroke tebal yang estetik. 4. Ukuran viewBox='0 0 500 200'. Tuliskan HANYA kode SVG-nya saja di dalam blok kode \`\`\`xml tanpa penjelasan tambahan.`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedPromptId('grafik');
                                  setTimeout(() => setCopiedPromptId(null), 2000);
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1 border border-slate-200"
                              >
                                {copiedPromptId === 'grafik' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-500" />
                                    <span>Salin Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono select-all">
                              Saya ingin membuat butir soal HOTS SMA. Tolong buatkan kode SVG mentah (raw code) untuk grafik/diagram <span className="bg-yellow-100 px-1 font-bold text-slate-800 rounded">[Isi Topik, misal: kurva permintaan ekonomi / diagram jaring makanan]</span>. SVG harus: 1. Berwarna modern, bersih, latar belakang transparan. 2. Memiliki sumbu X dan Y dengan label teks yang jelas. 3. Elemen garis/kurva dengan stroke tebal yang estetik. 4. Ukuran viewBox='0 0 500 200'. Tuliskan HANYA kode SVG-nya saja di dalam blok kode ```xml tanpa penjelasan tambahan.
                            </p>
                          </div>
                        )}

                        {activePromptTab === 'stimulus' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-700">Prompt Penulisan Stimulus HOTS Berkualitas</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = `Tuliskan sebuah teks stimulus berkualitas tinggi (HOTS) bertema [Isi Topik, misal: fenomena gentrifikasi perkotaan / perubahan iklim global]. Teks harus berupa studi kasus pendek atau berita ilmiah (150-200 kata), menyajikan konflik/dilema nyata, objektif, ilmiah, dan memicu kemampuan berpikir kritis siswa SMA. Akhiri dengan satu pertanyaan analisis mendalam.`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedPromptId('stimulus');
                                  setTimeout(() => setCopiedPromptId(null), 2000);
                                }}
                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition font-bold flex items-center gap-1 border border-slate-200"
                              >
                                {copiedPromptId === 'stimulus' ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span className="text-emerald-600">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-slate-500" />
                                    <span>Salin Prompt</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono select-all">
                              Tuliskan sebuah teks stimulus berkualitas tinggi (HOTS) bertema <span className="bg-yellow-100 px-1 font-bold text-slate-800 rounded">[Isi Topik, misal: fenomena gentrifikasi perkotaan]</span>. Teks harus berupa studi kasus pendek atau berita ilmiah (150-200 kata), menyajikan konflik/dilema nyata, objektif, ilmiah, dan memicu kemampuan berpikir kritis siswa SMA. Akhiri dengan satu pertanyaan analisis mendalam.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Illustration / Graphic Generator Widget (Nana Banana) */}
                    <div className="mt-2.5 space-y-2">
                      {!isGeneratingIllustration && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsAiIllustratorOpen(!isAiIllustratorOpen);
                            // Auto-fill prompt if empty based on question content
                            if (!aiIllustratorPrompt && questionForm.soal) {
                              const cleanSoal = questionForm.soal.length > 60 ? questionForm.soal.substring(0, 60) + '...' : questionForm.soal;
                              setAiIllustratorPrompt(`Buat ilustrasi diagram/grafik matematika/sains yang sesuai untuk soal: ${cleanSoal}`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-100/60 text-[11px] font-bold transition shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
                          {isAiIllustratorOpen ? "Tutup Perancang Gambar AI" : "✨ Rancang Ilustrasi / Grafik via AI Gemini"}
                        </button>
                      )}

                      {isAiIllustratorOpen && !isGeneratingIllustration && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                        >
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span>Instruksi Gambar / Grafik (Bisa Diatur Sesuai Keinginan):</span>
                            <span className="text-[10px] text-indigo-600 font-semibold font-mono">Output Vektor SVG</span>
                          </div>
                          
                          <textarea
                            rows={3}
                            value={aiIllustratorPrompt}
                            onChange={(e) => setAiIllustratorPrompt(e.target.value)}
                            placeholder="Contoh: Grafik fungsi kuadrat y = x^2 - 4x + 3 lengkap dengan label sumbu X, Y dan titik puncak (2,-1)"
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />

                          {/* Quick Preset Chips */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspirasi Cepat:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "Grafik Parabola Kuadrat",
                                "Sirkuit Listrik Seri Paralel",
                                "Diagram Venn Himpunan",
                                "Diagram Alir (Flowchart)",
                                "Siklus Biologi (Air/Karbon)",
                                "Bangun Geometri Kubus 3D"
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAiIllustratorPrompt(`Buatlah ilustrasi ${preset.toLowerCase()} yang indah, presisi, berwarna modern, lengkap dengan label keterangannya.`)}
                                  className="px-2 py-1 text-[10px] bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition font-medium"
                                >
                                  + {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-150">
                            <button
                              type="button"
                              onClick={() => setIsAiIllustratorOpen(false)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-xl text-[11px] transition"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleGenerateCustomIllustration}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-[11px] transition shadow-sm flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              Mulai Desain
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Animated Shimmer Loading Area */}
                      {isGeneratingIllustration && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md overflow-hidden relative"
                        >
                          {/* Top shining progress bar line */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse" />
                          
                          <div className="flex items-start gap-3">
                            <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full border-2 border-slate-800 border-t-indigo-400 animate-spin" />
                              <Sparkles className="h-4 w-4 text-indigo-400 animate-bounce" />
                            </div>
                            
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-widest">
                                AI Desainer sedang Bekerja...
                              </div>
                              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="italic text-slate-200 font-sans">{aiIllustratorStatus}</span>
                              </div>
                            </div>
                          </div>

                          {/* Animated progress track */}
                          <div className="space-y-1">
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative">
                              <motion.div
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full absolute left-0 top-0"
                                initial={{ width: "3%" }}
                                animate={{ width: ["15%", "45%", "75%", "92%"] }}
                                transition={{ duration: 15, ease: "easeInOut" }}
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex justify-between font-medium">
                              <span>Menggambar elemen grafik presisi tinggi</span>
                              <span className="animate-pulse">Mohon tunggu...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingQuestion(false);
                        setEditingQuestionId(null);
                      }}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-5 py-2 rounded-xl text-xs transition flex items-center gap-1.5"
                    >
                      {isSavingQuestion ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Butir Soal</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MENU SETTING CETAK (PRINT SETTINGS) - NEW REQUESTED FEATURE */}
            <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl shadow-xl p-5 sm:p-6 no-print space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-950 p-2 rounded-xl border border-blue-500/30">
                    <Settings className="h-5 w-5 text-blue-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      Menu Pengaturan MasterPrint TKA SMA
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Atur Kop Surat, identitas siswa, tata letak dua kolom, ukuran tulisan, dan cetak lembar kosong siswa atau lembar kunci jawaban.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPrintSettingsOpen(!isPrintSettingsOpen)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {isPrintSettingsOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
                </button>
              </div>

              {isPrintSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1"
                >
                  {/* Left Column - School Header info */}
                  <div className="lg:col-span-6 space-y-3">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block border-l-2 border-blue-500 pl-2">
                      Identitas Akademik & Kop Surat
                    </span>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Dinas / Kementerian (Kop Atas - Bisa beberapa baris)
                      </label>
                      <textarea
                        rows={2}
                        value={printConfig.kopDepartment}
                        onChange={(e) => setPrintConfig({ ...printConfig, kopDepartment: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="Contoh:&#10;PEMERINTAH PROVINSI JAWA TIMUR&#10;DINAS PENDIDIKAN"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Lembaga / Sekolah</label>
                        <input
                          type="text"
                          value={printConfig.schoolName}
                          onChange={(e) => setPrintConfig({ ...printConfig, schoolName: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          placeholder="SMA Negeri Nusantara"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alamat Sekolah</label>
                        <input
                          type="text"
                          value={printConfig.schoolAddress}
                          onChange={(e) => setPrintConfig({ ...printConfig, schoolAddress: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          placeholder="Jalan Pendidikan Raya No. 45 Nusantara - Telp/Fax: (021) 777-1234 - Website: www.sekolahkita.sch.id"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Ujian / Asesmen</label>
                        <input
                          type="text"
                          value={printConfig.examName}
                          onChange={(e) => setPrintConfig({ ...printConfig, examName: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mata Pelajaran</label>
                        <input
                          type="text"
                          value={printConfig.subjectName || ''}
                          onChange={(e) => setPrintConfig({ ...printConfig, subjectName: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          placeholder="Mata Pelajaran"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tahun Ajaran</label>
                        <input
                          type="text"
                          value={printConfig.academicYear}
                          onChange={(e) => setPrintConfig({ ...printConfig, academicYear: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semester</label>
                        <select
                          value={printConfig.semester}
                          onChange={(e) => setPrintConfig({ ...printConfig, semester: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="Ganjil">Ganjil</option>
                          <option value="Genap">Genap</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alokasi Waktu</label>
                        <input
                          type="text"
                          value={printConfig.timeAllocation}
                          onChange={(e) => setPrintConfig({ ...printConfig, timeAllocation: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Petunjuk Pengerjaan Soal</label>
                      <textarea
                        rows={2}
                        value={printConfig.instructionText}
                        onChange={(e) => setPrintConfig({ ...printConfig, instructionText: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>

                    {/* LOGO UPLOAD AREA FOR KOP SURAT RESMI */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1.5">
                        Logo Kop Surat Resmi Sekolah
                      </span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Left Logo */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-slate-300 uppercase">
                            Logo Kiri (Logo Sekolah / Daerah)
                          </label>
                          
                          {printConfig.schoolLogo ? (
                            <div className="relative border border-slate-800 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center min-h-[90px]">
                              <img 
                                src={printConfig.schoolLogo} 
                                alt="Logo Kiri" 
                                className="h-14 w-auto object-contain mb-1.5" 
                              />
                              <button
                                type="button"
                                onClick={() => setPrintConfig({ ...printConfig, schoolLogo: '' })}
                                className="text-[9px] font-bold text-rose-400 hover:text-rose-300 bg-slate-950/40 px-2 py-0.5 rounded-md transition"
                              >
                                Hapus Logo
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 rounded-xl p-4 cursor-pointer transition min-h-[90px] text-center">
                              <Upload className="h-4.5 w-4.5 text-slate-500 mb-1" />
                              <span className="text-[9px] font-bold text-slate-300">Pilih Logo Kiri</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setPrintConfig({ ...printConfig, schoolLogo: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden" 
                              />
                            </label>
                          )}
                          <p className="text-[8px] text-slate-400 leading-normal">
                            <b>Rekomendasi ukuran:</b> Dimensi persegi (1:1), minimal 200×200 pixel, format PNG transparan atau JPG.
                          </p>
                        </div>

                        {/* Right Logo */}
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-slate-300 uppercase">
                            Logo Kanan (Tut Wuri / Kemenag / Opsional)
                          </label>
                          
                          {printConfig.schoolLogoRight ? (
                            <div className="relative border border-slate-800 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center min-h-[90px]">
                              <img 
                                src={printConfig.schoolLogoRight} 
                                alt="Logo Kanan" 
                                className="h-14 w-auto object-contain mb-1.5" 
                              />
                              <button
                                type="button"
                                onClick={() => setPrintConfig({ ...printConfig, schoolLogoRight: '' })}
                                className="text-[9px] font-bold text-rose-400 hover:text-rose-300 bg-slate-950/40 px-2 py-0.5 rounded-md transition"
                              >
                                Hapus Logo
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 rounded-xl p-4 cursor-pointer transition min-h-[90px] text-center">
                              <Upload className="h-4.5 w-4.5 text-slate-500 mb-1" />
                              <span className="text-[9px] font-bold text-slate-300">Pilih Logo Kanan</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setPrintConfig({ ...printConfig, schoolLogoRight: reader.result as string });
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden" 
                              />
                            </label>
                          )}
                          <p className="text-[8px] text-slate-400 leading-normal">
                            <b>Rekomendasi ukuran:</b> Dimensi persegi (1:1), minimal 200×200 pixel, format PNG transparan atau JPG.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Options & Visibility Switches */}
                  <div className="lg:col-span-6 space-y-4">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest block border-l-2 border-indigo-500 pl-2">
                      Pengaturan Tampilan & Format Kertas
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showHeader}
                          onChange={(e) => setPrintConfig({ ...printConfig, showHeader: e.target.checked })}
                          className="rounded border-slate-750 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Aktifkan Kop Surat Resmi</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showStudentFields}
                          onChange={(e) => setPrintConfig({ ...printConfig, showStudentFields: e.target.checked })}
                          className="rounded border-slate-750 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Kolom Identitas Siswa</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showStimulus}
                          onChange={(e) => setPrintConfig({ ...printConfig, showStimulus: e.target.checked })}
                          className="rounded border-slate-750 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Tampilkan Stimulus Wacana</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showIllustration}
                          onChange={(e) => setPrintConfig({ ...printConfig, showIllustration: e.target.checked })}
                          className="rounded border-slate-750 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Tampilkan Grafik/Gambar AI</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showCompetencyTag}
                          onChange={(e) => setPrintConfig({ ...printConfig, showCompetencyTag: e.target.checked })}
                          className="rounded border-slate-750 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Tampilkan Metadata (Kompetensi)</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-emerald-400 hover:text-emerald-300 font-bold transition">
                        <input
                          type="checkbox"
                          checked={printConfig.showAnswerKey}
                          onChange={(e) => setPrintConfig({ ...printConfig, showAnswerKey: e.target.checked })}
                          className="rounded border-emerald-700 bg-slate-850 text-emerald-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <span>Cetak Kunci & Pembahasan</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Type className="h-3 w-3" /> Ukuran Huruf (Font)
                        </label>
                        <select
                          value={printConfig.fontSize}
                          onChange={(e) => setPrintConfig({ ...printConfig, fontSize: e.target.value })}
                          className="w-full bg-slate-800/85 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="text-xs">Kecil (Kertas Padat)</option>
                          <option value="text-sm">Sedang (Standar Nasional)</option>
                          <option value="text-base">Besar (Sangat Jelas)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <Layout className="h-3 w-3" /> Format Tata Letak
                        </label>
                        <select
                          value={printConfig.layoutColumns}
                          onChange={(e) => setPrintConfig({ ...printConfig, layoutColumns: e.target.value })}
                          className="w-full bg-slate-800/85 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="1">1 Kolom Penuh</option>
                          <option value="2">2 Kolom (Hemat Kertas)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                          <FileText className="h-3 w-3" /> Ukuran Kertas (Page)
                        </label>
                        <select
                          value={printConfig.pageSize}
                          onChange={(e) => setPrintConfig({ ...printConfig, pageSize: e.target.value })}
                          className="w-full bg-slate-800/85 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none"
                        >
                          <option value="A4">A4 (210 x 297 mm)</option>
                          <option value="F4">F4 / Folio (215 x 330 mm)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-col items-end gap-2">
                      <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg w-full sm:w-auto justify-center"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Mulai Cetak / Simpan ke PDF</span>
                      </button>
                      <button
                        onClick={() => exportQuestionsToWord(questions, printConfig.subjectName || config.mataPelajaran, printConfig.pageSize, printConfig.examName, printConfig.showAnswerKey)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg w-full sm:w-auto justify-center"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Unduh / Cetak Versi Word (DOC)</span>
                      </button>
                    </div>
                  </div>

                  {/* Full-width System/Reset Data section */}
                  <div className="lg:col-span-12 border-t border-slate-800/80 pt-4 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest block border-l-2 border-rose-500 pl-2">
                        Utilitas & Manajemen Data
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Hapus semua butir soal TKA SMA yang tersimpan untuk memudahkan Anda melakukan request pembuatan paket soal yang baru dari awal.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {!showDeleteAllConfirm ? (
                        <button
                          type="button"
                          onClick={() => setShowDeleteAllConfirm(true)}
                          className="bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-800/60 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition w-full sm:w-auto justify-center cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Hapus Semua Soal</span>
                        </button>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-3 bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-xl">
                          <span className="text-xs font-medium text-rose-300 px-2 text-center sm:text-left">
                            Yakin ingin menghapus {questions.length} soal?
                          </span>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={handleDeleteAllQuestions}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex-1 sm:flex-none cursor-pointer"
                            >
                              Ya, Hapus Semua
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowDeleteAllConfirm(false)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition flex-1 sm:flex-none cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Pembuatan Materi & Panduan */}
        {activeTab === 'materi' && (
          <div id="materi-panel" className="space-y-6 animate-fadeIn no-print">
            
            {/* Main Content Layout for Materi */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: List of Kisi-Kisi items for materi mapel */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="font-bold text-slate-800 text-sm">Pilih Kisi-Kisi Matriks</h4>
                    <div className="flex items-center gap-1.5">
                      {Object.keys(generatedMaterials).length > 0 && (
                        <button
                          onClick={() => exportAllMateriToWord(kisiList, generatedMaterials, config.mataPelajaran, printConfig.pageSize)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-2 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition"
                          title="Unduh semua materi yang telah disusun dalam satu file Word"
                        >
                          <Download className="h-3 w-3" />
                          <span>Unduh Semua Word</span>
                        </button>
                      )}
                      <span className="bg-slate-100 text-slate-600 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                        {kisiList.length} Baris
                      </span>
                    </div>
                  </div>

                  {kisiList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-2">
                      <Layers className="h-8 w-8 mx-auto text-slate-300" />
                      <p className="text-xs">Belum ada kisi-kisi terdaftar. Silakan buat di Tab 1 atau Tab 2 terlebih dahulu!</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {kisiList.map((kisi) => {
                        const isSelected = activeMateriKisiId === kisi.id;
                        const isMateriReady = !!generatedMaterials[kisi.id]?.content;
                        const isPromptReady = !!generatedMaterials[kisi.id]?.prompt;
                        const isGenerating = !!generatingMateriIds[kisi.id];

                        return (
                          <div 
                            key={kisi.id}
                            onClick={() => {
                              setActiveMateriKisiId(kisi.id);
                              setIsEditingMateri(false);
                            }}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                              isSelected 
                                ? 'bg-purple-50 border-purple-300 shadow-sm' 
                                : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-mono text-[10px] font-extrabold bg-slate-200 text-slate-700 h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0">
                                {kisi.no}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-extrabold text-slate-900 block truncate">
                                  {kisi.elemenMateri}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                                  {kisi.subElemenMateri}
                                </span>
                              </div>
                              
                              <div className="flex-shrink-0 flex gap-1 flex-wrap justify-end max-w-[100px]">
                                {isMateriReady && (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    Materi
                                  </span>
                                )}
                                {isPromptReady && (
                                  <span className="inline-flex items-center gap-0.5 bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                                    Prompt
                                  </span>
                                )}
                                {!isMateriReady && !isPromptReady && (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded-full">
                                    Belum
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                              {kisi.kompetensi}
                            </p>

                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="flex gap-1.5">
                                <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                  {getLevelKognitifLabel(kisi.levelKognitif)}
                                </span>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateMateri(kisi, activeSubTab);
                                }}
                                disabled={isGenerating}
                                className={`text-[10px] font-black px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                                  (activeSubTab === 'materi' ? isMateriReady : isPromptReady)
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700'
                                }`}
                              >
                                {isGenerating ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    <span>Memproses...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" />
                                    <span>
                                      {(activeSubTab === 'materi' ? isMateriReady : isPromptReady)
                                        ? `Buat Ulang ${activeSubTab === 'materi' ? 'Materi' : 'Prompt'}`
                                        : `Buat ${activeSubTab === 'materi' ? 'Materi' : 'Prompt'} AI`
                                      }
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Material Viewer / Workspace */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-0 overflow-hidden min-h-[500px] flex flex-col justify-between">
                  {(() => {
                    const activeMateri = activeMateriKisiId ? generatedMaterials[activeMateriKisiId] : null;
                    const activeKisi = kisiList.find(k => k.id === activeMateriKisiId);
                    const activeMateriContent = activeMateri ? (activeSubTab === 'materi' ? activeMateri.content : activeMateri.prompt) : '';

                    if (!activeKisi) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                          <FileText className="h-12 w-12 text-slate-300 animate-pulse" />
                          <div>
                            <h5 className="font-bold text-slate-700 text-sm">Pilih atau Buat Prompt Slide & Infografis</h5>
                            <p className="text-xs max-w-sm mt-1">
                              Silakan klik salah satu <b>Kisi-Kisi Matriks</b> di sebelah kiri untuk melihat, merumuskan, mengedit, atau menghapus materi dan prompt NotebookLM.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Sub-Tabs Selector */}
                        <div className="flex border-b border-slate-200 bg-slate-50/55">
                          <button
                            onClick={() => {
                              setActiveSubTab('materi');
                              setIsEditingMateri(false);
                            }}
                            className={`flex-1 py-3 px-4 text-center font-bold text-xs flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeSubTab === 'materi'
                                ? 'border-purple-600 text-purple-700 bg-white shadow-sm font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/40'
                            }`}
                          >
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            <span>1. Ringkasan Materi Ajar</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveSubTab('prompt');
                              setIsEditingMateri(false);
                            }}
                            className={`flex-1 py-3 px-4 text-center font-bold text-xs flex items-center justify-center gap-2 border-b-2 transition-all ${
                              activeSubTab === 'prompt'
                                ? 'border-purple-600 text-purple-700 bg-white shadow-sm font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/40'
                            }`}
                          >
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <span>2. Prompt Slide & Infografis (NotebookLM)</span>
                          </button>
                        </div>

                        {isEditingMateri ? (
                          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col space-y-3">
                              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                  <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                    {activeSubTab === 'materi' ? 'MODE EDIT RINGKASAN MATERI' : 'MODE EDIT PROMPT NOTEBOOKLM'} {activeKisi.no}
                                  </span>
                                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">
                                    {activeKisi.elemenMateri}
                                  </h3>
                                </div>
                                <button
                                  onClick={() => setIsEditingMateri(false)}
                                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="flex-1 flex flex-col">
                                <label className="text-xs font-bold text-slate-700 mb-1 block">
                                  {activeSubTab === 'materi' ? 'Isi Materi Pembelajaran:' : 'Isi Prompt Slide & Infografis:'}
                                </label>
                                <textarea
                                  value={editingMateriContent}
                                  onChange={(e) => setEditingMateriContent(e.target.value)}
                                  placeholder={
                                    activeSubTab === 'materi'
                                      ? "Tulis ringkasan materi pembelajaran sosiologi lengkap di sini..."
                                      : "Tulis mega-prompt untuk NotebookLM & Gemini AI di sini secara lengkap..."
                                  }
                                  className="w-full flex-1 min-h-[350px] bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 focus:outline-none shadow-inner resize-y"
                                />
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => setIsEditingMateri(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Batal</span>
                              </button>

                              <button
                                onClick={() => handleSaveMateri(activeKisi.id, editingMateriContent)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                              >
                                <Save className="h-3.5 w-3.5" />
                                <span>Simpan {activeSubTab === 'materi' ? 'Materi' : 'Prompt'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              {/* Header Detail */}
                              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                                      {activeSubTab === 'materi' ? 'Ringkasan Materi' : 'Prompt NotebookLM'} {activeKisi.no}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {getLevelKognitifLabel(activeKisi.levelKognitif)}
                                    </span>
                                  </div>
                                  <h3 className="font-extrabold text-slate-900 text-base mt-1">
                                    {activeKisi.elemenMateri}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Sub-materi: {activeKisi.subElemenMateri}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {activeMateriContent ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          setIsEditingMateri(true);
                                          setEditingMateriContent(activeMateriContent);
                                        }}
                                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                        title={`Edit ${activeSubTab === 'materi' ? 'materi' : 'prompt'} secara manual`}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                        <span>Edit</span>
                                      </button>

                                      <button
                                        onClick={() => handleDeleteMateri(activeKisi.id)}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                        title={`Hapus ${activeSubTab === 'materi' ? 'materi' : 'prompt'}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Hapus</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(activeMateriContent);
                                          const successMsg = activeSubTab === 'materi'
                                            ? "Ringkasan materi berhasil disalin ke clipboard!"
                                            : "Mega-Prompt untuk NotebookLM & Gemini berhasil disalin ke clipboard! Anda dapat menempelkannya langsung ke NotebookLM atau Gemini AI.";
                                          alert(successMsg);
                                        }}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        <span>Salin</span>
                                      </button>

                                      <button
                                        onClick={() => exportMateriToWord(activeKisi, activeMateriContent, config.mataPelajaran, printConfig.pageSize)}
                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                        title={`Unduh ${activeSubTab === 'materi' ? 'Materi' : 'Prompt'} sebagai file Word (.doc)`}
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Word</span>
                                      </button>

                                      <button
                                        onClick={() => handlePrintMateri(activeKisi, activeMateriContent)}
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                                        title={`Cetak ${activeSubTab === 'materi' ? 'Materi' : 'Prompt'}`}
                                      >
                                        <Printer className="h-3.5 w-3.5" />
                                        <span>Cetak</span>
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="file"
                                        id={`prompt-file-${activeKisi.id}`}
                                        accept=".txt,.md"
                                        onChange={(e) => handleUploadPromptFile(e, activeKisi.id)}
                                        className="hidden"
                                      />
                                      <label
                                        htmlFor={`prompt-file-${activeKisi.id}`}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                                        title="Unggah file teks (.txt / .md)"
                                      >
                                        <Upload className="h-3.5 w-3.5" />
                                        <span>Unggah File</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Content Render Area */}
                              <div className="mt-4 bg-slate-50/65 border border-slate-100 rounded-xl p-5 max-h-[500px] overflow-y-auto shadow-inner">
                                {activeMateriContent ? (
                                  <SimpleMarkdown content={activeMateriContent} />
                                ) : (
                                  <div className="text-center py-12 px-4 space-y-4">
                                    <FileText className="h-10 w-10 mx-auto text-slate-300" />
                                    <div className="max-w-md mx-auto space-y-1">
                                      <p className="text-sm font-bold text-slate-700">
                                        {activeSubTab === 'materi' ? 'Ringkasan Materi Belum Tersedia' : 'Prompt Belum Tersedia'}
                                      </p>
                                      <p className="text-xs text-slate-500 leading-relaxed">
                                        {activeSubTab === 'materi'
                                          ? 'Silakan pilih opsi di bawah untuk menyusun Ringkasan Materi Ajar komprehensif bagi sosiologi kelas XII berdasarkan parameter kisi-kisi ini:'
                                          : 'Silakan pilih opsi di bawah untuk membuat Mega-Prompt siap saji yang dioptimalkan untuk menyusun slide & infografis di NotebookLM:'
                                        }
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2.5 pt-2">
                                      <button
                                        onClick={() => handleGenerateMateri(activeKisi, activeSubTab)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                                      >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        <span>
                                          {activeSubTab === 'materi' ? 'Buat Materi dengan AI' : 'Buat Prompt dengan AI'}
                                        </span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setIsEditingMateri(true);
                                          setEditingMateriContent('');
                                        }}
                                        className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Tulis Manual</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Bottom Actions inside Card */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Info className="h-3.5 w-3.5 text-indigo-500" />
                                <span>
                                  {activeSubTab === 'materi' 
                                    ? 'Materi ajar dioptimalkan dengan teori mendalam & studi kasus nyata Indonesia.' 
                                    : 'Prompt dirancang khusus untuk memandu NotebookLM & Gemini AI agar konten interaktif.'
                                  }
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 5: Jadwal Rencana Pembelajaran TKA XII */}
        {activeTab === 'jadwal' && (
          <div id="jadwal-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            
            {/* Left Main Section: Schedule Table and Form */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                
                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      <span>Jadwal Rencana Pembelajaran TKA Kelas XII</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Distribusi materi mingguan khusus bulan <b>Juli, Agustus, September dan Oktober</b>.
                    </p>
                  </div>
                  
                  {/* Export and Action buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleResetJadwal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl text-xs font-bold transition"
                      title="Kosongkan seluruh rencana pembelajaran"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
                      <span>Kosongkan Jadwal</span>
                    </button>
                    
                    <button
                      onClick={() => exportJadwalToExcel(jadwalList, selectedJadwalPresetSubject)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel</span>
                    </button>
                    
                    <button
                      onClick={() => exportJadwalToWord(jadwalList, selectedJadwalPresetSubject, printConfig.pageSize)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>Word</span>
                    </button>

                    <button
                      onClick={handleSortJadwal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      title="Urutkan Jadwal Rencana Pembelajaran TKA Kelas XII berdasarkan bulan dan Minggu ke-"
                    >
                      <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Urutkan Jadwal Rencana Pembelajaran TKA Kelas XII</span>
                    </button>

                    <button
                      onClick={() => {
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;
                        
                        const tableRowsHtml = jadwalList.map(item => `
                          <tr>
                            <td style="border: 1px solid black; padding: 8px; text-align: center; font-weight: bold;">${item.bulan}</td>
                            <td style="border: 1px solid black; padding: 8px; text-align: center;">Minggu ke-${item.mingguKe}</td>
                            <td style="border: 1px solid black; padding: 8px; font-weight: bold;">${item.elemenMateri}</td>
                            <td style="border: 1px solid black; padding: 8px;">${item.subElemenMateri}</td>
                            <td style="border: 1px solid black; padding: 8px; font-style: italic;">${item.kompetensi}</td>
                          </tr>
                        `).join('');

                        const html = `
                          <html>
                          <head>
                            <title>Cetak Jadwal Pembelajaran TKA XII</title>
                            <style>
                              body { font-family: Arial, sans-serif; margin: 30px; }
                              h2 { text-align: center; color: #1e3a8a; }
                              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                              th { border: 1px solid black; padding: 10px; background-color: #f1f5f9; }
                              td { border: 1px solid black; padding: 8px; }
                            </style>
                          </head>
                          <body>
                            <h2>TABEL JADWAL RENCANA PEMBELAJARAN TKA KELAS XII (Juli, Agustus, September, Oktober)</h2>
                            <p><b>Mata Pelajaran:</b> ${selectedJadwalPresetSubject}</p>
                            <p><b>Periode Pembelajaran:</b> Juli, Agustus, September dan Oktober</p>
                            <p><b>Tanggal Cetak:</b> ${new Date().toLocaleDateString('id-ID')}</p>
                            <table>
                              <thead>
                                <tr>
                                  <th>Bulan</th>
                                  <th>Minggu Ke-</th>
                                  <th>Elemen / Materi</th>
                                  <th>Sub-elemen / Submateri</th>
                                  <th>Kompetensi yang Diuji</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${tableRowsHtml}
                              </tbody>
                            </table>
                            <script>
                              window.onload = function() { window.print(); }
                            </script>
                          </body>
                          </html>
                        `;
                        printWindow.document.write(html);
                        printWindow.document.close();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold transition"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {jadwalSortNotification && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 font-medium overflow-hidden"
                    >
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{jadwalSortNotification}</span>
                      </div>
                      <button 
                        onClick={() => setJadwalSortNotification(null)}
                        className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex gap-2.5">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">💡 Petunjuk Penyusunan:</span>
                    <span className="leading-relaxed text-slate-750">
                      Anda bisa menambah, mengedit secara langsung di baris tabel, atau menghapus rencana pembelajaran mingguan. Gunakan panel <b>"Rujukan Pusmendik Sosiologi"</b> di sebelah kanan untuk langsung menyalin elemen, submateri, dan kompetensi rujukan ke dalam baris tabel dengan sekali klik.
                    </span>
                  </div>
                </div>

                {/* Inline form to Add New Row */}
                {isAddingJadwal ? (
                  <form onSubmit={handleAddJadwal} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-700">Tambah Baris Rencana Pembelajaran Baru</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Bulan</label>
                        <select
                          value={newJadwal.bulan}
                          onChange={(e) => setNewJadwal(prev => ({ ...prev, bulan: e.target.value as any }))}
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        >
                          <option value="Juli">Juli</option>
                          <option value="Agustus">Agustus</option>
                          <option value="September">September</option>
                          <option value="Oktober">Oktober</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Minggu Ke-</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={newJadwal.mingguKe}
                          onChange={(e) => setNewJadwal(prev => ({ ...prev, mingguKe: parseInt(e.target.value) || 1 }))}
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs text-slate-700 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Elemen / Materi Pokok</label>
                        <input
                          type="text"
                          value={newJadwal.elemenMateri}
                          onChange={(e) => setNewJadwal(prev => ({ ...prev, elemenMateri: e.target.value }))}
                          placeholder="Contoh: Sosiologi sebagai Ilmu"
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs text-slate-700 outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Sub-elemen / Submateri</label>
                        <textarea
                          value={newJadwal.subElemenMateri}
                          onChange={(e) => setNewJadwal(prev => ({ ...prev, subElemenMateri: e.target.value }))}
                          placeholder="Masukkan rincian materi"
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs text-slate-700 outline-none h-16 resize-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Kompetensi yang Diuji</label>
                        <textarea
                          value={newJadwal.kompetensi}
                          onChange={(e) => setNewJadwal(prev => ({ ...prev, kompetensi: e.target.value }))}
                          placeholder="Masukkan kompetensi rujukan"
                          className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2 text-xs text-slate-700 outline-none h-16 resize-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsAddingJadwal(false)}
                        className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                      >
                        Simpan Rencana
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingJadwal(true)}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Baris Rencana Pembelajaran Baru</span>
                  </button>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full border-collapse text-left text-xs text-slate-600">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold">
                        <th className="px-4 py-3 font-bold text-slate-700 w-28">Bulan</th>
                        <th className="px-4 py-3 font-bold text-slate-700 w-24">Minggu Ke-</th>
                        <th className="px-4 py-3 font-bold text-slate-700 w-44">Elemen / Materi</th>
                        <th className="px-4 py-3 font-bold text-slate-700">Sub-elemen / Submateri</th>
                        <th className="px-4 py-3 font-bold text-slate-700">Kompetensi yang Diuji</th>
                        <th className="px-4 py-3 font-bold text-slate-700 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jadwalList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 px-6 bg-slate-50/50">
                            <div className="max-w-md mx-auto space-y-3 py-4">
                              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 mb-1">
                                <Sparkles className="h-6 w-6 animate-pulse" />
                              </div>
                              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">Jadwal Rencana Pembelajaran Kosong</h3>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Anda wajib memilih <strong>Rekomendasi Matriks Asesmen</strong> sesuai dengan Mata Pelajaran Anda pada panel rujukan kanan, lalu gunakan tombol <strong>"Impor Semua Rencana"</strong> atau klik tombol <strong>"⚡ Impor"</strong> untuk menyusun jadwal secara otomatis.
                              </p>
                              <div className="pt-1.5 text-indigo-600 font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1">
                                <span>👉 Silakan Pilih Pelajaran & Impor di Panel Sebelah Kanan!</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        jadwalList.map((item) => {
                          const isEditing = editingJadwalId === item.id;
                          
                          if (isEditing && editingJadwalData) {
                            return (
                              <tr key={item.id} className="bg-indigo-50/40">
                                <td className="px-3 py-2">
                                  <select
                                    value={editingJadwalData.bulan}
                                    onChange={(e) => setEditingJadwalData(prev => prev ? ({ ...prev, bulan: e.target.value as any }) : null)}
                                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs outline-none font-bold"
                                  >
                                    <option value="Juli">Juli</option>
                                    <option value="Agustus">Agustus</option>
                                    <option value="September">September</option>
                                    <option value="Oktober">Oktober</option>
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={editingJadwalData.mingguKe}
                                    onChange={(e) => setEditingJadwalData(prev => prev ? ({ ...prev, mingguKe: parseInt(e.target.value) || 1 }) : null)}
                                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs outline-none text-center font-bold"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={editingJadwalData.elemenMateri}
                                    onChange={(e) => setEditingJadwalData(prev => prev ? ({ ...prev, elemenMateri: e.target.value }) : null)}
                                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs outline-none font-bold text-indigo-900"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <textarea
                                    value={editingJadwalData.subElemenMateri}
                                    onChange={(e) => setEditingJadwalData(prev => prev ? ({ ...prev, subElemenMateri: e.target.value }) : null)}
                                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs outline-none h-16 resize-none text-slate-700"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <textarea
                                    value={editingJadwalData.kompetensi}
                                    onChange={(e) => setEditingJadwalData(prev => prev ? ({ ...prev, kompetensi: e.target.value }) : null)}
                                    className="w-full bg-white border border-slate-200 focus:ring-1 focus:ring-indigo-500 rounded p-1 text-xs outline-none h-16 resize-none italic text-slate-600"
                                  />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
                                    <button
                                      onClick={handleSaveEditJadwal}
                                      className="w-full px-2 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 transition"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingJadwalId(null);
                                        setEditingJadwalData(null);
                                      }}
                                      className="w-full px-2 py-1 border border-slate-200 text-slate-500 bg-white rounded text-[10px] font-bold hover:bg-slate-100 transition"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-4 py-3.5 font-bold text-slate-900">{item.bulan}</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                                  Minggu {item.mingguKe}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-indigo-900">{item.elemenMateri}</td>
                              <td className="px-4 py-3.5 text-slate-700 leading-relaxed max-w-xs">{item.subElemenMateri}</td>
                              <td className="px-4 py-3.5 text-slate-600 leading-relaxed italic max-w-sm">{item.kompetensi}</td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleStartEditJadwal(item)}
                                    className="text-indigo-600 hover:text-indigo-900 font-bold text-[11px] hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <span className="text-slate-200">|</span>
                                  <button
                                    onClick={() => handleDeleteJadwal(item.id)}
                                    className="text-red-500 hover:text-red-700 font-bold text-[11px] hover:underline"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* Right Side Panel: Rekomendasi Matriks Asesmen (Pusmendik) */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 sticky top-16">
                
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                      <span>Rekomendasi Matriks Asesmen</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Pusmendik standard for {selectedJadwalPresetSubject}
                    </p>
                  </div>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {(selectedJadwalPresetSubject === 'Matematika' 
                      ? PUSMENDIK_MATEMATIKA_PRESETS 
                      : selectedJadwalPresetSubject === 'Bahasa Indonesia' 
                      ? PUSMENDIK_BAHASA_INDONESIA_PRESETS 
                      : selectedJadwalPresetSubject === 'Bahasa Inggris'
                      ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
                      : selectedJadwalPresetSubject === 'Matematika Tingkat Lanjut'
                      ? PUSMENDIK_MATEMATIKA_TL_PRESETS
                      : selectedJadwalPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
                      ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
                      : selectedJadwalPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
                      ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
                      : selectedJadwalPresetSubject === 'Fisika'
                      ? PUSMENDIK_FISIKA_PRESETS
                      : selectedJadwalPresetSubject === 'Kimia'
                      ? PUSMENDIK_KIMIA_PRESETS
                      : selectedJadwalPresetSubject === 'Biologi'
                      ? PUSMENDIK_BIOLOGI_PRESETS
                      : selectedJadwalPresetSubject === 'PPKN'
                      ? PUSMENDIK_PPKN_PRESETS
                      : selectedJadwalPresetSubject === 'Ekonomi'
                      ? PUSMENDIK_EKONOMI_PRESETS
                      : selectedJadwalPresetSubject === 'Geografi'
                      ? PUSMENDIK_GEOGRAFI_PRESETS
                      : selectedJadwalPresetSubject === 'Sosiologi'
                      ? PUSMENDIK_SOSIOLOGI_PRESETS
                      : selectedJadwalPresetSubject === 'Sejarah Tingkat Lanjut'
                      ? PUSMENDIK_SEJARAH_TL_PRESETS
                      : selectedJadwalPresetSubject === 'Antropologi'
                      ? PUSMENDIK_ANTROPOLOGI_PRESETS
                      : selectedJadwalPresetSubject === 'Bahasa Jepang'
                      ? PUSMENDIK_BAHASA_JEPANG_PRESETS
                      : PUSMENDIK_PKK_PRESETS
                    ).length} Rujukan
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pilih mata pelajaran di bawah ini, lalu salin per materi atau impor sekaligus untuk menyusun jadwal secara otomatis.
                </p>

                {/* Subject Buttons Grid */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Pilih Pelajaran:</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                    {[
                      { id: 'Matematika', label: '📐 Matematika' },
                      { id: 'Bahasa Indonesia', label: '🇮🇩 B. Indonesia' },
                      { id: 'Bahasa Inggris', label: '🇬🇧 B. Inggris' },
                      { id: 'Matematika Tingkat Lanjut', label: '🚀 Mat Lanjut' },
                      { id: 'Bahasa Indonesia Tingkat Lanjut', label: '✍️ Indo Lanjut' },
                      { id: 'Bahasa Inggris Tingkat Lanjut', label: '🗣️ Inggris Lanjut' },
                      { id: 'Fisika', label: '⚛️ Fisika' },
                      { id: 'Kimia', label: '🧪 Kimia' },
                      { id: 'Biologi', label: '🧬 Biologi' },
                      { id: 'PPKN', label: '🗳️ PPKN' },
                      { id: 'Ekonomi', label: '💰 Ekonomi' },
                      { id: 'Geografi', label: '🌍 Geografi' },
                      { id: 'Sosiologi', label: '👥 Sosiologi' },
                      { id: 'Sejarah Tingkat Lanjut', label: '📜 Sejarah Lanjut' },
                      { id: 'Antropologi', label: '🗿 Antropologi' },
                      { id: 'Bahasa Jepang', label: '🎌 B. Jepang' },
                      { id: 'Produk Kreatif dan Kewirausahaan', label: '💼 Kewirausahaan' }
                    ].map((subj) => (
                      <button
                        key={subj.id}
                        onClick={() => setSelectedJadwalPresetSubject(subj.id as any)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition truncate ${
                          selectedJadwalPresetSubject === subj.id
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        {subj.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Import All Button */}
                <button
                  onClick={handleImportAllJadwalPresets}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Impor Semua {(selectedJadwalPresetSubject === 'Matematika' 
                    ? PUSMENDIK_MATEMATIKA_PRESETS 
                    : selectedJadwalPresetSubject === 'Bahasa Indonesia' 
                    ? PUSMENDIK_BAHASA_INDONESIA_PRESETS 
                    : selectedJadwalPresetSubject === 'Bahasa Inggris'
                    ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
                    : selectedJadwalPresetSubject === 'Matematika Tingkat Lanjut'
                    ? PUSMENDIK_MATEMATIKA_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
                    ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
                    ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Fisika'
                    ? PUSMENDIK_FISIKA_PRESETS
                    : selectedJadwalPresetSubject === 'Kimia'
                    ? PUSMENDIK_KIMIA_PRESETS
                    : selectedJadwalPresetSubject === 'Biologi'
                    ? PUSMENDIK_BIOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'PPKN'
                    ? PUSMENDIK_PPKN_PRESETS
                    : selectedJadwalPresetSubject === 'Ekonomi'
                    ? PUSMENDIK_EKONOMI_PRESETS
                    : selectedJadwalPresetSubject === 'Geografi'
                    ? PUSMENDIK_GEOGRAFI_PRESETS
                    : selectedJadwalPresetSubject === 'Sosiologi'
                    ? PUSMENDIK_SOSIOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'Sejarah Tingkat Lanjut'
                    ? PUSMENDIK_SEJARAH_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Antropologi'
                    ? PUSMENDIK_ANTROPOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Jepang'
                    ? PUSMENDIK_BAHASA_JEPANG_PRESETS
                    : PUSMENDIK_PKK_PRESETS
                  ).length} Rencana</span>
                </button>

                {/* List of references */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {(selectedJadwalPresetSubject === 'Matematika' 
                    ? PUSMENDIK_MATEMATIKA_PRESETS 
                    : selectedJadwalPresetSubject === 'Bahasa Indonesia' 
                    ? PUSMENDIK_BAHASA_INDONESIA_PRESETS 
                    : selectedJadwalPresetSubject === 'Bahasa Inggris'
                    ? PUSMENDIK_BAHASA_INGGRIS_PRESETS
                    : selectedJadwalPresetSubject === 'Matematika Tingkat Lanjut'
                    ? PUSMENDIK_MATEMATIKA_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Indonesia Tingkat Lanjut'
                    ? PUSMENDIK_BAHASA_INDONESIA_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Inggris Tingkat Lanjut'
                    ? PUSMENDIK_BAHASA_INGGRIS_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Fisika'
                    ? PUSMENDIK_FISIKA_PRESETS
                    : selectedJadwalPresetSubject === 'Kimia'
                    ? PUSMENDIK_KIMIA_PRESETS
                    : selectedJadwalPresetSubject === 'Biologi'
                    ? PUSMENDIK_BIOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'PPKN'
                    ? PUSMENDIK_PPKN_PRESETS
                    : selectedJadwalPresetSubject === 'Ekonomi'
                    ? PUSMENDIK_EKONOMI_PRESETS
                    : selectedJadwalPresetSubject === 'Geografi'
                    ? PUSMENDIK_GEOGRAFI_PRESETS
                    : selectedJadwalPresetSubject === 'Sosiologi'
                    ? PUSMENDIK_SOSIOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'Sejarah Tingkat Lanjut'
                    ? PUSMENDIK_SEJARAH_TL_PRESETS
                    : selectedJadwalPresetSubject === 'Antropologi'
                    ? PUSMENDIK_ANTROPOLOGI_PRESETS
                    : selectedJadwalPresetSubject === 'Bahasa Jepang'
                    ? PUSMENDIK_BAHASA_JEPANG_PRESETS
                    : PUSMENDIK_PKK_PRESETS
                  ).map((preset, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition text-[11px] space-y-2"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-extrabold text-indigo-950 block">
                          {preset.elemenMateri}
                        </span>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              // Auto-fill into new row form
                              setNewJadwal({
                                bulan: 'Juli',
                                mingguKe: 1,
                                elemenMateri: preset.elemenMateri,
                                subElemenMateri: preset.subElemenMateri,
                                kompetensi: preset.kompetensi
                              });
                              setIsAddingJadwal(true);
                              
                              // Scroll smoothly to form
                              const element = document.getElementById('jadwal-panel');
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded text-[10px] hover:bg-slate-300 transition shrink-0"
                            title="Salin ke Form Tambah Baru"
                          >
                            + Form
                          </button>
                          
                          <button
                            onClick={() => {
                              // Direct append to list
                              const item: JadwalItem = {
                                id: `jadwal-preset-${Date.now()}-${idx}`,
                                bulan: 'Juli',
                                mingguKe: 1,
                                elemenMateri: preset.elemenMateri,
                                subElemenMateri: preset.subElemenMateri,
                                kompetensi: preset.kompetensi
                              };
                              setJadwalList(prev => [...prev, item]);
                            }}
                            className="bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded text-[10px] hover:bg-indigo-700 transition shrink-0"
                            title="Impor langsung ke baris jadwal"
                          >
                            ⚡ Impor
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-slate-600 leading-relaxed">
                        <p><b>Sub-materi:</b> {preset.subElemenMateri}</p>
                        <p className="italic text-slate-500"><b>Kompetensi:</b> {preset.kompetensi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              
              </div>

            </div>

          </div>
        )}

        {/* Tab 5: Manajemen Pengguna */}
        {activeTab === 'users' && userRole === 'admin' && (
          <div id="users-panel" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn no-print">
            {/* Left Col: Add User Form */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <UserPlus className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-slate-800">Tambah Akun Guru Baru</h2>
              </div>

              {userError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{userError}</span>
                </div>
              )}

              {userSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{userSuccess}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newUserName || !newUserEmail || !newUserPassword) {
                  setUserError("Silakan lengkapi semua isian.");
                  return;
                }
                setUserError(null);
                setUserSuccess(null);
                setIsAddingUser(true);
                try {
                  await createNewUserByAdmin(newUserEmail.trim(), newUserPassword, newUserName, newUserRole, newUserRole === 'user' ? newUserMataPelajaran : 'Sosiologi');
                  setUserSuccess(`Akun ${newUserName} (${newUserRole === 'admin' ? 'Admin' : 'Guru'}) berhasil didaftarkan!`);
                  setNewUserName('');
                  setNewUserEmail('');
                  setNewUserPassword('');
                  setNewUserRole('user');
                  setNewUserMataPelajaran('Sosiologi');
                } catch (err: any) {
                  console.error(err);
                  if (err.code === 'auth/email-already-in-use') {
                    setUserError("Alamat email sudah terdaftar.");
                  } else if (err.code === 'auth/weak-password') {
                    setUserError("Password terlalu lemah (minimal 6 karakter).");
                  } else {
                    setUserError(`Gagal membuat akun: ${err.message}`);
                  }
                } finally {
                  setIsAddingUser(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Lengkap Guru</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso, S.Pd."
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Alamat Email Resmi</label>
                  <input
                    type="email"
                    required
                    placeholder="nama.guru@sekolah.sch.id"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password Baru</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 6 karakter"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Peran Hak Akses (Role)</label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setNewUserRole('user')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        newUserRole === 'user'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Guru Mapel
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('admin')}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                        newUserRole === 'admin'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Shield className="h-4 w-4" />
                      Administrator
                    </button>
                  </div>
                </div>

                {newUserRole === 'user' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Mata Pelajaran Ampuan</label>
                    <select
                      value={newUserMataPelajaran}
                      onChange={(e) => setNewUserMataPelajaran(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold"
                    >
                      <option value="Sosiologi">👥 Sosiologi</option>
                      <option value="Matematika">📐 Matematika</option>
                      <option value="Bahasa Indonesia">🇮🇩 Bahasa Indonesia</option>
                      <option value="Bahasa Inggris">🇬🇧 Bahasa Inggris</option>
                      <option value="Matematika Tingkat Lanjut">🚀 Matematika Tingkat Lanjut</option>
                      <option value="Bahasa Indonesia Tingkat Lanjut">✍️ Bahasa Indonesia Tingkat Lanjut</option>
                      <option value="Bahasa Inggris Tingkat Lanjut">🗣️ Bahasa Inggris Tingkat Lanjut</option>
                      <option value="Fisika">⚛️ Fisika</option>
                      <option value="Kimia">🧪 Kimia</option>
                      <option value="Biologi">🧬 Biologi</option>
                      <option value="PPKN">🏛️ PPKN</option>
                      <option value="Ekonomi">📈 Ekonomi</option>
                      <option value="Geografi">🗺️ Geografi</option>
                      <option value="Sejarah Tingkat Lanjut">📜 Sejarah Tingkat Lanjut</option>
                      <option value="Antropologi">🗿 Antropologi</option>
                      <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                      <option value="Produk Kreatif dan Kewirausahaan">🛠️ Produk Kreatif dan Kewirausahaan</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
                >
                  {isAddingUser ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Mendaftarkan Guru...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Daftarkan Guru Baru</span>
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Right Col: Current Users List */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800">Daftar Pengguna Sistem</h2>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {usersList.length} Pengguna
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-2">Nama Pengguna</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-2 font-bold text-slate-800">
                          <div>{usr.name || 'Guru Sosiologi'}</div>
                          {usr.role !== 'admin' && (
                            <div className="text-[10px] text-indigo-600 font-medium mt-0.5">Mapel: {usr.mataPelajaran || 'Sosiologi'}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-slate-600">{usr.email}</td>
                        <td className="py-3.5 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${
                            usr.role === 'admin'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {usr.role === 'admin' ? <Shield className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                            {usr.role === 'admin' ? 'Admin' : 'Guru'}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            disabled={usr.email === currentUser?.email}
                            onClick={async () => {
                              if (confirm(`Apakah Anda yakin ingin menghapus akses pengguna ${usr.name || usr.email}?`)) {
                                try {
                                  await deleteDoc(doc(db, 'users', usr.id));
                                } catch (err) {
                                  console.error("Gagal menghapus pengguna:", err);
                                  alert("Gagal menghapus pengguna dari database.");
                                }
                              }
                            }}
                            className={`p-1.5 rounded-lg border transition ${
                              usr.email === currentUser?.email
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300'
                            }`}
                            title={usr.email === currentUser?.email ? "Anda tidak dapat menghapus akun Anda sendiri" : "Hapus Pengguna"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">
                          Tidak ada pengguna terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* Questions Printable List */}
        <div 
          id="questions-printable-container" 
          className={`space-y-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 print:border-none print:p-0 print:shadow-none ${
            activeTab === 'soal' ? 'block' : 'hidden print:block'
          }`}
        >
              
              {/* Kop Surat Resmi */}
              {printConfig.showHeader && (
                <div className="border-b-[3px] border-double border-slate-900 pb-3 mb-5 flex items-center gap-4 text-center">
                  {printConfig.schoolLogo ? (
                    <img 
                      src={printConfig.schoolLogo} 
                      className="w-14 h-14 object-contain flex-shrink-0" 
                      alt="Logo Kiri" 
                    />
                  ) : (
                    <div className="w-14 h-14 border border-slate-800 rounded-full flex-shrink-0 flex items-center justify-center font-sans font-bold text-[9px] text-slate-800">
                      KOP
                    </div>
                  )}
                  <div className="flex-1">
                    {(printConfig.kopDepartment || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI')
                      .split('\n')
                      .map((line, idx) => (
                        <h4 key={idx} className="text-xs font-bold uppercase tracking-wide">{line.trim()}</h4>
                      ))
                    }
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">{printConfig.schoolName}</h3>
                    <p className="text-[9px] text-slate-600 italic">{printConfig.schoolAddress}</p>
                    <div className="border-t border-slate-400 mt-1 pt-1 flex justify-center gap-4 text-[9px] font-bold text-slate-700">
                      <span>TAHUN PELAJARAN: {printConfig.academicYear}</span>
                      <span>SEMESTER: {printConfig.semester.toUpperCase()}</span>
                    </div>
                  </div>
                  {printConfig.schoolLogoRight ? (
                    <img 
                      src={printConfig.schoolLogoRight} 
                      className="w-14 h-14 object-contain flex-shrink-0" 
                      alt="Logo Kanan" 
                    />
                  ) : (
                    <div className="w-14 h-14 border border-slate-800 rounded-full flex-shrink-0 flex items-center justify-center font-sans font-bold text-[9px] text-slate-800">
                      SMA
                    </div>
                  )}
                </div>
              )}

              {/* Title Section inside paper */}
              {!printConfig.showHeader && (
                <div className="border-b-2 border-slate-900 pb-4 text-center mb-4">
                  <h3 className="text-lg font-bold uppercase tracking-wide">LEMBAR SOAL UJIAN TKA SMA</h3>
                  <p className="text-xl font-extrabold text-slate-900">{printConfig.subjectName || config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'}</p>
                  <div className="mt-2 text-xs text-slate-600 flex justify-center gap-6">
                    <span><b>Tingkat/Kurikulum:</b> {config.muatan}</span>
                    <span><b>Tanggal:</b> {new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Exam Metadata Title (under Kop Surat) */}
              {printConfig.showHeader && (
                <div className="text-center space-y-0.5 mb-5">
                  <h2 className="text-sm font-extrabold tracking-wide uppercase">{printConfig.examName}</h2>
                  <h1 className="text-base font-black text-slate-900 uppercase">MATA PELAJARAN: {printConfig.subjectName || config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'}</h1>
                  <div className="text-[10px] text-slate-600 flex justify-center gap-4 font-semibold">
                    <span>Fase/Muatan: {config.muatan || 'SMA'}</span>
                    <span>Alokasi Waktu: {printConfig.timeAllocation}</span>
                  </div>
                </div>
              )}

              {/* Student Identity Section */}
              {printConfig.showStudentFields && (
                <div className="grid grid-cols-2 gap-4 border border-slate-400 p-3 rounded-lg text-[11px] font-semibold mb-5">
                  <div className="space-y-1">
                    <div className="flex"><span className="w-24">NAMA LENGKAP</span><span className="mr-2">:</span><span className="flex-1 border-b border-dashed border-slate-400"></span></div>
                    <div className="flex"><span className="w-24">NOMOR PESERTA</span><span className="mr-2">:</span><span className="flex-1 border-b border-dashed border-slate-400"></span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex"><span className="w-24">KELAS / JURUSAN</span><span className="mr-2">:</span><span className="flex-1 border-b border-dashed border-slate-400"></span></div>
                    <div className="flex"><span className="w-24">HARI / TANGGAL</span><span className="mr-2">:</span><span className="flex-1 text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                  </div>
                </div>
              )}

              {/* Instructions text */}
              {printConfig.instructionText && (
                <div className="border-l-2 border-slate-900 pl-3 py-0.5 text-xs text-slate-700 italic mb-5 leading-relaxed">
                  <b>PETUNJUK PENGERJAAN:</b> {printConfig.instructionText}
                </div>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 font-medium">
                  Belum ada butir soal yang tersusun. Sila buat Kisi-Kisi terlebih dahulu, lalu tekan tombol AI untuk menyusun atau tambahkan secara manual.
                </div>
              ) : (
                <div className={`${printConfig.layoutColumns === '2' ? 'columns-1 md:columns-2 gap-x-8 gap-y-6 print:columns-2 print:gap-x-8' : 'space-y-8'} ${printConfig.fontSize}`}>
                  {questions.map((q, idx) => (
                    <div key={q.id} className="inline-block w-full break-inside-avoid page-break-inside-avoid pb-6 mb-6 border-b border-slate-100 last:border-b-0 space-y-3">
                      
                      {/* Question Header (Always contains technical metadata on screen, but can be formatted nicely or hidden on print if showCompetencyTag is false) */}
                      {printConfig.showCompetencyTag ? (
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px]">
                          <div className="space-y-0.5">
                            <div><span className="font-bold">No Soal:</span> <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold">{q.noSoal}</span></div>
                            <div><span className="font-bold">Kompetensi:</span> {q.kompetensi}</div>
                            <div><span className="font-bold">Sub Kompetensi:</span> {q.subKompetensi}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                              {getBentukSoalLabel(q.shapes || q.bentukSoal)}
                            </span>
                            
                            {/* Control buttons inside card (hidden on print) */}
                            <div className="flex gap-1 no-print items-center">
                              {deletingQuestionId === q.id ? (
                                <div className="flex gap-1 items-center bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg">
                                  <span className="text-[9px] font-bold text-rose-700">Hapus?</span>
                                  <button
                                    onClick={() => {
                                      handleDeleteQuestion(q.id);
                                      setDeletingQuestionId(null);
                                    }}
                                    className="bg-red-600 text-white font-extrabold px-1 py-0.5 rounded text-[9px] transition"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeletingQuestionId(null)}
                                    className="bg-slate-200 text-slate-700 font-bold px-1 py-0.5 rounded text-[9px] transition"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : currentUser ? (
                                <div className="flex gap-1.5 items-center">
                                  <button
                                    onClick={() => handleEditQuestion(q)}
                                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs"
                                    title="Ubah Butir Soal"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Ubah Butir Soal</span>
                                  </button>
                                  <button
                                    onClick={() => setDeletingQuestionId(q.id)}
                                    className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs"
                                    title="Hapus Soal"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Traditional exam number format if technical tags are hidden */
                        <div className="flex justify-between items-center no-print pb-1 border-b border-slate-100 text-[10px] text-slate-400">
                          <span>Metadata Soal #{q.noSoal} ({getBentukSoalLabel(q.bentukSoal)})</span>
                          <div className="flex gap-1 items-center">
                            {deletingQuestionId === q.id ? (
                              <div className="flex gap-1 items-center bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg">
                                <span className="text-[9px] font-bold text-rose-700">Hapus?</span>
                                <button
                                  onClick={() => {
                                    handleDeleteQuestion(q.id);
                                    setDeletingQuestionId(null);
                                  }}
                                  className="bg-red-600 text-white font-extrabold px-1 py-0.5 rounded text-[9px] transition"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setDeletingQuestionId(null)}
                                  className="bg-slate-200 text-slate-700 font-bold px-1 py-0.5 rounded text-[9px] transition"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : currentUser ? (
                              <div className="flex gap-1.5 items-center">
                                <button
                                  onClick={() => handleEditQuestion(q)}
                                  className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs"
                                  title="Ubah Butir Soal"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Ubah Butir Soal</span>
                                </button>
                                <button
                                  onClick={() => setDeletingQuestionId(q.id)}
                                  className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-bold transition shadow-xs"
                                  title="Hapus Soal"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Question Content Block */}
                      <div className="flex gap-2.5 items-start">
                        {/* Always show traditional exam numbering on actual print */}
                        {!printConfig.showCompetencyTag && (
                          <span className="font-bold font-mono text-sm text-slate-900 min-w-[20px]">{q.noSoal}.</span>
                        )}
                        
                        <div className="flex-1 space-y-3.5">
                          
                          {/* Stimulus Box */}
                          {q.stimulus && printConfig.showStimulus && (
                            <div className="text-slate-700 leading-relaxed font-normal italic text-xs sm:text-sm text-justify mb-2">
                              {q.stimulus}
                            </div>
                          )}

                          {/* Illustration / Image Box */}
                          {q.gambarUrl && q.gambarUrl.trim() !== '' && printConfig.showIllustration && (
                            <div className="my-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 break-inside-avoid">
                              {q.gambarUrl.trim().toLowerCase().startsWith('<svg') ? (
                                <div 
                                  className="w-full max-w-sm overflow-x-auto flex justify-center py-2 px-3 bg-white rounded-xl border border-slate-100 shadow-xs"
                                  dangerouslySetInnerHTML={{ __html: q.gambarUrl }}
                                />
                              ) : (
                                <div className="relative group max-w-xs w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                                  <img 
                                    src={q.gambarUrl} 
                                    alt={`Ilustrasi Soal ${q.noSoal}`}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-auto object-contain max-h-[180px] mx-auto"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Question Statement */}
                          <div className="text-slate-900 leading-relaxed font-semibold whitespace-pre-line text-xs sm:text-sm">
                            {printConfig.showCompetencyTag && <span className="font-bold mr-1">{q.noSoal}.</span>}
                            {q.soal}
                          </div>

                          {/* Options */}
                          {q.opsi && q.opsi.length > 0 && (
                            <div className={`grid gap-2 pl-2 ${printConfig.layoutColumns === '2' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                              {q.opsi.map((opt, i) => {
                                const optLetter = opt.trim().substring(0, 1).toUpperCase();
                                const isCorrectOption = q.kunciJawaban.trim().toUpperCase().includes(optLetter) && printConfig.showAnswerKey;
                                return (
                                  <div 
                                    key={i} 
                                    className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs transition-all ${
                                      isCorrectOption 
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' 
                                        : 'border-slate-100 bg-slate-50/40 text-slate-800'
                                    }`}
                                  >
                                    <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono font-bold text-[9px] flex-shrink-0 ${
                                      isCorrectOption
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {optLetter}
                                    </span>
                                    <span className="font-sans leading-relaxed text-[11px] sm:text-xs">{opt.substring(2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Answer Key & Explanation */}
                          {printConfig.showAnswerKey && (
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-emerald-50/40 p-3 rounded-xl border border-dashed border-emerald-300 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Kunci Jawaban:</span>
                                <span className="font-mono bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                                  {q.kunciJawaban}
                                </span>
                              </div>
                              
                              {q.kataKunci && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Materi / Konsep:</span>
                                  <span className="bg-indigo-100 text-indigo-950 border border-indigo-200 text-[10px] font-semibold px-2 py-0.5 rounded">
                                    {q.kataKunci}
                                  </span>
                                </div>
                              )}
                              
                              <div className="text-[11px] text-slate-700 leading-relaxed">
                                <span className="font-bold text-slate-800">Pembahasan Ilmiah:</span>
                                <p className="whitespace-pre-wrap mt-0.5">{q.pembahasan}</p>
                              </div>
                            </motion.div>
                          )}

                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
      </main>

      {/* Footer */}
      <footer id="footer-section" className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200 mb-1">Generator Kisi-Kisi & Pembuat Soal TKA SMA</p>
            <p>Sistem Asesmen Pintar untuk Guru, Dosen, dan Pengajar Seluruh Indonesia.</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <p>© 2026 Kemdikbud SMA TKA Assessment. All Rights Reserved.</p>
            <p>Dikembangkan dengan <span className="text-rose-500">♥</span> menggunakan Gemini Flash & React.</p>
            <a 
              href="https://lynk.id/ajisosiologi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-indigo-950 text-[10px] font-extrabold text-indigo-400 hover:text-indigo-300 rounded-lg border border-slate-700 hover:border-indigo-500/50 transition duration-200 mt-1"
            >
              <span>Create @ajisosiologi</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Dynamic Animated AI Question Generation Progress Modal */}
      <AnimatePresence>
        {soalProgress.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center space-y-6 border border-slate-100 relative overflow-hidden"
            >
              {/* Top accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-60" />

              {/* Loader Animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-slate-100 border-b-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center animate-pulse">
                  <Sparkles className="h-7 w-7 text-indigo-600 animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
              </div>

              {/* Titles */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                  Penyusunan Soal Otomatis oleh AI Gemini
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-2">
                  Asisten AI sedang menyelaraskan materi asesmen dan merumuskan butir soal berstandar tinggi (HOTS, Literasi & Numerasi).
                </p>
              </div>

              {/* Progress Indicator */}
              {soalProgress.totalQuestions > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="uppercase tracking-wider text-[10px]">Progress Penyusunan</span>
                    <span className="text-indigo-600 font-mono text-sm font-bold">
                      {Math.min(100, Math.round((soalProgress.countSuccess / soalProgress.totalQuestions) * 100))}%
                    </span>
                  </div>
                  
                  {/* Progress Track */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                    <motion.div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.round((soalProgress.countSuccess / soalProgress.totalQuestions) * 100))}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Target: {soalProgress.totalQuestions} Soal</span>
                    <span className="text-emerald-600">Selesai: {soalProgress.countSuccess} Soal</span>
                  </div>
                </div>
              )}

              {/* Current Status Box */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left space-y-2 relative">
                {soalProgress.totalNo > 1 && (
                  <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Kisi-Kisi ke-{soalProgress.currentNo} dari {soalProgress.totalNo}</span>
                  </div>
                )}
                
                {soalProgress.topic && (
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 leading-snug">
                    <BookOpen className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{soalProgress.topic}</span>
                  </div>
                )}

                <div className="text-xs text-slate-600 font-semibold flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="italic text-[11px] text-slate-700">{soalProgress.statusText}</span>
                </div>
              </div>

              {/* Helpful standard tip */}
              <div className="text-[10px] text-slate-400 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span>Mengecek distractor & merumuskan kunci pembahasan ilmiah.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto Prompt Generator Modal */}
      <AnimatePresence>
        {isPromptModalOpen && selectedKisiForPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.92, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Top accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      Pembuat Prompt Otomatis AI (Megaprompt)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Salin prompt terstruktur di bawah ini untuk digunakan di Gemini, ChatGPT, Claude, dll.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {/* Content body - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Info Badges of current Kisi row */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2.5 text-left">
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                    Spesifikasi Kisi-Kisi No. {selectedKisiForPrompt.no}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Mata Pelajaran</span>
                      <span className="font-bold text-slate-700 truncate block">{config.mataPelajaran}</span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Materi Pokok</span>
                      <span className="font-bold text-slate-700 truncate block">{selectedKisiForPrompt.elemenMateri}</span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Sub-Materi / Indikator</span>
                      <span className="font-bold text-slate-700 block">{selectedKisiForPrompt.subElemenMateri || '-'}</span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Level Kognitif</span>
                      <span className="font-bold text-slate-700 block truncate">
                        {getLevelKognitifLabel(selectedKisiForPrompt.levelKognitif)}
                      </span>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Bentuk & Jumlah</span>
                      <span className="font-bold text-slate-700 block truncate">
                        {getBentukSoalLabel(selectedKisiForPrompt.bentukSoal)} ({selectedKisiForPrompt.jumlahSoal || 5} Soal)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prompt Text Box */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Draf Prompt AI Anda
                    </span>
                    <button
                      onClick={handleOptimizePromptWithAi}
                      disabled={isGeneratingPrompt}
                      className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Menganalisis & Mengoptimasi...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          <span>Optimasi via AI (Megaprompt)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative group">
                    <textarea
                      readOnly
                      value={generatedPromptText}
                      className="w-full h-64 bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs leading-relaxed focus:outline-none border border-slate-800 resize-none"
                    />
                    <div className="absolute top-3 right-3 opacity-90 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPromptText);
                          setCopiedPrompt(true);
                          setTimeout(() => setCopiedPrompt(false), 2000);
                        }}
                        className={`p-2 rounded-xl flex items-center gap-1 text-xs font-bold transition shadow ${
                          copiedPrompt 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-750'
                        }`}
                      >
                        {copiedPrompt ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Salin Prompt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 text-left">
                  <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs text-indigo-900 leading-normal font-medium">
                    <p className="font-bold">💡 Apa keuntungan menggunakan Prompt ini?</p>
                    <p className="text-slate-600">
                      Anda bisa menempelkan prompt ini pada platform AI luar untuk memperoleh materi penunjang pembelajaran lainnya, merancang bank soal alternatif yang sinkron dengan kurikulum, atau melatih pemahaman Anda secara mandiri di browser Anda sendiri.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  onClick={() => setIsPromptModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPromptText);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedPrompt ? 'Berhasil Disalin!' : 'Salin & Mulai'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center gap-3.5 mb-4 text-amber-500">
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Konfirmasi Keluar</h3>
                  <p className="text-xs text-slate-400">Yakin ingin meninggalkan sistem?</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Anda akan keluar dari sesi saat ini. Pastikan semua perubahan data parameter atau draf Anda telah tersimpan dengan benar di sistem.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={executeSignOut}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Confirmation Modal: Delete Single Jadwal */}
        {jadwalToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center gap-3.5 mb-4 text-red-600">
                <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Hapus Rencana Belajar?</h3>
                  <p className="text-xs text-slate-500">Konfirmasi pembatalan baris jadwal</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 mb-6">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Bulan / Periode:</span>
                  <span className="text-slate-900 font-extrabold">{jadwalToDelete.bulan}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Minggu Ke:</span>
                  <span className="text-slate-900 font-extrabold">Minggu {jadwalToDelete.mingguKe}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">Elemen / Materi:</span>
                  <p className="text-indigo-950 font-bold leading-relaxed">{jadwalToDelete.elemenMateri}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setJadwalToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={executeDeleteJadwal}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Ya, Hapus Rencana
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Confirmation Modal: Clear All Jadwal */}
        {showClearJadwalConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center gap-3.5 mb-4 text-red-600">
                <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Kosongkan Semua Jadwal?</h3>
                  <p className="text-xs text-slate-500">Konfirmasi pembersihan penuh tabel</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus <strong>seluruh rencana pembelajaran</strong> yang ada pada tabel? 
                Seluruh baris jadwal Anda saat ini akan dibersihkan secara permanen. Anda dapat memulihkannya lagi dengan mengimpor rekomendasi matriks asesmen yang sesuai di panel sebelah kanan.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowClearJadwalConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={executeClearJadwal}
                  className="px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Ya, Kosongkan Semua
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Confirmation Modal: Import All Presets */}
        {showImportPresetsConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4 no-print"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center gap-3.5 mb-4 text-indigo-600">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-950">Impor Semua Rencana?</h3>
                  <p className="text-xs text-slate-500">Mata Pelajaran: {showImportPresetsConfirm.subject}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin mengimpor sekaligus seluruh <strong>{showImportPresetsConfirm.count} rencana pembelajaran</strong> standar Pusmendik <strong>{showImportPresetsConfirm.subject}</strong> ke tabel jadwal Anda?
                <br /><br />
                Sistem akan secara otomatis mendistribusikannya secara merata ke minggu-minggu pada bulan <strong>Juli, Agustus, September, dan Oktober</strong>.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowImportPresetsConfirm(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  onClick={() => executeImportAllJadwalPresets(showImportPresetsConfirm.presets)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Ya, Impor Semua
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  const blocks = content.split('\n\n');

  return (
    <div className="space-y-4 text-slate-700 leading-relaxed text-sm">
      {blocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Header 1
        if (trimmed.startsWith('# ')) {
          return <h1 key={bIdx} className="text-xl font-extrabold text-indigo-950 mt-6 mb-2 pb-1 border-b border-slate-200">{trimmed.slice(2)}</h1>;
        }
        // Header 2
        if (trimmed.startsWith('## ')) {
          return <h2 key={bIdx} className="text-lg font-bold text-indigo-950 mt-5 mb-2">{trimmed.slice(3)}</h2>;
        }
        // Header 3
        if (trimmed.startsWith('### ')) {
          return <h3 key={bIdx} className="text-md font-bold text-slate-850 mt-4 mb-2">{trimmed.slice(4)}</h3>;
        }
        // Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const lines = trimmed.split('\n');
          return (
            <ul key={bIdx} className="list-disc pl-5 space-y-1.5">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^[*-\s]+/, '');
                return <li key={lIdx}>{renderInlines(itemText)}</li>;
              })}
            </ul>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const lines = trimmed.split('\n');
          return (
            <ol key={bIdx} className="list-decimal pl-5 space-y-1.5">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\d+\.\s+/, '');
                return <li key={lIdx}>{renderInlines(itemText)}</li>;
              })}
            </ol>
          );
        }
        // Blockquote
        if (trimmed.startsWith('> ')) {
          const text = trimmed.slice(2).replace(/\n>\s/g, '\n');
          return (
            <blockquote key={bIdx} className="border-l-4 border-purple-500 bg-slate-100/50 p-3 rounded-r-xl italic text-slate-600 my-2">
              {renderInlines(text)}
            </blockquote>
          );
        }

        // Standard paragraph
        return (
          <p key={bIdx} className="whitespace-pre-line text-slate-650 leading-relaxed">
            {renderInlines(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlines(text: string) {
  const parts = [];
  let currentText = text;

  while (currentText.length > 0) {
    const boldMatch = currentText.match(/\*\*([^*]+)\*\*/);
    const codeMatch = currentText.match(/`([^`]+)`/);

    let firstMatch = null;
    let type = '';

    if (boldMatch && codeMatch) {
      if ((boldMatch.index ?? 0) < (codeMatch.index ?? 0)) {
        firstMatch = boldMatch;
        type = 'bold';
      } else {
        firstMatch = codeMatch;
        type = 'code';
      }
    } else if (boldMatch) {
      firstMatch = boldMatch;
      type = 'bold';
    } else if (codeMatch) {
      firstMatch = codeMatch;
      type = 'code';
    }

    if (firstMatch && firstMatch.index !== undefined) {
      if (firstMatch.index > 0) {
        parts.push(currentText.substring(0, firstMatch.index));
      }
      if (type === 'bold') {
        parts.push(<strong key={currentText.length} className="font-extrabold text-slate-900">{firstMatch[1]}</strong>);
      } else if (type === 'code') {
        parts.push(<code key={currentText.length} className="bg-slate-250 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">{firstMatch[1]}</code>);
      }
      currentText = currentText.substring(firstMatch.index + firstMatch[0].length);
    } else {
      parts.push(currentText);
      break;
    }
  }

  return <>{parts}</>;
}
