
import React from 'react';
import { 
  BookOpen, 
  Target, 
  Lightbulb, 
  Flag,
  ListTodo, 
  FileCheck,
  Settings,
  Users
} from 'lucide-react';

export const STEPS = [
  { id: 1, title: 'Target & Waktu', icon: <Users className="w-5 h-5" />, desc: 'Jenjang, Kelas & JP' },
  { id: 2, title: 'Analisis Konteks', icon: <BookOpen className="w-5 h-5" />, desc: 'Pilihan & Refleksi' },
  { id: 3, title: 'Dimensi Lulusan', icon: <Target className="w-5 h-5" />, desc: 'Pilihan & Rekomendasi' },
  { id: 4, title: 'Tema & Bentuk', icon: <Lightbulb className="w-5 h-5" />, desc: 'Konsep Dasar' },
  { id: 5, title: 'Tujuan Projek', icon: <Flag className="w-5 h-5" />, desc: 'Poin-poin Tujuan' },
  { id: 6, title: 'Waktu & Aktivitas', icon: <ListTodo className="w-5 h-5" />, desc: 'JP & Timeline' },
  { id: 7, title: 'Finalisasi', icon: <FileCheck className="w-5 h-5" />, desc: 'Generate & Download' },
];

export const ANALYSIS_OPTIONS = {
  curriculum: {
    goals: [
      "Membantu penerapan konsep pembelajaran intrakurikuler",
      "Mengembangkan keterampilan abad 21",
      "Memberi ruang praktik karakter",
      "Membantu pembelajaran kontekstual",
      "Mendukung Visi & Misi Sekolah",
      "Integrasi muatan lokal"
    ],
    gaps: [
      "Kemampuan komunikasi dan presentasi masih rendah",
      "Kemampuan kerja sama kelompok belum maksimal",
      "Kreativitas masih terbatas",
      "Penerapan materi dalam praktik nyata",
      "Kemampuan pemecahan masalah (Problem Solving)",
      "Literasi digital"
    ],
    values: [
      "Disiplin dan tanggung jawab",
      "Kepedulian lingkungan",
      "Percaya diri dan kepemimpinan",
      "Religiusitas & Keimanan",
      "Gotong Royong & Empati",
      "Integritas & Kejujuran"
    ]
  },
  students: {
    interests: [
      "Teknologi dan digital (coding, desain grafis, media sosial)",
      "Olahraga (futsal, badminton)",
      "Kesehatan",
      "Seni (Musik, Tari, Rupa)",
      "Alam & Lingkungan Hidup",
      "Wirausaha & Bisnis"
    ],
    talents: [
      "Kemampuan penggunaan teknologi digital",
      "Bakat olahraga pada beberapa siswa",
      "Kreativitas dalam seni dan desain",
      "Kemampuan kerja tim cukup baik",
      "Kemampuan komunikasi publik",
      "Berpikir logis & analitis"
    ],
    needs: [
      "Kemampuan komunikasi",
      "Kemandirian dalam belajar",
      "Literasi membaca",
      "Numerasi dasar",
      "Manajemen emosi/diri",
      "Percaya Diri"
    ]
  },
  resources: {
    assets: [
      "Ruang kelas untuk klub belajar",
      "Area lingkungan sekolah untuk proyek lingkungan",
      "Laboratorium Komputer/IPA",
      "Perpustakaan",
      "Aula Pertemuan/Halaman Luas",
      "Lapangan"
    ],
    people: [
      "Tenaga kependidikan sebagai pendamping",
      "Praktisi dari dunia usaha atau industri",
      "Guru yang kompeten",
      "Dukungan Orang Tua/Komite",
      "Ikatan Alumni",
      "Rekan Guru Sekolah Lain"
    ],
    finance: [
      "Dana BOS",
      "Dana Komite/Sumbangan",
      "Kas Sekolah/Koperasi",
      "Sponsorship/CSR",
      "Swadaya Murid (barang bekas, dll)",
      "Iuran Murid/Dana Kelas"
    ],
    partners: [
      "Komunitas pemuda",
      "Pasar lokal atau usaha kecil",
      "Komunitas lingkungan",
      "UMKM/Dunia Usaha sekitar",
      "Puskesmas/Dinas Kesehatan",
      "Tukang Kayu"
    ]
  },
  social: {
    issues: [
      "Motivasi belajar tidak konsisten",
      "Merokok",
      "Pacaran",
      "Penggunaan Gadget berlebihan",
      "Masalah Sampah & Kebersihan",
      "Perundungan (Bullying)"
    ],
    values: [
      "Pengendalian diri",
      "Empati dan toleransi",
      "Ketahanan mental (resiliensi)",
      "Disiplin & Tanggung Jawab",
      "Kepedulian Sosial",
      "Motivasi"
    ],
    socioeco: [
      "Kegiatan perlu biaya rendah atau gratis",
      "Dukungan fasilitas belajar di rumah terbatas",
      "Partisipasi orang tua bervariasi",
      "Menengah ke bawah",
      "Menengah ke atas",
      "Beragam (Heterogen)"
    ]
  }
};
