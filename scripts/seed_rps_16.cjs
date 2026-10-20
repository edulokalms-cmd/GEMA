const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Update Course 1 Info
const course1 = db.courses.find(c => c.id === 'course_1');
if (course1) {
  course1.code = 'APLI-201';
  course1.name = 'Aplikasi Komputer';
  course1.semester = 'Ganjil 2026/2027';
  course1.academic_year = '2026/2027';
  course1.sks = 2;
  course1.lecturer_name = 'Dr. Sri Wahyuni, M.Kom.';
  course1.description = 'Mata kuliah dasar komputer terapan sains sesuai RPS 16 pertemuan: arsitektur komputer, tata kelola berkas, pengolah kata ilmiah, spreadsheet statistik, komunikasi visual, keamanan siber, UTS, kolaborasi cloud, komputasi bioinformatika, visualisasi laboratorium, basis data relasional, integritas AI akademik, proyek akhir sains dan evaluasi UAS.';
}

// 2. Define Full 16 RPS Materials
const rpsMaterials = [
  {
    id: "mat_1",
    title: "Pertemuan 1: Pengenalan Komputer & Ekosistem Perangkat Lunak",
    category: "Konsep Dasar",
    description: "Memahami arsitektur hardware, peran sistem operasi, firmware BIOS/UEFI, dan ekosistem perangkat lunak saintifik.",
    learning_objectives: [
      "Mengidentifikasi komponen hardware komputer (CPU, RAM, ROM, Storage, GPU, Motherboard).",
      "Memahami fungsi sistem operasi dalam alokasi resource memori dan proses komputasi.",
      "Mengenal klasifikasi perangkat lunak aplikasi umum dan saintifik untuk praktikum biologi."
    ],
    estimated_time: "20 Menit",
    order_number: 1,
    course_id: "course_1",
    created_at: "2026-01-12T08:00:00Z",
    content: `## 1. Arsitektur Komputer & Perangkat Lunak Saintifik
Komputer modern bekerja dengan prinsip arsitektur Von Neumann, di mana data dan instruksi disimpan dalam memori utama sebelum diproses oleh CPU.

### Komponen Kunci
- **CPU (Central Processing Unit)**: Otak pemroses komputasi aritmatika dan logika.
- **RAM (Random Access Memory)**: Memori kerja berkecepatan tinggi yang bersifat volatile.
- **Penyimpanan Sekunder (SSD NVMe / HDD)**: Media penyimpanan data permanen.
- **Perangkat Lunak Sistem & Aplikasi**: OS (Windows, Linux, macOS) menjembatani interaksi antara software sains dan hardware.`
  },
  {
    id: "mat_2",
    title: "Pertemuan 2: Manajemen Sistem Operasi & Tata Kelola Berkas Ilmiah",
    category: "Sistem Operasi",
    description: "Menguasai struktur direktori hierarkis, konvensi penamaan file riset, task manager, serta strategi backup 3-2-1.",
    learning_objectives: [
      "Menyusun hierarki folder praktikum dan riset terstandarisasi.",
      "Menerapkan konvensi penamaan berkas ISO 8601 bebas ambigu.",
      "Mengimplementasikan strategi 3-2-1 backup untuk mitigasi kehilangan data eksperimen."
    ],
    estimated_time: "25 Menit",
    order_number: 2,
    course_id: "course_1",
    created_at: "2026-01-19T08:00:00Z",
    content: `## 2. Tata Kelola Berkas Penelitian
Data pengamatan ilmiah laboratorium sangat berharga dan tidak dapat tergantikan jika hilang akibat kegagalan perangkat keras.

### Standar Penamaan File ISO
Gunakan format: \`[KODE_MK]_[NIM]_[TOPIK]_[YYYYMMDD].ekstensi\`
Contoh: \`APLI201_230302001_LaporanEnzim_20260119.docx\`

### Kaidah Strategi Backup 3-2-1
1. **3 Salinan**: Miliki minimal 3 kopi data penting.
2. **2 Media Berbeda**: Simpan pada 2 tipe media fisik (internal SSD laptop dan eksternal HDD).
3. **1 Salinan Offsite / Cloud**: Simpan 1 salinan di cloud kampus (Google Drive / OneDrive).`
  },
  {
    id: "mat_3",
    title: "Pertemuan 3: Pengolah Kata: Tata Tulis Karya Ilmiah & Manajemen Sitasi",
    category: "Pengolah Kata",
    description: "Format penulisan skripsi/makalah: Heading Styles, Daftar Isi Otomatis, Section Breaks (romawi & arab), dan Mendeley/Zotero.",
    learning_objectives: [
      "Menggunakan Heading Styles (1, 2, 3) untuk navigasi dokumen karya ilmiah.",
      "Menyusun Daftar Isi, Daftar Tabel, dan Daftar Gambar otomatis.",
      "Mengatur nomor halaman romawi dan arab dengan Section Break.",
      "Mengintegrasikan reference manager (Mendeley/Zotero) standar APA edisi 7."
    ],
    estimated_time: "30 Menit",
    order_number: 3,
    course_id: "course_1",
    created_at: "2026-01-26T08:00:00Z",
    content: `## 3. Formatting Dokumen Akademik Profesional
Word Processor bukan mesin ketik biasa, melainkan alat produksi dokumen ilmiah berstandar tinggi.

### Heading Styles & Navigasi
Terapkan Heading 1 untuk Judul Bab, Heading 2 untuk Sub-bab, dan Heading 3 untuk Bagian Lebih Spesifik.
Keuntungan: Daftar isi (Table of Contents) dapat di-generate dan di-update secara otomatis 1-klik.

### Section Break (Next Page) vs Page Break
- **Page Break**: Pindah ke halaman baru dengan format margin dan penomoran sama.
- **Section Break**: Memisahkan format berbeda (nomor halaman Romawi i, ii pada kata pengantar, dan nomor Arab 1, 2 pada Bab I).`
  },
  {
    id: "mat_4",
    title: "Pertemuan 4: Pengolah Angka: Analisis Data Statistik, Formula & Grafik",
    category: "Pengolah Angka",
    description: "Menganalisis data kuantitatif laboratorium dengan formula statistik (AVERAGE, STDEV, COUNTIF, IF) dan referensi absolut ($A$1).",
    learning_objectives: [
      "Mengaplikasikan formula statistik deskriptif pada data observasi praktikum.",
      "Menggunakan referensi sel absolut ($) dan relatif dengan tepat.",
      "Menyusun tabel agregat dengan Pivot Table.",
      "Membuat chart grafik saintifik lengkap dengan judul sumbu dan satuan."
    ],
    estimated_time: "30 Menit",
    order_number: 4,
    course_id: "course_1",
    created_at: "2026-02-02T08:00:00Z",
    content: `## 4. Pengolahan Data Kuantitatif Sains
Spreadsheet adalah instrumen utama saintis dalam mengorganisasi data observasi mentah.

### Formula Esensial
- \`=AVERAGE(range)\`: Nilai rata-rata hitung.
- \`=STDEV.S(range)\`: Standar deviasi sampel.
- \`=COUNTIF(range, kriteria)\`: Menghitung frekuensi kemunculan data.
- \`=IF(kondisi, benar, salah)\`: Logika percabangan untuk evaluasi mutu sampel.

### Referensi Sel Absolut ($)
Gunakan tombol **F4** untuk mengunci sel, misalnya \`$B$2\`. Referensi ini tidak akan bergeser saat formula disalin ke baris bawah.`
  },
  {
    id: "mat_5",
    title: "Pertemuan 5: Desain Slide Presentasi Ilmiah & Komunikasi Visual",
    category: "Presentasi",
    description: "Prinsip desain slide ilmiah: rasio kontras visual, hierarki tipografi, alur piramida terbalik, dan teknik presenter view.",
    learning_objectives: [
      "Menerapkan prinsip desain 1 gagasan utama per slide.",
      "Menghindari bullet-point berlebihan dengan diagram alir metodologi.",
      "Memilih tipografi sans-serif dengan kontras tinggi berstandar aksesibilitas.",
      "Menguasai mode Presenter View dan navigasi slide interaktif."
    ],
    estimated_time: "25 Menit",
    order_number: 5,
    course_id: "course_1",
    created_at: "2026-02-09T08:00:00Z",
    content: `## 5. Komunikasi Visual dalam Presentasi Akademik
Slide presentasi seminar ilmiah bukan media membaca paragraf makalah, melainkan media bantu visual yang memperkuat argumen lisan presenter.

### Prinsip Utama
1. **Satu Ide Pokok Per Slide**: Jangan campurkan latar belakang dan hasil analisis dalam slide yang sama.
2. **Diagram Alir Metodologi**: Ubah prosedur laboratorium menjadi bagan bertahap (flowchart).
3. **Kontras dan Keterbacaan**: Ukuran font minimal 24pt untuk teks isi, dan minimal 36pt untuk judul.`
  },
  {
    id: "mat_6",
    title: "Pertemuan 6: Keamanan Digital, Etika Siber & Privasi Data Akademik",
    category: "Keamanan Digital",
    description: "Keamanan akun portal akademik, 2-Factor Authentication (2FA), mitigasi phishing, dan integritas data penelitian.",
    learning_objectives: [
      "Mengidentifikasi karakteristik phishing dan rekayasa sosial di lingkungan kampus.",
      "Mengaktifkan autentikasi dua faktor (2FA) pada portal akademik dan email institusi.",
      "Menjaga kerahasiaan data partisipan riset dan data laboratorium.",
      "Memahami undang-undang informasi transaksi elektronik (UU ITE) dan etika siber."
    ],
    estimated_time: "20 Menit",
    order_number: 6,
    course_id: "course_1",
    created_at: "2026-02-16T08:00:00Z",
    content: `## 6. Keamanan Digital & Privasi Data
Dalam lingkungan kampus digital modern, ancaman siber seperti phishing akun portal nilai dan pencurian data penelitian makin sering terjadi.

### Proteksi Akun Kampus
- Aktifkan 2FA (Two-Factor Authentication) menggunakan aplikasi authenticator.
- Gunakan password unik minimal 12 karakter kombinasi huruf besar, kecil, angka, dan simbol.
- Jangan pernah membuka link mencurigakan dari email pengirim anonim.`
  },
  {
    id: "mat_7",
    title: "Pertemuan 7: Review & Praktikum Terpadu Pra-UTS",
    category: "Praktikum Terpadu",
    description: "Studi kasus integrasi komputasi: mengolah dataset riset mentah di Excel, merancang laporan di Word, dan mempresentasikan di PowerPoint.",
    learning_objectives: [
      "Mengintegrasikan output formula spreadsheet ke dalam dokumen laporan ilmiah.",
      "Mengekspor grafik beresolusi tinggi ke dalam dokumen karya tulis Word.",
      "Mensimulasikan pengerjaan kasus terpadu sebagai persiapan menghadapi UTS."
    ],
    estimated_time: "35 Menit",
    order_number: 7,
    course_id: "course_1",
    created_at: "2026-02-23T08:00:00Z",
    content: `## 7. Studi Kasus Integrasi Tiga Aplikasi Pokok
Pertemuan ini menyatukan keterampilan dari Pertemuan 1 s.d. 6 dalam sebuah skenario riset nyata:
1. **Analisis Data Mentah**: Mengolah 50 data pengukuran sampel biologi di spreadsheet.
2. **Penyusunan Makalah**: Memasukkan ringkasan tabel dan grafik statistik ke Word lengkap dengan sitasi dan daftar pustaka.
3. **Slide Presentasi**: Mengambil 3 temuan paling signifikan untuk disajikan dalam bentuk slide presentasi ilmiah.`
  },
  {
    id: "mat_8",
    title: "Pertemuan 8: Evaluasi Ujian Tengah Semester (UTS)",
    category: "Evaluasi Semester",
    description: "Evaluasi capaian pembelajaran setengah semester (CPMK 1 s.d. CPMK 3) melalui ujian teori komputasi dan praktik laboratorium mandiri.",
    learning_objectives: [
      "Menyelesaikan evaluasi objektif mengenai arsitektur komputer dan sistem operasi.",
      "Mengerjakan soal praktik format dokumen Word dan formula statistik Excel dalam batas waktu terstandar.",
      "Memverifikasi integritas akademik pengerjaan ujian mandiri."
    ],
    estimated_time: "90 Menit",
    order_number: 8,
    course_id: "course_1",
    created_at: "2026-03-02T08:00:00Z",
    content: `## 8. Ujian Tengah Semester (UTS)
Ujian Tengah Semester menilai penguasaan kompetensi dasar komputer terapan mahasiswa setelah menempuh 7 pertemuan perkuliahan.

### Aspek Penilaian
- **Teori Komputasi (30%)**: Konsep dasar sistem operasi, keamanan siber, dan format data saintifik.
- **Praktik Pemformatan Dokumen (35%)**: Template karya tulis, styles, heading, sitasi, dan section break.
- **Praktik Olah Data Spreadsheet (35%)**: Formula statistik, penguncian absolut sel, dan pembuatan chart ilmiah.`
  },
  {
    id: "mat_9",
    title: "Pertemuan 9: Aplikasi Produktivitas & Kolaborasi Berbasis Cloud",
    category: "Komputasi Cloud",
    description: "Pemanfaatan Google Workspace dan Microsoft 365: co-authoring dokumen real-time, sharing permission, version history, dan Google Form survei ilmiah.",
    learning_objectives: [
      "Mengelola hak akses file cloud (Viewer, Commenter, Editor, Restricted).",
      "Memanfaatkan Version History untuk melacak revisi dan memulihkan draft dokumen tim.",
      "Merancang kuesioner instrumen penelitian daring menggunakan Google Forms terintegrasi Sheets."
    ],
    estimated_time: "25 Menit",
    order_number: 9,
    course_id: "course_1",
    created_at: "2026-03-09T08:00:00Z",
    content: `## 9. Kolaborasi Cloud dalam Penelitian Modern
Penelitian ilmiah era kini hampir selalu melibatkan kolaborasi multi-peneliti yang berada di lokasi berbeda.

### Fitur Kunci Cloud Collaboration
- **Co-Authoring Real-time**: Mengedit satu naskah secara simultan tanpa konflik versi file.
- **Version History**: Memeriksa riwayat perubahan setiap anggota tim serta waktu pengeditan.
- **Google Forms Terintegrasi**: Mengumpulkan data survei lapangan secara otomatis ke dalam spreadsheet untuk dianalisis langsung.`
  },
  {
    id: "mat_10",
    title: "Pertemuan 10: Pengenalan Komputasi Bioinformatika Dasar & Basis Data Hayati",
    category: "Bioinformatika",
    description: "Eksplorasi database hayati internasional NCBI GenBank, UniProt, pencarian sekuens nukleotida/asam amino, dan analisis homologi BLAST.",
    learning_objectives: [
      "Mencari dan mengunduh format sekuens FASTA dari NCBI Nucleotide & Protein database.",
      "Menjalankan analisis kemiripan sekuens dengan algoritma BLASTn dan BLASTp.",
      "Menginterpretasikan nilai E-value, Query Cover, dan Persentase Identitas homolog."
    ],
    estimated_time: "35 Menit",
    order_number: 10,
    course_id: "course_1",
    created_at: "2026-03-16T08:00:00Z",
    content: `## 10. Komputasi Hayati: NCBI GenBank & BLAST
Bioinformatika merupakan integrasi ilmu biologi dengan teknologi komputasi untuk menyimpan dan menganalisis data molekuler.

### Format Data FASTA
Format standar sekuens DNA/RNA/Protein yang diawali dengan tanda \`>\` diikuti deskripsi nama organisme dan sekuens pada baris berikutnya:
\`\`\`
>AF086833.2 Zea mays ribulose-1,5-bisphosphate carboxylase/oxygenase
ATGTCACCACAAACAGAGACTAAAGCAAGTGTTGGATTCAAAGCTGGTGTTAAAGAGTAC
AAATTGACTTATTATACTCCTGAATATGAAACCAAGGATACTGATATCTTGGCAGCATT...
\`\`\`

### Membaca Hasil BLAST
- **E-value (Expect value)**: Semakin mendekati nol (\`0.0\`), semakin signifikan kemiripan sekuens bukan karena kebetulan.
- **Per. Ident**: Persentase pasangan basa yang cocok sempurna.`
  },
  {
    id: "mat_11",
    title: "Pertemuan 11: Visualisasi Data Laboratorium Lanjut & Statistik Inferensial Sederhana",
    category: "Pengolah Angka",
    description: "Analisis regresi linier, penentuan persamaan kurva standar (y = mx + c) dan nilai R-squared, pembuatan error bars (standar deviasi), dan boxplot.",
    learning_objectives: [
      "Menyusun kurva standar absorbansi spektrofotometer dengan grafik Scatter Plot.",
      "Menampilkan garis tren linier (Trendline), persamaan matematis, dan koefisien determinasi R².",
      "Menambahkan Error Bars berdasarkan standar deviasi sampel pengulangan."
    ],
    estimated_time: "30 Menit",
    order_number: 11,
    course_id: "course_1",
    created_at: "2026-03-23T08:00:00Z",
    content: `## 11. Visualisasi Data Laboratorium Saintifik
Dalam laporan praktikum biokimia dan fisiologi, mahasiswa sering membuat kurva standar (misalnya uji kadar glukosa atau konsentrasi protein).

### Langkah Membuat Kurva Standar
1. Plot data konsentrasi (sumbu X) dan nilai absorbansi (sumbu Y) menggunakan tipe chart **Scatter**.
2. Klik kanan titik data, pilih **Add Trendline > Linear**.
3. Centang opsi **Display Equation on chart** dan **Display R-squared value on chart**.
4. Nilai $R^2 \ge 0.98$ menandakan korelasi linier yang sangat kuat dan presisi.`
  },
  {
    id: "mat_12",
    title: "Pertemuan 12: Manajemen Basis Data & Tabel Relasional Sederhana",
    category: "Basis Data",
    description: "Konsep entitas, tabel relasional, primary key, form input data, query filter multi-kriteria untuk inventaris spesimen herbarium/laboratorium.",
    learning_objectives: [
      "Memahami perbedaan flat-file spreadsheet vs basis data relasional.",
      "Menentukan Primary Key dan Foreign Key untuk menjaga integritas data.",
      "Menyusun skema basis data inventaris sampel laboratorium biologi."
    ],
    estimated_time: "25 Menit",
    order_number: 12,
    course_id: "course_1",
    created_at: "2026-03-30T08:00:00Z",
    content: `## 12. Manajemen Basis Data Spesimen
Ketika data laboratorium mencapai ribuan spesimen, spreadsheet biasa rentan terhadap inkonsistensi dan redundansi data.

### Konsep Pokok Database Relasional
- **Table**: Kumpulan baris (rekaman) dan kolom (atribut).
- **Primary Key**: Kolom unik yang menjadi pembeda pasti setiap entitas (misalnya No_Katalog Spesimen).
- **Foreign Key**: Penghubung antar tabel yang berelasi (misalnya Lokasi_Koleksi_ID).
- **Relasi 1-ke-Banyak (One-to-Many)**: Satu famili tumbuhan dapat memiliki banyak spesies dalam koleksi herbarium.`
  },
  {
    id: "mat_13",
    title: "Pertemuan 13: Etika Digital, Hak Cipta & Pemanfaatan AI Akademik yang Bertanggung Jawab",
    category: "AI & Etika Akademik",
    description: "Prinsip etika pemanfaatan Generative AI (LLM), teknik prompt engineering saintifik, verifikasi fakta rujukan, dan pencegahan plagiarisme akademik.",
    learning_objectives: [
      "Memahami batasan dan resiko halusinasi pada model Generative AI.",
      "Merancang prompt terstruktur untuk brainstorming ide riset tanpa menyalin teks langsung.",
      "Menerapkan prinsip integritas akademik dan deklarasi penggunaan asistensi AI dalam karya tulis."
    ],
    estimated_time: "25 Menit",
    order_number: 13,
    course_id: "course_1",
    created_at: "2026-04-06T08:00:00Z",
    content: `## 13. Pemanfaatan Kecerdasan Buatan (AI) Beretika
Kecerdasan buatan generatif (seperti Gemini, ChatGPT, Claude) telah menjadi asisten produktivitas perkuliahan, namun wajib digunakan dengan mematuhi kode etik akademik kampus.

### Panduan Integritas Akademik
1. **AI Sebagai Alat Bantu Diskusi, Bukan Pengganti Pemikiran Kritis**: Mahasiswa bertanggung jawab penuh atas keabsahan seluruh tulisan yang diserahkan.
2. **Waspadai Halusinasi Referensi**: AI sering mengarang judul jurnal dan nama penulis fiktif. Selalu verifikasi sitasi langsung ke Google Scholar atau PubMed.
3. **Deklarasi Transparan**: Jika menggunakan AI untuk menyempurnakan tata bahasa, sertakan pernyataan di lembar pengakuan (acknowledgment).`
  },
  {
    id: "mat_14",
    title: "Pertemuan 14: Perancangan Proyek Akhir Komputasi Sains & Kolaborasi Kelompok",
    category: "Proyek Terpadu",
    description: "Penyusunan proyek akhir komputasi sains: integrasi studi kasus riil sains hayati, alokasi peran tim, metodologi pengolahan data digital, dan drafting laporan.",
    learning_objectives: [
      "Menentukan topik studi kasus komputasi terapan biologi/sains berbasis data nyata.",
      "Membagi peran kolaboratif (pengumpul data, pengolah formula, visualisator grafik, penyusun laporan).",
      "Menyusun draft laporan proyek akhir dengan sistematika karya ilmiah baku."
    ],
    estimated_time: "35 Menit",
    order_number: 14,
    course_id: "course_1",
    created_at: "2026-04-13T08:00:00Z",
    content: `## 14. Proyek Akhir Komputasi Terapan
Proyek akhir merupakan muara integrasi seluruh kompetensi aplikasi komputer yang telah dipelajari selama satu semester.

### Rubrik Capaian Proyek
- **Dataset Riset**: Penggunaan dataset riil minimal 30 entri pengamatan.
- **Kecakapan Spreadsheet**: Analisis statistik deskriptif dan kurva regresi/korelasi yang relevan.
- **Laporan Ilmiah**: Naskah rapi dengan Heading Styles, sitasi Mendeley, dan lampiran data.
- **Slide Presentasi**: Paparan visual terstruktur maksimal 8 slide per kelompok.`
  },
  {
    id: "mat_15",
    title: "Pertemuan 15: Presentasi Proyek Akhir & Review Komprehensif Semester",
    category: "Seminar Proyek",
    description: "Seminar pemaparan hasil proyek komputasi sains tiap kelompok, sesi tanya jawab akademik, peer-review, dan review menyeluruh kurikulum perkuliahan.",
    learning_objectives: [
      "Mempresentasikan hasil proyek komputasi secara lisan dengan waktu terbatas (10 menit per tim).",
      "Menjawab pertanyaan evaluatif dari dosen pengampu dan audiens rekan sejawat.",
      "Melakukan refleksi kompetensi digital yang telah dicapai sepanjang semester."
    ],
    estimated_time: "90 Menit",
    order_number: 15,
    course_id: "course_1",
    created_at: "2026-04-20T08:00:00Z",
    content: `## 15. Seminar Proyek & Review Komprehensif
Setiap kelompok mempresentasikan portofolio proyek komputasi sains di hadapan dosen pengampu dan rekan-rekan mahasiswa.

### Kriteria Penilaian Seminar
- **Kejelasan Komunikasi & Artikulasi (30%)**
- **Kualitas Desain Visual Slide (25%)**
- **Kedalaman Analisis Data Komputasi (30%)**
- **Ketepatan Menjawab Sesi Tanya Jawab (15%)**`
  },
  {
    id: "mat_16",
    title: "Pertemuan 16: Evaluasi Ujian Akhir Semester (UAS)",
    category: "Evaluasi Semester",
    description: "Evaluasi puncak Ujian Akhir Semester (UAS): penilaian portofolio komprehensif, uji kompetensi praktikum mandiri, dan penutupan perkuliahan.",
    learning_objectives: [
      "Menyelesaikan ujian praktik akhir komputasi saintifik secara komprehensif dan mandiri.",
      "Menyerahkan portofolio digital lengkap seluruh tugas praktikum semester berjalan.",
      "Memverifikasi rekapitulasi nilai akhir semester (Presensi, Tugas, Kuis, UTS, dan UAS)."
    ],
    estimated_time: "90 Menit",
    order_number: 16,
    course_id: "course_1",
    created_at: "2026-04-27T08:00:00Z",
    content: `## 16. Ujian Akhir Semester (UAS) Komprehensif
Evaluasi puncak untuk mengukur ketercapaian seluruh Capaian Pembelajaran Lulusan (CPL) dan CPMK mata kuliah Aplikasi Komputer.

### Komposisi Nilai Akhir
- **Presensi Kehadiran 16 Pertemuan**: 15%
- **Aktivitas & Partisipasi Forum**: 10%
- **Rata-rata Tugas Praktikum (10 Tugas)**: 25%
- **Rata-rata Mini Kuis (16 Pertemuan)**: 15%
- **Ujian Tengah Semester (UTS)**: 15%
- **Ujian Akhir Semester (UAS & Proyek)**: 20%`
  }
];

db.materials = rpsMaterials;

// 3. Define Quizzes and Questions for all 16 Meetings
const rpsQuizzes = [];
const rpsQuestions = [];

const quizData = [
  {
    meeting: 1,
    matId: 'mat_1',
    title: 'Mini Kuis: Konsep Komputasi & Perangkat Lunak',
    desc: 'Uji pemahaman dasar arsitektur perangkat keras, sistem operasi, dan ekosistem software komputer.',
    questions: [
      {
        q: 'Komponen perangkat keras yang bertindak sebagai otak utama pemroses instruksi data pada komputer adalah...',
        a: 'Random Access Memory (RAM)',
        b: 'Central Processing Unit (CPU)',
        c: 'Solid State Drive (SSD)',
        d: 'Power Supply Unit (PSU)',
        ans: 'b',
        exp: 'CPU (Central Processing Unit) bertugas mengeksekusi instruksi data dan logika komputasi.'
      },
      {
        q: 'Memori komputer yang bersifat volatile (data hilang saat daya listrik mati) adalah...',
        a: 'ROM BIOS',
        b: 'Hard Disk Drive',
        c: 'RAM (Random Access Memory)',
        d: 'Flashdisk USB',
        ans: 'c',
        exp: 'RAM bersifat volatile dan berfungsi sebagai ruang kerja sementara CPU saat program berjalan.'
      },
      {
        q: 'Perangkat lunak yang berfungsi sebagai jembatan pengendali antara pengguna, software aplikasi, dan hardware fisik adalah...',
        a: 'Sistem Operasi (Operating System)',
        b: 'Web Browser',
        c: 'Spreadsheet',
        d: 'Compiler',
        ans: 'a',
        exp: 'Sistem Operasi (Windows, Linux, macOS) mengelola sumber daya perangkat keras dan memfasilitasi jalannya aplikasi.'
      }
    ]
  },
  {
    meeting: 2,
    matId: 'mat_2',
    title: 'Mini Kuis: Manajemen Berkas & Sistem Operasi',
    desc: 'Evaluasi pemahaman tata kelola hierarki berkas penelitian, standar penamaan file, dan strategi 3-2-1 backup.',
    questions: [
      {
        q: 'Dalam strategi backup 3-2-1, angka "1" memiliki arti...',
        a: '1 jenis file yang dibackup',
        b: '1 salinan disimpan di lokasi luar (cloud / off-site)',
        c: '1 kali backup dalam setahun',
        d: '1 folder utama saja',
        ans: 'b',
        exp: 'Angka 1 mewakili 1 salinan yang wajib disimpan di luar lokasi fisik (cloud storage) untuk mitigasi bencana fisik.'
      },
      {
        q: 'Pintasan keyboard tercepat pada sistem operasi Windows untuk memanggil Task Manager adalah...',
        a: 'Ctrl + Alt + Del',
        b: 'Ctrl + Shift + Esc',
        c: 'Alt + F4',
        d: 'Windows + R',
        ans: 'b',
        exp: 'Ctrl + Shift + Esc membuka Task Manager secara instan tanpa melalui layar interupsi sekunder.'
      },
      {
        q: 'Format penamaan file akademik yang paling disarankan untuk mencegah kekeliruan versi adalah...',
        a: 'laporan_terbaru_revisi_fix_banget.docx',
        b: 'APLI201_230302001_LaporanEnzim_20260119.docx',
        c: 'Tugas_bio_1.docx',
        d: 'draft_final(1).docx',
        ans: 'b',
        exp: 'Format terstandarisasi mencakup kode mata kuliah, NIM, topik, dan tanggal ISO tahun-bulan-hari.'
      }
    ]
  },
  {
    meeting: 3,
    matId: 'mat_3',
    title: 'Mini Kuis: Pengolah Kata & Dokumen Ilmiah',
    desc: 'Uji kemampuan Heading Styles, Daftar Isi otomatis, Section Break penomoran halaman, dan sitasi.',
    questions: [
      {
        q: 'Fitur pada Microsoft Word yang wajib diterapkan pada judul bab agar Daftar Isi dapat terbentuk secara otomatis adalah...',
        a: 'Heading Styles',
        b: 'Format Painter',
        c: 'Drop Cap',
        d: 'Text Highlight',
        ans: 'a',
        exp: 'Heading Styles (Heading 1, 2, 3) memberikan struktur hierarki yang dibaca oleh generator Table of Contents.'
      },
      {
        q: 'Untuk membedakan format nomor halaman Romawi pada Kata Pengantar dan nomor Arab pada Bab Isi, digunakan pemisah jenis...',
        a: 'Page Break',
        b: 'Section Break (Next Page)',
        c: 'Line Break',
        d: 'Column Break',
        ans: 'b',
        exp: 'Section Break memisahkan bagian dokumen sehingga memungkinkan perbedaan penomoran halaman dan orientasi.'
      },
      {
        q: 'Aplikasi reference manager populer yang memfasilitasi otomatisasi penulisan sitasi dan daftar pustaka standar APA adalah...',
        a: 'Photoshop',
        b: 'Mendeley dan Zotero',
        c: 'Notepad',
        d: 'VLC Media Player',
        ans: 'b',
        exp: 'Mendeley dan Zotero adalah software pengelola referensi ilmiah yang terintegrasi dengan Word.'
      }
    ]
  },
  {
    meeting: 4,
    matId: 'mat_4',
    title: 'Mini Kuis: Analisis Data Spreadsheet & Formula',
    desc: 'Uji formula statistik deskriptif, penguncian sel absolut ($), dan fungsi logika pada spreadsheet.',
    questions: [
      {
        q: 'Formula spreadsheet untuk menghitung nilai standar deviasi sampel pengamatan eksperimen adalah...',
        a: '=SUM(range)',
        b: '=STDEV.S(range)',
        c: '=MEDIAN(range)',
        d: '=COUNT(range)',
        ans: 'b',
        exp: 'STDEV.S menghitung standar deviasi berdasarkan sampel data observasi laboratorium.'
      },
      {
        q: 'Tombol keyboard pintas untuk mengunci sel menjadi referensi absolut (misal $A$1) pada Excel/Sheets adalah...',
        a: 'F2',
        b: 'F4',
        c: 'F8',
        d: 'F12',
        ans: 'b',
        exp: 'Tombol F4 menyisipkan tanda dolar ($) pada kolom dan baris sel terpilih secara otomatis.'
      },
      {
        q: 'Fungsi formula =COUNTIF(B2:B30, ">=75") berguna untuk...',
        a: 'Menjumlahkan semua angka di atas 75',
        b: 'Menghitung banyaknya sel yang bernilai 75 ke atas',
        c: 'Mencari nilai rata-rata dari sel di atas 75',
        d: 'Mengalikan sel dengan angka 75',
        ans: 'b',
        exp: 'COUNTIF menghitung frekuensi jumlah sel dalam rentang yang memenuhi kriteria tertentu.'
      }
    ]
  },
  {
    meeting: 5,
    matId: 'mat_5',
    title: 'Mini Kuis: Desain Slide Presentasi Akademik',
    desc: 'Prinsip desain visual, rasio kontras, tipografi, dan penyajian data ilmiah seminar.',
    questions: [
      {
        q: 'Prinsip utama penyusunan teks pada slide presentasi seminar ilmiah yang baik adalah...',
        a: 'Menyalin seluruh paragraf proposal ke slide dengan ukuran font 12pt',
        b: 'Membatasi satu ide gagasan utama per slide dengan poin ringkas dan ukuran font minimal 24pt',
        c: 'Menggunakan 5 variasi warna teks yang berbeda-beda di tiap kalimat',
        d: 'Menghilangkan semua bagan dan diagram alir',
        ans: 'b',
        exp: 'Slide presentasi harus memiliki hierarki visual yang jelas dan ukuran font yang mudah dibaca oleh audiens.'
      },
      {
        q: 'Mode pada PowerPoint/Google Slides yang memungkinkan presenter melihat catatan pribadi dan timer presentasi adalah...',
        a: 'Slide Sorter View',
        b: 'Presenter View',
        c: 'Reading View',
        d: 'Outline View',
        ans: 'b',
        exp: 'Presenter View menampilkan catatan pribadi pembicara, waktu berjalan, dan pratinjau slide berikutnya.'
      }
    ]
  },
  {
    meeting: 6,
    matId: 'mat_6',
    title: 'Mini Kuis: Keamanan Siber & Privasi Digital',
    desc: 'Pemahaman mitigasi serangan phishing, proteksi 2FA, dan integritas data riset.',
    questions: [
      {
        q: 'Upaya penipuan online dengan memancing korban memasukkan sandi di halaman login palsu disebut...',
        a: 'Phishing',
        b: 'Defragmenting',
        c: 'Rendering',
        d: 'Overclocking',
        ans: 'a',
        exp: 'Phishing merupakan teknik social engineering untuk mencuri kredensial login melalui replika situs palsu.'
      },
      {
        q: 'Metode pengamanan akun yang mensyaratkan kode verifikasi tambahan dari perangkat ponsel setelah password disebut...',
        a: 'BIOS Update',
        b: 'Two-Factor Authentication (2FA)',
        c: 'Single Sign On',
        d: 'VPN Protocol',
        ans: 'b',
        exp: '2FA menambahkan lapisan keamanan kedua selain kata sandi statis.'
      }
    ]
  },
  {
    meeting: 7,
    matId: 'mat_7',
    title: 'Mini Kuis: Praktikum Terpadu Pra-UTS',
    desc: 'Evaluasi integrasi olah data spreadsheet, laporan word, dan slide presentasi pra-UTS.',
    questions: [
      {
        q: 'Saat mengekspor grafik dari Excel ke Word agar format tampilan tetap tajam dan ukurannya fleksibel, format tempel terbaik adalah...',
        a: 'Paste as Bitmap',
        b: 'Paste as Microsoft Office Graphic Object / Enhanced Metafile',
        c: 'Paste as Unformatted Text',
        d: 'Paste as HTML Code',
        ans: 'b',
        exp: 'Format objek grafik mempertahankan kualitas vektor resolusi tinggi tanpa piksel pecah saat dicetak.'
      },
      {
        q: 'Urutan alur kerja ilmiah komputasi terpadu yang tepat adalah...',
        a: 'Presentasi -> Input Data -> Olah Formula -> Laporan',
        b: 'Input Data Mentah -> Olah Formula & Chart -> Penyusunan Laporan Ilmiah -> Desain Slide Ringkasan',
        c: 'Desain Slide -> Input Data -> Cetak Makalah',
        d: 'Laporan -> Uji Coba -> Hapus Data',
        ans: 'b',
        exp: 'Alur kerja saintifik dimulai dari penyiapan data observasi, olah analisis, laporan komprehensif, dan slide.'
      }
    ]
  },
  {
    meeting: 8,
    matId: 'mat_8',
    title: 'Mini Kuis: Evaluasi Pemahaman UTS Komputasi',
    desc: 'Evaluasi penguasaan materi komprehensif paruh pertama semester.',
    questions: [
      {
        q: 'Kombinasi tombol untuk menyimpan dokumen kerja secara cepat pada program komputer adalah...',
        a: 'Ctrl + S',
        b: 'Ctrl + P',
        c: 'Ctrl + Z',
        d: 'Ctrl + X',
        ans: 'a',
        exp: 'Ctrl + S adalah shortcut universal untuk menyimpan (Save) dokumen kerja.'
      },
      {
        q: 'Jika formula di sel C2 adalah =$A$1*B2, ketika disalin ke baris C3 maka rumusnya akan menjadi...',
        a: '=$A$2*B3',
        b: '=$A$1*B3',
        c: '=A1*B2',
        d: '=$A$1*$B$2',
        ans: 'b',
        exp: 'Sel $A$1 terkunci secara absolut sehingga tetap $A$1, sedangkan B2 relatif bergeser menjadi B3.'
      }
    ]
  },
  {
    meeting: 9,
    matId: 'mat_9',
    title: 'Mini Kuis: Kolaborasi Cloud & Produktivitas Digital',
    desc: 'Evaluasi fitur co-authoring real-time, izin sharing berkas, dan form survei cloud.',
    questions: [
      {
        q: 'Hak akses Google Drive yang memperbolehkan pengguna lain membaca isi dokumen tanpa bisa mengubah teks aslinya adalah...',
        a: 'Editor',
        b: 'Viewer',
        c: 'Owner',
        d: 'Administrator',
        ans: 'b',
        exp: 'Akses Viewer hanya memberi izin membaca dan melihat dokumen tanpa wewenang menyunting.'
      },
      {
        q: 'Fitur cloud yang sangat berguna untuk melihat riwayat perubahan kalimat dan mengembalikan draft yang tak sengaja terhapus adalah...',
        a: 'Trash Can',
        b: 'Version History (Riwayat Versi)',
        c: 'Spell Checker',
        d: 'Word Count',
        ans: 'b',
        exp: 'Version History merekam setiap versi suntingan berkas beserta waktu dan identitas penulisnya.'
      }
    ]
  },
  {
    meeting: 10,
    matId: 'mat_10',
    title: 'Mini Kuis: Bioinformatika Dasar & Database GenBank',
    desc: 'Uji pemahaman format FASTA, database hayati NCBI, dan interpretasi BLAST.',
    questions: [
      {
        q: 'Simbol awalan yang menjadi ciri khas format sekuens nukleotida/asam amino FASTA adalah...',
        a: '# (Pagar)',
        b: '> (Lebih Besar)',
        c: '@ (At Sign)',
        d: '$ (Dolar)',
        ans: 'b',
        exp: 'Format FASTA diawali tanda > pada baris deskripsi identifier sekuens.'
      },
      {
        q: 'Pada hasil pencarian homolog BLAST, nilai E-value yang mengindikasikan kemiripan sekuens sangat tinggi dan signifikan adalah...',
        a: 'E-value mendekati 100',
        b: 'E-value mendekati 0.0',
        c: 'E-value di atas 500',
        d: 'E-value tak terhingga',
        ans: 'b',
        exp: 'Semakin mendekati 0.0 nilai E-value, semakin tinggi signifikansi kemiripan sekuens homolog.'
      }
    ]
  },
  {
    meeting: 11,
    matId: 'mat_11',
    title: 'Mini Kuis: Visualisasi Lanjut & Regresi Data Sains',
    desc: 'Uji pembuatan kurva standar absorbansi, Trendline linier, R-squared, dan error bars.',
    questions: [
      {
        q: 'Tipe grafik yang paling sesuai untuk membuat kurva standar regresi konsentrasi vs absorbansi adalah...',
        a: 'Pie Chart (Diagram Lingkaran)',
        b: 'Scatter Plot (Diagram Sebar X-Y)',
        c: 'Radar Chart',
        d: 'Donut Chart',
        ans: 'b',
        exp: 'Scatter Plot memetakan titik koordinat variabel bebas X dan terikat Y secara akurat.'
      },
      {
        q: 'Nilai koefisien determinasi (R²) pada kurva standar yang menunjukkan linearitas data sangat ideal adalah...',
        a: 'R² mendekati 0.10',
        b: 'R² mendekati 1.0 (misal ≥ 0.98)',
        c: 'R² bernilai negatif',
        d: 'R² sama dengan 0',
        ans: 'b',
        exp: 'R² mendekati 1 menunjukkan model garis tren linier sangat sempurna memprediksi variasi data.'
      }
    ]
  },
  {
    meeting: 12,
    matId: 'mat_12',
    title: 'Mini Kuis: Basis Data Relasional & Manajemen Informasi',
    desc: 'Konsep Primary Key, entitas tabel relasional, dan form data spesimen hayati.',
    questions: [
      {
        q: 'Karakteristik utama dari kolom yang ditetapkan sebagai Primary Key dalam tabel database adalah...',
        a: 'Nilainya boleh sama persis di setiap baris',
        b: 'Wajib unik (tidak boleh ada duplikasi) dan tidak boleh kosong (NOT NULL)',
        c: 'Hanya boleh berisi teks huruf kecil',
        d: 'Dihapus otomatis setiap hari',
        ans: 'b',
        exp: 'Primary Key adalah identitas pengenal unik bagi tiap baris rekaman dalam tabel relasional.'
      },
      {
        q: 'Kelebihan utama database relasional dibandingkan flat file spreadsheet untuk ribuan koleksi spesimen laboratorium adalah...',
        a: 'Tidak membutuhkan listrik untuk berjalan',
        b: 'Mencegah redundansi data dan menjaga konsistensi integritas relasi antar data',
        c: 'Hanya bisa dibuka di satu komputer saja',
        d: 'Format font selalu lebih berwarna',
        ans: 'b',
        exp: 'Database relasional mengeliminasi duplikasi data dan menjamin konsistensi data katalog.'
      }
    ]
  },
  {
    meeting: 13,
    matId: 'mat_13',
    title: 'Mini Kuis: Integritas Akademik & Pemanfaatan AI Cerdas',
    desc: 'Etika pemanfaatan Generative AI, mitigasi halusinasi referensi, dan prompt engineering.',
    questions: [
      {
        q: 'Fenomena di mana model Generative AI menghasilkan fakta atau sitasi jurnal ilmiah palsu yang tampak meyakinkan disebut...',
        a: 'Halusinasi AI (AI Hallucination)',
        b: 'Debugging',
        c: 'Compilation Error',
        d: 'Overclocking',
        ans: 'a',
        exp: 'Halusinasi AI terjadi ketika model menghasilkan rujukan fiktif yang tidak eksis di dunia nyata.'
      },
      {
        q: 'Sikap yang paling tepat bagi mahasiswa biologi saat menggunakan asistensi AI dalam menyusun tinjauan pustaka adalah...',
        a: 'Menyalin mentah-mentah seluruh respon AI tanpa memeriksa kembali',
        b: 'Memverifikasi setiap rujukan ilmiah ke jurnal primer asli dan menulis ulang gagasan dengan kata-kata sendiri',
        c: 'Membuat nama penulis palsu agar tidak dicurigai',
        d: 'Menghindari membaca buku teks sama sekali',
        ans: 'b',
        exp: 'Integritas akademik mewajibkan verifikasi fakta rujukan primer dan orisinalitas parafrase naskah.'
      }
    ]
  },
  {
    meeting: 14,
    matId: 'mat_14',
    title: 'Mini Kuis: Manajemen Proyek Komputasi Sains',
    desc: 'Evaluasi integrasi studi kasus, pembagian peran kerja tim, dan alur metodologi data komputasi.',
    questions: [
      {
        q: 'Tahapan awal yang paling krusial dalam pengerjaan proyek akhir komputasi kelompok adalah...',
        a: 'Mencetak jilid naskah',
        b: 'Perumusan masalah riset, penentuan dataset pengamatan, dan pembagian peran tim yang jelas',
        c: 'Membeli perlengkapan dekorasi presentasi',
        d: 'Mengganti topik di hari terakhir',
        ans: 'b',
        exp: 'Perumusan masalah dan penentuan dataset yang jelas adalah fondasi keberhasilan proyek sains.'
      },
      {
        q: 'Dalam pelaporan proyek sains, lampiran yang wajib disertakan untuk membuktikan validitas analisis adalah...',
        a: 'Foto profil media sosial kelompok',
        b: 'Lembar dataset mentah dan rekap tabel formula kalkulasi',
        c: 'Resep makanan praktikum',
        d: 'Nota pembelian laptop',
        ans: 'b',
        exp: 'Dataset mentah dan rekap formula adalah bukti otentik transparansi penelitian (open science).'
      }
    ]
  },
  {
    meeting: 15,
    matId: 'mat_15',
    title: 'Mini Kuis: Refleksi & Evaluasi Komprehensif',
    desc: 'Refleksi kompetensi seminar proyek ilmiah dan teknik menghadapi sesi tanya jawab akademik.',
    questions: [
      {
        q: 'Saat audiens atau dosen penguji memberikan pertanyaan kritis mengenai metodologi data kelompok, respon terbaik presenter adalah...',
        a: 'Meninggalkan panggung seminar',
        b: 'Mendengarkan dengan seksama, mencatat inti pertanyaan, dan menjawab secara lugas berlandaskan data analisis',
        c: 'Menyalahkan anggota tim lain',
        d: 'Membantah tanpa menunjukkan bukti tabel',
        ans: 'b',
        exp: 'Profesionalisme akademik tercermin dari kemampuan menjawab argumentatif berbasis bukti data objektif.'
      },
      {
        q: 'Manfaat utama sesi peer-review antar kelompok mahasiswa dalam seminar proyek adalah...',
        a: 'Mencari kesalahan untuk menjatuhkan nilai rekan',
        b: 'Memberikan umpan balik konstruktif guna menyempurnakan kualitas laporan akhir sebelum UAS',
        c: 'Mengurangi waktu tidur',
        d: 'Menghindari presentasi mandiri',
        ans: 'b',
        exp: 'Peer-review mendorong diskusi ilmiah konstruktif yang meningkatkan kualitas naskah final.'
      }
    ]
  },
  {
    meeting: 16,
    matId: 'mat_16',
    title: 'Mini Kuis: Evaluasi Komprehensif UAS Aplikasi Komputer',
    desc: 'Evaluasi pamungkas pemahaman seluruh domain keilmuan Aplikasi Komputer semester ganjil.',
    questions: [
      {
        q: 'Kompetensi digital paling utama yang diharapkan dikuasai lulusan mahasiswa sains melalui mata kuliah ini adalah...',
        a: 'Bermain game online dengan lancar',
        b: 'Mampu memanfaatkan aplikasi komputer secara etis, produktif, dan presisi dalam riset ilmiah dan publikasi akademik',
        c: 'Membongkar casing komputer tanpa alasan',
        d: 'Menghafal tombol keyboard',
        ans: 'b',
        exp: 'Tujuan utama mata kuliah adalah membekali mahasiswa kecakapan komputasi terapan untuk riset dan profesi ilmiah.'
      },
      {
        q: 'Format file standar yang paling disarankan saat mengirimkan naskah laporan akhir UAS agar tata letak halaman tidak berubah pada komputer penguji adalah...',
        a: 'Format PDF (.pdf)',
        b: 'Format Plain Text (.txt)',
        c: 'Format Batch Script (.bat)',
        d: 'Format Gambar (.bmp)',
        ans: 'a',
        exp: 'Format PDF (Portable Document Format) mempertahankan tata letak, tipografi, dan grafik persis seperti yang didesain pembuat.'
      }
    ]
  }
];

quizData.forEach((qd, idx) => {
  const quizId = `quiz_${qd.meeting}`;
  rpsQuizzes.push({
    id: quizId,
    material_id: qd.matId,
    title: qd.title,
    description: qd.desc,
    points: 30,
    created_at: `2026-0${Math.min(4, Math.floor(qd.meeting/4)+1)}-10T10:00:00Z`,
    course_id: "course_1"
  });

  qd.questions.forEach((q, qIdx) => {
    rpsQuestions.push({
      id: `q_${qd.meeting}_${qIdx + 1}`,
      quiz_id: quizId,
      type: 'single_choice',
      question: q.q,
      option_a: q.a,
      option_b: q.b,
      option_c: q.c,
      option_d: q.d,
      correct_answer: q.ans,
      explanation: q.exp
    });
  });
});

db.quizzes = rpsQuizzes;
db.questions = rpsQuestions;

// 4. Assignments across Key RPS Milestones
const rpsAssignments = [
  {
    id: "asg_1",
    meeting_number: 2,
    title: "Tugas 1: Manajemen Hierarki Direktori & Strategi Backup 3-2-1",
    description: "Rancang bagan struktur folder praktikum biologi serta dokumentasikan konfigurasi backup cloud pada laptop pribadi Anda.",
    due_date: "2026-02-01T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_2",
    meeting_number: 3,
    title: "Tugas 2: Penyusunan Dokumen Karya Tulis dengan Heading Styles & Sitasi Mendeley",
    description: "Susun template artikel ilmiah 5 halaman: gunakan Heading 1, 2, 3, Daftar Isi otomatis, Section Break (romawi & arab), serta minimal 5 sitasi Mendeley berstandar APA 7th.",
    due_date: "2026-02-08T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_3",
    meeting_number: 4,
    title: "Tugas 3: Analisis Data Kuantitatif Uji Lab dengan Formula Spreadsheet",
    description: "Olah dataset pengamatan pertumbuhan perkecambahan: gunakan formula AVERAGE, STDEV.S, COUNTIF, IF mutu, dan buat grafik diagram batang berlabel lengkap.",
    due_date: "2026-02-15T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_4",
    meeting_number: 5,
    title: "Tugas 4: Perancangan Slide Seminar Ilmiah & Visualisasi Metodologi",
    description: "Rancang 5-slide presentasi ilmiah mengenai uji enzimatis dengan prinsip 1 ide per slide, kontras tinggi, dan diagram alir metodologi praktikum.",
    due_date: "2026-02-22T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_5",
    meeting_number: 7,
    title: "Tugas 5: Laporan Studi Kasus Komputasi Sains Pra-UTS Terpadu",
    description: "Selesaikan studi kasus integrasi olah data spreadsheet, penulisan laporan terpadu Word, dan ekspor grafik kualitas tinggi pra-UTS.",
    due_date: "2026-03-01T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_6",
    meeting_number: 9,
    title: "Tugas 6: Manajemen Dokumen Kolaboratif Cloud & Version Control",
    description: "Buat dokumen riset bersama 3 rekan di Google Docs/Drive, praktikkan co-authoring real-time, komentar revisi, dan cantumkan tangkapan layar Version History.",
    due_date: "2026-03-15T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_7",
    meeting_number: 10,
    title: "Tugas 7: Penelusuran Sekuen Hayati di NCBI GenBank & Analisis BLAST",
    description: "Cari sekuens gen rbcL tumbuhan lokal di database NCBI, unduh file FASTA, jalankan analisis BLASTn, dan jelaskan makna E-value serta persen identitas homolog.",
    due_date: "2026-03-22T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_8",
    meeting_number: 11,
    title: "Tugas 8: Pembuatan Kurva Standar Regresi Linier & Error Bar Data Lab",
    description: "Olah data absorbansi spektrofotometri, buat grafik Scatter, tambahkan garis tren linier, tampilkan persamaan y = mx + c serta R², dan lengkapi dengan error bars.",
    due_date: "2026-03-29T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_9",
    meeting_number: 12,
    title: "Tugas 9: Desain Tabel Basis Data Relasional Spesimen Laboratorium",
    description: "Rancang skema tabel basis data relasional untuk katalog spesimen herbarium: tentukan primary key, foreign key, dan minimal 15 baris data entitas contoh.",
    due_date: "2026-04-05T23:59:00Z",
    max_score: 100
  },
  {
    id: "asg_10",
    meeting_number: 14,
    title: "Tugas 10: Proposal & Laporan Proyek Akhir Komputasi Sains",
    description: "Kumpulkan draft naskah laporan lengkap proyek akhir komputasi kelompok beserta tautan folder dataset spreadsheet dan slide seminar.",
    due_date: "2026-04-19T23:59:00Z",
    max_score: 100
  }
];

db.assignments = rpsAssignments;

// 5. Build Comprehensive Realistic Student Roster across BIO-2A, BIO-2B, BIO-2C
const studentTemplates = [
  // BIO-2A
  { name: 'Siti Nurhaliza', nim: '230302001', class_name: 'BIO-2A', email: 'siti.nurhaliza@hamzanwadi.ac.id' },
  { name: 'Rizky Pratama', nim: '230302002', class_name: 'BIO-2A', email: 'rizky.pratama@hamzanwadi.ac.id' },
  { name: 'Budi Santoso', nim: '230302005', class_name: 'BIO-2A', email: 'budi.santoso@hamzanwadi.ac.id' },
  { name: 'Baiq Rina Marlina', nim: '230302007', class_name: 'BIO-2A', email: 'baiq.rina@hamzanwadi.ac.id' },
  { name: 'Lalu Muhammad Rizki', nim: '230302008', class_name: 'BIO-2A', email: 'lalu.rizki@hamzanwadi.ac.id' },
  { name: 'Fathur Rahman', nim: '230302011', class_name: 'BIO-2A', email: 'fathur.rahman@hamzanwadi.ac.id' },
  { name: 'Nurul Aini', nim: '230302014', class_name: 'BIO-2A', email: 'nurul.aini@hamzanwadi.ac.id' },
  { name: 'Zulfa Hidayati', nim: '230302017', class_name: 'BIO-2A', email: 'zulfa.h@hamzanwadi.ac.id' },

  // BIO-2B
  { name: 'Ahmad Fauzan', nim: '230302003', class_name: 'BIO-2B', email: 'ahmad.fauzan@hamzanwadi.ac.id' },
  { name: 'Dinda Rahmawati', nim: '230302004', class_name: 'BIO-2B', email: 'dinda.rahma@hamzanwadi.ac.id' },
  { name: 'Muhammad Ilham', nim: '230302006', class_name: 'BIO-2B', email: 'm.ilham@hamzanwadi.ac.id' },
  { name: 'Ni Wayan Dian Lestari', nim: '230302009', class_name: 'BIO-2B', email: 'dian.lestari@hamzanwadi.ac.id' },
  { name: 'Eka Putri Wardani', nim: '230302012', class_name: 'BIO-2B', email: 'eka.putri@hamzanwadi.ac.id' },
  { name: 'Haerul Umam', nim: '230302015', class_name: 'BIO-2B', email: 'haerul.umam@hamzanwadi.ac.id' },
  { name: 'Intan Permatasari', nim: '230302018', class_name: 'BIO-2B', email: 'intan.p@hamzanwadi.ac.id' },
  { name: 'Kurnia Ramadhan', nim: '230302021', class_name: 'BIO-2B', email: 'kurnia.r@hamzanwadi.ac.id' },

  // BIO-2C
  { name: 'Wahyu Hidayat', nim: '230302010', class_name: 'BIO-2C', email: 'wahyu.h@hamzanwadi.ac.id' },
  { name: 'Suhartini', nim: '230302013', class_name: 'BIO-2C', email: 'suhartini@hamzanwadi.ac.id' },
  { name: 'M. Taufik Hidayatullah', nim: '230302016', class_name: 'BIO-2C', email: 'm.taufik@hamzanwadi.ac.id' },
  { name: 'Anisa Maharani', nim: '230302019', class_name: 'BIO-2C', email: 'anisa.m@hamzanwadi.ac.id' },
  { name: 'Lalu Agus Setiawan', nim: '230302020', class_name: 'BIO-2C', email: 'lalu.agus@hamzanwadi.ac.id' },
  { name: 'Yulia Citra', nim: '230302022', class_name: 'BIO-2C', email: 'yulia.citra@hamzanwadi.ac.id' },
  { name: 'Dimas Anggara', nim: '230302023', class_name: 'BIO-2C', email: 'dimas.a@hamzanwadi.ac.id' },
  { name: 'Putri Ayu Wandira', nim: '230302024', class_name: 'BIO-2C', email: 'putri.ayu@hamzanwadi.ac.id' },
];

function hashPassword(password) {
  return require('crypto').createHash('sha256').update(password + '_gema_bio_salt_2026').digest('hex');
}

const existingAdmin = db.users.find(u => u.role === 'admin') || {
  id: 'usr_admin',
  username: 'admin',
  password_hash: hashPassword('12345*'),
  name: 'Haryono Prasetyo, S.Kom., M.T.',
  email: 'admin@hamzanwadi.ac.id',
  role: 'admin',
  department: 'Pusat Komputer & SI',
  created_at: '2026-01-01T08:00:00Z'
};
existingAdmin.password_hash = hashPassword('12345*');

const existingDosen = db.users.find(u => u.role === 'dosen') || {
  id: 'usr_dosen',
  username: 'dosen',
  password_hash: hashPassword('12345*'),
  name: 'Dr. Sri Wahyuni, M.Kom.',
  email: 'sri.wahyuni@hamzanwadi.ac.id',
  role: 'dosen',
  department: 'Pendidikan Biologi',
  nidn: '0812038501',
  created_at: '2026-01-01T08:00:00Z'
};
existingDosen.password_hash = hashPassword('12345*');

const studentUsers = studentTemplates.map((st, i) => {
  const id = `usr_mhs_${i + 1}`;
  return {
    id,
    username: st.nim,
    password_hash: hashPassword('12345*'),
    name: st.name,
    email: st.email,
    role: 'mahasiswa',
    student_id: st.nim,
    class_name: st.class_name,
    department: 'Pendidikan Biologi',
    avatar: '',
    created_at: '2026-01-10T08:00:00Z'
  };
});

db.users = [existingAdmin, existingDosen, ...studentUsers];

// 6. Populate Realistic Attendances Across Meetings 1-16
const meetingTopicsMap = {
  1: 'Pertemuan 1: Pengenalan Komputer & Ekosistem Perangkat Lunak',
  2: 'Pertemuan 2: Manajemen Berkas & Sistem Operasi',
  3: 'Pertemuan 3: Pengolah Kata: Tata Tulis Ilmiah & Sitasi',
  4: 'Pertemuan 4: Pengolah Angka: Analisis Data Statistik & Formula',
  5: 'Pertemuan 5: Desain Slide Presentasi Ilmiah & Komunikasi Visual',
  6: 'Pertemuan 6: Keamanan Siber & Privasi Digital Mahasiswa',
  7: 'Pertemuan 7: Review & Praktikum Terpadu Pra-UTS',
  8: 'Pertemuan 8: Evaluasi Ujian Tengah Semester (UTS)',
  9: 'Pertemuan 9: Aplikasi Produktivitas & Kolaborasi Cloud',
  10: 'Pertemuan 10: Pengenalan Komputasi Bioinformatika Dasar',
  11: 'Pertemuan 11: Visualisasi Data Laboratorium dengan Chart Tingkat Lanjut',
  12: 'Pertemuan 12: Manajemen Basis Data & Tabel Relasional Sederhana',
  13: 'Pertemuan 13: Etika Digital & Pemanfaatan AI Akademik yang Bertanggung Jawab',
  14: 'Pertemuan 14: Proyek Akhir Komputasi Sains & Presentasi Kelompok',
  15: 'Pertemuan 15: Review Komprehensif',
  16: 'Pertemuan 16: Evaluasi Ujian Akhir Semester (UAS)'
};

const allAttendances = [];
// Meetings 1 through 10 have recorded real attendance, 11-16 upcoming/prepared
for (let m = 1; m <= 10; m++) {
  const meetingDate = `2026-0${Math.floor(m/5)+1}-${String(((m % 4) * 7) + 5).padStart(2, '0')}T08:00:00Z`;
  studentUsers.forEach((stu, sIdx) => {
    // Generate realistic distribution: 90% hadir, some izin/sakit, rarely alpa
    let status = 'hadir';
    let notes = 'Hadir tepat waktu';
    const seed = (m * 17 + sIdx * 31) % 100;
    if (seed === 7 || seed === 23) {
      status = 'izin';
      notes = 'Izin kegiatan ormawa kampus';
    } else if (seed === 13) {
      status = 'sakit';
      notes = 'Surat keterangan dokter terlampir';
    } else if (seed === 91 && sIdx % 5 === 0) {
      status = 'alpa';
      notes = 'Tanpa konfirmasi';
    }

    allAttendances.push({
      id: `att_${m}_${stu.id}`,
      meeting_number: m,
      meeting_topic: meetingTopicsMap[m],
      date: meetingDate,
      user_id: stu.id,
      status: status,
      notes: notes,
      updated_at: meetingDate
    });
  });
}
db.attendances = allAttendances;

// 7. Populate Realistic Assignment Submissions
const sampleSubmissions = [];
const submissionFeedbacks = [
  'Sistematika sangat rapi dan memenuhi rubrik RPS dengan baik.',
  'Analisis data sangat akurat, format grafik sesuai standar publikasi.',
  'Bagus! Penerapan formula spreadsheet tepat sasaran.',
  'Heading styles dan sitasi Mendeley lengkap berstandar APA 7th.',
  'Desain slide komunikatif dengan rasio kontras visual yang optimal.',
  'Penjelasan makna E-value dan analisis BLAST sangat mendalam.'
];

rpsAssignments.slice(0, 5).forEach((asg, asgIdx) => {
  studentUsers.forEach((stu, stuIdx) => {
    // 85% of students submit
    if ((asgIdx + stuIdx) % 7 !== 0) {
      const score = Math.min(100, Math.max(75, 82 + ((stuIdx * 3 + asgIdx * 7) % 18)));
      const feedback = submissionFeedbacks[(stuIdx + asgIdx) % submissionFeedbacks.length];
      sampleSubmissions.push({
        id: `sub_${asg.id}_${stu.id}`,
        assignment_id: asg.id,
        user_id: stu.id,
        content: `https://drive.google.com/file/d/tugas_${asg.meeting_number}_${stu.student_id}/view - Laporan praktikum pertemuan ${asg.meeting_number}`,
        score: score,
        feedback: feedback,
        submitted_at: `2026-0${Math.floor(asg.meeting_number/5)+1}-12T14:30:00Z`,
        graded_at: `2026-0${Math.floor(asg.meeting_number/5)+1}-14T10:00:00Z`
      });
    }
  });
});
db.assignment_submissions = sampleSubmissions;

// 8. Populate Realistic Quiz Results
const sampleQuizResults = [];
rpsQuizzes.slice(0, 8).forEach((quiz, qIdx) => {
  studentUsers.forEach((stu, sIdx) => {
    if ((qIdx + sIdx) % 9 !== 0) {
      const score = Math.min(100, Math.max(70, 80 + ((sIdx * 5 + qIdx * 11) % 21)));
      sampleQuizResults.push({
        id: `res_${quiz.id}_${stu.id}`,
        user_id: stu.id,
        quiz_id: quiz.id,
        score: score,
        points_earned: Math.round(score * 0.3),
        total_questions: 3,
        correct_count: score >= 90 ? 3 : score >= 70 ? 2 : 1,
        completed_at: `2026-0${Math.floor(qIdx/3)+1}-15T11:00:00Z`
      });
    }
  });
});
db.quiz_results = sampleQuizResults;

// 9. Populate Progress
const sampleProgress = [];
rpsMaterials.slice(0, 8).forEach((mat, mIdx) => {
  studentUsers.forEach((stu, sIdx) => {
    const isCompleted = (mIdx + sIdx) % 8 !== 0;
    sampleProgress.push({
      id: `prog_${mat.id}_${stu.id}`,
      user_id: stu.id,
      material_id: mat.id,
      status: isCompleted ? 'completed' : 'in_progress',
      completed_at: isCompleted ? `2026-0${Math.floor(mIdx/3)+1}-14T12:00:00Z` : null,
      updated_at: '2026-02-20T10:00:00Z'
    });
  });
});
db.progress = sampleProgress;

// Write back to database.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully seeded database with full 16 RPS meetings, quizzes, questions, assignments, and realistic classes!');
