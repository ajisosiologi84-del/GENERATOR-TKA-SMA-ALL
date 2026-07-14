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
  Image
} from 'lucide-react';
import { KisiKisiItem, Question, GeneratorConfig, BentukSoal, LevelKognitif, JumlahOpsi, JenisSoal } from './types';
import { 
  exportKisiToExcel, 
  exportKisiToWord, 
  exportQuestionsToExcel, 
  exportQuestionsToWord,
  getBentukSoalLabel,
  getLevelKognitifLabel
} from './utils/exportUtils';

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

export default function App() {
  // Navigation Tabs: 'config' (Generator & Prompt), 'kisi' (Matriks Asesmen), 'soal' (Pembuat Soal)
  const [activeTab, setActiveTab] = useState<'config' | 'kisi' | 'soal'>('config');

  // Input States for Generator Config
  const [config, setConfig] = useState<GeneratorConfig>({
    mataPelajaran: '',
    definisi: '',
    muatan: '',
    kompetensi: '',
    bentukSoal: 'pilihan_ganda_sederhana',
    levelKognitif: 'level_2',
    elemenMateri: '',
    subElemenMateri: '',
    batasanCatatan: '',
    jumlahOpsi: 5,
    jenisSoal: 'tunggal',
    jumlahSoal: 5,
    konteksLokal: [],
    stimulusKonten: [],
    kualitasChecklist: [
      'Konstruksi Soal', 
      'Kesesuaian Materi', 
      'Level Kognitif', 
      'Kunci Jawaban Tepat', 
      'Distractor Berkualitas',
      'Sesuai Kurikulum'
    ],
  });

  // State for Kisi-Kisi Matriks Asesmen list
  const [kisiList, setKisiList] = useState<KisiKisiItem[]>([]);

  // State for Question list
  const [questions, setQuestions] = useState<Question[]>([]);

  // Loading States
  const [isGeneratingKisi, setIsGeneratingKisi] = useState(false);
  const [isGeneratingSoal, setIsGeneratingSoal] = useState(false);
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
    jumlahSoal: 5
  });

  // Form states for adding/editing a Question manually
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // State for preset subject selection in the matrix UI
  const [selectedPresetSubject, setSelectedPresetSubject] = useState<'Matematika' | 'Bahasa Indonesia' | 'Bahasa Inggris' | 'Matematika Tingkat Lanjut' | 'Bahasa Indonesia Tingkat Lanjut' | 'Bahasa Inggris Tingkat Lanjut' | 'Fisika' | 'Kimia' | 'Biologi' | 'PPKN' | 'Ekonomi' | 'Geografi' | 'Sosiologi' | 'Sejarah Tingkat Lanjut' | 'Antropologi' | 'Bahasa Jepang' | 'Produk Kreatif dan Kewirausahaan'>('Matematika');

  // Sync preset subject selection with config mataPelajaran if applicable
  useEffect(() => {
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
  }, [config.mataPelajaran]);
  
  // Inline Deletion Confirmation States
  const [deletingKisiId, setDeletingKisiId] = useState<string | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  
  // State for Print Settings (Menu Setting Cetak)
  const [printConfig, setPrintConfig] = useState({
    showHeader: true,
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
  });
  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(true);

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

    // 2. Prompt Pembuat Soal
    const promptSoalText = `Buatkan butir-butir soal TKA SMA bermutu tinggi berbasis kurikulum pendidikan Indonesia.

INFORMASI SOAL:
- MATA PELAJARAN: ${config.mataPelajaran}
- MATERI/ELEMEN: ${config.elemenMateri} / ${config.subElemenMateri}
- KOMPETENSI DIUJI: ${config.kompetensi}
- BENTUK SOAL: ${getBentukSoalLabel(config.bentukSoal)}
- PILIHAN/OPSI JAWABAN: ${config.jumlahOpsi} Pilihan (A s.d ${config.jumlahOpsi === 5 ? 'E' : 'D'})
- JENIS SOAL: ${config.jenisSoal === 'grup' ? 'Soal Grup (Berbasis stimulus terintegrasi)' : 'Soal Tunggal'}${contextList}${stimulusList}${qualityList}

Format keluaran wajib mengikuti pola teks terstruktur Indonesia:
===========================================
No Soal : [Nomor]
Kompetensi : [Kompetensi yang diuji]
Sub Kompetensi : [Sub kompetensi spesifik]
Bentuk Soal : [Jenis bentuk soal]

Stimulus: (Jika ada)
[Paragraf stimulus, data, kasus, atau ilustrasi]

Soal:
[Pertanyaan utama]

Pilihan Jawaban:
A. [Pilihan A]
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
${config.jumlahOpsi === 5 ? 'E. [Pilihan E]\n' : ''}
Kunci Jawaban: [Kunci tepat]

Pembahasan:
[Penjelasan langkah demi langkah ilmiah dan terstruktur]
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

  // Trigger server-side AI generation of Kisi-Kisi
  const handleGenerateKisiViaAI = async () => {
    if (!config.mataPelajaran) {
      alert('Sila pilih Mata Pelajaran terlebih dahulu di Tab 1!');
      return;
    }
    setIsGeneratingKisi(true);
    try {
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

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Respon dari server tidak valid (bukan format JSON).');
      }
      if (Array.isArray(data)) {
        // Map to KisiKisiItem schema
        const mapped: KisiKisiItem[] = data.map((item: any, idx: number) => ({
          id: `kisi-ai-${Date.now()}-${idx}`,
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
          jumlahSoal: Number(item.jumlahSoal) || 5
        }));

        setKisiList(prev => [...prev, ...mapped]);
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
    const localPrompt = `Buatlah ${item.jumlahSoal || 5} butir soal ${getBentukSoalLabel(item.bentukSoal)} HOTS (Higher Order Thinking Skills) untuk mata pelajaran ${config.mataPelajaran || "Umum"} tingkat SMA, Kelas XII.

Spesifikasi Butir Soal:
- Lingkup Materi / Kompetensi: ${item.kompetensi}
- Materi Pokok (Elemen): ${item.elemenMateri}
- Sub-materi (Sub-elemen) / Indikator Soal: ${item.subElemenMateri || '-'}
- Level Kognitif: ${getLevelKognitifLabel(item.levelKognitif)} (${item.levelKognitif})
- Bentuk Soal: ${getBentukSoalLabel(item.bentukSoal)}

Ketentuan Penting:
1. Soal wajib mengukur kemampuan berpikir tingkat tinggi (HOTS): analisis (C4), evaluasi (C5), atau kreasi (C6).
2. Setiap soal wajib menyertakan stimulus berupa wacana kontekstual, studi kasus nyata, grafik data, atau kutipan literatur.
3. Pilihan jawaban pengecoh (distraktor) harus homogen, ilmiah, logis, dan menantang bagi siswa.
4. Sertakan kunci jawaban beserta pembahasan/analisis jawaban secara mendalam untuk setiap opsi.

Format Output:
Tampilkan soal dengan format yang sangat jelas:
1. Stimulus
2. Pertanyaan
3. Opsi pilihan jawaban (A, B, C, D, E)
4. Kunci Jawaban
5. Pembahasan Analitis`;

    setGeneratedPromptText(localPrompt);
    setIsPromptModalOpen(true);
  };

  // Optimize prompt using server-side Gemini AI
  const handleOptimizePromptWithAi = async () => {
    if (!selectedKisiForPrompt) return;
    setIsGeneratingPrompt(true);
    try {
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
            noSoalStart: currentNoSoal
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

        let data;
        try {
          const responseText = await response.text();
          data = JSON.parse(responseText);
        } catch (jsonErr: any) {
          throw new Error('Respon dari server tidak valid (bukan JSON format). Silakan coba lagi.');
        }

        if (Array.isArray(data)) {
          const mapped: Question[] = data.map((q: any, idx: number) => ({
            id: `q-ai-${Date.now()}-${i}-${idx}`,
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
        setQuestions(prev => [...prev, ...generatedSoalList]);
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

      let data;
      try {
        const responseText = await response.text();
        data = JSON.parse(responseText);
      } catch {
        throw new Error('Respon dari server tidak valid.');
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
              noSoalStart: currentNoSoal
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

          let data;
          try {
            const responseText = await response.text();
            data = JSON.parse(responseText);
          } catch {
            throw new Error('Respon dari server tidak valid (bukan JSON format).');
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
  const handleImportSinglePreset = (preset: { elemenMateri: string, subElemenMateri: string, kompetensi: string, batasanCatatan: string }) => {
    const presetSubjectMapped = selectedPresetSubject === 'PPKN' 
      ? 'Pendidikan Pancasila dan Kewarganegaraan'
      : selectedPresetSubject === 'Sejarah Tingkat Lanjut'
      ? 'Sejarah'
      : selectedPresetSubject === 'Produk Kreatif dan Kewirausahaan'
      ? 'Produk atau Projek Kreatif dan Kewirausahaan SMK dan MAK'
      : selectedPresetSubject;

    if (!config.mataPelajaran) {
      setConfig(prev => ({
        ...prev,
        mataPelajaran: presetSubjectMapped
      }));
    }

    const newItem: KisiKisiItem = {
      id: `kisi-pusmendik-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      no: kisiList.length + 1,
      bentukSoal: 'pilihan_ganda_sederhana',
      levelKognitif: 'level_2',
      elemenMateri: preset.elemenMateri,
      subElemenMateri: preset.subElemenMateri,
      kompetensi: preset.kompetensi,
      batasanCatatan: preset.batasanCatatan,
      jumlahSoal: 5
    };
    setKisiList(prev => [...prev, newItem]);
  };

  const handleImportAllPresets = () => {
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
      if (!config.mataPelajaran) {
        setConfig(prev => ({
          ...prev,
          mataPelajaran: presetSubjectMapped
        }));
      }

      const newItems: KisiKisiItem[] = activePresets.map((preset, idx) => ({
        id: `kisi-pusmendik-all-${Date.now()}-${idx}`,
        no: kisiList.length + idx + 1,
        bentukSoal: 'pilihan_ganda_sederhana',
        levelKognitif: 'level_2',
        elemenMateri: preset.elemenMateri,
        subElemenMateri: preset.subElemenMateri,
        kompetensi: preset.kompetensi,
        batasanCatatan: preset.batasanCatatan,
        jumlahSoal: 5
      }));
      setKisiList(prev => [...prev, ...newItems]);
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

    if (!config.mataPelajaran) {
      setConfig(prev => ({
        ...prev,
        mataPelajaran: presetSubjectMapped
      }));
    }

    setKisiForm({
      bentukSoal: 'pilihan_ganda_sederhana',
      levelKognitif: 'level_2',
      elemenMateri: preset.elemenMateri,
      subElemenMateri: preset.subElemenMateri,
      kompetensi: preset.kompetensi,
      batasanCatatan: preset.batasanCatatan,
      jumlahSoal: 5
    });
    alert(`Materi "${preset.subElemenMateri}" berhasil dimuat ke Form Tambah/Edit di bawah. Sila sesuaikan sebelum menyimpan.`);
  };

  // Kisi-Kisi Manual Actions
  const handleSaveKisiForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kisiForm.elemenMateri || !kisiForm.subElemenMateri || !kisiForm.kompetensi) {
      alert('Sila isi kolom Materi, Sub-materi, dan Kompetensi terlebih dahulu!');
      return;
    }

    if (isEditingKisi && editingKisiId) {
      setKisiList(prev => prev.map(item => item.id === editingKisiId ? {
        ...item,
        bentukSoal: kisiForm.bentukSoal as BentukSoal,
        levelKognitif: kisiForm.levelKognitif as LevelKognitif,
        elemenMateri: kisiForm.elemenMateri || '',
        subElemenMateri: kisiForm.subElemenMateri || '',
        kompetensi: kisiForm.kompetensi || '',
        batasanCatatan: kisiForm.batasanCatatan || '',
        jumlahSoal: Number(kisiForm.jumlahSoal) || 5
      } : item));
      setIsEditingKisi(false);
      setEditingKisiId(null);
    } else {
      const newItem: KisiKisiItem = {
        id: `kisi-manual-${Date.now()}`,
        no: kisiList.length + 1,
        bentukSoal: kisiForm.bentukSoal as BentukSoal,
        levelKognitif: kisiForm.levelKognitif as LevelKognitif,
        elemenMateri: kisiForm.elemenMateri || '',
        subElemenMateri: kisiForm.subElemenMateri || '',
        kompetensi: kisiForm.kompetensi || '',
        batasanCatatan: kisiForm.batasanCatatan || '',
        jumlahSoal: Number(kisiForm.jumlahSoal) || 5
      };
      setKisiList(prev => [...prev, newItem]);
    }

    // Reset Form
    setKisiForm({
      bentukSoal: 'pilihan_ganda_sederhana',
      levelKognitif: 'level_2',
      elemenMateri: '',
      subElemenMateri: '',
      kompetensi: '',
      batasanCatatan: '',
      jumlahSoal: 5
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
      jumlahSoal: item.jumlahSoal
    });
    setIsEditingKisi(true);
    setEditingKisiId(item.id);
  };

  const handleDeleteKisi = (id: string) => {
    setKisiList(prev => prev.filter(item => item.id !== id).map((item, index) => ({
      ...item,
      no: index + 1
    })));
  };

  const handleDeleteUnusedKisi = () => {
    const usedIds = new Set(questions.map(q => q.kisiKisiId));
    const unusedKisi = kisiList.filter(item => !usedIds.has(item.id));
    
    if (unusedKisi.length === 0) {
      alert('Semua baris Kisi-Kisi saat ini sudah digunakan oleh butir soal!');
      return;
    }

    setKisiList(prev => {
      const filtered = prev.filter(item => usedIds.has(item.id));
      return filtered.map((item, index) => ({
        ...item,
        no: index + 1
      }));
    });
    alert(`Berhasil menghapus ${unusedKisi.length} baris Kisi-Kisi kosong yang tidak digunakan.`);
  };

  // Questions Manual Actions
  const handleSaveQuestionForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.soal || !questionForm.kunciJawaban) {
      alert('Teks Soal dan Kunci Jawaban wajib diisi!');
      return;
    }

    // Clean options (remove empty strings)
    const activeOptions = (questionForm.opsi || []).filter(o => o.trim() !== '');

    if (isEditingQuestion && editingQuestionId) {
      setQuestions(prev => prev.map(q => q.id === editingQuestionId ? {
        ...q,
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
      } : q));
      setIsEditingQuestion(false);
      setEditingQuestionId(null);
    } else {
      const newQ: Question = {
        id: `q-manual-${Date.now()}`,
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
      setQuestions(prev => [...prev, newQ]);
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

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({
      ...q,
      noSoal: idx + 1
    })));
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
    window.print();
  };

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
                        PROMPT 2: PEMBUAT SOAL UTBK/TKA
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
                  onClick={() => exportKisiToWord(kisiList, config.mataPelajaran)}
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
                      onClick={() => setSelectedPresetSubject('Matematika')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Matematika' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      📐 Matematika
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Bahasa Indonesia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Indonesia' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🇮🇩 Bahasa Indonesia
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Bahasa Inggris')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Inggris' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🇬🇧 Bahasa Inggris
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Matematika Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Matematika Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🚀 Mat Lanjut
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Bahasa Indonesia Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Indonesia Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ✍️ Indo Lanjut
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Bahasa Inggris Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Inggris Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗣️ Inggris Lanjut
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Fisika')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Fisika' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      ⚛️ Fisika
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Kimia')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Kimia' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧪 Kimia
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Biologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Biologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🧬 Biologi
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('PPKN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'PPKN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗳️ PPKN
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Ekonomi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Ekonomi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      💰 Ekonomi
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Geografi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Geografi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🌍 Geografi
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Sosiologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Sosiologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      👥 Sosiologi
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Sejarah Tingkat Lanjut')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Sejarah Tingkat Lanjut' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      📜 Sejarah Tingkat Lanjut
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Antropologi')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Antropologi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🗿 Antropologi
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Bahasa Jepang')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPresetSubject === 'Bahasa Jepang' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      🎌 Bahasa Jepang
                    </button>
                    <button
                      onClick={() => setSelectedPresetSubject('Produk Kreatif dan Kewirausahaan')}
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
                        onClick={() => handleImportSinglePreset(preset)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded text-[10px] transition text-center"
                      >
                        + Tambah Langsung
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
              <form onSubmit={handleSaveKisiForm} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div>
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
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={kisiForm.jumlahSoal}
                      onChange={(e) => setKisiForm({ ...kisiForm, jumlahSoal: Number(e.target.value) })}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center"
                    />
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs px-3 py-1.5 transition"
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
                            jumlahSoal: 5
                          });
                        }}
                        className="bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs px-2.5 py-1.5 transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
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
                      <th className="py-3.5 px-4 text-center w-24">Jumlah Soal</th>
                      <th className="py-3.5 px-4 text-center w-32 no-print">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kisiList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">
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
                  onClick={() => exportQuestionsToExcel(questions, config.mataPelajaran)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                  <span>Download Excel (.xls)</span>
                </button>
                <button
                  onClick={() => exportQuestionsToWord(questions, config.mataPelajaran)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>Download Word (.doc)</span>
                </button>
                <button
                  onClick={() => setIsEditingQuestion(true)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="h-4.5 w-4.5" />
                  <span>Tambah Soal</span>
                </button>
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
                      <span className="text-[10px] text-indigo-600 font-semibold font-sans">Mendukung Link Gambar (http://) atau Kode SVG Lengkap (&lt;svg&gt;)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={questionForm.gambarUrl || ''}
                      onChange={(e) => setQuestionForm({ ...questionForm, gambarUrl: e.target.value })}
                      placeholder="Contoh: https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500  ATAU kode <svg viewBox='0 0 400 150'>...</svg>"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />

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
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
                    >
                      Simpan Butir Soal
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
                      Menu Pengaturan Cetak Lembar Ujian TKA SMA
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Ujian / Asesmen</label>
                        <input
                          type="text"
                          value={printConfig.examName}
                          onChange={(e) => setPrintConfig({ ...printConfig, examName: e.target.value })}
                          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
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

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
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
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Mulai Cetak / Simpan ke PDF</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
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
                    <h4 className="text-xs font-bold uppercase tracking-wide">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h4>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">{printConfig.schoolName}</h3>
                    <p className="text-[9px] text-slate-600 italic">Jalan Pendidikan Raya No. 45 Nusantara - Telp/Fax: (021) 777-1234 - Website: www.sekolahkita.sch.id</p>
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
                  <p className="text-xl font-extrabold text-slate-900">{config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'}</p>
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
                  <h1 className="text-base font-black text-slate-900 uppercase">MATA PELAJARAN: {config.mataPelajaran || 'TES KEMAMPUAN AKADEMIK'}</h1>
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
                    <div key={q.id} className="break-inside-avoid page-break-inside-avoid pb-6 border-b border-slate-100 last:border-b-0 space-y-3">
                      
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
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditQuestion(q)}
                                    className="text-slate-600 hover:text-indigo-600 p-1 hover:bg-slate-200 rounded transition"
                                    title="Edit soal"
                                  >
                                    <Sliders className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingQuestionId(q.id)}
                                    className="text-slate-600 hover:text-red-600 p-1 hover:bg-slate-200 rounded transition"
                                    title="Hapus soal"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
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
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditQuestion(q)}
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 hover:bg-slate-100 rounded transition"
                                  title="Edit soal"
                                >
                                  <Sliders className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setDeletingQuestionId(q.id)}
                                  className="text-slate-400 hover:text-red-600 p-0.5 hover:bg-slate-100 rounded transition"
                                  title="Hapus soal"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
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
                            <div className="border-l-4 border-indigo-600 bg-slate-50/80 p-3 rounded-r-xl italic text-slate-700 leading-relaxed font-sans text-xs">
                              <div className="font-bold not-italic text-[10px] text-indigo-800 mb-1 uppercase tracking-wide">
                                Wacana / Stimulus:
                              </div>
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
          <div className="text-right">
            <p>© 2026 Kemdikbud SMA TKA Assessment. All Rights Reserved.</p>
            <p>Dikembangkan dengan <span className="text-rose-500">♥</span> menggunakan Gemini Flash & React.</p>
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
      </AnimatePresence>
    </div>
  );
}
