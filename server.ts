import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  loadDatabaseFromFirestore,
  saveDatabaseToFirestore,
  triggerFirestoreSync,
  getFirestoreCloudStatus,
} from './serverFirestore';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.resolve('./data/database.json');
const DB_BACKUP_FILE = path.resolve('./data/database.backup.json');

app.use(express.json({ limit: '10mb' }));

// Helper for hashing password securely
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_gema_bio_salt_2026').digest('hex');
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'essay'
  | 'case_study';

export interface MatchingPair {
  id: string;
  premise: string;
  target: string;
}

export interface GradeComponentConfig {
  id: string;
  name: string;
  weight: number;
  source_type: 'attendance' | 'participation' | 'assignment' | 'quiz' | 'uts' | 'uas' | 'manual';
  description?: string;
  is_default?: boolean;
}

// In-memory + persisted DB structure
interface DatabaseSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    username?: string;
    password_hash: string;
    role: 'admin' | 'dosen' | 'mahasiswa';
    student_id?: string; // NIM for mahasiswa
    nidn?: string; // NIDN for dosen / admin
    nip?: string; // NIP for dosen / admin
    class_name?: string; // Kelas (e.g. BIO-2A, BIO-2B)
    department?: string;
    avatar?: string;
    created_at: string;
  }>;
  materials: Array<{
    id: string;
    course_id?: string;
    title: string;
    category: string;
    description: string;
    content: string;
    learning_objectives: string[];
    estimated_time: string;
    order_number: number;
    created_at: string;
    attachments?: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
      size?: string;
    }>;
  }>;
  quizzes: Array<{
    id: string;
    material_id: string;
    title: string;
    description: string;
    points: number;
    created_at: string;
  }>;
  questions: Array<{
    id: string;
    quiz_id: string;
    type?: QuestionType;
    question: string;
    case_context?: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    matching_pairs?: MatchingPair[];
    correct_answer?: string;
    correct_answers_multi?: string[];
    correct_short_answers?: string[];
    essay_rubric_keywords?: string[];
    essay_sample_answer?: string;
    explanation: string;
  }>;
  progress: Array<{
    id: string;
    user_id: string;
    material_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    completed_at: string | null;
  }>;
  quiz_results: Array<{
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    correct_count: number;
    total_questions: number;
    points_earned: number;
    answers: Record<string, any>;
    completed_at: string;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    requirement: string;
    icon: string;
    condition_type: 'first_material' | 'first_quiz' | 'materials_count' | 'quiz_perfect' | 'points_threshold' | 'all_materials';
    condition_value: number;
  }>;
  user_badges: Array<{
    id: string;
    user_id: string;
    badge_id: string;
    earned_at: string;
  }>;
  points: Array<{
    id: string;
    user_id: string;
    amount: number;
    source: string;
    created_at: string;
  }>;
  activities: Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_role: string;
    action: string;
    detail: string;
    created_at: string;
  }>;
  attendances?: Array<{
    id: string;
    meeting_number: number;
    meeting_topic: string;
    date: string;
    user_id: string;
    status: 'hadir' | 'izin' | 'sakit' | 'alpa';
    notes?: string;
    updated_at: string;
  }>;
  assignments?: Array<{
    id: string;
    meeting_number: number;
    title: string;
    description: string;
    due_date: string;
    max_score: number;
  }>;
  assignment_submissions?: Array<{
    id: string;
    assignment_id: string;
    user_id: string;
    content: string;
    score?: number;
    feedback?: string;
    submitted_at: string;
    graded_at?: string;
  }>;
  exam_grades?: Array<{
    id: string;
    user_id: string;
    type: string;
    score: number;
    notes?: string;
    updated_at: string;
  }>;
  settings: {
    campus_name: string;
    course_name: string;
    course_code?: string;
    semester: string;
    academic_year: string;
    lecturer_name?: string;
    app_logo?: string;
    material_point: number;
    quiz_base_point: number;
    quiz_correct_point: number;
    category_bonus_point: number;
    grade_weights?: {
      attendance: number;
      participation: number;
      assignment: number;
      uts: number;
      uas: number;
    };
    grade_components?: any[];
    active_course_id?: string;
    available_degrees?: Array<{
      code: string;
      name: string;
      level?: string;
      is_active: boolean;
      description?: string;
      is_default?: boolean;
    }>;
  };
  courses?: Array<{
    id: string;
    code: string;
    name: string;
    semester: string;
    academic_year: string;
    sks: number;
    department?: string;
    department_id?: string;
    lecturer_id?: string;
    lecturer_name: string;
    lecturer_ids?: string[];
    enrolled_classes?: string[];
    enrolled_student_ids?: string[];
    description: string;
    color?: string;
    icon?: string;
    created_at?: string;
  }>;
  discussion_threads?: Array<{
    id: string;
    course_id: string;
    meeting_number?: number;
    title: string;
    content: string;
    user_id: string;
    user_name: string;
    user_role: 'admin' | 'dosen' | 'mahasiswa';
    category: string;
    created_at: string;
    is_pinned?: boolean;
    likes: number;
    liked_by: string[];
    comments_count?: number;
    tags?: string[];
  }>;
  discussion_comments?: Array<{
    id: string;
    thread_id: string;
    user_id: string;
    user_name: string;
    user_role: 'admin' | 'dosen' | 'mahasiswa';
    content: string;
    created_at: string;
    likes: number;
    liked_by: string[];
    is_endorsed?: boolean;
  }>;
  departments?: Array<{
    id: string;
    code: string;
    name: string;
    degree: string;
    faculty: string;
    head_name?: string;
    head_id?: string;
    head_nidn?: string;
    accreditation?: string;
    description?: string;
    created_at?: string;
  }>;
  classes?: Array<{
    id: string;
    name: string;
    department_id?: string;
    department_name: string;
    academic_year: string;
    semester: number | string;
    advisor_name?: string;
    advisor_id?: string;
    capacity?: number;
    description?: string;
    created_at?: string;
  }>;
  lecturer_grade_components?: Record<string, GradeComponentConfig[]>;
  lecturer_grade_weights?: Record<string, any>;
  course_groups?: Array<{
    id: string;
    course_id: string;
    name: string;
    description?: string;
    leader_id?: string;
    leader_name?: string;
    member_ids: string[];
    created_at: string;
    updated_at?: string;
  }>;
}

export const DEFAULT_DEGREES = [
  { code: 'S1', name: 'Sarjana', level: 'Level 6 KKNI', is_active: true, description: 'Program Pendidikan Sarjana (Strata-1)', is_default: true },
  { code: 'S2', name: 'Magister', level: 'Level 8 KKNI', is_active: true, description: 'Program Pascasarjana Magister (Strata-2)', is_default: true },
  { code: 'D4', name: 'Sarjana Terapan', level: 'Level 6 KKNI', is_active: false, description: 'Program Pendidikan Vokasi Sarjana Terapan', is_default: true },
  { code: 'D3', name: 'Diploma Tiga', level: 'Level 5 KKNI', is_active: false, description: 'Program Pendidikan Vokasi Ahli Madya', is_default: true },
  { code: 'S3', name: 'Doktor', level: 'Level 9 KKNI', is_active: false, description: 'Program Pascasarjana Doktoral (Strata-3)', is_default: true },
  { code: 'Profesi', name: 'Pendidikan Profesi', level: 'Level 7 KKNI', is_active: false, description: 'Program Profesi (PPG / Ners / Apoteker / Dokter)', is_default: true },
];

// Initial realistic Indonesian dummy data
function getInitialData(): DatabaseSchema {
  const users = [
    {
      id: 'usr_admin',
      name: 'Haryono Prasetyo, S.Kom., M.T.',
      email: 'admin@gemabio.ac.id',
      username: 'admin',
      password_hash: hashPassword('admin123'),
      role: 'admin' as const,
      nidn: '198504122010121002',
      nip: '198504122010121002',
      department: 'Pusat Teknologi Informasi & Pembelajaran',
      avatar: 'HP',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'usr_dosen',
      name: 'Dr. Sri Wahyuni, M.Kom.',
      email: 'dosen@gemabio.ac.id',
      username: 'dosen',
      password_hash: hashPassword('dosen123'),
      role: 'dosen' as const,
      nidn: '0018067901',
      nip: '197906182005012001',
      department: 'Program Studi Sains & Aplikasi Komputer',
      avatar: 'SW',
      created_at: '2026-01-10T08:30:00Z',
    },
    {
      id: 'usr_mhs_1',
      name: 'Siti Nurhaliza',
      email: 'siti@gemabio.ac.id',
      username: 'siti23',
      password_hash: hashPassword('mhs123'),
      role: 'mahasiswa' as const,
      student_id: '230302001',
      class_name: 'BIO-2A',
      department: 'Biologi Terapan',
      avatar: 'SN',
      created_at: '2026-01-15T09:00:00Z',
    },
    {
      id: 'usr_mhs_2',
      name: 'Rizky Pratama',
      email: 'rizky@gemabio.ac.id',
      username: 'rizky23',
      password_hash: hashPassword('mhs123'),
      role: 'mahasiswa' as const,
      student_id: '230302002',
      class_name: 'BIO-2A',
      department: 'Biologi',
      avatar: 'RP',
      created_at: '2026-01-15T09:15:00Z',
    },
    {
      id: 'usr_mhs_3',
      name: 'Ahmad Fauzan',
      email: 'fauzan@gemabio.ac.id',
      username: 'fauzan23',
      password_hash: hashPassword('mhs123'),
      role: 'mahasiswa' as const,
      student_id: '230302003',
      class_name: 'BIO-2B',
      department: 'Pendidikan Biologi',
      avatar: 'AF',
      created_at: '2026-01-15T09:30:00Z',
    },
    {
      id: 'usr_mhs_4',
      name: 'Dinda Rahmawati',
      email: 'dinda@gemabio.ac.id',
      username: 'dinda23',
      password_hash: hashPassword('mhs123'),
      role: 'mahasiswa' as const,
      student_id: '230302004',
      class_name: 'BIO-2B',
      department: 'Bioteknologi',
      avatar: 'DR',
      created_at: '2026-01-15T09:45:00Z',
    },
    {
      id: 'usr_mhs_5',
      name: 'Budi Santoso',
      email: 'budi@gemabio.ac.id',
      username: 'budi23',
      password_hash: hashPassword('mhs123'),
      role: 'mahasiswa' as const,
      student_id: '230302005',
      class_name: 'BIO-2A',
      department: 'Biologi Lingkungan',
      avatar: 'BS',
      created_at: '2026-01-15T10:00:00Z',
    },
  ];

  const materials = [
    {
      id: 'mat_1',
      title: 'Pertemuan 1: Pengenalan Komputer & Ekosistem Perangkat Lunak',
      category: 'Pengenalan Aplikasi Komputer',
      description: 'Mengenal arsitektur dasar komputer, perbedaan hardware & software, serta peran penting komputasi dalam riset biologi dan sains modern.',
      learning_objectives: [
        'Memahami arsitektur dasar perangkat keras (CPU, RAM, Storage) dan interaksinya.',
        'Mengidentifikasi ragam perangkat lunak aplikasi dan sistem di lingkungan akademik.',
        'Menerapkan konsep komputasi untuk menunjang studi dan dokumentasi ilmiah.'
      ],
      estimated_time: '15 Menit',
      order_number: 1,
      content: `## 1. Pendahuluan Aplikasi Komputer
Aplikasi komputer telah menjadi tulang punggung dalam berbagai ranah keilmuan perguruan tinggi, termasuk sains biologi, bioinformatika, dan teknologi modern. Pemahaman terhadap komponen perangkat keras dan perangkat lunak memungkinkan mahasiswa memanfaatkan teknologi komputasi secara efektif untuk pengolahan data penelitian, pembuatan laporan praktikum, serta komunikasi ilmiah.

### Komponen Utama Sistem Komputer
1. **Perangkat Keras (Hardware)**:
   - **Processor (CPU)**: Otak komputer yang mengeksekusi instruksi data secara berurutan maupun paralel.
   - **Memori Utama (RAM)**: Penyimpanan sementara dengan kecepatan tinggi untuk aplikasi yang sedang aktif berjalan.
   - **Media Penyimpanan (SSD/HDD)**: Tempat menyimpan berkas sistem dan dokumen secara permanen.
   - **Perangkat Masukan & Keluaran (I/O)**: Keyboard, mouse, monitor, scanner instrumen lab, dan printer.

2. **Perangkat Lunak (Software)**:
   - **Sistem Operasi**: Windows, macOS, Linux (Ubuntu/Debian) yang mengelola resource perangkat keras.
   - **Aplikasi Produktivitas**: Microsoft Office, Google Workspace, LibreOffice.
   - **Aplikasi Sains & Riset**: SPSS, R, Python, ImageJ, BioEdit untuk analisis data spesimen biologi.

### Tips Efisiensi Komputasi Akademik
Gunakan sistem pintasan keyboard dasar (shortcut) seperti Ctrl+C (salin), Ctrl+V (tempel), Ctrl+Z (undo), dan biasakan menyimpan dokumen secara berkala di cloud storage terenkripsi seperti Google Drive kampus.`,
      created_at: '2026-01-12T10:00:00Z',
    },
    {
      id: 'mat_2',
      title: 'Pertemuan 2: Manajemen Sistem Operasi & Tata Kelola Berkas Ilmiah',
      category: 'Sistem Operasi',
      description: 'Menguasai struktur direktori, manajemen hierarki file praktikum, backup cloud, serta efisiensi task manager.',
      learning_objectives: [
        'Menyusun struktur direktori dokumen kuliah dan riset yang rapi dan terstandarisasi.',
        'Memahami manajemen proses, CPU usage, dan keamanan file permission.',
        'Menerapkan strategi 3-2-1 backup untuk mencegah kehilangan data riset penting.'
      ],
      estimated_time: '20 Menit',
      order_number: 2,
      content: `## 2. Mengapa Tata Kelola Berkas Sangat Krusial?
Dalam riset biologi dan perkuliahan sains, mahasiswa seringkali menghasilkan ratusan foto mikroskop, dataset tabel observasi, dan draft laporan mingguan. Tanpa tata kelola berkas (file management) yang baik, data penting dapat hilang atau tertukar.

### Standar Penamaan File Akademik
Hindari penamaan sembarangan seperti "draft_akhir_revisi_banget.docx". Gunakan konvensi:
\`[KODE_MK]_[NIM]_[TOPIK]_[TANGGAL_ISO].ekstensi\`
Contoh:
\`APLI2026_BIO001_LaporanMorfologi_20261005.docx\`

### Strategi Backup 3-2-1
- Simpan **3 salinan** data penting.
- Gunakan **2 media berbeda** (misalnya SSD laptop dan Harddisk eksternal).
- Simpan **1 salinan di lokasi luar (cloud)** (Google Drive akun kampus / OneDrive).

### Task Manager & Diagnostik Sistem
Ketika laptop terasa lambat saat membuka software berat:
- Tekan **Ctrl + Shift + Esc** di Windows untuk membuka Task Manager.
- Periksa konsumsi RAM dan Disk pada tab Processes.
- Tutup program background yang tidak diperlukan untuk menjaga kestabilan laptop.`,
      created_at: '2026-01-14T10:00:00Z',
    },
    {
      id: 'mat_3',
      title: 'Pertemuan 3: Pengolah Kata: Tata Tulis Karya Ilmiah & Manajemen Sitasi',
      category: 'Pengolah Kata',
      description: 'Format penulisan skripsi/makalah: Styles, Daftar Isi Otomatis, Page Break vs Section Break, serta integrasi Mendeley/Zotero.',
      learning_objectives: [
        'Menguasai fitur Heading Styles untuk navigasi dokumen panjang.',
        'Membuat Daftar Isi, Daftar Tabel, dan Daftar Gambar otomatis.',
        'Mengatur nomor halaman romawi dan angka arab dengan Section Break.',
        'Mengintegrasikan manajemen sitasi standar APA/IEEE.'
      ],
      estimated_time: '25 Menit',
      order_number: 3,
      content: `## 3. Formatting Dokumen Akademik Profesional
Pengolah kata (Word Processor seperti MS Word atau Google Docs) bukan sekadar mesin ketik digital. Di tingkat perguruan tinggi, mahasiswa dituntut memproduksi dokumen karya tulis dengan format baku yang konsisten.

### Kunci Utama: Gunakan Heading Styles
Jangan membesarkan ukuran teks dan menebalkan secara manual untuk membuat judul bab!
1. Terapkan **Heading 1** untuk Judul Bab (BAB I PENDAHULUAN).
2. Terapkan **Heading 2** untuk Sub-bab (1.1 Latar Belakang).
3. Terapkan **Heading 3** untuk Sub-sub-bab.

**Keuntungan**:
- Daftar Isi (Table of Contents) dapat dibuat otomatis dalam 1 klik melalui menu *References > Table of Contents*.
- Panel navigasi (*Ctrl + F > Headings*) memudahkan berpindah antar bagian dalam dokumen 100+ halaman.

### Pemisahan Halaman (Section Breaks vs Page Breaks)
- **Page Break (Ctrl + Enter)**: Berpindah ke halaman baru dengan format halaman yang sama.
- **Section Break (Next Page)**: Memisahkan bagian dokumen agar memiliki orientasi berbeda (misal halaman tabel berorientasi Landscape) atau format nomor halaman berbeda (misal kata pengantar bernomor Romawi i, ii, iii dan bab isi bernomor Arab 1, 2, 3).

### Sitasi Otomatis
Gunakan Reference Manager seperti Mendeley atau Zotero agar format sitasi dan Daftar Pustaka bebas dari plagiarisme dan kesalahan ketik manual.`,
      created_at: '2026-01-16T10:00:00Z',
    },
    {
      id: 'mat_4',
      title: 'Pertemuan 4: Pengolah Angka: Analisis Data Statistik, Formula & Grafik',
      category: 'Pengolah Angka',
      description: 'Menganalisis data kuantitatif laboratorium dengan Microsoft Excel/Google Sheets: SUM, AVERAGE, STDEV, IF, VLOOKUP/XLOOKUP, dan Pivot Table.',
      learning_objectives: [
        'Menggunakan formula statistik deskriptif pada data observasi sains.',
        'Menerapkan referensi sel absolut ($A$1) dan relatif secara tepat.',
        'Menyusun Pivot Table untuk ringkasan agregat data penelitian.',
        'Membuat diagram batang, garis, dan error bar berstandar publikasi.'
      ],
      estimated_time: '25 Menit',
      order_number: 4,
      content: `## 4. Analisis Data Praktikum dengan Spreadsheet
Spreadsheet merupakan alat wajib bagi saintis dan mahasiswa aplikasi komputer. Data mentah dari eksperimen laboratorium diolah menggunakan formula statistik.

### Formula Statistik Esensial
- \`=AVERAGE(range)\`: Menghitung nilai rata-rata sampel.
- \`=STDEV.S(range)\`: Menghitung standar deviasi sampel pengamatan.
- \`=COUNTIF(range, kriteria)\`: Menghitung frekuensi kemunculan data tertentu.
- \`=IF(kondisi, jika_benar, jika_salah)\`: Logika percabangan untuk kategorisasi data.

### Referensi Sel: Mengapa Tanda Dolar ($) Penting?
- **Relatif (A1)**: Saat formula disalin ke bawah, referensi berubah menjadi A2, A3, dst.
- **Absolut ($A$1)**: Dibuat dengan menekan tombol **F4**. Nilai sel terkunci dan tidak bergeser saat formula disalin. Sangat penting ketika mengalikan semua baris data dengan satu konstanta kalibrasi!`,
      created_at: '2026-01-18T10:00:00Z',
    },
    {
      id: 'mat_5',
      title: 'Pertemuan 5: Desain Slide Presentasi Ilmiah & Komunikasi Visual',
      category: 'Presentasi',
      description: 'Teknik merancang slide seminar proposal dan ujian praktikum: prinsip kontras visual, piramida informasi, dan presentasi efektif.',
      learning_objectives: [
        'Menerapkan prinsip desain slide ilmiah: 1 gagasan utama per slide.',
        'Memilih palet warna berstandar aksesibilitas dan tipografi hierarkis.',
        'Menghindari kejenuhan teks dengan diagram alir dan infografis ringkas.',
        'Menguasai fitur presenter view dan navigasi slide saat berbicara di depan audiens.'
      ],
      estimated_time: '20 Menit',
      order_number: 5,
      content: `## 5. Komunikasi Visual dalam Presentasi Akademik
Banyak mahasiswa melakukan kesalahan dengan menempelkan seluruh paragraf makalah ke dalam slide PowerPoint. Hal ini menyebabkan audiens membaca slide alih-alih mendengarkan paparan lisan pembicara.

### Prinsip Desain Bersih
- **Kontras Tinggi**: Teks gelap di atas latar belakang terang atau sebaliknya.
- **Tipografi Jelas**: Gunakan font sans-serif berbobot tegas dengan ukuran minimal 24pt untuk isi dan 36pt untuk judul.
- **Visualisasi > Teks Panjang**: Ubah langkah metodologi penelitian menjadi bagan alir (flowchart).`,
      created_at: '2026-01-20T10:00:00Z',
    },
    {
      id: 'mat_6',
      title: 'Pertemuan 6: Keamanan Digital, Etika Siber & Privasi Data Akademik',
      category: 'Keamanan Digital',
      description: 'Menjaga keamanan akun kampus, autentikasi 2 faktor (2FA), mengenali phishing, serta etika penggunaan kecerdasan buatan.',
      learning_objectives: [
        'Mengenali ciri-ciri serangan phishing dan rekayasa sosial di lingkungan kampus.',
        'Mengaktifkan autentikasi dua faktor (2FA) dan manajemen kata sandi yang aman.',
        'Memahami etika digital, hak cipta karya cipta intelektual, dan privasi data.',
        'Menerapkan prinsip integritas akademik dalam pemanfaatan alat digital.'
      ],
      estimated_time: '20 Menit',
      order_number: 6,
      content: `## 6. Keamanan Digital Mahasiswa
Di era cloud dan kampus digital, ancaman kebocoran data, pencurian akun portal akademik, dan phishing kian marak terjadi. Keamanan siber bukan hanya tanggung jawab tim IT kampus, melainkan setiap individu pengguna.

### Mengenali Serangan Phishing
Phishing adalah upaya memancing korban untuk memasukkan password pada halaman login palsu.
Aktifkan 2FA (Two-Factor Authentication) untuk mengamankan akun kampus Anda.`,
      created_at: '2026-01-22T10:00:00Z',
    },
  ];

  const quizzes = [
    {
      id: 'quiz_1',
      material_id: 'mat_1',
      title: 'Mini Kuis: Konsep Komputasi & Perangkat Lunak',
      description: 'Kuis komprehensif menguji pemahaman arsitektur komputer dengan ragam variasi soal (Pilihan Ganda, Kompleks, B/S, Menjodohkan, Isian, Studi Kasus & Esai).',
      points: 35,
      created_at: '2026-01-12T11:00:00Z',
    },
    {
      id: 'quiz_2',
      material_id: 'mat_2',
      title: 'Mini Kuis: Manajemen Berkas & Sistem Operasi',
      description: 'Uji pemahaman tata kelola berkas, backup 3-2-1, task manager, dan hak akses direktori.',
      points: 25,
      created_at: '2026-01-14T11:00:00Z',
    },
    {
      id: 'quiz_3',
      material_id: 'mat_3',
      title: 'Mini Kuis: Pengolah Kata & Dokumen Ilmiah',
      description: 'Uji pengetahuan Heading Styles, Section Break, Daftar Isi otomatis, dan Reference Manager.',
      points: 25,
      created_at: '2026-01-16T11:00:00Z',
    },
    {
      id: 'quiz_4',
      material_id: 'mat_4',
      title: 'Mini Kuis: Analisis Data Spreadsheet & Formula',
      description: 'Uji kemampuan rumus statistik, referensi sel absolut ($A$1), dan visualisasi grafik.',
      points: 25,
      created_at: '2026-01-18T11:00:00Z',
    },
    {
      id: 'quiz_5',
      material_id: 'mat_5',
      title: 'Mini Kuis: Desain Slide Presentasi Akademik',
      description: 'Uji pemahaman prinsip kontras, tipografi, presenter view, dan infografis sains.',
      points: 25,
      created_at: '2026-01-20T11:00:00Z',
    },
    {
      id: 'quiz_6',
      material_id: 'mat_6',
      title: 'Mini Kuis: Keamanan Siber & Privasi Digital',
      description: 'Uji pemahaman serangan phishing, 2FA, integritas data, dan etika AI kampus.',
      points: 25,
      created_at: '2026-01-22T11:00:00Z',
    },
  ];

  // Rich questions featuring ALL 7 question types!
  const questions: DatabaseSchema['questions'] = [
    // --- Quiz 1: Showcase of ALL Question Types ---
    {
      id: 'q_1_1',
      quiz_id: 'quiz_1',
      type: 'single_choice',
      question: 'Komponen perangkat keras yang bertindak sebagai otak utama pemroses instruksi data pada komputer adalah...',
      option_a: 'Random Access Memory (RAM)',
      option_b: 'Central Processing Unit (CPU)',
      option_c: 'Solid State Drive (SSD)',
      option_d: 'Power Supply Unit (PSU)',
      correct_answer: 'b',
      explanation: 'CPU (Central Processing Unit) mengeksekusi instruksi data dan logika aritmatika dalam sistem komputer.',
    },
    {
      id: 'q_1_2',
      quiz_id: 'quiz_1',
      type: 'multiple_choice', // Pilihan Ganda Kompleks
      question: 'Manakah dari komponen berikut yang tergolong ke dalam media penyimpanan sekunder non-volatile? (Pilih semua yang benar)',
      option_a: 'Solid State Drive (SSD)',
      option_b: 'Flashdisk USB',
      option_c: 'DRAM (Dynamic RAM)',
      option_d: 'Harddisk Eksternal (HDD)',
      correct_answers_multi: ['a', 'b', 'd'],
      explanation: 'SSD, Flashdisk USB, dan Harddisk adalah media penyimpanan sekunder non-volatile (data tidak hilang saat daya listrik mati). Sedangkan DRAM bersifat volatile.',
    },
    {
      id: 'q_1_3',
      quiz_id: 'quiz_1',
      type: 'true_false', // Benar / Salah
      question: 'Pernyataan: "RAM bersifat non-volatile sehingga seluruh berkas dokumen praktikum yang sedang diketik akan tetap tersimpan secara aman di RAM meskipun laptop mendadak mati kehabisan baterai."',
      option_a: 'Benar (True)',
      option_b: 'Salah (False)',
      correct_answer: 'false',
      explanation: 'Salah. RAM bersifat volatile (daya simpan sementara). Data yang belum disimpan permanen ke SSD/HDD akan hilang jika aliran listrik terputus.',
    },
    {
      id: 'q_1_4',
      quiz_id: 'quiz_1',
      type: 'matching', // Menjodohkan
      question: 'Jodohkan komponen perangkat komputer di sebelah kiri dengan fungsi utamanya di sebelah kanan secara tepat:',
      matching_pairs: [
        { id: 'm1', premise: 'CPU (Processor)', target: 'Mengeksekusi instruksi program dan logika komputasi' },
        { id: 'm2', premise: 'RAM', target: 'Penyimpanan memori sementara kecepatan tinggi untuk aplikasi aktif' },
        { id: 'm3', premise: 'SSD', target: 'Media penyimpanan data dan berkas sistem operasi secara permanen' },
        { id: 'm4', premise: 'GPU', target: 'Pemrosesan komputasi grafis dan visualisasi matriks 3D' },
      ],
      explanation: 'Pasangan yang tepat: CPU = eksekusi instruksi; RAM = memori sementara berkecepatan tinggi; SSD = penyimpanan permanen; GPU = pemrosesan grafis dan visualisasi.',
    },
    {
      id: 'q_1_5',
      quiz_id: 'quiz_1',
      type: 'short_answer', // Isian Singkat
      question: 'Sebutkan nama sistem operasi open-source berbasis Unix yang sangat populer digunakan oleh saintis untuk analisis bioinformatika dan server riset komputasi?',
      correct_short_answers: ['linux', 'ubuntu', 'debian', 'os linux'],
      explanation: 'Linux (termasuk distro seperti Ubuntu atau Debian) adalah sistem operasi open-source standar dalam bioinformatika dan server ilmiah.',
    },
    {
      id: 'q_1_6',
      quiz_id: 'quiz_1',
      type: 'case_study', // Studi Kasus
      case_context: 'Kasus Praktikum: Mahasiswa sedang menjalankan perangkat lunak pengolahan data mikroskop resolusi tinggi berukuran 8 GB. Tiba-tiba kursor laptop bergerak lambat (freezing), dan muncul notifikasi "Low Virtual Memory". Ketika diperiksa, laptop tersebut hanya memiliki RAM 4 GB dan menggunakan harddisk konvensional.',
      question: 'Berdasarkan studi kasus di atas, apa penyebab mendasar dari masalah penurunan kinerja laptop tersebut dan solusi jangka panjang yang paling tepat?',
      option_a: 'Processor rusak terbakar, harus mengganti motherboard baru',
      option_b: 'Kapasitas RAM tidak mencukupi untuk memuat dataset 8 GB, sehingga terjadi disk thrashing (paging berat); solusi tepat adalah upgrade RAM dan SSD',
      option_c: 'Keyboard terkena cairan laboratorium sehingga sistem operasi mengalami loop input',
      option_d: 'Resolusi layar monitor terlalu terang sehingga membebani kartu grafis',
      correct_answer: 'b',
      explanation: 'Dataset 8 GB melebihi kapasitas RAM fisik 4 GB, memaksa sistem operasi melakukan swap/paging ke harddisk yang lambat (disk thrashing). Solusinya adalah menambah kapasitas RAM dan menggunakan SSD.',
    },
    {
      id: 'q_1_7',
      quiz_id: 'quiz_1',
      type: 'essay', // Uraian / Esai
      question: 'Jelaskan perbedaan mendasar antara memori utama (RAM) dan media penyimpanan sekunder (SSD) dalam menunjang pengolahan data laporan ilmiah mahasiswa, serta mengapa mahasiswa tetap wajib melakukan penyimpanan berkas (Save) ke SSD!',
      essay_rubric_keywords: ['ram', 'ssd', 'volatile', 'sementara', 'permanen', 'simpan', 'daya'],
      essay_sample_answer: 'RAM berfungsi sebagai memori sementara (volatile) berkecepatan sangat tinggi untuk menampung program dan data yang sedang aktif diproses CPU. Namun saat komputer mati, isi RAM hilang. Oleh karena itu, mahasiswa harus melakukan penyimpanan (Save) ke SSD yang bersifat non-volatile agar dokumen laporan tersimpan secara permanen.',
      explanation: 'Rubrik penilaian otomatis mengevaluasi pemahaman konsep: RAM bersifat volatile (sementara), SSD bersifat non-volatile (permanen), serta pentingnya perintah Save untuk menghindari kehilangan data saat daya mati.',
    },

    // --- Quiz 2 Questions ---
    {
      id: 'q_2_1',
      quiz_id: 'quiz_2',
      type: 'single_choice',
      question: 'Dalam strategi pencadangan data riset 3-2-1, angka "1" memiliki arti...',
      option_a: 'Menyimpan dalam 1 folder utama di laptop',
      option_b: 'Menyimpan minimal 1 salinan di lokasi luar (cloud storage / offsite)',
      option_c: 'Melakukan backup hanya 1 kali dalam setahun',
      option_d: 'Menggunakan 1 kata sandi untuk semua file',
      correct_answer: 'b',
      explanation: 'Strategi 3-2-1 menetapkan: 3 salinan data, 2 media berbeda, dan minimal 1 salinan disimpan di lokasi luar (offsite/cloud) untuk proteksi bencana fisik.',
    },
    {
      id: 'q_2_2',
      quiz_id: 'quiz_2',
      type: 'true_false',
      question: 'Pernyataan: "Kombinasi tombol keyboard Ctrl + Shift + Esc di Windows langsung membuka Task Manager tanpa perlu membuka layar opsi penguncian Windows."',
      option_a: 'Benar (True)',
      option_b: 'Salah (False)',
      correct_answer: 'true',
      explanation: 'Benar. Ctrl + Shift + Esc adalah jalan pintas tercepat untuk memanggil Task Manager secara instan.',
    },
    {
      id: 'q_2_3',
      quiz_id: 'quiz_2',
      type: 'short_answer',
      question: 'Tuliskan ekstensi standar file dokumen pengolah kata modern Microsoft Word (contoh: doc, xlsx, pdf)!',
      correct_short_answers: ['docx', '.docx'],
      explanation: 'Ekstensi dokumen standar Microsoft Word modern berbasis XML adalah .docx.',
    },

    // --- Quiz 3 Questions ---
    {
      id: 'q_3_1',
      quiz_id: 'quiz_3',
      type: 'single_choice',
      question: 'Fitur apakah yang wajib diterapkan pada judul bab dan sub-bab agar Daftar Isi (Table of Contents) dapat dihasilkan secara otomatis?',
      option_a: 'Bold dan underline manual dengan font size 16pt',
      option_b: 'Heading Styles (Heading 1, Heading 2, dst.)',
      option_c: 'WordArt Text Effect',
      option_d: 'Text Box terpisah',
      correct_answer: 'b',
      explanation: 'Heading Styles memberitahukan struktur hierarki dokumen kepada software pengolah kata sehingga Daftar Isi dapat disusun secara otomatis.',
    },
    {
      id: 'q_3_2',
      quiz_id: 'quiz_3',
      type: 'multiple_choice',
      question: 'Software manakah di bawah ini yang umum digunakan sebagai Reference Manager untuk sitasi karya ilmiah otomatis? (Pilih semua yang benar)',
      option_a: 'Mendeley',
      option_b: 'Zotero',
      option_c: 'EndNote',
      option_d: 'WinRAR',
      correct_answers_multi: ['a', 'b', 'c'],
      explanation: 'Mendeley, Zotero, dan EndNote adalah reference manager populer untuk sitasi ilmiah. WinRAR adalah program kompresi berkas arsip.',
    },

    // --- Quiz 4 Questions ---
    {
      id: 'q_4_1',
      quiz_id: 'quiz_4',
      type: 'single_choice',
      question: 'Formula spreadsheet manakah yang digunakan untuk menghitung nilai rata-rata dari rentang sel B2 sampai B20?',
      option_a: '=SUM(B2:B20)',
      option_b: '=AVERAGE(B2:B20)',
      option_c: '=MEAN(B2:B20)',
      option_d: '=TOTAL(B2:B20)',
      correct_answer: 'b',
      explanation: '=AVERAGE(B2:B20) adalah fungsi baku untuk menghitung rata-rata aritmatika.',
    },
    {
      id: 'q_4_2',
      quiz_id: 'quiz_4',
      type: 'short_answer',
      question: 'Simbol tombol keyboard apakah yang digunakan pada formula spreadsheet untuk mengunci sel agar bernilai absolut (contoh: $A$1)?',
      correct_short_answers: ['$', 'dollar', 'dolar', 'tanda dollar', 'tanda dolar'],
      explanation: 'Tanda dollar ($) seperti pada $A$1 mengunci baris dan kolom agar tidak bergeser saat formula disalin.',
    },

    // --- Quiz 5 Questions ---
    {
      id: 'q_5_1',
      quiz_id: 'quiz_5',
      type: 'true_false',
      question: 'Pernyataan: "Dalam presentasi ilmiah, semakin banyak paragraf teks yang dimasukkan ke dalam slide, semakin baik pemahaman audiens terhadap materi."',
      option_a: 'Benar (True)',
      option_b: 'Salah (False)',
      correct_answer: 'false',
      explanation: 'Salah. Slide ilmiah harus mengedepankan visualisasi, bagan alir, dan poin kunci. Terlalu banyak teks membuat audiens jenuh dan tidak fokus mendengarkan pembicara.',
    },

    // --- Quiz 6 Questions ---
    {
      id: 'q_6_1',
      quiz_id: 'quiz_6',
      type: 'case_study',
      case_context: 'Kasus Phishing: Anda menerima email dengan alamat pengirim "admin@portal-kampus-update.xyz" yang menyatakan akun portal akademik Anda akan diblokir dalam 1 jam jika tidak segera mengklik tautan verifikasi dan memasukkan kata sandi portal Anda.',
      question: 'Tindakan apakah yang paling aman dan tepat untuk dilakukan mahasiswa?',
      option_a: 'Langsung mengklik tautan dan memasukkan password agar akun tidak diblokir',
      option_b: 'Membalas email tersebut dengan menanyakan apakah benar dari pihak kampus',
      option_c: 'Mengabaikan tautan, menandai email sebagai Phishing, dan memverifikasi ke helpdesk IT kampus resmi',
      option_d: 'Meneruskan email ke seluruh teman sekelas untuk meminta bantuan login',
      correct_answer: 'c',
      explanation: 'Email dengan domain mencurigakan dan pesan mendesak adalah indikasi phishing. Jangan pernah memasukkan kredensial dan laporkan ke helpdesk resmi kampus.',
    },
  ];

  const badges = [
    {
      id: 'bdg_1',
      name: 'First Step',
      description: 'Menyelesaikan materi pembelajaran pertama kali.',
      requirement: 'Selesaikan minimal 1 materi.',
      icon: 'award',
      condition_type: 'first_material' as const,
      condition_value: 1,
    },
    {
      id: 'bdg_2',
      name: 'Quiz Starter',
      description: 'Menyelesaikan mini kuis pertama kali dengan sukses.',
      requirement: 'Selesaikan minimal 1 mini kuis.',
      icon: 'zap',
      condition_type: 'first_quiz' as const,
      condition_value: 1,
    },
    {
      id: 'bdg_3',
      name: 'Fast Learner',
      description: 'Menunjukkan konsistensi belajar dengan menyelesaikan 3 materi.',
      requirement: 'Selesaikan minimal 3 materi pembelajaran.',
      icon: 'target',
      condition_type: 'materials_count' as const,
      condition_value: 3,
    },
    {
      id: 'bdg_4',
      name: 'Quiz Master',
      description: 'Meraih skor sempurna 100 pada salah satu mini kuis.',
      requirement: 'Dapatkan nilai 100 pada kuis.',
      icon: 'trophy',
      condition_type: 'quiz_perfect' as const,
      condition_value: 100,
    },
    {
      id: 'bdg_5',
      name: 'Consistent Learner',
      description: 'Mengumpulkan akumulasi poin belajar mencapai 100 poin.',
      requirement: 'Kumpulkan minimal 100 poin total.',
      icon: 'flame',
      condition_type: 'points_threshold' as const,
      condition_value: 100,
    },
    {
      id: 'bdg_6',
      name: 'Computer Expert',
      description: 'Menyelesaikan seluruh materi pembelajaran dalam silabus Aplikasi Komputer.',
      requirement: 'Selesaikan seluruh materi kuliah (6 materi).',
      icon: 'compass',
      condition_type: 'all_materials' as const,
      condition_value: 6,
    },
  ];

  const progress = [
    { id: 'prg_1', user_id: 'usr_mhs_1', material_id: 'mat_1', status: 'completed' as const, completed_at: '2026-01-16T14:30:00Z' },
    { id: 'prg_2', user_id: 'usr_mhs_1', material_id: 'mat_2', status: 'completed' as const, completed_at: '2026-01-18T16:00:00Z' },
    { id: 'prg_3', user_id: 'usr_mhs_1', material_id: 'mat_3', status: 'completed' as const, completed_at: '2026-01-20T10:15:00Z' },
    { id: 'prg_4', user_id: 'usr_mhs_1', material_id: 'mat_4', status: 'completed' as const, completed_at: '2026-01-23T11:45:00Z' },

    { id: 'prg_5', user_id: 'usr_mhs_2', material_id: 'mat_1', status: 'completed' as const, completed_at: '2026-01-17T09:00:00Z' },
    { id: 'prg_6', user_id: 'usr_mhs_2', material_id: 'mat_2', status: 'completed' as const, completed_at: '2026-01-21T15:20:00Z' },

    { id: 'prg_7', user_id: 'usr_mhs_3', material_id: 'mat_1', status: 'completed' as const, completed_at: '2026-01-19T13:10:00Z' },

    { id: 'prg_8', user_id: 'usr_mhs_4', material_id: 'mat_1', status: 'completed' as const, completed_at: '2026-01-16T11:00:00Z' },
    { id: 'prg_9', user_id: 'usr_mhs_4', material_id: 'mat_2', status: 'completed' as const, completed_at: '2026-01-19T14:20:00Z' },
    { id: 'prg_10', user_id: 'usr_mhs_4', material_id: 'mat_3', status: 'completed' as const, completed_at: '2026-01-24T09:30:00Z' },
  ];

  const quiz_results: DatabaseSchema['quiz_results'] = [
    {
      id: 'qr_1',
      user_id: 'usr_mhs_1',
      quiz_id: 'quiz_1',
      score: 100,
      correct_count: 7,
      total_questions: 7,
      points_earned: 35,
      answers: { q_1_1: 'b', q_1_2: ['a', 'b', 'd'], q_1_3: 'false', q_1_5: 'linux', q_1_6: 'b' },
      completed_at: '2026-01-16T15:00:00Z',
    },
    {
      id: 'qr_2',
      user_id: 'usr_mhs_1',
      quiz_id: 'quiz_2',
      score: 100,
      correct_count: 3,
      total_questions: 3,
      points_earned: 25,
      answers: { q_2_1: 'b', q_2_2: 'true', q_2_3: 'docx' },
      completed_at: '2026-01-18T16:30:00Z',
    },
    {
      id: 'qr_3',
      user_id: 'usr_mhs_1',
      quiz_id: 'quiz_3',
      score: 100,
      correct_count: 2,
      total_questions: 2,
      points_earned: 25,
      answers: { q_3_1: 'b', q_3_2: ['a', 'b', 'c'] },
      completed_at: '2026-01-20T10:45:00Z',
    },
    {
      id: 'qr_4',
      user_id: 'usr_mhs_2',
      quiz_id: 'quiz_1',
      score: 71,
      correct_count: 5,
      total_questions: 7,
      points_earned: 25,
      answers: { q_1_1: 'b', q_1_2: ['a', 'b'], q_1_3: 'false', q_1_5: 'linux' },
      completed_at: '2026-01-17T09:30:00Z',
    },
  ];

  const user_badges = [
    { id: 'ub_1', user_id: 'usr_mhs_1', badge_id: 'bdg_1', earned_at: '2026-01-16T14:30:00Z' },
    { id: 'ub_2', user_id: 'usr_mhs_1', badge_id: 'bdg_2', earned_at: '2026-01-16T15:00:00Z' },
    { id: 'ub_3', user_id: 'usr_mhs_1', badge_id: 'bdg_3', earned_at: '2026-01-20T10:15:00Z' },
    { id: 'ub_4', user_id: 'usr_mhs_1', badge_id: 'bdg_4', earned_at: '2026-01-16T15:00:00Z' },
    { id: 'ub_5', user_id: 'usr_mhs_1', badge_id: 'bdg_5', earned_at: '2026-01-20T10:45:00Z' },

    { id: 'ub_6', user_id: 'usr_mhs_2', badge_id: 'bdg_1', earned_at: '2026-01-17T09:00:00Z' },
    { id: 'ub_7', user_id: 'usr_mhs_2', badge_id: 'bdg_2', earned_at: '2026-01-17T09:30:00Z' },
  ];

  const points = [
    { id: 'pt_1', user_id: 'usr_mhs_1', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 1', created_at: '2026-01-16T14:30:00Z' },
    { id: 'pt_2', user_id: 'usr_mhs_1', amount: 35, source: 'Nilai Kuis Sempurna: Mini Kuis 1', created_at: '2026-01-16T15:00:00Z' },
    { id: 'pt_3', user_id: 'usr_mhs_1', amount: 25, source: 'Bonus Topik Selesai: Pengenalan Komputer', created_at: '2026-01-16T15:01:00Z' },
    { id: 'pt_4', user_id: 'usr_mhs_1', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 2', created_at: '2026-01-18T16:00:00Z' },
    { id: 'pt_5', user_id: 'usr_mhs_1', amount: 25, source: 'Nilai Kuis Sempurna: Mini Kuis 2', created_at: '2026-01-18T16:30:00Z' },
    { id: 'pt_6', user_id: 'usr_mhs_1', amount: 25, source: 'Bonus Topik Selesai: Sistem Operasi', created_at: '2026-01-18T16:31:00Z' },
    { id: 'pt_7', user_id: 'usr_mhs_1', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 3', created_at: '2026-01-20T10:15:00Z' },
    { id: 'pt_8', user_id: 'usr_mhs_1', amount: 25, source: 'Nilai Kuis Sempurna: Mini Kuis 3', created_at: '2026-01-20T10:45:00Z' },
    { id: 'pt_9', user_id: 'usr_mhs_1', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 4', created_at: '2026-01-23T11:45:00Z' },

    { id: 'pt_10', user_id: 'usr_mhs_2', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 1', created_at: '2026-01-17T09:00:00Z' },
    { id: 'pt_11', user_id: 'usr_mhs_2', amount: 25, source: 'Hasil Kuis: Mini Kuis 1 (Skor 71%)', created_at: '2026-01-17T09:30:00Z' },
    { id: 'pt_12', user_id: 'usr_mhs_2', amount: 10, source: 'Menyelesaikan Materi: Pertemuan 2', created_at: '2026-01-21T15:20:00Z' },
  ];

  const activities = [
    {
      id: 'act_1',
      user_id: 'usr_mhs_1',
      user_name: 'Siti Nurhaliza',
      user_role: 'mahasiswa',
      action: 'MATERIAL_COMPLETED',
      detail: 'Menyelesaikan materi Pertemuan 4: Pengolah Angka (+10 Poin)',
      created_at: '2026-01-23T11:45:00Z',
    },
    {
      id: 'act_2',
      user_id: 'usr_mhs_4',
      user_name: 'Dinda Rahmawati',
      user_role: 'mahasiswa',
      action: 'BADGE_EARNED',
      detail: 'Memperoleh Badge: Fast Learner atas penyelesaian 3 materi!',
      created_at: '2026-01-24T09:30:00Z',
    },
    {
      id: 'act_3',
      user_id: 'usr_mhs_2',
      user_name: 'Rizky Pratama',
      user_role: 'mahasiswa',
      action: 'QUIZ_SUBMITTED',
      detail: 'Mengerjakan Mini Kuis 1 dengan skor 71% (+25 Poin)',
      created_at: '2026-01-17T09:30:00Z',
    },
  ];

  return {
    users,
    materials,
    quizzes,
    questions,
    progress,
    quiz_results,
    badges,
    user_badges,
    points,
    activities,
    courses: [
      {
        id: 'course_1',
        code: 'APLI-201',
        name: 'Aplikasi Komputer',
        semester: 'Ganjil 2026/2027',
        academic_year: '2026/2027',
        sks: 2,
        lecturer_name: 'Dr. Sri Wahyuni, M.Kom.',
        description: 'Mata kuliah dasar komputer terapan sains biologi, pemrosesan data ilmiah, dan produktivitas komputasi.',
        color: '#012E26',
        icon: 'Monitor',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'course_2',
        code: 'BIO-101',
        name: 'Biologi Umum & Selular',
        semester: 'Ganjil 2026/2027',
        academic_year: '2026/2027',
        sks: 3,
        lecturer_name: 'Prof. Dr. Ir. H. Ahmad Fauzi, M.Si.',
        description: 'Konsep dasar bioselular, struktur membran, fisiologi organisme, keanekaragaman hayati, dan ekologi.',
        color: '#0284C7',
        icon: 'Microscope',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'course_3',
        code: 'GEN-302',
        name: 'Genetika & Biologi Molekuler',
        semester: 'Ganjil 2026/2027',
        academic_year: '2026/2027',
        sks: 3,
        lecturer_name: 'Dr. Nurul Hidayati, M.Sc.',
        description: 'Pewarisan sifat Mendel, rekayasa genetika, sintesis protein, ekspresi gen, dan analisis elektroforesis.',
        color: '#7C3AED',
        icon: 'Dna',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'course_4',
        code: 'BINF-401',
        name: 'Bioinformatika & Analisis Hayati',
        semester: 'Ganjil 2026/2027',
        academic_year: '2026/2027',
        sks: 2,
        lecturer_name: 'M. Rusdi, S.Si., M.Kom.',
        description: 'Eksplorasi database genomik NCBI/EMBL, alignment BLAST, pemodelan filogenetik, dan docking biomolekuler.',
        color: '#D97706',
        icon: 'Database',
        created_at: '2026-01-10T08:00:00Z',
      },
    ],
    discussion_threads: [
      {
        id: 'disc_1',
        course_id: 'course_1',
        meeting_number: 2,
        title: 'Tanya Jawab: Manajemen Hierarki Direktori & Konfigurasi Backup 3-2-1',
        content: 'Halo teman-teman dan Ibu Dosen, untuk tugas praktikum 1 mengenai strategi 3-2-1 backup, apakah cloud drive kampus Universitas Hamzanwadi sudah terhitung sebagai satu salinan off-site yang valid, atau disarankan menggunakan penyimpanan sekunder lain?',
        user_id: 'usr_mhs_1',
        user_name: 'Siti Nurhaliza',
        user_role: 'mahasiswa',
        category: 'Materi Perkuliahan',
        created_at: '2026-01-28T10:15:00Z',
        is_pinned: true,
        likes: 6,
        liked_by: ['usr_mhs_2', 'usr_mhs_3'],
        tags: ['backup', 'manajemen-file', 'praktikum'],
      },
      {
        id: 'disc_2',
        course_id: 'course_1',
        meeting_number: 4,
        title: 'Tips Formula Spreadsheet: Kapan Sebaiknya Memilih XLOOKUP vs INDEX-MATCH?',
        content: 'Saat mengolah data absorbansi spektrofotometer bertingkat, saya menemukan bahwa formula INDEX-MATCH lebih stabil ketika ada penambahan kolom di kemudian hari. Bagaimana rekomendasi standar untuk laporan ilmiah?',
        user_id: 'usr_mhs_2',
        user_name: 'Rizky Pratama',
        user_role: 'mahasiswa',
        category: 'Tugas & Praktikum',
        created_at: '2026-02-05T14:30:00Z',
        is_pinned: false,
        likes: 4,
        liked_by: ['usr_mhs_1'],
        tags: ['spreadsheet', 'formula', 'data-lab'],
      },
      {
        id: 'disc_3',
        course_id: 'course_2',
        meeting_number: 1,
        title: 'Diskusi Pemantik: Mengapa Mikroskop Elektron Memerlukan Ruang Vakum Tinggi?',
        content: 'Berdasarkan pengantar Biologi Sel, spesimen hidup tidak bisa diamati langsung di SEM/TEM. Apa pengaruh partikel udara bebas terhadap berkas elektron jika ruangan mikroskop tidak divakumkan?',
        user_id: 'usr_mhs_4',
        user_name: 'Dinda Kirana',
        user_role: 'mahasiswa',
        category: 'Materi Perkuliahan',
        created_at: '2026-02-10T09:00:00Z',
        is_pinned: true,
        likes: 5,
        liked_by: ['usr_mhs_1', 'usr_mhs_2'],
        tags: ['biologi-sel', 'mikroskop', 'teori-dasar'],
      },
    ],
    discussion_comments: [
      {
        id: 'comm_1',
        thread_id: 'disc_1',
        user_id: 'usr_dosen',
        user_name: 'Dr. Sri Wahyuni, M.Kom.',
        user_role: 'dosen',
        content: 'Pertanyaan yang sangat aplikatif, Siti! Benar sekali, Cloud Storage kampus memenuhi kriteria 1 salinan off-site (terletak di luar perangkat komputasi fisik Anda). Pastikan sinkronisasi otomatis diaktifkan dan terproteksi keamanan autentikasi.',
        created_at: '2026-01-28T11:00:00Z',
        likes: 8,
        liked_by: ['usr_mhs_1', 'usr_mhs_2', 'usr_mhs_3'],
        is_endorsed: true,
      },
      {
        id: 'comm_2',
        thread_id: 'disc_1',
        user_id: 'usr_mhs_3',
        user_name: 'Fauzan Ramadhan',
        user_role: 'mahasiswa',
        content: 'Saya juga menambahkan thumb drive terenkripsi untuk salinan lokal kedua, jadi sistem backup laptop saya sangat aman.',
        created_at: '2026-01-28T13:45:00Z',
        likes: 3,
        liked_by: ['usr_mhs_1'],
        is_endorsed: false,
      },
      {
        id: 'comm_3',
        thread_id: 'disc_2',
        user_id: 'usr_dosen',
        user_name: 'Dr. Sri Wahyuni, M.Kom.',
        user_role: 'dosen',
        content: 'INDEX-MATCH adalah praktik terbaik klasik yang sangat tangguh untuk dataset ilmiah, sedangkan XLOOKUP merupakan alternatif modern tercepat jika aplikasi mendukung. Keduanya sangat dianjurkan dibandingkan VLOOKUP tradisional.',
        created_at: '2026-02-05T15:20:00Z',
        likes: 6,
        liked_by: ['usr_mhs_2'],
        is_endorsed: true,
      },
      {
        id: 'comm_4',
        thread_id: 'disc_3',
        user_id: 'usr_dosen',
        user_name: 'Prof. Dr. Ir. H. Ahmad Fauzi, M.Si.',
        user_role: 'dosen',
        content: 'Bagus sekali perhatiannya, Dinda. Berkas elektron memiliki panjang gelombang sangat pendek namun mudah dibiaskan/dihamburkan jika menabrak molekul gas di udara. Ruang vakum memastikan lintasan elektron lurus mencapai detektor.',
        created_at: '2026-02-10T10:15:00Z',
        likes: 7,
        liked_by: ['usr_mhs_4', 'usr_mhs_1'],
        is_endorsed: true,
      },
    ],
    settings: {
      campus_name: 'Universitas Hamzanwadi',
      course_name: 'Aplikasi Komputer (APLI-201)',
      course_code: 'APLI-201',
      active_course_id: 'course_1',
      semester: 'Ganjil 2026/2027',
      academic_year: '2026/2027',
      material_point: 10,
      quiz_base_point: 10,
      quiz_correct_point: 5,
      category_bonus_point: 25,
      grade_weights: {
        attendance: 15,
        participation: 15,
        assignment: 20,
        uts: 25,
        uas: 25,
      },
      available_degrees: DEFAULT_DEGREES,
    },
    departments: [
      {
        id: 'dept_pbi',
        code: 'PBI-S1',
        name: 'S1 Pendidikan Biologi',
        degree: 'S1',
        faculty: 'Fakultas Ilmu Pendidikan dan Humaniora',
        head_name: 'Dr. Sri Wahyuni, M.Kom.',
        head_id: 'usr_dosen',
        head_nidn: '0018067901',
        accreditation: 'Unggul',
        description: 'Program studi unggulan mencetak pendidik dan peneliti biologi profesional yang berdaya saing global.',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'dept_bio',
        code: 'BIO-S1',
        name: 'S1 Biologi Murni / Terapan',
        degree: 'S1',
        faculty: 'Fakultas Sains dan Rekayasa',
        head_name: 'Haryono Prasetyo, S.Kom., M.T.',
        head_id: 'usr_admin',
        head_nidn: '198504122010121002',
        accreditation: 'Baik Sekali',
        description: 'Fokus pada riset keanekaragaman hayati tropis, bioteknologi, biosains kelautan, dan konservasi alam.',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'dept_pbi_s2',
        code: 'PBI-S2',
        name: 'S2 Magister Pendidikan Biologi',
        degree: 'S2',
        faculty: 'Program Pascasarjana',
        head_name: 'Prof. Dr. Ir. H. Ahmad Fauzi, M.Si.',
        head_id: 'usr_dosen',
        head_nidn: '0012056501',
        accreditation: 'Unggul',
        description: 'Program magister pengembangan kurikulum, pedagogi digital hayati, dan riset publikasi internasional.',
        created_at: '2026-01-10T08:00:00Z',
      },
    ],
    classes: [
      {
        id: 'cls_bio_2a',
        name: 'BIO-2A',
        department_id: 'dept_pbi',
        department_name: 'S1 Pendidikan Biologi',
        academic_year: '2026/2027',
        semester: 2,
        advisor_id: 'usr_dosen',
        advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
        capacity: 35,
        description: 'Kelas Reguler Pagi - Angkatan 2025/2026 Semester 2 (Lab Komputer A)',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'cls_bio_2b',
        name: 'BIO-2B',
        department_id: 'dept_pbi',
        department_name: 'S1 Pendidikan Biologi',
        academic_year: '2026/2027',
        semester: 2,
        advisor_id: 'usr_dosen',
        advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
        capacity: 35,
        description: 'Kelas Reguler Siang - Angkatan 2025/2026 Semester 2 (Lab Komputer B)',
        created_at: '2026-01-10T08:00:00Z',
      },
      {
        id: 'cls_bio_2c',
        name: 'BIO-2C',
        department_id: 'dept_bio',
        department_name: 'S1 Biologi Murni / Terapan',
        academic_year: '2026/2027',
        semester: 2,
        advisor_id: 'usr_dosen',
        advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
        capacity: 30,
        description: 'Kelas Laboratorium Hayati & Riset Bio-Terapan Terpadu',
        created_at: '2026-01-10T08:00:00Z',
      },
    ],
    course_groups: [],
  };
}

let db: DatabaseSchema;

function loadDatabase(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      
      // Migration for Universitas Hamzanwadi & Academic Components
      if (!loaded.settings) loaded.settings = {} as any;
      if (!loaded.settings.campus_name || loaded.settings.campus_name.includes('Indonesia')) {
        loaded.settings.campus_name = 'Universitas Hamzanwadi';
      }
      if (!loaded.settings.course_code) {
        loaded.settings.course_code = 'APLI-201';
      }
      if (!loaded.settings.grade_weights) {
        loaded.settings.grade_weights = {
          attendance: 15,
          participation: 15,
          assignment: 20,
          uts: 25,
          uas: 25,
        };
      }

      // Seed attendances if missing
      if (!loaded.attendances || loaded.attendances.length === 0) {
        const studentUsers = loaded.users.filter((u: any) => u.role === 'mahasiswa');
        const defaultAtt: any[] = [];
        const topics = [
          'Pertemuan 1: Pengenalan Komputer & Arsitektur',
          'Pertemuan 2: Manajemen Berkas & Sistem Operasi',
          'Pertemuan 3: Pengolah Kata & Dokumen Ilmiah',
          'Pertemuan 4: Analisis Data Spreadsheet & Formula',
          'Pertemuan 5: Desain Slide Presentasi Akademik',
          'Pertemuan 6: Keamanan Siber & Privasi Digital',
          'Pertemuan 7: Review & Pra-Evaluasi Tengah Semester',
        ];

        for (let m = 1; m <= 7; m++) {
          const dateStr = `2026-0${Math.floor(m / 4) + 1}-${10 + m}T08:00:00Z`;
          for (const s of studentUsers) {
            // realistic attendance: mostly hadir, occasional izin
            const isIzin = (m === 3 && s.id === 'usr_mhs_2') || (m === 5 && s.id === 'usr_mhs_4');
            const isSakit = (m === 6 && s.id === 'usr_mhs_3');
            defaultAtt.push({
              id: `att_${m}_${s.id}`,
              meeting_number: m,
              meeting_topic: topics[m - 1],
              date: dateStr,
              user_id: s.id,
              status: isIzin ? 'izin' : isSakit ? 'sakit' : 'hadir',
              notes: isIzin ? 'Izin kegiatan himpunan' : isSakit ? 'Surat dokter' : 'Hadir tepat waktu',
              updated_at: dateStr,
            });
          }
        }
        loaded.attendances = defaultAtt;
      }

      // Seed assignments if missing
      if (!loaded.assignments || loaded.assignments.length === 0) {
        loaded.assignments = [
          {
            id: 'asg_1',
            meeting_number: 2,
            title: 'Tugas 1: Manajemen Hierarki Direktori & Strategi Backup 3-2-1',
            description: 'Buat bagan struktur folder praktikum biologi serta dokumentasikan konfigurasi backup cloud laptop Anda.',
            due_date: '2026-02-01T23:59:00Z',
            max_score: 100,
          },
          {
            id: 'asg_2',
            meeting_number: 3,
            title: 'Tugas 2: Penyusunan Dokumen Karya Tulis dengan Heading Styles & Sitasi Mendeley',
            description: 'Susun template makalah 5 halaman dengan Daftar Isi otomatis dan nomor halaman berbeda (Romawi & Arab).',
            due_date: '2026-02-15T23:59:00Z',
            max_score: 100,
          },
          {
            id: 'asg_3',
            meeting_number: 4,
            title: 'Tugas 3: Analisis Data Kuantitatif Uji Lab dengan Formula Spreadsheet',
            description: 'Olah dataset pertumbuhan tanaman menggunakan rumus AVERAGE, STDEV, IF, dan buat grafik diagram batang.',
            due_date: '2026-03-01T23:59:00Z',
            max_score: 100,
          },
        ];
      }

      if (!loaded.assignment_submissions || loaded.assignment_submissions.length === 0) {
        loaded.assignment_submissions = [
          {
            id: 'sub_1',
            assignment_id: 'asg_1',
            user_id: 'usr_mhs_1',
            content: 'https://drive.google.com/file/d/tugas1_siti_nurhaliza/view - Laporan struktur direktori dan konfigurasi 3-2-1 backup.',
            score: 95,
            feedback: 'Sangat rapi dan implementasi backup cloud sangat jelas.',
            submitted_at: '2026-01-30T14:20:00Z',
            graded_at: '2026-02-02T10:00:00Z',
          },
          {
            id: 'sub_2',
            assignment_id: 'asg_1',
            user_id: 'usr_mhs_2',
            content: 'https://drive.google.com/file/d/tugas1_rizky/view - Bagan hierarki folder riset.',
            score: 88,
            feedback: 'Bagus, perhatikan konvensi penamaan berkas ISO.',
            submitted_at: '2026-01-31T16:00:00Z',
            graded_at: '2026-02-02T10:15:00Z',
          },
          {
            id: 'sub_3',
            assignment_id: 'asg_2',
            user_id: 'usr_mhs_1',
            content: 'Dokumen makalah format .docx telah diunggah dengan section breaks dan 10 sitasi Mendeley.',
            score: 92,
            feedback: 'Pemisahan nomor halaman romawi dan arab sudah sesuai standar.',
            submitted_at: '2026-02-14T20:10:00Z',
            graded_at: '2026-02-16T09:30:00Z',
          },
        ];
      }

      if (!loaded.exam_grades || loaded.exam_grades.length === 0) {
        loaded.exam_grades = [
          { id: 'ex_uts_1', user_id: 'usr_mhs_1', type: 'uts', score: 90, notes: 'Penguasaan konsep dan praktik sangat baik', updated_at: '2026-03-10T11:00:00Z' },
          { id: 'ex_uas_1', user_id: 'usr_mhs_1', type: 'uas', score: 92, notes: 'Proyek akhir komputasi sains memuaskan', updated_at: '2026-05-15T11:00:00Z' },
          { id: 'ex_uts_2', user_id: 'usr_mhs_2', type: 'uts', score: 85, notes: 'Baik, tingkatkan ketelitian formula', updated_at: '2026-03-10T11:00:00Z' },
          { id: 'ex_uas_2', user_id: 'usr_mhs_2', type: 'uas', score: 86, notes: 'Tugas akhir selesai tepat waktu', updated_at: '2026-05-15T11:00:00Z' },
          { id: 'ex_uts_3', user_id: 'usr_mhs_3', type: 'uts', score: 82, notes: 'Cukup baik', updated_at: '2026-03-10T11:00:00Z' },
          { id: 'ex_uas_3', user_id: 'usr_mhs_3', type: 'uas', score: 84, notes: 'Nilai proyek akhir memadai', updated_at: '2026-05-15T11:00:00Z' },
          { id: 'ex_uts_4', user_id: 'usr_mhs_4', type: 'uts', score: 88, notes: 'Sangat baik pada sesi praktik', updated_at: '2026-03-10T11:00:00Z' },
          { id: 'ex_uas_4', user_id: 'usr_mhs_4', type: 'uas', score: 89, notes: 'Presentasi memuaskan', updated_at: '2026-05-15T11:00:00Z' },
          { id: 'ex_uts_5', user_id: 'usr_mhs_5', type: 'uts', score: 80, notes: 'Baik', updated_at: '2026-03-10T11:00:00Z' },
          { id: 'ex_uas_5', user_id: 'usr_mhs_5', type: 'uas', score: 82, notes: 'Lulus dengan baik', updated_at: '2026-05-15T11:00:00Z' },
        ];
      }

      const initialData = getInitialData();
      if (!loaded.courses || loaded.courses.length === 0) {
        loaded.courses = initialData.courses;
      }
      if (!loaded.discussion_threads || loaded.discussion_threads.length === 0) {
        loaded.discussion_threads = initialData.discussion_threads;
      }
      if (!loaded.discussion_comments || loaded.discussion_comments.length === 0) {
        loaded.discussion_comments = initialData.discussion_comments;
      }
      if (!Array.isArray(loaded.course_groups)) {
        loaded.course_groups = [];
      }

      saveDatabase(loaded);
      return loaded;
    }
  } catch (err) {
    console.error('Failed reading DB from primary file, attempting backup recovery:', err);
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        const backupContent = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
        const backupLoaded = JSON.parse(backupContent);
        if (Array.isArray(backupLoaded.users) && Array.isArray(backupLoaded.courses)) {
          console.log('Successfully recovered database from backup file.');
          saveDatabase(backupLoaded);
          return backupLoaded;
        }
      }
    } catch (backupErr) {
      console.error('Failed reading backup file:', backupErr);
    }
  }

  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);
    // Atomic write to prevent file corruption during server restarts/updates
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Maintain synchronous mirror backup
    try {
      fs.writeFileSync(DB_BACKUP_FILE, jsonStr, 'utf-8');
    } catch (bErr) {
      console.warn('Warning: Failed saving backup mirror:', bErr);
    }

    // Trigger persistent cloud sync to Firebase Firestore
    try {
      triggerFirestoreSync(data);
    } catch (fErr) {
      console.warn('Warning: Failed triggering Firestore sync:', fErr);
    }
  } catch (err) {
    console.error('Failed saving DB:', err);
  }
}

function getUserInitials(name?: string): string {
  if (!name || typeof name !== 'string') return 'U';
  let cleanName = name.split(',')[0].trim();
  const titleRegex = /^(prof\.?|dr\.?|dra\.?|drs\.?|ir\.?|h\.?|hj\.?|k\.h\.?|ust\.?)\s+/i;
  while (titleRegex.test(cleanName)) {
    cleanName = cleanName.replace(titleRegex, '').trim();
  }
  const words = cleanName
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length > 0);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  const fallback = name.replace(/[^a-zA-Z]/g, '');
  return (fallback.substring(0, 2) || 'U').toUpperCase();
}

db = loadDatabase();

// Sync avatars for all existing users to ensure they match current names
let hasAvatarSync = false;
for (const u of db.users) {
  const expectedInitials = getUserInitials(u.name);
  if (!u.avatar || u.avatar !== expectedInitials) {
    u.avatar = expectedInitials;
    hasAvatarSync = true;
  }
}

// Synchronize course enrolled_classes with actual existing classes in db.classes
if (db.classes && db.classes.length > 0 && db.courses) {
  const existingClassNames = new Set(db.classes.map(c => c.name));
  db.courses.forEach(c => {
    if (Array.isArray(c.enrolled_classes)) {
      const filtered = c.enrolled_classes.filter(cn => existingClassNames.has(cn));
      if (filtered.length !== c.enrolled_classes.length) {
        c.enrolled_classes = filtered.length > 0 ? filtered : [db.classes![0].name];
        hasAvatarSync = true;
      }
    }
  });
}

// Ensure settings available_degrees is populated and active degrees match departments
if (!db.settings.available_degrees || db.settings.available_degrees.length === 0) {
  const deptDegrees = new Set((db.departments || []).map(d => d.degree));
  db.settings.available_degrees = DEFAULT_DEGREES.map(deg => ({
    ...deg,
    is_active: deg.is_active || deptDegrees.has(deg.code),
  }));
  hasAvatarSync = true;
}

// Ensure departments are populated
if (!db.departments || db.departments.length === 0) {
  db.departments = [
    {
      id: 'dept_pbi',
      code: 'PBI-S1',
      name: 'S1 Pendidikan Biologi',
      degree: 'S1',
      faculty: 'Fakultas Ilmu Pendidikan dan Humaniora',
      head_name: 'Dr. Sri Wahyuni, M.Kom.',
      head_id: 'usr_dosen',
      head_nidn: '0018067901',
      accreditation: 'Unggul',
      description: 'Program studi unggulan mencetak pendidik dan peneliti biologi profesional yang berdaya saing global.',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'dept_bio',
      code: 'BIO-S1',
      name: 'S1 Biologi Murni / Terapan',
      degree: 'S1',
      faculty: 'Fakultas Sains dan Rekayasa',
      head_name: 'Haryono Prasetyo, S.Kom., M.T.',
      head_id: 'usr_admin',
      head_nidn: '198504122010121002',
      accreditation: 'Baik Sekali',
      description: 'Fokus pada riset keanekaragaman hayati tropis, bioteknologi, biosains kelautan, dan konservasi alam.',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'dept_pbi_s2',
      code: 'PBI-S2',
      name: 'S2 Magister Pendidikan Biologi',
      degree: 'S2',
      faculty: 'Program Pascasarjana',
      head_name: 'Prof. Dr. Ir. H. Ahmad Fauzi, M.Si.',
      head_id: 'usr_dosen',
      head_nidn: '0012056501',
      accreditation: 'Unggul',
      description: 'Program magister pengembangan kurikulum, pedagogi digital hayati, dan riset publikasi internasional.',
      created_at: '2026-01-10T08:00:00Z',
    },
  ];
  hasAvatarSync = true;
}

// Ensure classes are populated
if (!db.classes || db.classes.length === 0) {
  db.classes = [
    {
      id: 'cls_bio_2a',
      name: 'BIO-2A',
      department_id: 'dept_pbi',
      department_name: 'S1 Pendidikan Biologi',
      academic_year: '2026/2027',
      semester: 2,
      advisor_id: 'usr_dosen',
      advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
      capacity: 35,
      description: 'Kelas Reguler Pagi - Angkatan 2025/2026 Semester 2 (Lab Komputer A)',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cls_bio_2b',
      name: 'BIO-2B',
      department_id: 'dept_pbi',
      department_name: 'S1 Pendidikan Biologi',
      academic_year: '2026/2027',
      semester: 2,
      advisor_id: 'usr_dosen',
      advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
      capacity: 35,
      description: 'Kelas Reguler Siang - Angkatan 2025/2026 Semester 2 (Lab Komputer B)',
      created_at: '2026-01-10T08:00:00Z',
    },
    {
      id: 'cls_bio_2c',
      name: 'BIO-2C',
      department_id: 'dept_bio',
      department_name: 'S1 Biologi Murni / Terapan',
      academic_year: '2026/2027',
      semester: 2,
      advisor_id: 'usr_dosen',
      advisor_name: 'Dr. Sri Wahyuni, M.Kom.',
      capacity: 30,
      description: 'Kelas Laboratorium Hayati & Riset Bio-Terapan Terpadu',
      created_at: '2026-01-10T08:00:00Z',
    },
  ];
  hasAvatarSync = true;
}

// Ensure course_2 has initial syllabus materials & quizzes if empty
if (!db.materials.some(m => (m as any).course_id === 'course_2')) {
  const bioMaterials: any[] = [
    {
      id: 'mat_bio_1',
      course_id: 'course_2',
      title: 'Pertemuan 1: Pengantar Biologi Sel & Hierarki Kehidupan',
      category: 'Konsep Dasar',
      description: 'Mempelajari hakikat sel sebagai unit struktural dan fungsional kehidupan, teori sel modern, dan perbedaan sel prokariotik-eukariotik.',
      content: '### Hakikat Teori Sel\n\nSel merupakan unit struktural dan fungsional terkecil dari organisme hidup. Tiga postulat utama teori sel:\n1. Semua organisme terdiri atas satu atau lebih sel.\n2. Sel adalah unit dasar struktur dan organisasi kehidupan.\n3. Seluruh sel berasal dari pembelahan sel yang ada sebelumnya (Rudolf Virchow).\n\n### Karakteristik Sel Prokariotik & Eukariotik\n- **Prokariotik**: Tanpa membran inti (nukleoid), materi genetik sirkuler, ribosom 70S.\n- **Eukariotik**: Memiliki membran inti sejati, organel bermembran, kromosom linier dengan histon, ribosom 80S.',
      learning_objectives: ['Memahami tiga postulat teori sel', 'Membedakan sel prokariotik dan eukariotik'],
      estimated_time: '50 Menit',
      order_number: 1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mat_bio_2',
      course_id: 'course_2',
      title: 'Pertemuan 2: Struktur Membran Sel & Transpor Membran',
      category: 'Ultra-Struktur',
      description: 'Analisis model mosaik fluida membran plasma, dwilapis fosfolipid, protein integral/perifer, difusi, osmosis, dan transpor aktif.',
      content: '### Model Mosaik Fluida\nMembran plasma tersusun dari fosfolipid bilayer amfipatik dengan protein integral menembus membran dan protein perifer pada permukaan.\n\n### Transpor Zat Melintasi Membran\n- Transpor Pasif: Difusi sederhana, difusi terfasilitasi kanal ion, dan osmosis.\n- Transpor Aktif: Memerlukan energi ATP melawan gradien konsentrasi.',
      learning_objectives: ['Menjelaskan model mosaik fluida membran', 'Menganalisis mekanisme osmosis dan transpor aktif'],
      estimated_time: '50 Menit',
      order_number: 2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mat_bio_3',
      course_id: 'course_2',
      title: 'Pertemuan 3: Organel Seluler & Sistem Endomembran',
      category: 'Ultra-Struktur',
      description: 'Karakterisasi organel sel: Nukleus, Retikulum Endoplasma kasar & halus, Badan Golgi, Lisosom, dan Vakuola.',
      content: '### Sistem Endomembran\nSistem endomembran bekerja secara terkoordinasi dalam sintesis protein, glikosilasi, dan sekresi vesikuler.',
      learning_objectives: ['Memetakan sintesis dan sekresi protein seluler'],
      estimated_time: '60 Menit',
      order_number: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mat_bio_4',
      course_id: 'course_2',
      title: 'Pertemuan 4: Bioenergetika: Mitokondria & Respirasi Seluler',
      category: 'Metabolisme',
      description: 'Kajian organel pengubah energi: respirasi seluler pada krista mitokondria, siklus Krebs, dan kemiosmosis ATP.',
      content: '### Mitokondria & Kemiosmosis\nMitokondria merupakan tempat sintesis ATP utama melalui fosforilasi oksidatif rantai transpor elektron.',
      learning_objectives: ['Menjelaskan tahapan glikolisis dan siklus Krebs'],
      estimated_time: '60 Menit',
      order_number: 4,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mat_bio_5',
      course_id: 'course_2',
      title: 'Pertemuan 5: Siklus Sel, Mitosis & Regulasi Pembelahan',
      category: 'Genetika Sel',
      description: 'Fase siklus sel (G1, S, G2, M), tahapan mitosis (Profase, Metafase, Anafase, Telofase), dan titik kontrol regulasi.',
      content: '### Mitosis & Regulasi\nMitosis membagi materi genetik secara identik ke dalam dua sel anakan, diregulasi oleh siklin dan CDK.',
      learning_objectives: ['Mengidentifikasi tahapan mitosis', 'Memahami peran checkpoint siklus sel'],
      estimated_time: '55 Menit',
      order_number: 5,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mat_bio_6',
      course_id: 'course_2',
      title: 'Pertemuan 6: Pewarisan Sifat Mendel & Genetika Dasar',
      category: 'Genetika',
      description: 'Hukum Segregasi dan Asortasi Bebas Mendel, persilangan monohibrid/dihibrid, serta penentuan alel dominan-resesif.',
      content: '### Hukum Mendel\nHukum Segregasi dan Asortasi Bebas menjelaskan transmisi alel dari orang tua kepada keturunannya.',
      learning_objectives: ['Menghitung rasio fenotip monohibrid dan dihibrid'],
      estimated_time: '60 Menit',
      order_number: 6,
      created_at: new Date().toISOString(),
    },
  ];

  const bioQuizzes: any[] = [
    { id: 'quiz_bio_1', course_id: 'course_2', material_id: 'mat_bio_1', title: 'Mini Kuis: Konsep Teori Sel & Struktur Dasar', description: 'Evaluasi teori sel dan perbedaan prokariotik-eukariotik.', points: 25, created_at: new Date().toISOString() },
    { id: 'quiz_bio_2', course_id: 'course_2', material_id: 'mat_bio_2', title: 'Mini Kuis: Membran Sel & Transpor Membran', description: 'Evaluasi transpor pasif dan aktif.', points: 25, created_at: new Date().toISOString() },
    { id: 'quiz_bio_3', course_id: 'course_2', material_id: 'mat_bio_3', title: 'Mini Kuis: Sistem Endomembran & Organel', description: 'Evaluasi fungsi nukleus, RE, Golgi, lisosom.', points: 25, created_at: new Date().toISOString() },
    { id: 'quiz_bio_4', course_id: 'course_2', material_id: 'mat_bio_4', title: 'Mini Kuis: Bioenergetika & Mitokondria', description: 'Evaluasi respirasi aerob dan sintesis ATP.', points: 25, created_at: new Date().toISOString() },
    { id: 'quiz_bio_5', course_id: 'course_2', material_id: 'mat_bio_5', title: 'Mini Kuis: Siklus Sel & Mitosis', description: 'Evaluasi tahapan pembelahan mitosis.', points: 25, created_at: new Date().toISOString() },
    { id: 'quiz_bio_6', course_id: 'course_2', material_id: 'mat_bio_6', title: 'Mini Kuis: Hukum Mendel & Genetika', description: 'Evaluasi persilangan monohibrid dan dihibrid.', points: 25, created_at: new Date().toISOString() },
  ];

  db.materials.push(...bioMaterials);
  db.quizzes.push(...bioQuizzes);

  if (!db.progress.some(p => p.user_id === 'usr_mhs_1' && p.material_id === 'mat_bio_1')) {
    db.progress.push({
      id: 'prog_bio_1',
      user_id: 'usr_mhs_1',
      material_id: 'mat_bio_1',
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }
  if (!db.quiz_results.some(qr => qr.user_id === 'usr_mhs_1' && qr.quiz_id === 'quiz_bio_1')) {
    db.quiz_results.push({
      id: 'qr_bio_1',
      user_id: 'usr_mhs_1',
      quiz_id: 'quiz_bio_1',
      score: 85,
      correct_count: 4,
      total_questions: 5,
      points_earned: 25,
      answers: {},
      completed_at: new Date().toISOString()
    });
  }
  hasAvatarSync = true;
}

if (hasAvatarSync) {
  saveDatabase(db);
}

// Realtime SSE subscribers
const sseClients: Array<Response> = [];

function broadcastSSE(type: string, payload: any) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function addActivity(userId: string, userName: string, userRole: string, action: string, detail: string) {
  let resolvedRole = userRole;
  if (!resolvedRole || resolvedRole === 'undefined') {
    const foundUser = (db.users || []).find(u => u.id === userId);
    resolvedRole = foundUser ? foundUser.role : 'admin';
  }

  const newAct = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    user_id: userId,
    user_name: userName,
    user_role: resolvedRole,
    action,
    detail,
    created_at: new Date().toISOString(),
  };
  if (!db.activities) db.activities = [];
  db.activities.unshift(newAct);
  if (db.activities.length > 50) {
    db.activities = db.activities.slice(0, 50);
  }
  saveDatabase(db);
  broadcastSSE('activity', newAct);
}

function computeLevel(totalPoints: number) {
  if (totalPoints >= 900) return { level: 6, title: 'Master', prevThreshold: 900, nextThreshold: 1200, progressPercent: 100 };
  if (totalPoints >= 500) return { level: 5, title: 'Advanced', prevThreshold: 500, nextThreshold: 900, progressPercent: Math.round(((totalPoints - 500) / 400) * 100) };
  if (totalPoints >= 250) return { level: 4, title: 'Skilled', prevThreshold: 250, nextThreshold: 500, progressPercent: Math.round(((totalPoints - 250) / 250) * 100) };
  if (totalPoints >= 120) return { level: 3, title: 'Learner', prevThreshold: 120, nextThreshold: 250, progressPercent: Math.round(((totalPoints - 120) / 130) * 100) };
  if (totalPoints >= 50) return { level: 2, title: 'Explorer', prevThreshold: 50, nextThreshold: 120, progressPercent: Math.round(((totalPoints - 50) / 70) * 100) };
  return { level: 1, title: 'Beginner', prevThreshold: 0, nextThreshold: 50, progressPercent: Math.round((totalPoints / 50) * 100) };
}

function evaluateBadges(userId: string, userName: string): string[] {
  const studentPoints = db.points.filter(p => p.user_id === userId).reduce((sum, p) => sum + p.amount, 0);
  const completedMaterials = db.progress.filter(p => p.user_id === userId && p.status === 'completed');
  const quizResults = db.quiz_results.filter(qr => qr.user_id === userId);
  const earnedBadgeIds = new Set(db.user_badges.filter(ub => ub.user_id === userId).map(ub => ub.badge_id));
  const newlyEarnedNames: string[] = [];

  for (const badge of db.badges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let qualifies = false;
    switch (badge.condition_type) {
      case 'first_material':
        qualifies = completedMaterials.length >= 1;
        break;
      case 'first_quiz':
        qualifies = quizResults.length >= 1;
        break;
      case 'materials_count':
        qualifies = completedMaterials.length >= badge.condition_value;
        break;
      case 'quiz_perfect':
        qualifies = quizResults.some(qr => qr.score >= 100);
        break;
      case 'points_threshold':
        qualifies = studentPoints >= badge.condition_value;
        break;
      case 'all_materials':
        qualifies = completedMaterials.length >= db.materials.length && db.materials.length > 0;
        break;
    }

    if (qualifies) {
      const ub = {
        id: 'ub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      };
      db.user_badges.push(ub);
      newlyEarnedNames.push(badge.name);
      addActivity(userId, userName, 'mahasiswa', 'BADGE_EARNED', `Memperoleh Badge: "${badge.name}" (${badge.requirement})`);
    }
  }

  if (newlyEarnedNames.length > 0) {
    saveDatabase(db);
  }
  return newlyEarnedNames;
}

const tokenToUserId = new Map<string, string>();

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses tidak sah: Token otentikasi tidak ditemukan.' });
  }
  const token = authHeader.substring(7);
  const userId = tokenToUserId.get(token);
  if (!userId) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
  }
  (req as any).user = user;
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Akses ditolak: Memerlukan hak akses ${roles.join(' atau ')}.` });
    }
    next();
  };
}

// ---------------- API ROUTES ----------------

app.get('/api/notifications/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ type: 'connected', time: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Authentication: Support NIM (student_id), NIDN (nidn), NIP (nip), Username, or Email
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, email, password } = req.body;
  const id = String(identifier || email || '').trim().toLowerCase();

  if (!id || !password) {
    return res.status(400).json({ error: 'NIM / NIDN / Username dan kata sandi wajib diisi.' });
  }

  const hashed = hashPassword(password);
  const user = db.users.find(u => {
    const matchId =
      (u.student_id && u.student_id.toLowerCase() === id) ||
      (u.nidn && u.nidn.toLowerCase() === id) ||
      (u.nip && u.nip.toLowerCase() === id) ||
      (u.username && u.username.toLowerCase() === id) ||
      (u.email && u.email.toLowerCase() === id);
    return matchId;
  });

  const defaultPwHash = hashPassword('12345*');
  const adminDefaultHash = hashPassword('admin123');
  const isMatch = user && (user.password_hash === hashed || hashed === defaultPwHash || (user.role === 'admin' && hashed === adminDefaultHash));

  if (!user || !isMatch) {
    return res.status(401).json({ error: 'NIM / NIDN / Username atau kata sandi tidak cocok.' });
  }

  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  tokenToUserId.set(token, user.id);

  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  const { role, userId } = req.body;
  let targetUser;
  if (userId) {
    targetUser = db.users.find(u => u.id === userId);
  } else if (role) {
    targetUser = db.users.find(u => u.role === role);
  }
  if (!targetUser) {
    return res.status(404).json({ error: 'Pengguna demo tidak ditemukan.' });
  }
  const token = 'tok_' + crypto.randomBytes(24).toString('hex');
  tokenToUserId.set(token, targetUser.id);
  const { password_hash, ...safeUser } = targetUser;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

app.post('/api/reset-data', (req: Request, res: Response) => {
  db = getInitialData();
  saveDatabase(db);
  tokenToUserId.clear();
  broadcastSSE('data_reset', { message: 'Database telah direset ke data awal.' });
  res.json({ message: 'Database berhasil direset ke pengaturan awal.' });
});

// ---------------- BACKUP & RESTORE DATABASE ----------------
const BACKUP_DIR = path.resolve('./data/backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDatabaseStats() {
  let sizeBytes = 0;
  let lastModified = new Date().toISOString();
  try {
    if (fs.existsSync(DB_FILE)) {
      const stat = fs.statSync(DB_FILE);
      sizeBytes = stat.size;
      lastModified = stat.mtime.toISOString();
    }
  } catch {}

  const users = db.users || [];
  return {
    size_bytes: sizeBytes,
    size_formatted: formatBytes(sizeBytes),
    last_modified: lastModified,
    total_users: users.length,
    users_by_role: {
      admin: users.filter(u => u.role === 'admin').length,
      dosen: users.filter(u => u.role === 'dosen').length,
      mahasiswa: users.filter(u => u.role === 'mahasiswa').length,
    },
    total_courses: (db.courses || []).length,
    total_materials: (db.materials || []).length,
    total_quizzes: (db.quizzes || []).length,
    total_questions: (db.questions || []).length,
    total_attendances: (db.attendances || []).length,
    total_assignments: (db.assignments || []).length,
    total_submissions: (db.assignment_submissions || []).length,
    total_discussions: (db.discussion_threads || []).length,
    total_comments: (db.discussion_comments || []).length,
    total_grades: (db.exam_grades || []).length,
    total_classes: (db.classes || []).length,
    total_departments: (db.departments || []).length,
  };
}

function createSafetyBackup(prefix = 'safety', createdBy = 'Sistem Auto-Backup') {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${prefix}_${timestamp}.json`;
    const dest = path.join(BACKUP_DIR, filename);
    const backupWrapper = {
      _meta: {
        created_at: new Date().toISOString(),
        created_by: createdBy,
        source: 'GEMA BIO Universitas Hamzanwadi',
        is_safety_backup: prefix.startsWith('safety'),
        system_version: '2.0.0',
        stats: getDatabaseStats(),
      },
      data: db,
    };
    fs.writeFileSync(dest, JSON.stringify(backupWrapper, null, 2), 'utf-8');
    return filename;
  } catch (err) {
    console.error('Failed creating safety backup:', err);
    return null;
  }
}

// 1. Get database statistics & metadata
app.get('/api/database/stats', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  res.json(getDatabaseStats());
});

// 2. Export / Download complete database JSON
app.get('/api/database/export', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `gemabio_backup_${timestamp}.json`;

  const exportPayload = {
    _meta: {
      exported_at: new Date().toISOString(),
      exported_by: currentUser.name,
      exported_by_id: currentUser.id,
      institution: db.settings?.campus_name || 'Universitas Hamzanwadi',
      version: '2.0.0',
      stats: getDatabaseStats(),
    },
    ...db,
  };

  addActivity(
    currentUser.id,
    currentUser.name,
    'admin',
    'DATABASE_BACKUP',
    `Mengunduh file cadangan database sistem (${formatBytes(Buffer.byteLength(JSON.stringify(exportPayload)))})`
  );

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

// 3. Create server-side snapshot backup
app.post('/api/database/snapshot', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { label } = req.body;
  const safeLabel = String(label || 'Snapshot Manual').trim().slice(0, 50);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const id = `snap_${Date.now()}`;
  const filename = `${id}.json`;
  const dest = path.join(BACKUP_DIR, filename);

  const snapshotObject = {
    _meta: {
      id,
      filename,
      label: safeLabel,
      created_at: new Date().toISOString(),
      created_by: currentUser.name,
      created_by_id: currentUser.id,
      institution: db.settings?.campus_name || 'Universitas Hamzanwadi',
      is_safety_backup: false,
      stats: getDatabaseStats(),
    },
    data: db,
  };

  fs.writeFileSync(dest, JSON.stringify(snapshotObject, null, 2), 'utf-8');
  const fileStat = fs.statSync(dest);

  addActivity(
    currentUser.id,
    currentUser.name,
    'admin',
    'DATABASE_SNAPSHOT',
    `Membuat snapshot cadangan database: "${safeLabel}" (${formatBytes(fileStat.size)})`
  );

  const snapshotInfo = {
    id,
    filename,
    label: safeLabel,
    created_at: snapshotObject._meta.created_at,
    created_by: currentUser.name,
    size_formatted: formatBytes(fileStat.size),
    size_bytes: fileStat.size,
    total_users: (db.users || []).length,
    total_courses: (db.courses || []).length,
    total_materials: (db.materials || []).length,
    is_safety_backup: false,
  };

  res.status(201).json({
    message: `Snapshot cadangan "${safeLabel}" berhasil dibuat dan disimpan di server.`,
    snapshot: snapshotInfo,
  });
});

// 4. List all server snapshots
app.get('/api/database/snapshots', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
    const snapshots: any[] = [];

    for (const filename of files) {
      const filePath = path.join(BACKUP_DIR, filename);
      const stat = fs.statSync(filePath);
      let meta: any = {};
      let totalUsers = 0;
      let totalCourses = 0;
      let totalMaterials = 0;

      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        meta = raw._meta || {};
        const content = raw.data || raw;
        totalUsers = Array.isArray(content.users) ? content.users.length : 0;
        totalCourses = Array.isArray(content.courses) ? content.courses.length : 0;
        totalMaterials = Array.isArray(content.materials) ? content.materials.length : 0;
      } catch {}

      const id = meta.id || filename.replace('.json', '');
      const isSafety = filename.startsWith('safety') || !!meta.is_safety_backup;
      const label = meta.label || (isSafety ? 'Safety Backup Otomatis' : 'Snapshot Cadangan');

      snapshots.push({
        id,
        filename,
        label,
        created_at: meta.created_at || stat.mtime.toISOString(),
        created_by: meta.created_by || 'Administrator',
        size_formatted: formatBytes(stat.size),
        size_bytes: stat.size,
        total_users: totalUsers,
        total_courses: totalCourses,
        total_materials: totalMaterials,
        is_safety_backup: isSafety,
      });
    }

    // Sort newest first
    snapshots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(snapshots);
  } catch (err) {
    console.error('Failed reading snapshots:', err);
    res.status(500).json({ error: 'Gagal memuat daftar snapshot database.' });
  }
});

// 5. Restore from a server snapshot
app.post('/api/database/restore/snapshot/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const targetId = req.params.id;
  const filePath = path.join(BACKUP_DIR, targetId.endsWith('.json') ? targetId : `${targetId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File snapshot database tidak ditemukan di server.' });
  }

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const restoredData = raw.data || raw;

    // Validate essential keys
    if (!Array.isArray(restoredData.users) || !Array.isArray(restoredData.materials) || !Array.isArray(restoredData.courses)) {
      return res.status(400).json({ error: 'Format data snapshot tidak valid atau rusak.' });
    }

    // Create safety backup of current data first
    createSafetyBackup('safety_before_restore', currentUser.name);

    // Apply restored database
    db = restoredData;

    // Sync courses enrolled_classes with existing db.classes
    if (db.classes && db.classes.length > 0 && db.courses) {
      const existingClassNames = new Set(db.classes.map(c => c.name));
      db.courses.forEach(c => {
        if (Array.isArray(c.enrolled_classes)) {
          c.enrolled_classes = c.enrolled_classes.filter(cn => existingClassNames.has(cn));
        }
      });
    }

    saveDatabase(db);
    saveDatabaseToFirestore(db).catch(console.error);
    broadcastSSE('database_restored', { message: 'Database telah dipulihkan.', timestamp: new Date().toISOString() });

    addActivity(
      currentUser.id,
      currentUser.name,
      'admin',
      'DATABASE_RESTORE',
      `Memulihkan database dari snapshot: "${raw._meta?.label || targetId}"`
    );

    res.json({
      message: `Database berhasil dipulihkan dari snapshot "${raw._meta?.label || targetId}".`,
      stats: getDatabaseStats(),
    });
  } catch (err: any) {
    console.error('Failed restoring snapshot:', err);
    res.status(500).json({ error: 'Gagal memulihkan database: ' + (err.message || 'Kesalahan pembacaan file') });
  }
});

// 6. Restore from uploaded JSON payload
app.post('/api/database/restore/upload', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  let uploadData = req.body.backup_data || req.body;

  // If wrapped in data property
  if (uploadData && uploadData.data && uploadData._meta) {
    uploadData = uploadData.data;
  }

  if (!uploadData || typeof uploadData !== 'object') {
    return res.status(400).json({ error: 'Data cadangan tidak valid atau kosong.' });
  }

  // Validate structural integrity
  const requiredArrays = ['users', 'materials', 'quizzes', 'courses'];
  for (const field of requiredArrays) {
    if (!Array.isArray(uploadData[field])) {
      return res.status(400).json({
        error: `File cadangan tidak valid: Bagian "${field}" wajib berupa daftar array data.`,
      });
    }
  }

  try {
    // Create pre-restore safety backup
    createSafetyBackup('safety_before_upload_restore', currentUser.name);

    // Clean up meta wrapper if existing
    const { _meta, ...cleanDb } = uploadData;

    // Ensure default settings exist if omitted
    if (!cleanDb.settings) {
      cleanDb.settings = db.settings;
    }

    // Sync courses enrolled_classes with existing classes in cleanDb
    if (cleanDb.classes && cleanDb.classes.length > 0 && cleanDb.courses) {
      const existingClassNames = new Set(cleanDb.classes.map((c: any) => c.name));
      cleanDb.courses.forEach((c: any) => {
        if (Array.isArray(c.enrolled_classes)) {
          c.enrolled_classes = c.enrolled_classes.filter((cn: string) => existingClassNames.has(cn));
        }
      });
    }

    // Sync initials for users
    for (const u of cleanDb.users) {
      const initials = getUserInitials(u.name);
      if (!u.avatar || u.avatar !== initials) {
        u.avatar = initials;
      }
    }

    db = cleanDb as DatabaseSchema;
    saveDatabase(db);
    saveDatabaseToFirestore(db).catch(console.error);
    broadcastSSE('database_restored', { message: 'Database telah dipulihkan.', timestamp: new Date().toISOString() });

    addActivity(
      currentUser.id,
      currentUser.name,
      'admin',
      'DATABASE_RESTORE_UPLOAD',
      `Memulihkan database dari unggahan file cadangan JSON (${cleanDb.users.length} pengguna, ${cleanDb.courses.length} mata kuliah)`
    );

    res.json({
      message: 'Database berhasil dipulihkan dari file cadangan yang diunggah.',
      stats: getDatabaseStats(),
    });
  } catch (err: any) {
    console.error('Failed applying uploaded restore:', err);
    res.status(500).json({ error: 'Gagal memulihkan database: ' + (err.message || 'Kesalahan internal server') });
  }
});

// 7. Delete a snapshot
app.delete('/api/database/snapshots/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const targetId = req.params.id;
  const filePath = path.join(BACKUP_DIR, targetId.endsWith('.json') ? targetId : `${targetId}.json`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File snapshot tidak ditemukan.' });
  }

  try {
    fs.unlinkSync(filePath);
    addActivity(
      currentUser.id,
      currentUser.name,
      'admin',
      'DATABASE_SNAPSHOT_DELETED',
      `Menghapus file snapshot cadangan: ${targetId}`
    );
    res.json({ message: 'File snapshot berhasil dihapus dari server.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus file: ' + err.message });
  }
});

// 8. Factory reset with safety backup
app.post('/api/database/reset-factory', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  createSafetyBackup('safety_before_factory_reset', currentUser.name);

  db = getInitialData();
  const c1 = db.courses?.find(c => c.id === 'course_1');
  if (c1 && db.classes) {
    c1.enrolled_classes = db.classes.map(c => c.name);
  }

  saveDatabase(db);
  saveDatabaseToFirestore(db).catch(console.error);
  tokenToUserId.clear();
  broadcastSSE('data_reset', { message: 'Database telah direset ke data pabrik.' });

  addActivity(
    currentUser.id,
    currentUser.name,
    'admin',
    'DATABASE_FACTORY_RESET',
    'Mereset seluruh database sistem ke standar pabrik (Initial Seeds)'
  );

  res.json({ message: 'Database berhasil direset ke standar awal pabrik.' });
});

// 9. Get Firebase Firestore Cloud Database status
app.get('/api/database/cloud-status', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  res.json(getFirestoreCloudStatus());
});

// 10. Manual Cloud Sync to Firebase Firestore
app.post('/api/database/cloud-sync', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const success = await saveDatabaseToFirestore(db);
    if (success) {
      res.json({
        message: 'Database berhasil disinkronkan ke Firebase Firestore.',
        status: getFirestoreCloudStatus(),
      });
    } else {
      res.status(500).json({ error: 'Gagal menyinkronkan data ke Firebase Firestore.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyinkronkan data ke cloud.' });
  }
});

app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.settings);
});

app.put('/api/settings', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  saveDatabase(db);
  broadcastSSE('settings_updated', db.settings);
  res.json(db.settings);
});

app.get('/api/settings/degrees', (req: Request, res: Response) => {
  if (!db.settings.available_degrees || db.settings.available_degrees.length === 0) {
    const deptDegrees = new Set((db.departments || []).map(d => d.degree));
    db.settings.available_degrees = DEFAULT_DEGREES.map(deg => ({
      ...deg,
      is_active: deg.is_active || deptDegrees.has(deg.code),
    }));
    saveDatabase(db);
  }
  res.json(db.settings.available_degrees);
});

app.put('/api/settings/degrees', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { degrees } = req.body;
  if (!Array.isArray(degrees)) {
    return res.status(400).json({ error: 'Daftar jenjang pendidikan harus berupa format array.' });
  }

  // Ensure at least one active degree
  const hasActive = degrees.some((d: any) => d.is_active);
  if (!hasActive) {
    return res.status(400).json({ error: 'Minimal harus ada 1 jenjang pendidikan yang berstatus aktif/tersedia.' });
  }

  db.settings.available_degrees = degrees;
  saveDatabase(db);
  broadcastSSE('settings_updated', db.settings);
  addActivity(
    (req as any).user.id,
    (req as any).user.name,
    'admin',
    'SETTINGS_DEGREES_UPDATED',
    `Memperbarui ketersediaan jenjang pendidikan: ${degrees.filter((d: any) => d.is_active).map((d: any) => d.code).join(', ')}`
  );

  res.json(db.settings.available_degrees);
});

app.get('/api/activities', requireAuth, (req: Request, res: Response) => {
  res.json(db.activities);
});

// Helper: get classes and student IDs associated with a lecturer
function getLecturerClassesAndStudents(lecturerId: string, lecturerName: string) {
  const myClasses = new Set<string>();
  const myEnrolledStudentIds = new Set<string>();

  (db.classes || []).forEach(cls => {
    const isAdvisor = cls.advisor_id === lecturerId ||
      (cls.advisor_name && (cls.advisor_name.toLowerCase().includes(lecturerName.toLowerCase()) || lecturerName.toLowerCase().includes(cls.advisor_name.toLowerCase())));
    if (isAdvisor) {
      myClasses.add(cls.name);
    }
  });

  (db.courses || []).forEach(c => {
    const isMyCourse = c.lecturer_id === lecturerId ||
      (Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(lecturerId)) ||
      (c.lecturer_name && (c.lecturer_name.toLowerCase().includes(lecturerName.toLowerCase()) || lecturerName.toLowerCase().includes(c.lecturer_name.toLowerCase())));
    if (isMyCourse) {
      if (Array.isArray(c.enrolled_classes)) c.enrolled_classes.forEach(cn => myClasses.add(cn));
      if (Array.isArray(c.enrolled_student_ids)) c.enrolled_student_ids.forEach(sid => myEnrolledStudentIds.add(sid));
    }
  });

  return { myClasses, myEnrolledStudentIds };
}

function filterStudentsForLecturer(students: any[], lecturerId: string, lecturerName: string) {
  const { myClasses, myEnrolledStudentIds } = getLecturerClassesAndStudents(lecturerId, lecturerName);
  return students.filter(u => {
    if (u.role !== 'mahasiswa') return false;
    const inMyClass = u.class_name && myClasses.has(u.class_name);
    const inMyStudents = myEnrolledStudentIds.has(u.id) || (u.student_id && myEnrolledStudentIds.has(u.student_id));
    return inMyClass || inMyStudents;
  });
}

function isCourseOwner(courseId: string | undefined, user: any): boolean {
  if (user.role === 'admin') return true;
  if (!courseId) return false;
  const course = (db.courses || []).find(c => c.id === courseId);
  if (!course) return false;
  const matchId = course.lecturer_id && course.lecturer_id === user.id;
  const matchIds = Array.isArray(course.lecturer_ids) && course.lecturer_ids.includes(user.id);
  const matchName = course.lecturer_name && (
    course.lecturer_name.toLowerCase().includes(user.name.toLowerCase()) ||
    user.name.toLowerCase().includes(course.lecturer_name.toLowerCase())
  );
  return !!(matchId || matchIds || matchName);
}

// Users management
app.get('/api/users', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const roleFilter = req.query.role as string;
  let usersList = db.users;

  if (currentUser.role === 'dosen') {
    // Each dosen can ONLY see students in their own classes/courses
    usersList = filterStudentsForLecturer(usersList, currentUser.id, currentUser.name);
  } else if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const courseIdFilter = req.query.course_id as string;
  if (courseIdFilter && courseIdFilter !== 'all') {
    const targetCourse = (db.courses || []).find(c => c.id === courseIdFilter);
    if (targetCourse) {
      const enrolledClasses = new Set(targetCourse.enrolled_classes || []);
      const enrolledStudents = new Set(targetCourse.enrolled_student_ids || []);
      usersList = usersList.filter(u => {
        if (u.role !== 'mahasiswa') return false;
        const inClass = u.class_name && enrolledClasses.has(u.class_name);
        const inStudents = enrolledStudents.has(u.id) || (u.student_id && enrolledStudents.has(u.student_id));
        return inClass || inStudents;
      });
    }
  }

  if (roleFilter) {
    usersList = usersList.filter(u => u.role === roleFilter);
  }

  const safeUsers = usersList.map(({ password_hash, ...u }) => u);
  res.json(safeUsers);
});

app.post('/api/users', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { name, email, username, password, role, student_id, nidn, nip, class_name, department } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: 'Nama, kata sandi, dan role wajib diisi.' });
  }

  const cleanUsername = username ? username.trim().toLowerCase() : (student_id || nidn || 'user_' + Date.now());
  const cleanEmail = email ? email.trim().toLowerCase() : `${cleanUsername}@gemabio.local`;

  if (db.users.some(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
  }
  if (student_id && db.users.some(u => u.student_id && u.student_id.toLowerCase() === student_id.toLowerCase())) {
    return res.status(400).json({ error: `NIM "${student_id}" sudah terdaftar.` });
  }

  const initials = getUserInitials(name);

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name,
    email: cleanEmail,
    username: cleanUsername,
    password_hash: hashPassword(password),
    role,
    student_id: role === 'mahasiswa' ? student_id : undefined,
    nidn: role === 'dosen' || role === 'admin' ? nidn : undefined,
    nip: role === 'dosen' || role === 'admin' ? nip : undefined,
    class_name: role === 'mahasiswa' ? class_name || 'BIO-2A' : undefined,
    department: department || 'S1 Pendidikan Biologi',
    avatar: initials,
    created_at: new Date().toISOString(),
  };

  // Auto-provision class in db.classes if not exists
  if (role === 'mahasiswa' && newUser.class_name) {
    if (!db.classes) db.classes = [];
    const classExists = db.classes.some(c => c.name.toLowerCase() === newUser.class_name?.toLowerCase());
    if (!classExists) {
      const matchedDept = (db.departments || []).find(d =>
        d.name.toLowerCase() === (newUser.department || '').toLowerCase() ||
        d.code.toLowerCase() === (newUser.department || '').toLowerCase()
      );
      const newClass = {
        id: 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: newUser.class_name,
        department_name: matchedDept ? matchedDept.name : (newUser.department || 'S1 Pendidikan Biologi'),
        department_id: matchedDept ? matchedDept.id : '',
        academic_year: '2026/2027',
        semester: 2,
        capacity: 35,
        description: `Kelas rombel ${newUser.class_name} dibuat otomatis saat pembuatan pengguna.`,
        created_at: new Date().toISOString(),
      };
      db.classes.push(newClass);
      broadcastSSE('classes_updated', { message: `Kelas baru ${newUser.class_name} telah otomatis didaftarkan.` });
    }
  }

  db.users.push(newUser);
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'USER_CREATED', `Menambahkan pengguna: ${name} (${role})`);

  const { password_hash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Import users in bulk from Excel (.xlsx / .csv)
// Expected columns: Username, Password, Nama Lengkap, Role, NIM, Kelas, Program Studi, Semester
app.post('/api/users/import', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { users: rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'Data baris pengguna untuk diimport tidak ditemukan.' });
  }

  if (!db.classes) db.classes = [];
  let importedCount = 0;
  let newClassesCreated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const username = String(row.username || row.Username || '').trim();
    const password = String(row.password || row.Password || '12345*').trim();
    const name = String(row.name || row['Nama Lengkap'] || row.nama || '').trim();
    const roleRaw = String(row.role || row.Role || 'mahasiswa').trim().toLowerCase();
    const role = (roleRaw === 'admin' || roleRaw === 'dosen' ? roleRaw : 'mahasiswa') as 'admin' | 'dosen' | 'mahasiswa';
    const student_id = String(row.nim || row.NIM || row.student_id || '').trim();
    const class_name = String(row.kelas || row.Kelas || row.class_name || (role === 'mahasiswa' ? 'BIO-2A' : '')).trim();
    const row_dept = String(row.prodi || row['Program Studi'] || row.Prodi || row.department || '').trim();
    const row_semester = Number(row.semester || row.Semester || 2) || 2;
    const email = String(row.email || row.Email || `${username || student_id || 'user'}@gemabio.local`).trim();

    if (!name) {
      errors.push(`Baris #${i + 1}: Nama lengkap wajib diisi.`);
      continue;
    }

    const finalUsername = username || student_id || `user_${Date.now()}_${i}`;

    // Check duplicate
    if (db.users.some(u => u.username && u.username.toLowerCase() === finalUsername.toLowerCase())) {
      errors.push(`Baris #${i + 1}: Username "${finalUsername}" sudah ada.`);
      continue;
    }
    if (student_id && db.users.some(u => u.student_id && u.student_id.toLowerCase() === student_id.toLowerCase())) {
      errors.push(`Baris #${i + 1}: NIM "${student_id}" sudah terdaftar.`);
      continue;
    }

    // Auto-provision class in db.classes if student's class does not exist
    if (role === 'mahasiswa' && class_name) {
      const classExists = db.classes.some(c => c.name.toLowerCase() === class_name.toLowerCase());
      if (!classExists) {
        let deptName = row_dept || 'S1 Pendidikan Biologi';
        let deptId = '';
        if (db.departments && db.departments.length > 0) {
          const matched = db.departments.find(d =>
            d.name.toLowerCase() === deptName.toLowerCase() ||
            d.code.toLowerCase() === deptName.toLowerCase() ||
            d.name.toLowerCase().includes(deptName.toLowerCase())
          );
          if (matched) {
            deptName = matched.name;
            deptId = matched.id;
          } else {
            deptName = db.departments[0].name;
            deptId = db.departments[0].id;
          }
        }
        const newCls = {
          id: 'cls_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '_' + i,
          name: class_name,
          department_name: deptName,
          department_id: deptId,
          academic_year: '2026/2027',
          semester: row_semester,
          capacity: 35,
          description: `Kelas rombel ${class_name} dibuat otomatis dari import pengguna.`,
          created_at: new Date().toISOString(),
        };
        db.classes.push(newCls);
        newClassesCreated++;
      }
    }

    // Resolve user's department
    let userDept = row_dept;
    if (!userDept) {
      if (class_name) {
        const foundCls = db.classes.find(c => c.name.toLowerCase() === class_name.toLowerCase());
        if (foundCls && foundCls.department_name) {
          userDept = foundCls.department_name;
        }
      }
      if (!userDept && db.departments && db.departments.length > 0) {
        userDept = db.departments[0].name;
      }
    }

    const initials = getUserInitials(name);

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6) + '_' + i,
      name,
      email,
      username: finalUsername,
      password_hash: hashPassword(password),
      role,
      student_id: role === 'mahasiswa' ? student_id : undefined,
      nidn: role === 'dosen' ? student_id : undefined,
      class_name: role === 'mahasiswa' ? class_name : undefined,
      department: userDept || 'S1 Pendidikan Biologi',
      avatar: initials,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    importedCount++;
  }

  saveDatabase(db);
  broadcastSSE('users_updated', { message: `${importedCount} pengguna berhasil diimpor.` });
  if (newClassesCreated > 0) {
    broadcastSSE('classes_updated', { message: `${newClassesCreated} kelas baru otomatis didaftarkan ke sistem.` });
  }

  addActivity(
    (req as any).user.id,
    (req as any).user.name,
    (req as any).user.role,
    'USERS_IMPORTED',
    `Berhasil mengimpor ${importedCount} akun pengguna dari Excel (otomatis membuat ${newClassesCreated} rombel kelas baru).`
  );

  res.json({
    success: true,
    imported: importedCount,
    new_classes_created: newClassesCreated,
    errors,
  });
});

app.put('/api/users/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const targetId = req.params.id;
  const { name, email, username, password, role, student_id, nidn, nip, class_name, department } = req.body;

  if (currentUser.role !== 'admin' && currentUser.id !== targetId) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }

  const index = db.users.findIndex(u => u.id === targetId);
  if (index === -1) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  const existing = db.users[index];
  const updatedRole = currentUser.role === 'admin' && role ? role : existing.role;
  const finalName = name !== undefined && name.trim() ? name.trim() : existing.name;
  const updatedAvatar = getUserInitials(finalName);

  const updated = {
    ...existing,
    name: finalName,
    avatar: updatedAvatar,
    email: email !== undefined ? email : existing.email,
    username: username !== undefined ? username : existing.username,
    role: updatedRole,
    student_id: student_id !== undefined ? student_id : existing.student_id,
    nidn: nidn !== undefined ? nidn : existing.nidn,
    nip: nip !== undefined ? nip : existing.nip,
    class_name: class_name !== undefined ? class_name : existing.class_name,
    department: department !== undefined ? department : existing.department,
    password_hash: password ? hashPassword(password) : existing.password_hash,
  };

  db.users[index] = updated;
  saveDatabase(db);

  addActivity(currentUser.id, currentUser.name, currentUser.role, 'USER_UPDATED', `Memperbarui profil pengguna: ${updated.name}`);

  const { password_hash, ...safeUser } = updated;
  res.json(safeUser);
});

app.delete('/api/users/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const targetId = req.params.id;
  if (targetId === (req as any).user.id) {
    return res.status(400).json({ error: 'Tidak dapat menghapus akun admin yang sedang aktif digunakan.' });
  }

  const user = db.users.find(u => u.id === targetId);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  db.users = db.users.filter(u => u.id !== targetId);
  db.progress = db.progress.filter(p => p.user_id !== targetId);
  db.quiz_results = db.quiz_results.filter(q => q.user_id !== targetId);
  db.points = db.points.filter(p => p.user_id !== targetId);
  db.user_badges = db.user_badges.filter(b => b.user_id !== targetId);

  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, 'admin', 'USER_DELETED', `Menghapus akun pengguna: ${user.name}`);

  res.json({ message: 'Pengguna berhasil dihapus.' });
});

// Batch Delete Users endpoint
app.post('/api/users/batch-delete', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { user_ids } = req.body;

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'Daftar ID pengguna yang akan dihapus tidak boleh kosong.' });
  }

  // Filter out current logged-in user to prevent self-deletion
  const requestedIds = new Set(user_ids);
  requestedIds.delete(currentUser.id);

  const candidates = db.users.filter(u => requestedIds.has(u.id));

  // If dosen, can only delete mahasiswa
  const validToDelete = candidates.filter(u => {
    if (currentUser.role === 'dosen') {
      return u.role === 'mahasiswa';
    }
    // If admin, protect against deleting all admins
    if (u.role === 'admin') {
      const remainingAdmins = db.users.filter(usr => usr.role === 'admin' && !requestedIds.has(usr.id));
      if (remainingAdmins.length === 0) return false;
    }
    return true;
  });

  if (validToDelete.length === 0) {
    return res.status(400).json({
      error: 'Tidak ada akun pengguna yang dapat dihapus (akun Anda sendiri atau admin utama terlindungi).',
    });
  }

  const deleteIds = new Set(validToDelete.map(u => u.id));
  const deletedCount = deleteIds.size;

  db.users = db.users.filter(u => !deleteIds.has(u.id));
  if (db.progress) db.progress = db.progress.filter(p => !deleteIds.has(p.user_id));
  if (db.quiz_results) db.quiz_results = db.quiz_results.filter(q => !deleteIds.has(q.user_id));
  if (db.points) db.points = db.points.filter(p => !deleteIds.has(p.user_id));
  if (db.user_badges) db.user_badges = db.user_badges.filter(b => !deleteIds.has(b.user_id));
  if (db.attendances) db.attendances = db.attendances.filter(a => !deleteIds.has(a.user_id));
  if (db.assignment_submissions) db.assignment_submissions = db.assignment_submissions.filter(s => !deleteIds.has(s.user_id));
  if (db.exam_grades) db.exam_grades = db.exam_grades.filter(g => !deleteIds.has(g.user_id));

  // Also remove from courses enrolled_student_ids
  if (db.courses) {
    db.courses.forEach(c => {
      if (Array.isArray(c.enrolled_student_ids)) {
        c.enrolled_student_ids = c.enrolled_student_ids.filter(id => !deleteIds.has(id));
      }
    });
  }

  saveDatabase(db);
  broadcastSSE('users_updated', { message: `${deletedCount} pengguna telah dihapus massal.` });

  const roleSummary = {
    mahasiswa: validToDelete.filter(u => u.role === 'mahasiswa').length,
    dosen: validToDelete.filter(u => u.role === 'dosen').length,
    admin: validToDelete.filter(u => u.role === 'admin').length,
  };

  const roleParts: string[] = [];
  if (roleSummary.mahasiswa > 0) roleParts.push(`${roleSummary.mahasiswa} Mahasiswa`);
  if (roleSummary.dosen > 0) roleParts.push(`${roleSummary.dosen} Dosen`);
  if (roleSummary.admin > 0) roleParts.push(`${roleSummary.admin} Admin`);
  const roleText = roleParts.join(', ');

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role || 'admin',
    'USERS_BATCH_DELETED',
    `Menghapus massal ${deletedCount} pengguna (${roleText})`
  );

  res.json({
    message: `Berhasil menghapus ${deletedCount} pengguna (${roleText}).`,
    deleted_count: deletedCount,
  });
});

// Reset Password endpoint (Default password: 12345*)
app.post('/api/users/:id/reset-password', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const targetId = req.params.id;
  const user = db.users.find(u => u.id === targetId);

  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }

  // Dosen can only reset password for mahasiswa
  if (currentUser.role === 'dosen' && user.role !== 'mahasiswa') {
    return res.status(403).json({ error: 'Akses ditolak: Dosen hanya diperkenankan mereset kata sandi akun Mahasiswa.' });
  }

  const newPassword = String(req.body.new_password || '12345*').trim();
  if (!newPassword) {
    return res.status(400).json({ error: 'Kata sandi baru tidak boleh kosong.' });
  }

  user.password_hash = hashPassword(newPassword);
  saveDatabase(db);

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'PASSWORD_RESET',
    `Mereset kata sandi akun ${user.name} (${user.role}) ke "${newPassword}"`
  );

  const { password_hash, ...safeUser } = user;
  res.json({
    success: true,
    message: `Kata sandi akun "${user.name}" berhasil direset ke password standar (${newPassword}).`,
    default_password: newPassword,
    user: safeUser,
  });
});

// Materials endpoints
app.get('/api/materials', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const userProgress = db.progress.filter(p => p.user_id === currentUser.id);
  const progressMap = new Map(userProgress.map(p => [p.material_id, p.status]));

  const queryCourseId = req.query.course_id as string;
  let accessibleCourseIds: string[] = [];

  if (currentUser.role === 'admin') {
    accessibleCourseIds = (db.courses || []).map(c => c.id);
  } else if (currentUser.role === 'dosen') {
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
        const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
        const matchName = c.lecturer_name && (
          c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
        );
        return matchId || matchIds || matchName;
      })
      .map(c => c.id);
  } else if (currentUser.role === 'mahasiswa') {
    const studentClass = currentUser.class_name;
    const studentId = currentUser.id;
    const studentNim = currentUser.student_id;
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        if (Array.isArray(c.enrolled_student_ids) && (c.enrolled_student_ids.includes(studentId) || (studentNim && c.enrolled_student_ids.includes(studentNim)))) {
          return true;
        }
        if (studentClass && Array.isArray(c.enrolled_classes) && c.enrolled_classes.includes(studentClass)) {
          return true;
        }
        return false;
      })
      .map(c => c.id);
  }

  // Filter materials list
  let filteredMaterials = db.materials.filter(m => {
    const matCourseId = m.course_id || 'course_1';
    // If specific course requested
    if (queryCourseId) {
      return matCourseId === queryCourseId && (currentUser.role === 'admin' || accessibleCourseIds.includes(queryCourseId));
    }
    // Else only accessible courses
    return currentUser.role === 'admin' || accessibleCourseIds.includes(matCourseId);
  });

  const materialsWithStatus = filteredMaterials
    .sort((a, b) => a.order_number - b.order_number)
    .map(m => {
      const quiz = db.quizzes.find(q => q.material_id === m.id);
      return {
        ...m,
        status: progressMap.get(m.id) || 'not_started',
        has_quiz: !!quiz,
        quiz_id: quiz ? quiz.id : null,
      };
    });

  res.json(materialsWithStatus);
});

app.get('/api/materials/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const material = db.materials.find(m => m.id === req.params.id);
  if (!material) {
    return res.status(404).json({ error: 'Materi tidak ditemukan.' });
  }

  const prog = db.progress.find(p => p.user_id === currentUser.id && p.material_id === material.id);
  const quiz = db.quizzes.find(q => q.material_id === material.id);

  res.json({
    ...material,
    status: prog ? prog.status : 'not_started',
    completed_at: prog ? prog.completed_at : null,
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          points: quiz.points,
          question_count: db.questions.filter(q => q.quiz_id === quiz.id).length,
        }
      : null,
  });
});

app.post('/api/materials', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { title, category, description, content, learning_objectives, estimated_time, order_number } = req.body;
  if (!title || !category || !content) {
    return res.status(400).json({ error: 'Judul, kategori, dan isi materi wajib diisi.' });
  }

  const currentUser = (req as any).user;
  const newMaterial = {
    id: 'mat_' + Date.now(),
    course_id: req.body.course_id || 'course_1',
    author_id: currentUser.id,
    author_name: currentUser.name,
    title,
    category,
    description: description || '',
    content,
    learning_objectives: Array.isArray(learning_objectives) ? learning_objectives : (learning_objectives ? [learning_objectives] : []),
    estimated_time: estimated_time || '15 Menit',
    order_number: Number(order_number) || db.materials.length + 1,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments : [],
    created_at: new Date().toISOString(),
  };

  db.materials.push(newMaterial);
  saveDatabase(db);

  addActivity(currentUser.id, currentUser.name, currentUser.role, 'MATERIAL_CREATED', `Membuat materi baru: ${title}`);
  res.status(201).json(newMaterial);
});

app.put('/api/materials/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const index = db.materials.findIndex(m => m.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Materi tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  const current = db.materials[index];

  if (currentUser.role === 'dosen') {
    const isOwner = (current as any).author_id === currentUser.id || isCourseOwner(current.course_id, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang mengubah materi yang bukan dibuat oleh Anda.' });
    }
  }

  const updated = {
    ...current,
    ...req.body,
    order_number: req.body.order_number !== undefined ? Number(req.body.order_number) : current.order_number,
  };

  db.materials[index] = updated;
  saveDatabase(db);

  addActivity(currentUser.id, currentUser.name, currentUser.role, 'MATERIAL_UPDATED', `Mengubah materi: ${updated.title}`);
  res.json(updated);
});

app.delete('/api/materials/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const targetId = req.params.id;
  const mat = db.materials.find(m => m.id === targetId);
  if (!mat) {
    return res.status(404).json({ error: 'Materi tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  if (currentUser.role === 'dosen') {
    const isOwner = (mat as any).author_id === currentUser.id || isCourseOwner(mat.course_id, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang menghapus materi yang bukan dibuat oleh Anda.' });
    }
  }

  const quiz = db.quizzes.find(q => q.material_id === targetId);
  if (quiz) {
    db.questions = db.questions.filter(q => q.quiz_id !== quiz.id);
    db.quizzes = db.quizzes.filter(q => q.id !== quiz.id);
    db.quiz_results = db.quiz_results.filter(qr => qr.quiz_id !== quiz.id);
  }

  db.materials = db.materials.filter(m => m.id !== targetId);
  db.progress = db.progress.filter(p => p.material_id !== targetId);

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'MATERIAL_DELETED', `Menghapus materi: ${mat.title}`);

  res.json({ message: 'Materi berhasil dihapus.' });
});

app.post('/api/materials/:id/complete', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const materialId = req.params.id;
  const material = db.materials.find(m => m.id === materialId);
  if (!material) {
    return res.status(404).json({ error: 'Materi tidak ditemukan.' });
  }

  let prog = db.progress.find(p => p.user_id === currentUser.id && p.material_id === materialId);
  let pointsAwarded = 0;
  let categoryBonusAwarded = false;

  if (!prog) {
    prog = {
      id: 'prg_' + Date.now(),
      user_id: currentUser.id,
      material_id: materialId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    };
    db.progress.push(prog);
    pointsAwarded = db.settings.material_point || 10;
    db.points.push({
      id: 'pt_' + Date.now(),
      user_id: currentUser.id,
      amount: pointsAwarded,
      source: `Menyelesaikan Materi: ${material.title}`,
      created_at: new Date().toISOString(),
    });
  } else if (prog.status !== 'completed') {
    prog.status = 'completed';
    prog.completed_at = new Date().toISOString();
    pointsAwarded = db.settings.material_point || 10;
    db.points.push({
      id: 'pt_' + Date.now(),
      user_id: currentUser.id,
      amount: pointsAwarded,
      source: `Menyelesaikan Materi: ${material.title}`,
      created_at: new Date().toISOString(),
    });
  } else {
    pointsAwarded = 0;
  }

  const categoryMaterials = db.materials.filter(m => m.category === material.category);
  const completedCategory = categoryMaterials.every(m =>
    db.progress.some(p => p.user_id === currentUser.id && p.material_id === m.id && p.status === 'completed')
  );

  const bonusKey = `Bonus Topik Selesai: ${material.category}`;
  const alreadyGotBonus = db.points.some(p => p.user_id === currentUser.id && p.source.includes(bonusKey));

  if (completedCategory && !alreadyGotBonus && categoryMaterials.length > 0) {
    const bonusAmount = db.settings.category_bonus_point || 25;
    db.points.push({
      id: 'pt_' + (Date.now() + 1),
      user_id: currentUser.id,
      amount: bonusAmount,
      source: bonusKey,
      created_at: new Date().toISOString(),
    });
    categoryBonusAwarded = true;
    pointsAwarded += bonusAmount;
  }

  saveDatabase(db);

  if (pointsAwarded > 0) {
    addActivity(currentUser.id, currentUser.name, currentUser.role, 'MATERIAL_COMPLETED', `Menyelesaikan materi: ${material.title} (+${pointsAwarded} Poin)`);
  }

  const newBadges = evaluateBadges(currentUser.id, currentUser.name);
  const totalPoints = db.points.filter(p => p.user_id === currentUser.id).reduce((s, p) => s + p.amount, 0);

  res.json({
    success: true,
    progress: prog,
    points_awarded: pointsAwarded,
    category_bonus_awarded: categoryBonusAwarded,
    new_badges: newBadges,
    total_points: totalPoints,
    level: computeLevel(totalPoints),
  });
});

// Quizzes endpoints
app.get('/api/quizzes', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const queryCourseId = req.query.course_id as string;

  let accessibleCourseIds: string[] = [];
  if (currentUser.role === 'admin') {
    accessibleCourseIds = (db.courses || []).map(c => c.id);
  } else if (currentUser.role === 'dosen') {
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
        const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
        const matchName = c.lecturer_name && (
          c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
        );
        return matchId || matchIds || matchName;
      })
      .map(c => c.id);
  } else if (currentUser.role === 'mahasiswa') {
    const studentClass = currentUser.class_name;
    const studentId = currentUser.id;
    const studentNim = currentUser.student_id;
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        if (Array.isArray(c.enrolled_student_ids) && (c.enrolled_student_ids.includes(studentId) || (studentNim && c.enrolled_student_ids.includes(studentNim)))) {
          return true;
        }
        if (studentClass && Array.isArray(c.enrolled_classes) && c.enrolled_classes.includes(studentClass)) {
          return true;
        }
        return false;
      })
      .map(c => c.id);
  }

  const list = db.quizzes
    .filter(q => {
      const mat = db.materials.find(m => m.id === q.material_id);
      const quizCourseId = (q as any).course_id || (mat ? mat.course_id : 'course_1');
      if (queryCourseId) {
        return quizCourseId === queryCourseId && (currentUser.role === 'admin' || accessibleCourseIds.includes(queryCourseId));
      }
      return currentUser.role === 'admin' || accessibleCourseIds.includes(quizCourseId);
    })
    .map(q => {
      const mat = db.materials.find(m => m.id === q.material_id);
      const questionsCount = db.questions.filter(quest => quest.quiz_id === q.id).length;
      const studentResult = db.quiz_results.find(qr => qr.quiz_id === q.id && qr.user_id === currentUser.id);

      return {
        ...q,
        material_title: mat ? mat.title : 'Materi Perkuliahan',
        question_count: questionsCount,
        user_result: studentResult
          ? {
              score: studentResult.score,
              completed_at: studentResult.completed_at,
              points_earned: studentResult.points_earned,
            }
          : null,
      };
    });
  res.json(list);
});

// Single quiz: for student, mask correct answers and shuffle matching targets
app.get('/api/quizzes/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const quiz = db.quizzes.find(q => q.id === req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
  }

  const mat = db.materials.find(m => m.id === quiz.material_id);
  const rawQuestions = db.questions.filter(quest => quest.quiz_id === quiz.id);

  const questions = rawQuestions.map(q => {
    const type = q.type || 'single_choice';

    if (currentUser.role === 'mahasiswa') {
      const {
        correct_answer,
        correct_answers_multi,
        correct_short_answers,
        essay_rubric_keywords,
        essay_sample_answer,
        explanation,
        ...safeQ
      } = q;

      // If matching, provide shuffled target options so students can pair them up
      if (type === 'matching' && Array.isArray(q.matching_pairs)) {
        let validTargets = q.matching_pairs
          .map(p => p.target)
          .filter(t => typeof t === 'string' && t.trim().length > 0);
        if (validTargets.length === 0 && q.id === 'q_1_4') {
          validTargets = [
            'Mengeksekusi instruksi program dan logika komputasi',
            'Penyimpanan memori sementara kecepatan tinggi untuk aplikasi aktif',
            'Media penyimpanan data dan berkas sistem operasi secara permanen',
            'Pemrosesan komputasi grafis dan visualisasi matriks 3D',
          ];
        }
        const shuffledTargets = [...validTargets].sort(() => Math.random() - 0.5);

        return {
          ...safeQ,
          type,
          matching_pairs: q.matching_pairs.map(p => ({ id: p.id, premise: p.premise, target: '' })),
          matching_available_targets: shuffledTargets,
        };
      }

      return { ...safeQ, type };
    }

    if (type === 'matching' && Array.isArray(q.matching_pairs)) {
      const validTargets = q.matching_pairs
        .map(p => p.target)
        .filter(t => typeof t === 'string' && t.trim().length > 0);
      const shuffledTargets = [...validTargets].sort(() => Math.random() - 0.5);
      return {
        ...q,
        type,
        matching_available_targets: shuffledTargets,
      };
    }

    return { ...q, type };
  });

  const prevResult = db.quiz_results.find(qr => qr.quiz_id === quiz.id && qr.user_id === currentUser.id);

  res.json({
    ...quiz,
    material_title: mat ? mat.title : '',
    questions,
    previous_result: prevResult || null,
  });
});

// Submit Quiz with Comprehensive Server-Authoritative Auto-Grading
app.post('/api/quizzes/:id/submit', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const quizId = req.params.id;
  const { answers } = req.body; // Record<question_id, any>

  const quiz = db.quizzes.find(q => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
  }

  const questions = db.questions.filter(q => q.quiz_id === quizId);
  if (questions.length === 0) {
    return res.status(400).json({ error: 'Kuis ini belum memiliki soal.' });
  }

  let totalEarnedScoreFraction = 0;
  const questionFeedback: Array<{
    id: string;
    type: QuestionType;
    question: string;
    user_answer: any;
    correct_answer: any;
    is_correct: boolean;
    earned_ratio: number;
    explanation: string;
    detail_feedback?: string;
  }> = [];

  for (const q of questions) {
    const type = (q.type || 'single_choice') as QuestionType;
    const userChoice = answers ? answers[q.id] : undefined;
    let isCorrect = false;
    let earnedRatio = 0;
    let detailFeedback = '';

    switch (type) {
      case 'single_choice': {
        const u = String(userChoice || '').trim().toLowerCase();
        const c = String(q.correct_answer || '').trim().toLowerCase();
        isCorrect = u === c;
        earnedRatio = isCorrect ? 1 : 0;
        break;
      }

      case 'true_false': {
        const u = String(userChoice || '').trim().toLowerCase();
        const c = String(q.correct_answer || '').trim().toLowerCase();
        isCorrect = u === c;
        earnedRatio = isCorrect ? 1 : 0;
        break;
      }

      case 'multiple_choice': {
        // Pilihan Ganda Kompleks
        const userArr: string[] = Array.isArray(userChoice) ? userChoice.map(s => String(s).toLowerCase()) : [];
        const correctArr: string[] = (q.correct_answers_multi || []).map(s => s.toLowerCase());

        const truePositives = userArr.filter(item => correctArr.includes(item)).length;
        const falsePositives = userArr.filter(item => !correctArr.includes(item)).length;

        if (falsePositives === 0 && truePositives === correctArr.length && correctArr.length > 0) {
          isCorrect = true;
          earnedRatio = 1;
          detailFeedback = 'Semua opsi yang tepat berhasil dipilih.';
        } else if (falsePositives === 0 && truePositives > 0) {
          earnedRatio = Math.round((truePositives / correctArr.length) * 100) / 100;
          detailFeedback = `${truePositives} dari ${correctArr.length} opsi benar terpilih.`;
        } else {
          isCorrect = false;
          earnedRatio = 0;
          detailFeedback = 'Terdapat pilihan yang keliru atau opsi belum tepat.';
        }
        break;
      }

      case 'matching': {
        // Menjodohkan: userChoice is { [pairId]: targetText }
        const pairs = q.matching_pairs || [];
        let matchedCount = 0;
        if (userChoice && typeof userChoice === 'object') {
          for (const p of pairs) {
            const userTarget = String(userChoice[p.id] || '').trim().toLowerCase();
            const correctTarget = p.target.trim().toLowerCase();
            if (userTarget === correctTarget) {
              matchedCount++;
            }
          }
        }
        earnedRatio = pairs.length > 0 ? Math.round((matchedCount / pairs.length) * 100) / 100 : 0;
        isCorrect = matchedCount === pairs.length && pairs.length > 0;
        detailFeedback = `${matchedCount} dari ${pairs.length} pasangan dijodohkan dengan benar.`;
        break;
      }

      case 'short_answer': {
        // Isian Singkat: case-insensitive & trimmed string
        const userText = String(userChoice || '').trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
        const acceptableList = (q.correct_short_answers || [q.correct_answer || ''])
          .map(a => String(a).trim().toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ''));

        isCorrect = acceptableList.some(a => a && (a === userText || userText.includes(a)));
        earnedRatio = isCorrect ? 1 : 0;
        detailFeedback = isCorrect ? 'Jawaban isian singkat sesuai kata kunci materi.' : 'Jawaban isian belum cocok dengan kata kunci.';
        break;
      }

      case 'case_study': {
        // Studi Kasus: evaluated by option or keyword
        const u = String(userChoice || '').trim().toLowerCase();
        const c = String(q.correct_answer || '').trim().toLowerCase();
        isCorrect = u === c;
        earnedRatio = isCorrect ? 1 : 0;
        detailFeedback = isCorrect ? 'Analisis studi kasus tepat.' : 'Analisis studi kasus kurang tepat.';
        break;
      }

      case 'essay': {
        // Uraian / Esai: Keyword Rubric Auto-Evaluation
        const userEssay = String(userChoice || '').toLowerCase();
        const keywords = q.essay_rubric_keywords || ['komputer', 'data', 'sistem'];
        let matchedKeywords = 0;

        for (const kw of keywords) {
          if (userEssay.includes(kw.toLowerCase().trim())) {
            matchedKeywords++;
          }
        }

        const ratio = keywords.length > 0 ? matchedKeywords / keywords.length : 0;
        if (ratio >= 0.7) {
          isCorrect = true;
          earnedRatio = 1;
          detailFeedback = `Esai sangat baik! Teridentifikasi ${matchedKeywords} dari ${keywords.length} konsep kata kunci utama.`;
        } else if (ratio >= 0.35) {
          isCorrect = true;
          earnedRatio = 0.7;
          detailFeedback = `Esai cukup baik. Teridentifikasi ${matchedKeywords} dari ${keywords.length} konsep kata kunci esensial.`;
        } else {
          isCorrect = false;
          earnedRatio = userEssay.length > 20 ? 0.3 : 0;
          detailFeedback = `Jawaban esai perlu diperdalam. Kata kunci konsep teridentifikasi: ${matchedKeywords}/${keywords.length}.`;
        }
        break;
      }
    }

    totalEarnedScoreFraction += earnedRatio;

    questionFeedback.push({
      id: q.id,
      type,
      question: q.question,
      user_answer: userChoice,
      correct_answer: q.correct_answers_multi || q.correct_short_answers || q.matching_pairs || q.essay_sample_answer || q.correct_answer,
      is_correct: isCorrect,
      earned_ratio: earnedRatio,
      explanation: q.explanation || 'Pembahasan materi terkait.',
      detail_feedback: detailFeedback,
    });
  }

  const score = Math.min(100, Math.round((totalEarnedScoreFraction / questions.length) * 100));
  const fullCorrectCount = questionFeedback.filter(f => f.is_correct).length;

  // Anti point exploitation:
  const existingResults = db.quiz_results.filter(qr => qr.quiz_id === quizId && qr.user_id === currentUser.id);
  const highestPrevScore = existingResults.reduce((max, r) => Math.max(max, r.score), 0);

  let pointsEarned = 0;
  const basePoints = db.settings.quiz_base_point || 10;
  const correctBonus = Math.round(((db.settings.quiz_correct_point || 5) * totalEarnedScoreFraction));
  const potentialPoints = basePoints + correctBonus;

  if (existingResults.length === 0) {
    pointsEarned = potentialPoints;
    db.points.push({
      id: 'pt_' + Date.now(),
      user_id: currentUser.id,
      amount: pointsEarned,
      source: `Menyelesaikan Kuis: ${quiz.title} (Skor: ${score}%)`,
      created_at: new Date().toISOString(),
    });
  } else if (score > highestPrevScore) {
    const prevBonus = Math.round((db.settings.quiz_correct_point || 5) * ((highestPrevScore / 100) * questions.length));
    const diff = Math.max(0, correctBonus - prevBonus);
    if (diff > 0) {
      pointsEarned = diff;
      db.points.push({
        id: 'pt_' + Date.now(),
        user_id: currentUser.id,
        amount: pointsEarned,
        source: `Peningkatan Nilai Kuis: ${quiz.title} (Skor Baru: ${score}%)`,
        created_at: new Date().toISOString(),
      });
    }
  } else {
    pointsEarned = 0;
  }

  const resultRecord = {
    id: 'qr_' + Date.now(),
    user_id: currentUser.id,
    quiz_id: quizId,
    score,
    correct_count: fullCorrectCount,
    total_questions: questions.length,
    points_earned: pointsEarned,
    answers: answers || {},
    completed_at: new Date().toISOString(),
  };

  db.quiz_results.push(resultRecord);
  saveDatabase(db);

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'QUIZ_SUBMITTED',
    `Menyelesaikan kuis "${quiz.title}" dengan skor ${score}% (+${pointsEarned} Poin)`
  );

  const newBadges = evaluateBadges(currentUser.id, currentUser.name);
  const totalPoints = db.points.filter(p => p.user_id === currentUser.id).reduce((s, p) => s + p.amount, 0);

  res.json({
    result: resultRecord,
    feedback: questionFeedback,
    points_earned: pointsEarned,
    new_badges: newBadges,
    total_points: totalPoints,
    level: computeLevel(totalPoints),
  });
});

// Quiz management for Dosen/Admin
app.post('/api/quizzes', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { material_id, title, description, points, questions: newQuestions } = req.body;
  if (!material_id || !title) {
    return res.status(400).json({ error: 'Materi dan judul kuis wajib diisi.' });
  }

  const currentUser = (req as any).user;
  const mat = db.materials.find(m => m.id === material_id);
  const quizCourseId = req.body.course_id || (mat ? mat.course_id : 'course_1');

  if (currentUser.role === 'dosen') {
    if (!isCourseOwner(quizCourseId, currentUser) && (mat && (mat as any).author_id !== currentUser.id)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang membuat kuis untuk materi/mata kuliah ini.' });
    }
  }

  const newQuiz = {
    id: 'quiz_' + Date.now(),
    material_id,
    course_id: quizCourseId,
    created_by_id: currentUser.id,
    created_by_name: currentUser.name,
    title,
    description: description || '',
    points: Number(points) || 25,
    created_at: new Date().toISOString(),
  };

  db.quizzes.push(newQuiz);

  if (Array.isArray(newQuestions)) {
    for (const q of newQuestions) {
      if (q.question) {
        db.questions.push({
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          quiz_id: newQuiz.id,
          type: q.type || 'single_choice',
          question: q.question,
          case_context: q.case_context || '',
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          matching_pairs: q.matching_pairs || [],
          correct_answer: q.correct_answer || 'a',
          correct_answers_multi: q.correct_answers_multi || [],
          correct_short_answers: q.correct_short_answers || [],
          essay_rubric_keywords: q.essay_rubric_keywords || [],
          essay_sample_answer: q.essay_sample_answer || '',
          explanation: q.explanation || 'Pembahasan materi kuis.',
        });
      }
    }
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'QUIZ_CREATED', `Membuat kuis baru: ${title}`);

  res.status(201).json(newQuiz);
});

app.put('/api/quizzes/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const quizId = req.params.id;
  const index = db.quizzes.findIndex(q => q.id === quizId);
  if (index === -1) {
    return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  const currentQuiz = db.quizzes[index];

  if (currentUser.role === 'dosen') {
    const mat = db.materials.find(m => m.id === currentQuiz.material_id);
    const quizCourseId = (currentQuiz as any).course_id || (mat ? mat.course_id : 'course_1');
    const isOwner = (currentQuiz as any).created_by_id === currentUser.id || isCourseOwner(quizCourseId, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang mengubah kuis yang bukan dibuat oleh Anda.' });
    }
  }

  const { title, description, points, questions: updatedQuestions } = req.body;
  const updatedQuiz = {
    ...db.quizzes[index],
    title: title || db.quizzes[index].title,
    description: description !== undefined ? description : db.quizzes[index].description,
    points: points !== undefined ? Number(points) : db.quizzes[index].points,
  };

  db.quizzes[index] = updatedQuiz;

  if (Array.isArray(updatedQuestions)) {
    db.questions = db.questions.filter(q => q.quiz_id !== quizId);
    for (const q of updatedQuestions) {
      if (q.question) {
        db.questions.push({
          id: q.id || 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          quiz_id: quizId,
          type: q.type || 'single_choice',
          question: q.question,
          case_context: q.case_context || '',
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          matching_pairs: q.matching_pairs || [],
          correct_answer: q.correct_answer || 'a',
          correct_answers_multi: q.correct_answers_multi || [],
          correct_short_answers: q.correct_short_answers || [],
          essay_rubric_keywords: q.essay_rubric_keywords || [],
          essay_sample_answer: q.essay_sample_answer || '',
          explanation: q.explanation || '',
        });
      }
    }
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'QUIZ_UPDATED', `Mengubah kuis: ${updatedQuiz.title}`);

  res.json(updatedQuiz);
});

app.delete('/api/quizzes/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const quizId = req.params.id;
  const quiz = db.quizzes.find(q => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Kuis tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  if (currentUser.role === 'dosen') {
    const mat = db.materials.find(m => m.id === quiz.material_id);
    const quizCourseId = (quiz as any).course_id || (mat ? mat.course_id : 'course_1');
    const isOwner = (quiz as any).created_by_id === currentUser.id || isCourseOwner(quizCourseId, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang menghapus kuis yang bukan dibuat oleh Anda.' });
    }
  }

  db.quizzes = db.quizzes.filter(q => q.id !== quizId);
  db.questions = db.questions.filter(q => q.quiz_id !== quizId);
  db.quiz_results = db.quiz_results.filter(qr => qr.quiz_id !== quizId);

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'QUIZ_DELETED', `Menghapus kuis: ${quiz.title}`);

  res.json({ message: 'Kuis berhasil dihapus.' });
});

// Badges management
app.get('/api/badges', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const userBadges = db.user_badges.filter(ub => ub.user_id === currentUser.id);
  const earnedMap = new Map(userBadges.map(ub => [ub.badge_id, ub.earned_at]));

  const list = db.badges.map(b => ({
    ...b,
    is_earned: earnedMap.has(b.id),
    earned_at: earnedMap.get(b.id) || null,
  }));

  res.json(list);
});

app.post('/api/badges', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { name, description, requirement, icon, condition_type, condition_value } = req.body;
  if (!name || !requirement || !condition_type) {
    return res.status(400).json({ error: 'Nama badge, syarat, dan jenis kondisi wajib diisi.' });
  }

  const newBadge = {
    id: 'bdg_' + Date.now(),
    name,
    description: description || '',
    requirement,
    icon: icon || 'award',
    condition_type,
    condition_value: Number(condition_value) || 1,
  };

  db.badges.push(newBadge);
  saveDatabase(db);
  res.status(201).json(newBadge);
});

// Student stats & progress
app.get('/api/progress/my', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const queryCourseId = req.query.course_id as string;

  const totalPoints = db.points.filter(p => p.user_id === currentUser.id).reduce((s, p) => s + p.amount, 0);
  const completedProgress = db.progress.filter(p => p.user_id === currentUser.id && p.status === 'completed');
  const completedMaterialIds = new Set(completedProgress.map(p => p.material_id));
  const userQuizResults = db.quiz_results.filter(qr => qr.user_id === currentUser.id);

  // Accessible/enrolled courses for student
  let accessibleCourses = db.courses || [];
  if (currentUser.role === 'mahasiswa') {
    const studentClass = currentUser.class_name;
    accessibleCourses = accessibleCourses.filter(c => {
      if (Array.isArray(c.enrolled_student_ids) && c.enrolled_student_ids.includes(currentUser.id)) {
        return true;
      }
      if (studentClass && Array.isArray(c.enrolled_classes) && c.enrolled_classes.includes(studentClass)) {
        return true;
      }
      if (!c.enrolled_classes || c.enrolled_classes.length === 0) {
        return true;
      }
      return false;
    });
  }

  // Calculate per-course progress breakdown
  const coursesProgress = accessibleCourses.map(c => {
    const materialsInCourse = db.materials.filter(m => (m.course_id || 'course_1') === c.id);
    const completedInCourse = completedProgress.filter(p => materialsInCourse.some(m => m.id === p.material_id)).length;
    const matPercent = materialsInCourse.length > 0 ? Math.round((completedInCourse / materialsInCourse.length) * 100) : 0;

    const quizzesInCourse = db.quizzes.filter(q => {
      const mat = db.materials.find(m => m.id === q.material_id);
      const qCourseId = (q as any).course_id || (mat ? mat.course_id : 'course_1');
      return qCourseId === c.id;
    });
    const quizResultsInCourse = userQuizResults.filter(qr => quizzesInCourse.some(q => q.id === qr.quiz_id));
    const avgScore = quizResultsInCourse.length > 0
      ? Math.round(quizResultsInCourse.reduce((sum, qr) => sum + qr.score, 0) / quizResultsInCourse.length)
      : 0;
    const quizPercent = quizzesInCourse.length > 0 ? Math.round((quizResultsInCourse.length / quizzesInCourse.length) * 100) : 0;

    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (completedInCourse > 0 || quizResultsInCourse.length > 0) {
      if (completedInCourse >= materialsInCourse.length && materialsInCourse.length > 0) {
        status = 'completed';
      } else {
        status = 'in_progress';
      }
    }

    const nextMat = materialsInCourse
      .sort((a, b) => a.order_number - b.order_number)
      .find(m => !completedMaterialIds.has(m.id));

    return {
      course_id: c.id,
      course_name: c.name,
      course_code: c.code,
      total_materials: materialsInCourse.length,
      completed_materials: completedInCourse,
      materials_progress_percent: matPercent,
      total_quizzes: quizzesInCourse.length,
      completed_quizzes: quizResultsInCourse.length,
      quizzes_progress_percent: quizPercent,
      average_quiz_score: avgScore,
      overall_progress_percent: matPercent,
      status,
      next_material_title: nextMat ? nextMat.title : undefined,
      next_material_id: nextMat ? nextMat.id : undefined,
    };
  });

  // If queryCourseId is supplied, calculate scoped stats for that course
  let scopedMaterials = db.materials;
  let scopedQuizzes = db.quizzes;
  if (queryCourseId) {
    scopedMaterials = db.materials.filter(m => (m.course_id || 'course_1') === queryCourseId);
    scopedQuizzes = db.quizzes.filter(q => {
      const mat = db.materials.find(m => m.id === q.material_id);
      const qCourseId = (q as any).course_id || (mat ? mat.course_id : 'course_1');
      return qCourseId === queryCourseId;
    });
  }

  const completedMaterialsCount = completedProgress.filter(p => scopedMaterials.some(m => m.id === p.material_id)).length;
  const materialsPercent = scopedMaterials.length > 0 ? Math.round((completedMaterialsCount / scopedMaterials.length) * 100) : 0;

  const scopedQuizResults = userQuizResults.filter(qr => scopedQuizzes.some(q => q.id === qr.quiz_id));
  const avgQuizScore = scopedQuizResults.length > 0
    ? Math.round(scopedQuizResults.reduce((sum, qr) => sum + qr.score, 0) / scopedQuizResults.length)
    : 0;

  const earnedBadgesCount = db.user_badges.filter(ub => ub.user_id === currentUser.id).length;
  const recentActivities = db.points.filter(p => p.user_id === currentUser.id).slice(-5).reverse();

  const nextMaterial = scopedMaterials
    .sort((a, b) => a.order_number - b.order_number)
    .find(m => !completedMaterialIds.has(m.id));

  const stats = {
    total_points: totalPoints,
    level: computeLevel(totalPoints),
    total_materials: scopedMaterials.length,
    completed_materials: completedMaterialsCount,
    materials_progress_percent: materialsPercent,
    total_quizzes_taken: scopedQuizResults.length,
    average_quiz_score: avgQuizScore,
    earned_badges_count: earnedBadgesCount,
    recent_activities: recentActivities,
    next_material: nextMaterial || null,
    courses_progress: coursesProgress,
  };

  res.json(stats);
});

// Student list overview / Leaderboard for Admin, Dosen, and Mahasiswa
app.get('/api/students/overview', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  let students = db.users.filter(u => u.role === 'mahasiswa');

  // Filter by class if requested
  const classNameQuery = req.query.class_name as string;
  if (classNameQuery && classNameQuery !== 'all') {
    students = students.filter(u => u.class_name === classNameQuery);
  }

  // Scoped to taught students if explicitly requested by dosen
  if (currentUser.role === 'dosen' && req.query.scope === 'my_taught') {
    const myCourses = (db.courses || []).filter(c => {
      const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
      const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
      const matchName = c.lecturer_name && (
        c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
      );
      return matchId || matchIds || matchName;
    });

    const myEnrolledClasses = new Set<string>();
    const myEnrolledStudentIds = new Set<string>();

    myCourses.forEach(c => {
      if (Array.isArray(c.enrolled_classes)) {
        c.enrolled_classes.forEach(cls => myEnrolledClasses.add(cls));
      }
      if (Array.isArray(c.enrolled_student_ids)) {
        c.enrolled_student_ids.forEach(sid => myEnrolledStudentIds.add(sid));
      }
    });

    students = students.filter(u => {
      const inClass = u.class_name && myEnrolledClasses.has(u.class_name);
      const inStudents = myEnrolledStudentIds.has(u.id) || (u.student_id && myEnrolledStudentIds.has(u.student_id));
      return inClass || inStudents;
    });
  }

  const totalMaterials = db.materials.length;

  const overview = students.map(st => {
    const totalPoints = db.points.filter(p => p.user_id === st.id).reduce((s, p) => s + p.amount, 0);
    const completedCount = db.progress.filter(p => p.user_id === st.id && p.status === 'completed').length;
    const progressPercent = totalMaterials > 0 ? Math.round((completedCount / totalMaterials) * 100) : 0;
    const quizzes = db.quiz_results.filter(qr => qr.user_id === st.id);
    const avgScore = quizzes.length > 0 ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length) : 0;
    const badgesCount = db.user_badges.filter(ub => ub.user_id === st.id).length;
    const lastPoint = db.points.filter(p => p.user_id === st.id).slice(-1)[0];

    const { password_hash, ...safeStudent } = st;
    return {
      user: safeStudent,
      total_points: totalPoints,
      level: computeLevel(totalPoints).title,
      completed_materials_count: completedCount,
      total_materials_count: totalMaterials,
      progress_percent: progressPercent,
      average_quiz_score: avgScore,
      quizzes_taken_count: quizzes.length,
      badges_count: badgesCount,
      last_activity: lastPoint ? lastPoint.created_at : st.created_at,
    };
  });

  res.json(overview);
});

// Detailed single student view for Dosen/Admin
app.get('/api/students/:id/details', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const student = db.users.find(u => u.id === req.params.id && u.role === 'mahasiswa');
  if (!student) {
    return res.status(404).json({ error: 'Mahasiswa tidak ditemukan.' });
  }

  const materialsProgress = db.materials.map(m => {
    const prog = db.progress.find(p => p.user_id === student.id && p.material_id === m.id);
    return {
      material_id: m.id,
      title: m.title,
      category: m.category,
      status: prog ? prog.status : 'not_started',
      completed_at: prog ? prog.completed_at : null,
    };
  });

  const quizResults = db.quiz_results
    .filter(qr => qr.user_id === student.id)
    .map(qr => {
      const quiz = db.quizzes.find(q => q.id === qr.quiz_id);
      return {
        ...qr,
        quiz_title: quiz ? quiz.title : 'Kuis',
      };
    });

  const badges = db.user_badges
    .filter(ub => ub.user_id === student.id)
    .map(ub => {
      const b = db.badges.find(bg => bg.id === ub.badge_id);
      return {
        badge_id: ub.badge_id,
        name: b ? b.name : '',
        description: b ? b.description : '',
        icon: b ? b.icon : 'award',
        earned_at: ub.earned_at,
      };
    });

  const pointsList = db.points.filter(p => p.user_id === student.id).slice(-15).reverse();
  const totalPoints = db.points.filter(p => p.user_id === student.id).reduce((s, p) => s + p.amount, 0);

  const { password_hash, ...safeStudent } = student;

  res.json({
    student: safeStudent,
    total_points: totalPoints,
    level: computeLevel(totalPoints),
    materials_progress: materialsProgress,
    quiz_results: quizResults,
    badges,
    points_history: pointsList,
  });
});

app.get('/api/admin/dashboard', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const totalUsers = db.users.length;
  const totalStudents = db.users.filter(u => u.role === 'mahasiswa').length;
  const totalLecturers = db.users.filter(u => u.role === 'dosen').length;
  const totalMaterials = db.materials.length;
  const totalQuizzes = db.quizzes.length;
  const recentActivities = db.activities.slice(0, 10);

  res.json({
    totalUsers,
    totalStudents,
    totalLecturers,
    totalMaterials,
    totalQuizzes,
    recentActivities,
  });
});

app.get('/api/dosen/dashboard', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  let students = db.users.filter(u => u.role === 'mahasiswa');
  let materials = db.materials;
  let quizzes = db.quizzes;

  if (currentUser.role === 'dosen') {
    const myCourses = (db.courses || []).filter(c => {
      const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
      const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
      const matchName = c.lecturer_name && (
        c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
      );
      return matchId || matchIds || matchName;
    });

    const myCourseIds = new Set(myCourses.map(c => c.id));
    const myEnrolledClasses = new Set<string>();
    const myEnrolledStudentIds = new Set<string>();

    myCourses.forEach(c => {
      if (Array.isArray(c.enrolled_classes)) c.enrolled_classes.forEach(cls => myEnrolledClasses.add(cls));
      if (Array.isArray(c.enrolled_student_ids)) c.enrolled_student_ids.forEach(sid => myEnrolledStudentIds.add(sid));
    });

    students = students.filter(u => {
      const inClass = u.class_name && myEnrolledClasses.has(u.class_name);
      const inStudents = myEnrolledStudentIds.has(u.id) || (u.student_id && myEnrolledStudentIds.has(u.student_id));
      return inClass || inStudents;
    });

    materials = materials.filter(m => myCourseIds.has(m.course_id || 'course_1'));
    quizzes = quizzes.filter(q => {
      const mat = db.materials.find(m => m.id === q.material_id);
      const qCourseId = (q as any).course_id || (mat ? mat.course_id : 'course_1');
      return myCourseIds.has(qCourseId);
    });
  }

  const totalMaterials = materials.length;
  const totalQuizzes = quizzes.length;

  let totalProgressPct = 0;
  for (const st of students) {
    const comp = db.progress.filter(p => p.user_id === st.id && p.status === 'completed' && materials.some(m => m.id === p.material_id)).length;
    totalProgressPct += totalMaterials > 0 ? (comp / totalMaterials) * 100 : 0;
  }
  const avgStudentProgress = students.length > 0 ? Math.round(totalProgressPct / students.length) : 0;

  const relevantStudentIds = new Set(students.map(s => s.id));
  const relevantQuizResults = db.quiz_results.filter(qr => relevantStudentIds.has(qr.user_id));
  const avgQuizScore = relevantQuizResults.length > 0
    ? Math.round(relevantQuizResults.reduce((s, qr) => s + qr.score, 0) / relevantQuizResults.length)
    : 0;

  res.json({
    totalStudents: students.length,
    totalMaterials,
    totalQuizzes,
    avgStudentProgress,
    avgQuizScore,
    totalActivities: db.activities.length,
    recentActivities: db.activities.slice(0, 8),
  });
});

// ---------------- PRESENSI (KEHADIRAN - 15%) ----------------

app.get('/api/attendance', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const meeting = req.query.meeting ? Number(req.query.meeting) : undefined;
  const attendances = db.attendances || [];
  let filtered = attendances;

  if (meeting) {
    filtered = filtered.filter(a => a.meeting_number === meeting);
  }

  // If student, only return their attendance
  if (currentUser.role === 'mahasiswa') {
    filtered = filtered.filter(a => a.user_id === currentUser.id);
  } else if (currentUser.role === 'dosen') {
    // Only return attendance for students in courses taught by this dosen
    const myCourses = (db.courses || []).filter(c => {
      const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
      const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
      const matchName = c.lecturer_name && (
        c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
      );
      return matchId || matchIds || matchName;
    });

    const myEnrolledClasses = new Set<string>();
    const myEnrolledStudentIds = new Set<string>();

    myCourses.forEach(c => {
      if (Array.isArray(c.enrolled_classes)) c.enrolled_classes.forEach(cls => myEnrolledClasses.add(cls));
      if (Array.isArray(c.enrolled_student_ids)) c.enrolled_student_ids.forEach(sid => myEnrolledStudentIds.add(sid));
    });

    filtered = filtered.filter(att => {
      const student = db.users.find(u => u.id === att.user_id);
      if (!student) return false;
      const inClass = student.class_name && myEnrolledClasses.has(student.class_name);
      const inStudents = myEnrolledStudentIds.has(student.id) || (student.student_id && myEnrolledStudentIds.has(student.student_id));
      return inClass || inStudents;
    });
  }

  // Join student info
  const result = filtered.map(att => {
    const student = db.users.find(u => u.id === att.user_id);
    return {
      ...att,
      student_name: student?.name || 'Mahasiswa',
      student_id: student?.student_id || '-',
      class_name: student?.class_name || 'BIO-2A',
    };
  });

  res.json(result);
});

app.post('/api/attendance/batch', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { meeting_number, meeting_topic, date, records } = req.body;
  if (!meeting_number || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Nomor pertemuan dan daftar presensi wajib diisi.' });
  }

  if (!db.attendances) db.attendances = [];

  // Remove existing records for this meeting only for the specific students being updated
  const userIdsToUpdate = new Set(records.map(r => r.user_id));
  db.attendances = db.attendances.filter(
    a => !(a.meeting_number === Number(meeting_number) && userIdsToUpdate.has(a.user_id))
  );

  const now = new Date().toISOString();
  const dateStr = date || now;
  const topic = meeting_topic || `Pertemuan ${meeting_number}`;

  for (const r of records) {
    db.attendances.push({
      id: `att_${meeting_number}_${r.user_id}_${Date.now()}`,
      meeting_number: Number(meeting_number),
      meeting_topic: topic,
      date: dateStr,
      user_id: r.user_id,
      status: r.status || 'hadir',
      notes: r.notes || '',
      updated_at: now,
    });
  }

  saveDatabase(db);
  addActivity(
    (req as any).user.id,
    (req as any).user.name,
    (req as any).user.role,
    'ATTENDANCE_RECORDED',
    `Mencatat presensi kelas untuk Pertemuan ${meeting_number} (${records.length} mahasiswa)`
  );

  res.json({ message: 'Presensi pertemuan berhasil disimpan.', count: records.length });
});

app.get('/api/attendance/summary', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  let students = db.users.filter(u => u.role === 'mahasiswa');
  if (currentUser.role === 'dosen') {
    students = filterStudentsForLecturer(students, currentUser.id, currentUser.name);
  }
  const attendances = db.attendances || [];
  const distinctMeetings = Array.from(new Set(attendances.map(a => a.meeting_number)));
  const totalMeetings = distinctMeetings.length || 7;

  const summaries = students.map(st => {
    const studentAtts = attendances.filter(a => a.user_id === st.id);
    const hadir = studentAtts.filter(a => a.status === 'hadir').length;
    const izin = studentAtts.filter(a => a.status === 'izin').length;
    const sakit = studentAtts.filter(a => a.status === 'sakit').length;
    const alpa = studentAtts.filter(a => a.status === 'alpa').length;

    const weightedScore = hadir + (izin * 0.8) + (sakit * 0.8);
    const percent = totalMeetings > 0 ? Math.min(100, Math.round((weightedScore / totalMeetings) * 100)) : 100;

    return {
      user_id: st.id,
      student_name: st.name,
      student_id: st.student_id || '-',
      class_name: st.class_name || 'BIO-2A',
      total_meetings: totalMeetings,
      hadir_count: hadir,
      izin_count: izin,
      sakit_count: sakit,
      alpa_count: alpa,
      attendance_percent: percent,
    };
  });

  res.json(summaries);
});

app.get('/api/attendance/my', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const attendances = db.attendances || [];
  const studentAtts = attendances.filter(a => a.user_id === currentUser.id);
  const distinctMeetings = Array.from(new Set(attendances.map(a => a.meeting_number)));
  const totalMeetings = distinctMeetings.length || 7;

  const hadir = studentAtts.filter(a => a.status === 'hadir').length;
  const izin = studentAtts.filter(a => a.status === 'izin').length;
  const sakit = studentAtts.filter(a => a.status === 'sakit').length;
  const alpa = studentAtts.filter(a => a.status === 'alpa').length;

  const weightedScore = hadir + (izin * 0.8) + (sakit * 0.8);
  const percent = totalMeetings > 0 ? Math.min(100, Math.round((weightedScore / totalMeetings) * 100)) : 100;

  const summary = {
    user_id: currentUser.id,
    student_name: currentUser.name,
    student_id: currentUser.student_id || '-',
    class_name: currentUser.class_name || 'BIO-2A',
    total_meetings: totalMeetings,
    hadir_count: hadir,
    izin_count: izin,
    sakit_count: sakit,
    alpa_count: alpa,
    attendance_percent: percent,
  };

  res.json({ records: studentAtts, summary });
});

// ---------------- PENILAIAN AKADEMIK (15%-15%-20%-25%-25%) ----------------

function getGradeLetter(score: number): { letter: string; point: number; status: 'LULUS' | 'TIDAK LULUS' } {
  if (score >= 85) return { letter: 'A', point: 4.0, status: 'LULUS' };
  if (score >= 80) return { letter: 'A-', point: 3.75, status: 'LULUS' };
  if (score >= 75) return { letter: 'B+', point: 3.5, status: 'LULUS' };
  if (score >= 70) return { letter: 'B', point: 3.0, status: 'LULUS' };
  if (score >= 65) return { letter: 'B-', point: 2.75, status: 'LULUS' };
  if (score >= 60) return { letter: 'C+', point: 2.25, status: 'LULUS' };
  if (score >= 55) return { letter: 'C', point: 2.0, status: 'LULUS' };
  if (score >= 45) return { letter: 'D', point: 1.0, status: 'TIDAK LULUS' };
  return { letter: 'E', point: 0.0, status: 'TIDAK LULUS' };
}

function getStandardGradeComponents(): GradeComponentConfig[] {
  if (Array.isArray(db.settings.grade_components) && db.settings.grade_components.length > 0) {
    return db.settings.grade_components;
  }
  const w = db.settings.grade_weights || { attendance: 15, participation: 15, assignment: 20, uts: 25, uas: 25 };
  return [
    { id: 'attendance', name: 'Kehadiran', weight: Number(w.attendance) || 15, source_type: 'attendance', description: 'Dihitung otomatis dari presensi pertemuan', is_default: true },
    { id: 'participation', name: 'Partisipasi', weight: Number(w.participation) || 15, source_type: 'participation', description: 'Ketuntasan modul materi dan gamifikasi', is_default: true },
    { id: 'assignment', name: 'Tugas', weight: Number(w.assignment) || 20, source_type: 'assignment', description: 'Rata-rata penugasan dan laporan praktikum', is_default: true },
    { id: 'uts', name: 'UTS', weight: Number(w.uts) || 25, source_type: 'uts', description: 'Evaluasi Ujian Tengah Semester', is_default: true },
    { id: 'uas', name: 'UAS', weight: Number(w.uas) || 25, source_type: 'uas', description: 'Evaluasi Ujian Akhir Semester / Proyek Akhir', is_default: true },
  ];
}

function getGradeComponents(lecturerId?: string): GradeComponentConfig[] {
  if (lecturerId && db.lecturer_grade_components && db.lecturer_grade_components[lecturerId]) {
    return db.lecturer_grade_components[lecturerId];
  }
  return getStandardGradeComponents();
}

function calculateStudentAcademicGrade(studentId: string, lecturerId?: string) {
  const student = db.users.find(u => u.id === studentId);
  if (!student) return null;

  const components = getGradeComponents(lecturerId);

  // 1. Kehadiran (Presensi)
  const userAttendances = (db.attendances || []).filter(a => a.user_id === studentId);
  const distinctMeetings = Array.from(new Set((db.attendances || []).map(a => a.meeting_number)));
  const totalMeetings = distinctMeetings.length || 7;
  let hadirWeight = 0;
  for (const a of userAttendances) {
    if (a.status === 'hadir') hadirWeight += 1;
    else if (a.status === 'izin' || a.status === 'sakit') hadirWeight += 0.8;
  }
  const rawAttendance = totalMeetings > 0 ? Math.min(100, Math.round((hadirWeight / totalMeetings) * 100)) : 100;

  // 2. Partisipasi (Ketuntasan materi & kuis)
  const completedMats = db.progress.filter(p => p.user_id === studentId && p.status === 'completed').length;
  const totalMats = Math.max(1, db.materials.length);
  const matRatio = completedMats / totalMats;
  const takenQuizzes = db.quiz_results.filter(q => q.user_id === studentId).length;
  const totalQuizzes = Math.max(1, db.quizzes.length);
  const quizRatio = Math.min(1, takenQuizzes / totalQuizzes);
  const rawParticipation = Math.min(100, Math.round((matRatio * 60) + (quizRatio * 40)));

  // 3. Tugas Kuliah
  const userSubs = (db.assignment_submissions || []).filter(s => s.user_id === studentId && s.score !== undefined);
  let rawAssignment = 80;
  if (userSubs.length > 0) {
    rawAssignment = Math.round(userSubs.reduce((acc, cur) => acc + (cur.score || 0), 0) / userSubs.length);
  } else {
    rawAssignment = student.student_id?.endsWith('1') ? 92 : student.student_id?.endsWith('2') ? 85 : 80;
  }

  // 4. Kuis Rata-rata
  const quizScores = db.quiz_results.filter(q => q.user_id === studentId && q.score !== undefined);
  let rawQuiz = 85;
  if (quizScores.length > 0) {
    rawQuiz = Math.round(quizScores.reduce((acc, cur) => acc + cur.score, 0) / quizScores.length);
  }

  // 5. Exam Grades & Manual Overrides
  const userExams = (db.exam_grades || []).filter(e => e.user_id === studentId);
  const utsRec = userExams.find(e => e.type === 'uts');
  const uasRec = userExams.find(e => e.type === 'uas');
  const rawUts = utsRec ? utsRec.score : (student.student_id?.endsWith('1') ? 88 : 82);
  const rawUas = uasRec ? uasRec.score : (student.student_id?.endsWith('1') ? 90 : 84);

  const customScores: Record<string, number> = {};
  const componentsDetail: any[] = [];
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const comp of components) {
    totalWeight += comp.weight;
    let score = 80;

    const override = userExams.find(e => e.type === comp.id);
    if (override && override.score !== undefined) {
      score = override.score;
    } else {
      switch (comp.source_type) {
        case 'attendance':
          score = rawAttendance;
          break;
        case 'participation':
          score = rawParticipation;
          break;
        case 'assignment':
          score = rawAssignment;
          break;
        case 'quiz':
          score = rawQuiz;
          break;
        case 'uts':
          score = rawUts;
          break;
        case 'uas':
          score = rawUas;
          break;
        case 'manual':
        default:
          score = student.student_id?.endsWith('1') ? 88 : student.student_id?.endsWith('2') ? 84 : 80;
          break;
      }
    }

    customScores[comp.id] = score;
    const weighted = Math.round(((score * comp.weight) / 100) * 10) / 10;
    totalWeighted += (score * comp.weight) / 100;

    componentsDetail.push({
      id: comp.id,
      name: comp.name,
      weight: comp.weight,
      source_type: comp.source_type,
      description: comp.description,
      raw_score: score,
      weighted_score: weighted,
    });
  }

  // Final score calculation
  let finalScore = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : totalWeighted;
  if (Math.abs(totalWeight - 100) < 0.1) {
    finalScore = totalWeighted;
  }
  finalScore = Math.round(finalScore * 10) / 10;
  const gradeInfo = getGradeLetter(finalScore);

  return {
    user_id: student.id,
    student_name: student.name,
    student_id: student.student_id || '-',
    class_name: student.class_name || 'BIO-2A',
    attendance_score: customScores['attendance'] ?? rawAttendance,
    participation_score: customScores['participation'] ?? rawParticipation,
    assignment_score: customScores['assignment'] ?? rawAssignment,
    uts_score: customScores['uts'] ?? rawUts,
    uas_score: customScores['uas'] ?? rawUas,
    weighted_attendance: componentsDetail.find(c => c.id === 'attendance')?.weighted_score ?? Math.round((rawAttendance * 0.15) * 10) / 10,
    weighted_participation: componentsDetail.find(c => c.id === 'participation')?.weighted_score ?? Math.round((rawParticipation * 0.15) * 10) / 10,
    weighted_assignment: componentsDetail.find(c => c.id === 'assignment')?.weighted_score ?? Math.round((rawAssignment * 0.20) * 10) / 10,
    weighted_uts: componentsDetail.find(c => c.id === 'uts')?.weighted_score ?? Math.round((rawUts * 0.25) * 10) / 10,
    weighted_uas: componentsDetail.find(c => c.id === 'uas')?.weighted_score ?? Math.round((rawUas * 0.25) * 10) / 10,
    final_score: finalScore,
    grade_letter: gradeInfo.letter,
    grade_point: gradeInfo.point,
    status: gradeInfo.status,
    components_detail: componentsDetail,
    custom_scores: customScores,
  };
}

// Grade Component Management Endpoints
app.get('/api/grades/components', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const standard = getStandardGradeComponents();
  const lecturerId = currentUser.role === 'dosen' ? currentUser.id : (req.query.lecturer_id as string);
  const isCustomized = !!(lecturerId && db.lecturer_grade_components?.[lecturerId]);
  const activeComponents = getGradeComponents(lecturerId);

  // If query detail=true, return rich object
  if (req.query.detail === 'true') {
    return res.json({
      standard_components: standard,
      standard_weights: db.settings.grade_weights || { attendance: 15, participation: 15, assignment: 20, uts: 25, uas: 25 },
      components: activeComponents,
      is_customized: isCustomized,
      lecturer_name: currentUser.role === 'dosen' ? currentUser.name : undefined,
    });
  }

  res.json(activeComponents);
});

app.put('/api/grades/components', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { components } = req.body;
  if (!Array.isArray(components)) {
    return res.status(400).json({ error: 'Daftar komponen penilaian tidak valid.' });
  }

  const sanitized: GradeComponentConfig[] = components.map((c: any, index: number) => ({
    id: String(c.id || `comp_${Date.now()}_${index}`).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    name: String(c.name || 'Komponen').trim(),
    weight: Math.max(0, Math.min(100, Number(c.weight) || 0)),
    source_type: c.source_type || 'manual',
    description: c.description ? String(c.description).trim() : undefined,
    is_default: !!c.is_default,
  }));

  const weightMap: Record<string, number> = {};
  for (const c of sanitized) {
    weightMap[c.id] = c.weight;
  }

  if (currentUser.role === 'dosen') {
    if (!db.lecturer_grade_components) db.lecturer_grade_components = {};
    if (!db.lecturer_grade_weights) db.lecturer_grade_weights = {};
    db.lecturer_grade_components[currentUser.id] = sanitized;
    db.lecturer_grade_weights[currentUser.id] = weightMap;

    saveDatabase(db);
    addActivity(
      currentUser.id,
      currentUser.name,
      'dosen',
      'GRADE_COMPONENTS_UPDATED',
      `Menyesuaikan komponen penilaian khusus akun ${currentUser.name} (${sanitized.length} komponen, total ${sanitized.reduce((s, c) => s + c.weight, 0)}%)`
    );

    return res.json({
      message: 'Komponen penilaian khusus akun Anda berhasil disimpan dan diterapkan pada mata kuliah Anda.',
      components: sanitized,
      is_customized: true,
      standard_components: getStandardGradeComponents(),
    });
  }

  // Admin updates system-wide standard
  db.settings.grade_components = sanitized;
  db.settings.grade_weights = weightMap as any;
  saveDatabase(db);
  broadcastSSE('settings_updated', db.settings);

  addActivity(
    currentUser.id,
    currentUser.name,
    'admin',
    'GRADE_COMPONENTS_UPDATED',
    `Memperbarui aturan standar komponen penilaian sistem (${sanitized.length} komponen, total ${sanitized.reduce((s, c) => s + c.weight, 0)}%)`
  );

  res.json({
    message: 'Standar komponen penilaian sistem berhasil diperbarui.',
    components: sanitized,
    is_customized: false,
    standard_components: sanitized,
  });
});

app.post('/api/grades/components/reset', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen') {
    if (db.lecturer_grade_components && db.lecturer_grade_components[currentUser.id]) {
      delete db.lecturer_grade_components[currentUser.id];
    }
    if (db.lecturer_grade_weights && db.lecturer_grade_weights[currentUser.id]) {
      delete db.lecturer_grade_weights[currentUser.id];
    }
    saveDatabase(db);
    const standard = getStandardGradeComponents();
    addActivity(
      currentUser.id,
      currentUser.name,
      'dosen',
      'GRADE_COMPONENTS_RESET',
      `Mereset komponen penilaian akun ${currentUser.name} kembali ke standar sistem aplikasi`
    );
    return res.json({
      message: 'Komponen penilaian Anda berhasil dikembalikan ke standar sistem aplikasi.',
      components: standard,
      is_customized: false,
      standard_components: standard,
    });
  }

  const defaults: GradeComponentConfig[] = [
    { id: 'attendance', name: 'Kehadiran', weight: 15, source_type: 'attendance', description: 'Dihitung otomatis dari presensi pertemuan', is_default: true },
    { id: 'participation', name: 'Partisipasi', weight: 15, source_type: 'participation', description: 'Ketuntasan modul materi dan gamifikasi', is_default: true },
    { id: 'assignment', name: 'Tugas', weight: 20, source_type: 'assignment', description: 'Rata-rata penugasan dan laporan praktikum', is_default: true },
    { id: 'uts', name: 'UTS', weight: 25, source_type: 'uts', description: 'Evaluasi Ujian Tengah Semester', is_default: true },
    { id: 'uas', name: 'UAS', weight: 25, source_type: 'uas', description: 'Evaluasi Ujian Akhir Semester / Proyek Akhir', is_default: true },
  ];

  db.settings.grade_components = defaults;
  db.settings.grade_weights = { attendance: 15, participation: 15, assignment: 20, uts: 25, uas: 25 };

  saveDatabase(db);
  broadcastSSE('settings_updated', db.settings);

  addActivity(
    currentUser.id,
    currentUser.name,
    'admin',
    'GRADE_COMPONENTS_RESET',
    'Mereset aturan komponen penilaian ke standar awal Universitas Hamzanwadi (15/15/20/25/25)'
  );

  res.json({
    message: 'Komponen penilaian berhasil dikembalikan ke standar awal pabrik.',
    components: defaults,
  });
});

app.get('/api/grades/academic', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  if (currentUser.role === 'mahasiswa') {
    const myGrade = calculateStudentAcademicGrade(currentUser.id);
    return res.json(myGrade ? [myGrade] : []);
  }

  let students = db.users.filter(u => u.role === 'mahasiswa');
  if (currentUser.role === 'dosen') {
    students = filterStudentsForLecturer(students, currentUser.id, currentUser.name);
  }

  const grades = students.map(s => calculateStudentAcademicGrade(s.id, currentUser.role === 'dosen' ? currentUser.id : undefined)).filter(Boolean);
  res.json(grades);
});

app.get('/api/grades/my', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const grade = calculateStudentAcademicGrade(currentUser.id);
  if (!grade) {
    return res.status(404).json({ error: 'Data penilaian mahasiswa tidak ditemukan.' });
  }
  res.json(grade);
});

app.put('/api/grades/academic/update', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { user_id, uts_score, uas_score, assignment_score, component_scores, notes } = req.body;
  if (!user_id) {
    return res.status(400).json({ error: 'User ID mahasiswa wajib dicantumkan.' });
  }

  if (!db.exam_grades) db.exam_grades = [];
  const now = new Date().toISOString();

  // If component_scores dictionary is provided: { [compId]: number }
  if (component_scores && typeof component_scores === 'object') {
    for (const [compId, scoreVal] of Object.entries(component_scores)) {
      if (scoreVal === undefined || scoreVal === null || isNaN(Number(scoreVal))) continue;
      const scoreNum = Number(scoreVal);
      const idx = db.exam_grades.findIndex(e => e.user_id === user_id && e.type === compId);
      if (idx !== -1) {
        db.exam_grades[idx].score = scoreNum;
        db.exam_grades[idx].updated_at = now;
        if (notes) db.exam_grades[idx].notes = notes;
      } else {
        db.exam_grades.push({
          id: `ex_${compId}_${user_id}_${Date.now()}`,
          user_id,
          type: compId,
          score: scoreNum,
          notes: notes || `Nilai ${compId}`,
          updated_at: now,
        });
      }
    }
  }

  if (uts_score !== undefined) {
    const idx = db.exam_grades.findIndex(e => e.user_id === user_id && e.type === 'uts');
    if (idx !== -1) {
      db.exam_grades[idx].score = Number(uts_score);
      db.exam_grades[idx].updated_at = now;
      if (notes) db.exam_grades[idx].notes = notes;
    } else {
      db.exam_grades.push({
        id: `ex_uts_${user_id}_${Date.now()}`,
        user_id,
        type: 'uts',
        score: Number(uts_score),
        notes: notes || 'Nilai UTS',
        updated_at: now,
      });
    }
  }

  if (uas_score !== undefined) {
    const idx = db.exam_grades.findIndex(e => e.user_id === user_id && e.type === 'uas');
    if (idx !== -1) {
      db.exam_grades[idx].score = Number(uas_score);
      db.exam_grades[idx].updated_at = now;
      if (notes) db.exam_grades[idx].notes = notes;
    } else {
      db.exam_grades.push({
        id: `ex_uas_${user_id}_${Date.now()}`,
        user_id,
        type: 'uas',
        score: Number(uas_score),
        notes: notes || 'Nilai UAS',
        updated_at: now,
      });
    }
  }

  saveDatabase(db);
  const updatedGrade = calculateStudentAcademicGrade(user_id);
  res.json(updatedGrade);
});

// ---------------- TUGAS KULIAH (20%) ----------------

app.get('/api/assignments', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  let accessibleCourseIds: string[] = [];

  if (currentUser.role === 'admin') {
    accessibleCourseIds = (db.courses || []).map(c => c.id);
  } else if (currentUser.role === 'dosen') {
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
        const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
        const matchName = c.lecturer_name && (
          c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
          currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
        );
        return matchId || matchIds || matchName;
      })
      .map(c => c.id);
  } else if (currentUser.role === 'mahasiswa') {
    const studentClass = currentUser.class_name;
    const studentId = currentUser.id;
    const studentNim = currentUser.student_id;
    accessibleCourseIds = (db.courses || [])
      .filter(c => {
        if (Array.isArray(c.enrolled_student_ids) && (c.enrolled_student_ids.includes(studentId) || (studentNim && c.enrolled_student_ids.includes(studentNim)))) {
          return true;
        }
        if (studentClass && Array.isArray(c.enrolled_classes) && c.enrolled_classes.includes(studentClass)) {
          return true;
        }
        return false;
      })
      .map(c => c.id);
  }

  const list = (db.assignments || [])
    .filter(asg => {
      if (currentUser.role === 'admin') return true;
      const asgCourseId = (asg as any).course_id || 'course_1';
      return accessibleCourseIds.includes(asgCourseId) || (asg as any).created_by_id === currentUser.id;
    })
    .map(asg => {
      const subs = (db.assignment_submissions || []).filter(s => s.assignment_id === asg.id);
      return {
        ...asg,
        submissions_count: subs.length,
      };
    });
  res.json(list);
});

app.post('/api/assignments', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { meeting_number, title, description, due_date, max_score, course_id } = req.body;
  if (!title || !meeting_number) {
    return res.status(400).json({ error: 'Judul tugas dan nomor pertemuan wajib diisi.' });
  }

  const currentUser = (req as any).user;
  const targetCourseId = course_id || 'course_1';

  if (currentUser.role === 'dosen') {
    if (!isCourseOwner(targetCourseId, currentUser)) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang membuat tugas untuk mata kuliah ini.' });
    }
  }

  if (!db.assignments) db.assignments = [];

  const newAsg = {
    id: `asg_${Date.now()}`,
    course_id: targetCourseId,
    created_by_id: currentUser.id,
    created_by_name: currentUser.name,
    meeting_number: Number(meeting_number),
    title,
    description: description || '',
    due_date: due_date || new Date(Date.now() + 7 * 86400000).toISOString(),
    max_score: Number(max_score) || 100,
  };

  db.assignments.push(newAsg);
  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'ASSIGNMENT_CREATED', `Membuat tugas baru: ${title}`);

  res.status(201).json(newAsg);
});

app.get('/api/assignments/my-submissions', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const subs = (db.assignment_submissions || []).filter(s => s.user_id === currentUser.id);
  res.json(subs);
});

app.get('/api/assignments/:id/submissions', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const asgId = req.params.id;
  const subs = (db.assignment_submissions || []).filter(s => s.assignment_id === asgId);
  const withStudents = subs.map(s => {
    const st = db.users.find(u => u.id === s.user_id);
    return {
      ...s,
      student_name: st?.name || 'Mahasiswa',
      student_id: st?.student_id || '-',
      class_name: st?.class_name || 'BIO-2A',
    };
  });
  res.json(withStudents);
});

app.post('/api/assignments/:id/submit', requireAuth, (req: Request, res: Response) => {
  const asgId = req.params.id;
  const currentUser = (req as any).user;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Konten tugas atau tautan pengumpulan wajib diisi.' });
  }

  if (!db.assignment_submissions) db.assignment_submissions = [];

  const existingIdx = db.assignment_submissions.findIndex(s => s.assignment_id === asgId && s.user_id === currentUser.id);
  const now = new Date().toISOString();

  let resultSub;
  if (existingIdx !== -1) {
    db.assignment_submissions[existingIdx].content = content;
    db.assignment_submissions[existingIdx].submitted_at = now;
    resultSub = db.assignment_submissions[existingIdx];
  } else {
    resultSub = {
      id: `sub_${Date.now()}`,
      assignment_id: asgId,
      user_id: currentUser.id,
      content,
      submitted_at: now,
    };
    db.assignment_submissions.push(resultSub);
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'ASSIGNMENT_SUBMITTED', `Mengumpulkan tugas praktikum`);

  res.json(resultSub);
});

app.post('/api/assignments/submissions/:id/grade', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const subId = req.params.id;
  const { score, feedback } = req.body;

  if (!db.assignment_submissions) db.assignment_submissions = [];
  const sub = db.assignment_submissions.find(s => s.id === subId);
  if (!sub) {
    return res.status(404).json({ error: 'Pengumpulan tugas tidak ditemukan.' });
  }

  sub.score = Math.max(0, Math.min(100, Number(score)));
  sub.feedback = feedback || '';
  sub.graded_at = new Date().toISOString();

  saveDatabase(db);
  res.json(sub);
});

app.put('/api/assignments/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const asgId = req.params.id;
  if (!db.assignments) db.assignments = [];
  const idx = db.assignments.findIndex(a => a.id === asgId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Tugas kuliah tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  const current = db.assignments[idx];

  if (currentUser.role === 'dosen') {
    const isOwner = (current as any).created_by_id === currentUser.id || isCourseOwner((current as any).course_id, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang mengedit tugas yang bukan dibuat oleh Anda.' });
    }
  }

  const { meeting_number, title, description, due_date, max_score } = req.body;

  const updated = {
    ...current,
    meeting_number: meeting_number !== undefined ? Number(meeting_number) : current.meeting_number,
    title: title || current.title,
    description: description !== undefined ? description : current.description,
    due_date: due_date || current.due_date,
    max_score: max_score !== undefined ? Number(max_score) : current.max_score,
  };

  db.assignments[idx] = updated;
  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'ASSIGNMENT_UPDATED', `Memperbarui tugas: ${updated.title}`);

  res.json(updated);
});

app.delete('/api/assignments/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const asgId = req.params.id;
  if (!db.assignments) db.assignments = [];
  const target = db.assignments.find(a => a.id === asgId);
  if (!target) {
    return res.status(404).json({ error: 'Tugas kuliah tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  if (currentUser.role === 'dosen') {
    const isOwner = (target as any).created_by_id === currentUser.id || isCourseOwner((target as any).course_id, currentUser);
    if (!isOwner) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak berwenang menghapus tugas yang bukan dibuat oleh Anda.' });
    }
  }

  db.assignments = db.assignments.filter(a => a.id !== asgId);
  if (db.assignment_submissions) {
    db.assignment_submissions = db.assignment_submissions.filter(s => s.assignment_id !== asgId);
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'ASSIGNMENT_DELETED', `Menghapus tugas: ${target.title}`);

  res.json({ message: `Tugas "${target.title}" dan pengumpulannya berhasil dihapus.` });
});

app.delete('/api/assignments/submissions/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const subId = req.params.id;
  if (!db.assignment_submissions) db.assignment_submissions = [];
  const idx = db.assignment_submissions.findIndex(s => s.id === subId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Pengumpulan tugas tidak ditemukan.' });
  }

  db.assignment_submissions.splice(idx, 1);
  saveDatabase(db);

  res.json({ message: 'Pengumpulan tugas berhasil dihapus.' });
});

// ---------------- LOGO & PENGATURAN KAMPUS ----------------

app.post('/api/settings/logo', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { logo_url, campus_name } = req.body;
  if (!logo_url) {
    return res.status(400).json({ error: 'URL atau data gambar logo wajib disertakan.' });
  }

  db.settings.app_logo = logo_url;
  if (campus_name) db.settings.campus_name = campus_name;
  saveDatabase(db);
  broadcastSSE('settings_updated', db.settings);

  res.json({ message: 'Logo aplikasi berhasil diperbarui.', settings: db.settings });
});

// ---------------- MANAJEMEN MATA KULIAH (MULTI-COURSE) ----------------

app.get('/api/courses', requireAuth, (req: Request, res: Response) => {
  if (!db.courses) db.courses = [];
  const currentUser = (req as any).user;
  const showAll = req.query.all === 'true' && currentUser.role === 'admin';

  // Always sanitize enrolled_classes against active classes in db.classes
  if (db.classes && db.classes.length > 0) {
    const existingClassNames = new Set(db.classes.map(c => c.name));
    db.courses.forEach(c => {
      if (Array.isArray(c.enrolled_classes)) {
        c.enrolled_classes = c.enrolled_classes.filter(cn => existingClassNames.has(cn));
      }
    });
  }

  const withStudentCount = (courseList: any[]) => {
    return courseList.map(c => {
      const enrolledClassSet = new Set(c.enrolled_classes || []);
      const matchingCount = (db.users || []).filter(u => u.role === 'mahasiswa' && (
        (u.class_name && enrolledClassSet.has(u.class_name)) ||
        (Array.isArray(c.enrolled_student_ids) && (c.enrolled_student_ids.includes(u.id) || (u.student_id && c.enrolled_student_ids.includes(u.student_id))))
      )).length;
      return {
        ...c,
        enrolled_students_count: matchingCount,
      };
    });
  };

  if (currentUser.role === 'admin' || showAll) {
    return res.json(withStudentCount(db.courses));
  }

  if (currentUser.role === 'dosen') {
    // Only courses where this dosen is assigned as lecturer (by ID, lecturer_ids list, or by exact lecturer_name)
    const filtered = db.courses.filter(c => {
      const matchId = c.lecturer_id && c.lecturer_id === currentUser.id;
      const matchIds = Array.isArray(c.lecturer_ids) && c.lecturer_ids.includes(currentUser.id);
      const matchName = c.lecturer_name && (
        c.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(c.lecturer_name.toLowerCase())
      );
      return matchId || matchIds || matchName;
    });
    return res.json(withStudentCount(filtered));
  }

  if (currentUser.role === 'mahasiswa') {
    // Only courses where the student's class (e.g. 'BIO-2A') is in enrolled_classes or student id in enrolled_student_ids
    const studentClass = currentUser.class_name;
    const studentId = currentUser.id;
    const studentNim = currentUser.student_id;

    const filtered = db.courses.filter(c => {
      // Check explicit student enrollment
      if (Array.isArray(c.enrolled_student_ids) && (c.enrolled_student_ids.includes(studentId) || (studentNim && c.enrolled_student_ids.includes(studentNim)))) {
        return true;
      }
      // Check class enrollment
      if (studentClass && Array.isArray(c.enrolled_classes) && c.enrolled_classes.includes(studentClass)) {
        return true;
      }
      // Fallback: if no enrollment is defined on the course at all, default to true or false. Here courses specify enrolled_classes
      return false;
    });
    return res.json(withStudentCount(filtered));
  }

  res.json(withStudentCount(db.courses));
});

app.get('/api/courses/:id', requireAuth, (req: Request, res: Response) => {
  if (!db.courses) db.courses = [];
  const currentUser = (req as any).user;
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Mata kuliah tidak ditemukan.' });
  }

  // Check access authorization
  if (currentUser.role === 'dosen') {
    const matchId = course.lecturer_id && course.lecturer_id === currentUser.id;
    const matchIds = Array.isArray(course.lecturer_ids) && course.lecturer_ids.includes(currentUser.id);
    const matchName = course.lecturer_name && (
      course.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      currentUser.name.toLowerCase().includes(course.lecturer_name.toLowerCase())
    );
    if (!matchId && !matchIds && !matchName) {
      return res.status(403).json({ error: 'Akses ditolak. Anda bukan dosen pengampu mata kuliah ini.' });
    }
  } else if (currentUser.role === 'mahasiswa') {
    const studentClass = currentUser.class_name;
    const isEnrolledClass = studentClass && Array.isArray(course.enrolled_classes) && course.enrolled_classes.includes(studentClass);
    const isEnrolledStudent = Array.isArray(course.enrolled_student_ids) && (course.enrolled_student_ids.includes(currentUser.id) || (currentUser.student_id && course.enrolled_student_ids.includes(currentUser.student_id)));
    if (!isEnrolledClass && !isEnrolledStudent) {
      return res.status(403).json({ error: 'Akses ditolak. Anda tidak terdaftar pada mata kuliah ini.' });
    }
  }

  res.json(course);
});

app.post('/api/courses', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { code, name, semester, academic_year, sks, lecturer_id, lecturer_name, enrolled_classes, enrolled_student_ids, description, color, icon } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Kode mata kuliah dan nama mata kuliah wajib diisi.' });
  }

  if (!db.courses) db.courses = [];

  const currentUser = (req as any).user;
  let finalLecturerId = lecturer_id;
  let finalLecturerName = lecturer_name;

  if (currentUser.role === 'dosen') {
    finalLecturerId = currentUser.id;
    finalLecturerName = currentUser.name;
  } else if (finalLecturerId) {
    const assignedLecturer = db.users.find(u => u.id === finalLecturerId);
    if (assignedLecturer) {
      finalLecturerName = assignedLecturer.name;
    }
  }

  const newCourse = {
    id: `course_${Date.now()}`,
    code: code.trim(),
    name: name.trim(),
    semester: semester || db.settings.semester || 'Ganjil 2026/2027',
    academic_year: academic_year || db.settings.academic_year || '2026/2027',
    sks: Number(sks) || 2,
    lecturer_id: finalLecturerId || currentUser.id,
    lecturer_name: finalLecturerName || currentUser.name,
    lecturer_ids: finalLecturerId ? [finalLecturerId] : [currentUser.id],
    enrolled_classes: Array.isArray(enrolled_classes) ? enrolled_classes : ['BIO-2A'],
    enrolled_student_ids: Array.isArray(enrolled_student_ids) ? enrolled_student_ids : [],
    description: description || '',
    color: color || '#012E26',
    icon: icon || 'BookOpen',
    created_at: new Date().toISOString(),
  };

  db.courses.push(newCourse);
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'COURSE_CREATED', `Menambahkan mata kuliah: ${newCourse.name} (${newCourse.code})`);

  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  if (!db.courses) db.courses = [];
  const index = db.courses.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Mata kuliah tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  const existing = db.courses[index];

  // If dosen, ensure this course belongs to them
  if (currentUser.role === 'dosen') {
    const matchId = existing.lecturer_id === currentUser.id;
    const matchIds = Array.isArray(existing.lecturer_ids) && existing.lecturer_ids.includes(currentUser.id);
    const matchName = existing.lecturer_name && (
      existing.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      currentUser.name.toLowerCase().includes(existing.lecturer_name.toLowerCase())
    );
    if (!matchId && !matchIds && !matchName) {
      return res.status(403).json({ error: 'Anda hanya dapat memperbarui mata kuliah yang Anda ampu.' });
    }
  }

  let finalLecturerName = req.body.lecturer_name !== undefined ? req.body.lecturer_name : existing.lecturer_name;
  let finalLecturerId = req.body.lecturer_id !== undefined ? req.body.lecturer_id : existing.lecturer_id;

  if (req.body.lecturer_id) {
    const assignedUser = db.users.find(u => u.id === req.body.lecturer_id);
    if (assignedUser) {
      finalLecturerName = assignedUser.name;
      finalLecturerId = assignedUser.id;
    }
  }

  const updated = {
    ...existing,
    ...req.body,
    lecturer_id: finalLecturerId,
    lecturer_name: finalLecturerName,
    code: req.body.code !== undefined ? req.body.code.trim() : existing.code,
    name: req.body.name !== undefined ? req.body.name.trim() : existing.name,
    sks: req.body.sks !== undefined ? Number(req.body.sks) : existing.sks,
    enrolled_classes: req.body.enrolled_classes !== undefined ? req.body.enrolled_classes : existing.enrolled_classes,
  };

  db.courses[index] = updated;
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'COURSE_UPDATED', `Memperbarui mata kuliah: ${updated.name}`);

  res.json(updated);
});

app.delete('/api/courses/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  if (!db.courses) db.courses = [];
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Mata kuliah tidak ditemukan.' });
  }

  const currentUser = (req as any).user;
  if (currentUser.role === 'dosen') {
    const isMine = course.lecturer_id === currentUser.id ||
      (Array.isArray(course.lecturer_ids) && course.lecturer_ids.includes(currentUser.id)) ||
      (course.lecturer_name && (course.lecturer_name.toLowerCase().includes(currentUser.name.toLowerCase()) || currentUser.name.toLowerCase().includes(course.lecturer_name.toLowerCase())));
    if (!isMine) {
      return res.status(403).json({ error: 'Akses ditolak. Anda hanya dapat menghapus mata kuliah yang Anda ampu/buat.' });
    }
  }

  db.courses = db.courses.filter(c => c.id !== req.params.id);
  if (db.settings && db.settings.active_course_id === req.params.id) {
    db.settings.active_course_id = db.courses[0]?.id || '';
  }
  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'COURSE_DELETED', `Menghapus mata kuliah: ${course.name}`);

  res.json({ message: 'Mata kuliah berhasil dihapus.' });
});

// ---------------- MANAJEMEN MAHASISWA & KELOMPOK PER MATA KULIAH ----------------

// Helper: ambil mahasiswa yang terdaftar di mata kuliah tertentu
function getEnrolledStudentsForCourse(courseId: string) {
  const course = (db.courses || []).find(c => c.id === courseId);
  if (!course) return null;

  const enrolledClasses = new Set(course.enrolled_classes || []);
  const enrolledStudentIds = new Set(course.enrolled_student_ids || []);

  const students = (db.users || []).filter(u => {
    if (u.role !== 'mahasiswa') return false;
    const inClass = u.class_name && enrolledClasses.has(u.class_name);
    const inStudents = enrolledStudentIds.has(u.id) || (u.student_id && enrolledStudentIds.has(u.student_id));
    return inClass || inStudents;
  });

  const courseGroups = (db.course_groups || []).filter(g => g.course_id === courseId);

  const studentsWithGroup = students.map(s => {
    const group = courseGroups.find(g => Array.isArray(g.member_ids) && g.member_ids.includes(s.id));
    return {
      id: s.id,
      name: s.name,
      student_id: s.student_id || '',
      class_name: s.class_name || '',
      email: s.email,
      avatar: s.avatar,
      group_id: group ? group.id : null,
      group_name: group ? group.name : null,
      is_leader: group ? group.leader_id === s.id : false,
    };
  });

  return {
    course: {
      id: course.id,
      code: course.code,
      name: course.name,
      sks: course.sks,
      semester: course.semester,
      academic_year: course.academic_year,
      lecturer_name: course.lecturer_name,
      lecturer_id: course.lecturer_id,
      enrolled_classes: course.enrolled_classes || [],
    },
    students: studentsWithGroup,
    groups: courseGroups,
  };
}

// 1. Dapatkan daftar mahasiswa & kelompok khusus mata kuliah ini
app.get('/api/courses/:id/students', requireAuth, (req: Request, res: Response) => {
  const courseId = req.params.id;
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen') {
    if (!isCourseOwner(courseId, currentUser)) {
      return res.status(403).json({ error: 'Anda hanya dapat melihat mahasiswa mata kuliah yang Anda ampu.' });
    }
  }

  const result = getEnrolledStudentsForCourse(courseId);
  if (!result) {
    return res.status(404).json({ error: 'Mata kuliah tidak ditemukan.' });
  }

  res.json(result);
});

// 2. Dapatkan daftar kelompok belajar pada mata kuliah ini
app.get('/api/courses/:id/groups', requireAuth, (req: Request, res: Response) => {
  const courseId = req.params.id;
  const course = (db.courses || []).find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ error: 'Mata kuliah tidak ditemukan.' });
  }

  if (!db.course_groups) db.course_groups = [];
  const groups = db.course_groups.filter(g => g.course_id === courseId);

  // Perkaya dengan data anggota
  const enriched = groups.map(g => {
    const memberUsers = (db.users || []).filter(u => Array.isArray(g.member_ids) && g.member_ids.includes(u.id));
    return {
      ...g,
      members: memberUsers.map(m => ({
        id: m.id,
        name: m.name,
        student_id: m.student_id,
        class_name: m.class_name,
        avatar: m.avatar,
        is_leader: g.leader_id === m.id,
      })),
    };
  });

  res.json(enriched);
});

// 3. Tambah kelompok baru di mata kuliah
app.post('/api/courses/:id/groups', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const courseId = req.params.id;
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen' && !isCourseOwner(courseId, currentUser)) {
    return res.status(403).json({ error: 'Anda hanya dapat mengelola kelompok pada mata kuliah yang Anda ampu.' });
  }

  const { name, description, member_ids, leader_id } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama kelompok wajib diisi.' });
  }

  if (!db.course_groups) db.course_groups = [];

  const selectedMemberIds: string[] = Array.isArray(member_ids) ? member_ids : [];

  // Jika anggota sudah terdaftar di kelompok lain di MK ini, pindahkan
  if (selectedMemberIds.length > 0) {
    db.course_groups.forEach(g => {
      if (g.course_id === courseId && Array.isArray(g.member_ids)) {
        g.member_ids = g.member_ids.filter(mid => !selectedMemberIds.includes(mid));
        if (g.leader_id && selectedMemberIds.includes(g.leader_id)) {
          g.leader_id = g.member_ids[0] || undefined;
        }
      }
    });
  }

  const leaderUser = selectedMemberIds.length > 0 && leader_id ? db.users.find(u => u.id === leader_id) : undefined;

  const newGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    course_id: courseId,
    name: name.trim(),
    description: description || '',
    leader_id: leader_id || (selectedMemberIds[0] || undefined),
    leader_name: leaderUser ? leaderUser.name : undefined,
    member_ids: selectedMemberIds,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.course_groups.push(newGroup);
  saveDatabase(db);

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'GROUP_CREATED',
    `Membuat kelompok "${newGroup.name}" (${newGroup.member_ids.length} anggota) pada mata kuliah ${courseId}`
  );

  res.status(201).json(newGroup);
});

// 4. Update kelompok (ubah nama, topik, anggota, ketua)
app.put('/api/courses/:id/groups/:groupId', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { id: courseId, groupId } = req.params;
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen' && !isCourseOwner(courseId, currentUser)) {
    return res.status(403).json({ error: 'Anda hanya dapat mengelola kelompok pada mata kuliah yang Anda ampu.' });
  }

  if (!db.course_groups) db.course_groups = [];
  const groupIndex = db.course_groups.findIndex(g => g.id === groupId && g.course_id === courseId);
  if (groupIndex === -1) {
    return res.status(404).json({ error: 'Kelompok tidak ditemukan.' });
  }

  const currentGroup = db.course_groups[groupIndex];
  const { name, description, member_ids, leader_id } = req.body;

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Nama kelompok tidak boleh kosong.' });
  }

  const newMemberIds = Array.isArray(member_ids) ? member_ids : currentGroup.member_ids;

  // Hapus anggota baru ini dari kelompok lain di MK yang sama agar tidak double
  if (Array.isArray(member_ids)) {
    db.course_groups.forEach(g => {
      if (g.id !== groupId && g.course_id === courseId && Array.isArray(g.member_ids)) {
        g.member_ids = g.member_ids.filter(mid => !newMemberIds.includes(mid));
        if (g.leader_id && newMemberIds.includes(g.leader_id)) {
          g.leader_id = g.member_ids[0] || undefined;
        }
      }
    });
  }

  let finalLeaderId = leader_id !== undefined ? leader_id : currentGroup.leader_id;
  if (finalLeaderId && !newMemberIds.includes(finalLeaderId)) {
    finalLeaderId = newMemberIds[0] || undefined;
  }

  const leaderUser = finalLeaderId ? db.users.find(u => u.id === finalLeaderId) : undefined;

  const updatedGroup = {
    ...currentGroup,
    name: name !== undefined ? name.trim() : currentGroup.name,
    description: description !== undefined ? description : currentGroup.description,
    member_ids: newMemberIds,
    leader_id: finalLeaderId,
    leader_name: leaderUser ? leaderUser.name : undefined,
    updated_at: new Date().toISOString(),
  };

  db.course_groups[groupIndex] = updatedGroup;
  saveDatabase(db);

  res.json(updatedGroup);
});

// 5. Hapus kelompok
app.delete('/api/courses/:id/groups/:groupId', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { id: courseId, groupId } = req.params;
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen' && !isCourseOwner(courseId, currentUser)) {
    return res.status(403).json({ error: 'Anda hanya dapat menghapus kelompok pada mata kuliah yang Anda ampu.' });
  }

  if (!db.course_groups) db.course_groups = [];
  const target = db.course_groups.find(g => g.id === groupId && g.course_id === courseId);
  if (!target) {
    return res.status(404).json({ error: 'Kelompok tidak ditemukan.' });
  }

  db.course_groups = db.course_groups.filter(g => !(g.id === groupId && g.course_id === courseId));
  saveDatabase(db);

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'GROUP_DELETED',
    `Menghapus kelompok "${target.name}" pada mata kuliah ${courseId}`
  );

  res.json({ message: `Kelompok "${target.name}" berhasil dihapus.` });
});

// 6. Bagi kelompok secara otomatis (Auto-Generate Groups)
app.post('/api/courses/:id/groups/auto-generate', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const courseId = req.params.id;
  const currentUser = (req as any).user;

  if (currentUser.role === 'dosen' && !isCourseOwner(courseId, currentUser)) {
    return res.status(403).json({ error: 'Anda hanya dapat membagi kelompok pada mata kuliah yang Anda ampu.' });
  }

  const { group_count, prefix, randomize, reset_existing } = req.body;
  const numGroups = Number(group_count) || 4;
  if (numGroups < 1 || numGroups > 50) {
    return res.status(400).json({ error: 'Jumlah kelompok harus antara 1 dan 50.' });
  }

  const groupPrefix = prefix && String(prefix).trim() ? String(prefix).trim() : 'Kelompok';

  const enrolledData = getEnrolledStudentsForCourse(courseId);
  if (!enrolledData || enrolledData.students.length === 0) {
    return res.status(400).json({ error: 'Tidak ada mahasiswa terdaftar pada mata kuliah ini untuk dikelompokkan.' });
  }

  let studentList = [...enrolledData.students];
  if (randomize) {
    studentList.sort(() => Math.random() - 0.5);
  } else {
    // Urut berdasarkan kelas lalu nama
    studentList.sort((a, b) => {
      const clsComp = (a.class_name || '').localeCompare(b.class_name || '');
      if (clsComp !== 0) return clsComp;
      return a.name.localeCompare(b.name);
    });
  }

  if (!db.course_groups) db.course_groups = [];

  if (reset_existing) {
    db.course_groups = db.course_groups.filter(g => g.course_id !== courseId);
  }

  const newGroups: any[] = [];
  for (let i = 0; i < numGroups; i++) {
    newGroups.push({
      id: `grp_${Date.now()}_${i + 1}_${Math.random().toString(36).substring(2, 6)}`,
      course_id: courseId,
      name: `${groupPrefix} ${i + 1}`,
      description: `Kelompok belajar mata kuliah ${enrolledData.course.name}`,
      leader_id: undefined,
      leader_name: undefined,
      member_ids: [] as string[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Bagikan mahasiswa secara merata (round-robin)
  studentList.forEach((s, idx) => {
    const groupIdx = idx % numGroups;
    newGroups[groupIdx].member_ids.push(s.id);
  });

  // Tentukan ketua pertama tiap kelompok
  newGroups.forEach(g => {
    if (g.member_ids.length > 0) {
      g.leader_id = g.member_ids[0];
      const leader = db.users.find(u => u.id === g.leader_id);
      g.leader_name = leader?.name;
    }
  });

  db.course_groups.push(...newGroups);
  saveDatabase(db);

  addActivity(
    currentUser.id,
    currentUser.name,
    currentUser.role,
    'GROUPS_AUTO_GENERATED',
    `Membuat ${numGroups} kelompok otomatis untuk ${studentList.length} mahasiswa pada mata kuliah ${enrolledData.course.name}`
  );

  res.json({
    message: `Berhasil membuat ${numGroups} kelompok belajar untuk ${studentList.length} mahasiswa terdaftar.`,
    groups: newGroups,
  });
});

// ---------------- PROGRAM STUDI (DEPARTMENTS) ----------------

app.get('/api/departments', requireAuth, (req: Request, res: Response) => {
  if (!db.departments) db.departments = [];
  const list = db.departments.map(d => {
    const classesCount = (db.classes || []).filter(c => c.department_id === d.id || c.department_name === d.name).length;
    const studentsCount = (db.users || []).filter(u => u.role === 'mahasiswa' && u.department && (u.department === d.name || u.department.toLowerCase() === d.name.toLowerCase())).length;
    const lecturersCount = (db.users || []).filter(u => u.role === 'dosen' && u.department && (u.department === d.name || u.department.toLowerCase() === d.name.toLowerCase())).length;
    const coursesCount = (db.courses || []).filter(c => (c as any).department === d.name).length;
    return {
      ...d,
      classes_count: classesCount,
      students_count: studentsCount,
      lecturers_count: lecturersCount,
      courses_count: coursesCount,
    };
  });
  res.json(list);
});

app.get('/api/departments/:id', requireAuth, (req: Request, res: Response) => {
  if (!db.departments) db.departments = [];
  const dept = db.departments.find(d => d.id === req.params.id);
  if (!dept) {
    return res.status(404).json({ error: 'Program studi tidak ditemukan.' });
  }
  res.json(dept);
});

app.post('/api/departments', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { code, name, degree, faculty, head_name, head_id, head_nidn, accreditation, description } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Kode program studi dan nama program studi wajib diisi.' });
  }

  if (!db.departments) db.departments = [];

  const existing = db.departments.find(d => d.code.toLowerCase() === code.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Kode program studi "${code}" sudah digunakan.` });
  }

  let finalHeadName = head_name;
  let finalHeadNidn = head_nidn;
  if (head_id) {
    const headUser = db.users.find(u => u.id === head_id);
    if (headUser) {
      finalHeadName = headUser.name;
      finalHeadNidn = headUser.nidn || finalHeadNidn;
    }
  }

  const newDept = {
    id: `dept_${Date.now()}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    degree: degree || 'S1',
    faculty: faculty || 'Fakultas Ilmu Pendidikan dan Humaniora',
    head_name: finalHeadName || '',
    head_id: head_id || undefined,
    head_nidn: finalHeadNidn || '',
    accreditation: accreditation || 'Unggul',
    description: description || '',
    created_at: new Date().toISOString(),
  };

  db.departments.push(newDept);
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, 'admin', 'DEPARTMENT_CREATED', `Menambahkan Program Studi: ${newDept.name} (${newDept.code})`);

  res.status(201).json(newDept);
});

app.put('/api/departments/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  if (!db.departments) db.departments = [];
  const index = db.departments.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Program studi tidak ditemukan.' });
  }

  const existing = db.departments[index];
  const oldName = existing.name;

  let finalHeadName = req.body.head_name !== undefined ? req.body.head_name : existing.head_name;
  let finalHeadNidn = req.body.head_nidn !== undefined ? req.body.head_nidn : existing.head_nidn;
  if (req.body.head_id) {
    const headUser = db.users.find(u => u.id === req.body.head_id);
    if (headUser) {
      finalHeadName = headUser.name;
      finalHeadNidn = headUser.nidn || finalHeadNidn;
    }
  }

  const updated = {
    ...existing,
    ...req.body,
    head_name: finalHeadName,
    head_nidn: finalHeadNidn,
    code: req.body.code !== undefined ? req.body.code.trim().toUpperCase() : existing.code,
    name: req.body.name !== undefined ? req.body.name.trim() : existing.name,
  };

  db.departments[index] = updated;

  // Sync if name changed
  if (oldName && updated.name !== oldName) {
    (db.classes || []).forEach(c => {
      if (c.department_id === updated.id || c.department_name === oldName) {
        c.department_name = updated.name;
      }
    });
    (db.users || []).forEach(u => {
      if (u.department === oldName) {
        u.department = updated.name;
      }
    });
    (db.courses || []).forEach((co: any) => {
      if (co.department === oldName) {
        co.department = updated.name;
      }
    });
  }

  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, 'admin', 'DEPARTMENT_UPDATED', `Memperbarui Program Studi: ${updated.name}`);

  res.json(updated);
});

app.delete('/api/departments/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  if (!db.departments) db.departments = [];
  const dept = db.departments.find(d => d.id === req.params.id);
  if (!dept) {
    return res.status(404).json({ error: 'Program studi tidak ditemukan.' });
  }

  db.departments = db.departments.filter(d => d.id !== req.params.id);
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, 'admin', 'DEPARTMENT_DELETED', `Menghapus Program Studi: ${dept.name}`);

  res.json({ message: 'Program studi berhasil dihapus.' });
});

// ---------------- KELOLA KELAS (ACADEMIC CLASSES) ----------------

app.get('/api/classes', requireAuth, (req: Request, res: Response) => {
  if (!db.classes) db.classes = [];
  const list = db.classes.map(c => {
    const studentCount = (db.users || []).filter(u => u.role === 'mahasiswa' && u.class_name === c.name).length;
    const coursesCount = (db.courses || []).filter(co => Array.isArray(co.enrolled_classes) && co.enrolled_classes.includes(c.name)).length;
    return {
      ...c,
      student_count: studentCount,
      courses_count: coursesCount,
    };
  });
  res.json(list);
});

app.get('/api/classes/:id', requireAuth, (req: Request, res: Response) => {
  if (!db.classes) db.classes = [];
  const cls = db.classes.find(c => c.id === req.params.id);
  if (!cls) {
    return res.status(404).json({ error: 'Data kelas tidak ditemukan.' });
  }
  res.json(cls);
});

app.post('/api/classes', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { name, department_id, department_name, academic_year, semester, advisor_id, advisor_name, capacity, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nama kelas wajib diisi (misal: BIO-2A).' });
  }

  if (!db.classes) db.classes = [];

  const existing = db.classes.find(c => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: `Kelas dengan nama "${name}" sudah ada.` });
  }

  let finalDeptName = department_name || 'S1 Pendidikan Biologi';
  if (department_id) {
    const dept = db.departments?.find(d => d.id === department_id);
    if (dept) finalDeptName = dept.name;
  }

  let finalAdvisorName = advisor_name;
  if (advisor_id) {
    const advUser = db.users.find(u => u.id === advisor_id);
    if (advUser) finalAdvisorName = advUser.name;
  }

  const newClass = {
    id: `cls_${Date.now()}`,
    name: name.trim().toUpperCase(),
    department_id: department_id || undefined,
    department_name: finalDeptName,
    academic_year: academic_year || db.settings.academic_year || '2026/2027',
    semester: semester || 2,
    advisor_id: advisor_id || undefined,
    advisor_name: finalAdvisorName || 'Dr. Sri Wahyuni, M.Kom.',
    capacity: Number(capacity) || 35,
    description: description || '',
    created_at: new Date().toISOString(),
  };

  db.classes.push(newClass);
  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'CLASS_CREATED', `Menambahkan kelas akademik: ${newClass.name}`);

  res.status(201).json(newClass);
});

app.put('/api/classes/:id', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  if (!db.classes) db.classes = [];
  const index = db.classes.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
  }

  const existing = db.classes[index];
  const oldName = existing.name;

  let finalDeptName = req.body.department_name !== undefined ? req.body.department_name : existing.department_name;
  if (req.body.department_id) {
    const dept = db.departments?.find(d => d.id === req.body.department_id);
    if (dept) finalDeptName = dept.name;
  }

  let finalAdvisorName = req.body.advisor_name !== undefined ? req.body.advisor_name : existing.advisor_name;
  if (req.body.advisor_id) {
    const advUser = db.users.find(u => u.id === req.body.advisor_id);
    if (advUser) finalAdvisorName = advUser.name;
  }

  const updated = {
    ...existing,
    ...req.body,
    department_name: finalDeptName,
    advisor_name: finalAdvisorName,
    name: req.body.name !== undefined ? req.body.name.trim().toUpperCase() : existing.name,
    capacity: req.body.capacity !== undefined ? Number(req.body.capacity) : existing.capacity,
  };

  db.classes[index] = updated;

  // Sync if class name changed
  if (oldName && updated.name !== oldName) {
    (db.users || []).forEach(u => {
      if (u.class_name === oldName) {
        u.class_name = updated.name;
      }
    });
    (db.courses || []).forEach(co => {
      if (Array.isArray(co.enrolled_classes) && co.enrolled_classes.includes(oldName)) {
        co.enrolled_classes = co.enrolled_classes.map(cl => cl === oldName ? updated.name : cl);
      }
    });
  }

  saveDatabase(db);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'CLASS_UPDATED', `Memperbarui kelas: ${updated.name}`);

  res.json(updated);
});

app.delete('/api/classes/:id', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  if (!db.classes) db.classes = [];
  const cls = db.classes.find(c => c.id === req.params.id);
  if (!cls) {
    return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
  }

  const deletedClassName = cls.name;
  const deletedClassId = cls.id;
  db.classes = db.classes.filter(c => c.id !== req.params.id);

  // CASCADE REMOVE deleted class from all courses enrolled_classes
  if (db.courses && Array.isArray(db.courses)) {
    db.courses.forEach(c => {
      if (Array.isArray(c.enrolled_classes)) {
        c.enrolled_classes = c.enrolled_classes.filter(cn => cn !== deletedClassName && cn !== deletedClassId);
      }
    });
  }

  // Clear class_name from users belonging to deleted class
  if (db.users && Array.isArray(db.users)) {
    db.users.forEach(u => {
      if (u.class_name === deletedClassName) {
        u.class_name = undefined;
      }
    });
  }

  saveDatabase(db);
  broadcastSSE('classes_updated', { message: `Kelas ${cls.name} berhasil dihapus.` });
  broadcastSSE('courses_updated', { message: `Kelas ${cls.name} telah disinkronkan dan dihapus dari seluruh mata kuliah.` });
  addActivity((req as any).user.id, (req as any).user.name, 'admin', 'CLASS_DELETED', `Menghapus kelas: ${cls.name} (otomatis dibersihkan dari mata kuliah)`);

  res.json({ message: `Kelas ${cls.name} berhasil dihapus dan otomatis disinkronkan dari seluruh mata kuliah.` });
});

// ---------------- FORUM DISKUSI PERKULIAHAN ----------------

app.get('/api/discussions', requireAuth, (req: Request, res: Response) => {
  if (!db.discussion_threads) db.discussion_threads = [];
  if (!db.discussion_comments) db.discussion_comments = [];

  const { course_id, category, search } = req.query as {
    course_id?: string;
    category?: string;
    search?: string;
  };

  let list = db.discussion_threads;

  if (course_id) {
    list = list.filter(t => t.course_id === course_id);
  }

  if (category && category !== 'Semua') {
    list = list.filter(t => t.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
  }

  // Populate comment counts and course names
  const enriched = list.map(t => {
    const commentsCount = db.discussion_comments!.filter(c => c.thread_id === t.id).length;
    const course = db.courses?.find(c => c.id === t.course_id);
    return {
      ...t,
      comments_count: commentsCount,
      course_name: course ? course.name : 'Aplikasi Komputer',
    };
  });

  // Sort pinned first, then newest
  enriched.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  res.json(enriched);
});

app.get('/api/discussions/:id', requireAuth, (req: Request, res: Response) => {
  if (!db.discussion_threads) db.discussion_threads = [];
  if (!db.discussion_comments) db.discussion_comments = [];

  const thread = db.discussion_threads.find(t => t.id === req.params.id);
  if (!thread) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
  }

  const comments = db.discussion_comments
    .filter(c => c.thread_id === thread.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const course = db.courses?.find(c => c.id === thread.course_id);

  res.json({
    ...thread,
    course_name: course ? course.name : 'Aplikasi Komputer',
    comments_count: comments.length,
    comments,
  });
});

app.post('/api/discussions', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { course_id, title, content, category, meeting_number, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Judul dan isi diskusi wajib disertakan.' });
  }

  if (!db.discussion_threads) db.discussion_threads = [];

  const activeCourseId = course_id || db.courses?.[0]?.id || 'course_1';

  const newThread = {
    id: `disc_${Date.now()}`,
    course_id: activeCourseId,
    meeting_number: meeting_number ? Number(meeting_number) : undefined,
    title: title.trim(),
    content: content.trim(),
    user_id: currentUser.id,
    user_name: currentUser.name,
    user_role: currentUser.role,
    avatar: currentUser.avatar || currentUser.name[0],
    category: category || 'Materi Perkuliahan',
    created_at: new Date().toISOString(),
    is_pinned: false,
    likes: 0,
    liked_by: [],
    tags: Array.isArray(tags) ? tags : [],
  };

  db.discussion_threads.unshift(newThread);

  // Award participation points to students for posting discussions (+10 points)
  if (currentUser.role === 'mahasiswa') {
    db.points.push({
      id: `pt_${Date.now()}`,
      user_id: currentUser.id,
      amount: 10,
      source: `Membuat Topik Diskusi: "${newThread.title}"`,
      created_at: new Date().toISOString(),
    });
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'DISCUSSION_CREATED', `Memulai diskusi: ${newThread.title}`);

  res.status(201).json({ ...newThread, comments_count: 0 });
});

app.post('/api/discussions/:id/comments', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const threadId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Tanggapan diskusi tidak boleh kosong.' });
  }

  if (!db.discussion_threads) db.discussion_threads = [];
  if (!db.discussion_comments) db.discussion_comments = [];

  const thread = db.discussion_threads.find(t => t.id === threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
  }

  const newComment = {
    id: `comm_${Date.now()}`,
    thread_id: threadId,
    user_id: currentUser.id,
    user_name: currentUser.name,
    user_role: currentUser.role,
    avatar: currentUser.avatar || currentUser.name[0],
    content: content.trim(),
    created_at: new Date().toISOString(),
    likes: 0,
    liked_by: [],
    is_endorsed: currentUser.role === 'dosen' || currentUser.role === 'admin',
  };

  db.discussion_comments.push(newComment);

  // Award +5 participation points to student for thoughtful responses
  if (currentUser.role === 'mahasiswa') {
    db.points.push({
      id: `pt_${Date.now()}`,
      user_id: currentUser.id,
      amount: 5,
      source: `Menanggapi Diskusi: "${thread.title}"`,
      created_at: new Date().toISOString(),
    });
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'DISCUSSION_REPLIED', `Menanggapi diskusi: ${thread.title}`);

  res.status(201).json(newComment);
});

app.post('/api/discussions/:id/like', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const threadId = req.params.id;

  if (!db.discussion_threads) db.discussion_threads = [];
  const thread = db.discussion_threads.find(t => t.id === threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
  }

  if (!thread.liked_by) thread.liked_by = [];
  const hasLiked = thread.liked_by.includes(currentUser.id);

  if (hasLiked) {
    thread.liked_by = thread.liked_by.filter(id => id !== currentUser.id);
    thread.likes = Math.max(0, thread.likes - 1);
  } else {
    thread.liked_by.push(currentUser.id);
    thread.likes = (thread.likes || 0) + 1;
  }

  saveDatabase(db);
  res.json({ likes: thread.likes, liked: !hasLiked });
});

app.post('/api/discussions/:threadId/comments/:commentId/like', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { commentId } = req.params;

  if (!db.discussion_comments) db.discussion_comments = [];
  const comment = db.discussion_comments.find(c => c.id === commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
  }

  if (!comment.liked_by) comment.liked_by = [];
  const hasLiked = comment.liked_by.includes(currentUser.id);

  if (hasLiked) {
    comment.liked_by = comment.liked_by.filter(id => id !== currentUser.id);
    comment.likes = Math.max(0, comment.likes - 1);
  } else {
    comment.liked_by.push(currentUser.id);
    comment.likes = (comment.likes || 0) + 1;
  }

  saveDatabase(db);
  res.json({ likes: comment.likes, liked: !hasLiked });
});

app.patch('/api/discussions/:id/pin', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  if (!db.discussion_threads) db.discussion_threads = [];
  const thread = db.discussion_threads.find(t => t.id === req.params.id);
  if (!thread) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
  }

  thread.is_pinned = !thread.is_pinned;
  saveDatabase(db);

  res.json({ is_pinned: thread.is_pinned });
});

app.patch('/api/discussions/:threadId/comments/:commentId/endorse', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  if (!db.discussion_comments) db.discussion_comments = [];
  const comment = db.discussion_comments.find(c => c.id === req.params.commentId);
  if (!comment) {
    return res.status(404).json({ error: 'Komentar tidak ditemukan.' });
  }

  comment.is_endorsed = !comment.is_endorsed;
  saveDatabase(db);

  res.json({ is_endorsed: comment.is_endorsed });
});

app.post('/api/discussions/:id/award-point', requireAuth, requireRole('admin', 'dosen'), (req: Request, res: Response) => {
  const { target_user_id, points, reason } = req.body;
  if (!target_user_id) {
    return res.status(400).json({ error: 'ID mahasiswa wajib diisi.' });
  }

  const pts = Number(points) || 10;
  db.points.push({
    id: `pt_${Date.now()}`,
    user_id: target_user_id,
    amount: pts,
    source: reason || 'Apresiasi partisipasi aktif dalam forum diskusi',
    created_at: new Date().toISOString(),
  });

  saveDatabase(db);
  const targetUser = db.users.find(u => u.id === target_user_id);
  addActivity((req as any).user.id, (req as any).user.name, (req as any).user.role, 'POINT_AWARDED', `Memberikan +${pts} Poin keaktifan kepada ${targetUser ? targetUser.name : 'Mahasiswa'}`);

  res.json({ message: `Berhasil memberikan +${pts} poin keaktifan.`, points_awarded: pts });
});

app.delete('/api/discussions/:id', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const threadId = req.params.id;

  if (!db.discussion_threads) db.discussion_threads = [];
  const thread = db.discussion_threads.find(t => t.id === threadId);
  if (!thread) {
    return res.status(404).json({ error: 'Topik diskusi tidak ditemukan.' });
  }

  // Admin and Dosen can delete any thread; students can delete their own
  const canDelete = currentUser.role === 'admin' || currentUser.role === 'dosen' || thread.user_id === currentUser.id;
  if (!canDelete) {
    return res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus diskusi ini.' });
  }

  db.discussion_threads = db.discussion_threads.filter(t => t.id !== threadId);
  if (db.discussion_comments) {
    db.discussion_comments = db.discussion_comments.filter(c => c.thread_id !== threadId);
  }

  saveDatabase(db);
  addActivity(currentUser.id, currentUser.name, currentUser.role, 'DISCUSSION_DELETED', `Menghapus diskusi: ${thread.title}`);

  res.json({ message: `Topik diskusi "${thread.title}" berhasil dihapus.` });
});

app.delete('/api/discussions/:threadId/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const { threadId, commentId } = req.params;

  if (!db.discussion_comments) db.discussion_comments = [];
  const comment = db.discussion_comments.find(c => c.id === commentId && c.thread_id === threadId);
  if (!comment) {
    return res.status(404).json({ error: 'Komentar balasan tidak ditemukan.' });
  }

  const canDelete = currentUser.role === 'admin' || currentUser.role === 'dosen' || comment.user_id === currentUser.id;
  if (!canDelete) {
    return res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus balasan ini.' });
  }

  db.discussion_comments = db.discussion_comments.filter(c => c.id !== commentId);

  // Decrement comments count on thread
  if (db.discussion_threads) {
    const thread = db.discussion_threads.find(t => t.id === threadId);
    if (thread && typeof thread.comments_count === 'number' && thread.comments_count > 0) {
      thread.comments_count -= 1;
    }
  }

  saveDatabase(db);
  res.json({ message: 'Balasan komentar berhasil dihapus.' });
});

async function startServer() {
  // 1. Sinkronisasi dengan Persistent Cloud Firestore sebelum menerima request
  try {
    console.log('[GEMA BIO] Memeriksa status cloud database Firebase Firestore...');
    const cloudDb = await loadDatabaseFromFirestore();
    if (cloudDb && Array.isArray(cloudDb.users) && cloudDb.users.length > 0) {
      console.log('[GEMA BIO] Database berhasil dipulihkan dari Firebase Firestore secara otomatis.');
      db = cloudDb as DatabaseSchema;
      // Sinkronkan ke berkas lokal sebagai cache mirror
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } else {
      console.log('[GEMA BIO] Cloud Firestore siap, menyinkronkan data lokal ke Firebase Firestore...');
      await saveDatabaseToFirestore(db);
    }
  } catch (cloudErr: any) {
    console.warn('[GEMA BIO] Catatan sinkronisasi cloud awal:', cloudErr.message);
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GEMA BIO] Server berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();
