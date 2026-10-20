export interface PresetDiagram {
  id: string;
  title: string;
  category: string;
  caption: string;
  thumbnail: string;
  dataUrl: string;
}

// Crisp, high-contrast educational SVG diagrams encoded as data URLs
export const PRESET_DIAGRAMS: PresetDiagram[] = [
  {
    id: 'diag_ipo',
    title: 'Siklus Pemrosesan Data (Input - Proses - Output)',
    category: 'Pengenalan Komputer',
    caption: 'Gambar: Diagram Siklus Input - Proses - Output (IPO) pada Sistem Komputer Modern',
    thumbnail: 'IPO Cycle',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <rect width="800" height="360" rx="20" fill="#0f172a"/>
  <text x="400" y="45" fill="#f8fafc" font-size="20" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">DIAGRAM ALUR SIKLUS PEMROSESAN DATA (IPO CYCLE)</text>
  <text x="400" y="70" fill="#94a3b8" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">Prinsip Kerja Komputer: Input Device → Processing Unit → Output Device</text>
  
  <!-- Input Box -->
  <rect x="50" y="110" width="180" height="130" rx="14" fill="#1e293b" stroke="#38bdf8" stroke-width="3"/>
  <rect x="70" y="125" width="40" height="40" rx="8" fill="#0284c7"/>
  <text x="90" y="150" fill="#ffffff" font-size="20" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">IN</text>
  <text x="140" y="145" fill="#38bdf8" font-size="16" font-weight="bold" font-family="system-ui, sans-serif">1. INPUT</text>
  <text x="140" y="165" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Pemasukan Data</text>
  <text x="70" y="195" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• Keyboard &amp; Mouse</text>
  <text x="70" y="215" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• Scanner &amp; Mikrofon</text>

  <!-- Arrow 1 -->
  <path d="M 240 175 L 290 175" stroke="#38bdf8" stroke-width="4" stroke-dasharray="6,4" marker-end="url(#arrow)"/>
  <polygon points="290,170 305,175 290,180" fill="#38bdf8"/>

  <!-- Process Box -->
  <rect x="310" y="100" width="180" height="150" rx="14" fill="#1e293b" stroke="#a855f7" stroke-width="3"/>
  <rect x="330" y="115" width="40" height="40" rx="8" fill="#7e22ce"/>
  <text x="350" y="140" fill="#ffffff" font-size="18" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">CPU</text>
  <text x="390" y="135" fill="#c084fc" font-size="16" font-weight="bold" font-family="system-ui, sans-serif">2. PROSES</text>
  <text x="390" y="155" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Pengolahan Data</text>
  <text x="330" y="185" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• ALU (Aritmatika/Logika)</text>
  <text x="330" y="205" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• CU (Control Unit)</text>
  <text x="330" y="225" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• Register &amp; Cache</text>

  <!-- Arrow 2 -->
  <path d="M 500 175 L 550 175" stroke="#34d399" stroke-width="4" stroke-dasharray="6,4"/>
  <polygon points="550,170 565,175 550,180" fill="#34d399"/>

  <!-- Output Box -->
  <rect x="570" y="110" width="180" height="130" rx="14" fill="#1e293b" stroke="#34d399" stroke-width="3"/>
  <rect x="590" y="125" width="40" height="40" rx="8" fill="#059669"/>
  <text x="610" y="150" fill="#ffffff" font-size="18" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">OUT</text>
  <text x="645" y="145" fill="#34d399" font-size="16" font-weight="bold" font-family="system-ui, sans-serif">3. OUTPUT</text>
  <text x="645" y="165" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Hasil Informasi</text>
  <text x="590" y="195" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• Layar Monitor</text>
  <text x="590" y="215" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif">• Printer &amp; Audio</text>

  <!-- Storage Box (Bottom Center) -->
  <rect x="280" y="275" width="240" height="65" rx="10" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <text x="400" y="300" fill="#fbbf24" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">4. STORAGE (Media Penyimpanan)</text>
  <text x="400" y="322" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">SSD / Harddisk / Flash Memory / Cloud</text>
  <path d="M 400 255 L 400 270" stroke="#f59e0b" stroke-width="3" stroke-dasharray="3,3"/>
</svg>
`)}`,
  },
  {
    id: 'diag_architecture',
    title: 'Arsitektur Komputer & Memori (CPU - RAM - Storage)',
    category: 'Perangkat Keras',
    caption: 'Gambar: Diagram Hierarki Memori & Komunikasi Bus Sistem Komputer',
    thumbnail: 'Computer Arch',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <rect width="800" height="360" rx="20" fill="#091e28"/>
  <text x="400" y="45" fill="#38bdf8" font-size="20" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">ARSITEKTUR PERANGKAT KERAS KOMPUTER</text>
  <text x="400" y="70" fill="#94a3b8" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">Aliran Bus Data, Alamat, dan Kendali antar Komponen Utama</text>

  <!-- Central CPU Card -->
  <rect x="60" y="100" width="200" height="210" rx="16" fill="#0f2b38" stroke="#0284c7" stroke-width="3"/>
  <text x="160" y="130" fill="#38bdf8" font-size="16" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">CENTRAL PROCESSING UNIT</text>
  <rect x="80" y="145" width="160" height="40" rx="8" fill="#164e63"/>
  <text x="160" y="170" fill="#e0f2fe" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Control Unit (CU)</text>
  <rect x="80" y="195" width="160" height="40" rx="8" fill="#164e63"/>
  <text x="160" y="220" fill="#e0f2fe" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Arithmetic Logic Unit (ALU)</text>
  <rect x="80" y="245" width="160" height="40" rx="8" fill="#164e63"/>
  <text x="160" y="270" fill="#e0f2fe" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Register &amp; Cache L1/L2</text>

  <!-- Bus Trunk -->
  <rect x="290" y="185" width="80" height="30" rx="6" fill="#0369a1"/>
  <text x="330" y="205" fill="#ffffff" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">BUS</text>

  <!-- RAM Memory Card -->
  <rect x="400" y="100" width="160" height="210" rx="16" fill="#0f2b38" stroke="#10b981" stroke-width="3"/>
  <text x="480" y="135" fill="#34d399" font-size="16" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">MEMORI UTAMA</text>
  <text x="480" y="155" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">(RAM / ROM)</text>
  <circle cx="480" cy="195" r="24" fill="#065f46"/>
  <text x="480" y="200" fill="#a7f3d0" font-size="11" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">RAM</text>
  <text x="480" y="240" fill="#e2e8f0" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Volatile Storage</text>
  <text x="480" y="260" fill="#94a3b8" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Akses Sangat Cepat</text>

  <!-- Bus Trunk 2 -->
  <rect x="585" y="185" width="45" height="30" rx="6" fill="#0369a1"/>

  <!-- Secondary Storage Card -->
  <rect x="650" y="100" width="110" height="210" rx="16" fill="#0f2b38" stroke="#f59e0b" stroke-width="3"/>
  <text x="705" y="135" fill="#fbbf24" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">STORAGE</text>
  <rect x="665" y="160" width="80" height="45" rx="6" fill="#78350f"/>
  <text x="705" y="185" fill="#fde68a" font-size="11" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">SSD / HDD</text>
  <text x="705" y="235" fill="#e2e8f0" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Non-Volatile</text>
  <text x="705" y="255" fill="#94a3b8" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Kapasitas Besar</text>
</svg>
`)}`,
  },
  {
    id: 'diag_network',
    title: 'Model Komunikasi Jaringan (Client - Server & Cloud)',
    category: 'Jaringan & Internet',
    caption: 'Gambar: Arsitektur Model Komunikasi Klien - Server dan Layanan Komputasi Awan',
    thumbnail: 'Client Server',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <rect width="800" height="360" rx="20" fill="#111827"/>
  <text x="400" y="45" fill="#60a5fa" font-size="20" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">ARSITEKTUR JARINGAN &amp; CLIENT-SERVER</text>
  <text x="400" y="70" fill="#9ca3af" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">Protokol HTTP/HTTPS, Database Server, &amp; Perangkat Klien Mahasiswa</text>

  <!-- Client 1 Laptop -->
  <rect x="50" y="120" width="150" height="90" rx="12" fill="#1f2937" stroke="#3b82f6" stroke-width="2"/>
  <text x="125" y="155" fill="#93c5fd" font-size="14" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">KLIEN (Browser)</text>
  <text x="125" y="175" fill="#d1d5db" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Laptop Mahasiswa</text>

  <!-- Client 2 Mobile -->
  <rect x="50" y="230" width="150" height="80" rx="12" fill="#1f2937" stroke="#3b82f6" stroke-width="2"/>
  <text x="125" y="260" fill="#93c5fd" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">SMARTPHONE</text>
  <text x="125" y="280" fill="#d1d5db" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Aplikasi Mobile</text>

  <!-- Internet Cloud in center -->
  <ellipse cx="370" cy="205" rx="100" ry="60" fill="#1e3a8a" stroke="#60a5fa" stroke-width="3"/>
  <text x="370" y="200" fill="#ffffff" font-size="16" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">INTERNET</text>
  <text x="370" y="222" fill="#93c5fd" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">TCP/IP &amp; DNS Gateway</text>

  <!-- Connection Lines -->
  <path d="M 205 165 L 275 190" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5,4"/>
  <path d="M 205 265 L 275 220" stroke="#60a5fa" stroke-width="3" stroke-dasharray="5,4"/>
  <path d="M 470 205 L 545 205" stroke="#10b981" stroke-width="3" stroke-dasharray="5,4"/>

  <!-- Server Stack -->
  <rect x="550" y="110" width="200" height="95" rx="12" fill="#1f2937" stroke="#10b981" stroke-width="2"/>
  <text x="650" y="145" fill="#34d399" font-size="15" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">WEB SERVER</text>
  <text x="650" y="165" fill="#d1d5db" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Aplikasi LMS Kampus</text>
  <text x="650" y="185" fill="#9ca3af" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Node.js / Express API</text>

  <!-- Database Box -->
  <rect x="550" y="225" width="200" height="90" rx="12" fill="#1f2937" stroke="#f59e0b" stroke-width="2"/>
  <text x="650" y="255" fill="#fbbf24" font-size="15" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">DATABASE SERVER</text>
  <text x="650" y="275" fill="#d1d5db" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Penyimpanan Relasional</text>
  <text x="650" y="295" fill="#9ca3af" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle">Data Nilai, Kuis, &amp; Akun</text>
</svg>
`)}`,
  },
  {
    id: 'diag_flowchart',
    title: 'Diagram Alir (Flowchart) Logika & Keputusan',
    category: 'Logika & Algoritma',
    caption: 'Gambar: Simbol Standar Diagram Alir Pemrograman & Pengambilan Keputusan',
    thumbnail: 'Flowchart',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <rect width="800" height="360" rx="20" fill="#0f172a"/>
  <text x="400" y="45" fill="#38bdf8" font-size="20" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">SIMBOL STANDAR FLOWCHART PEMROGRAMAN</text>
  <text x="400" y="70" fill="#94a3b8" font-size="12" font-family="system-ui, sans-serif" text-anchor="middle">Pedoman Notasi Algoritma dan Struktur Pengambilan Keputusan</text>

  <!-- 1. Terminator -->
  <rect x="50" y="110" width="140" height="50" rx="25" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <text x="120" y="140" fill="#ffffff" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Mulai / Selesai</text>
  <text x="120" y="180" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Terminator</text>

  <!-- 2. Process -->
  <rect x="235" y="110" width="140" height="50" rx="4" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>
  <text x="305" y="140" fill="#ffffff" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Perhitungan / Aksi</text>
  <text x="305" y="180" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Proses (Kotak)</text>

  <!-- 3. Decision Diamond -->
  <polygon points="495,100 550,135 495,170 440,135" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <text x="495" y="140" fill="#ffffff" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Kondisi ?</text>
  <text x="495" y="190" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Keputusan (Belah Ketupat)</text>

  <!-- 4. Input Output Parallelogram -->
  <polygon points="650,110 755,110 735,160 630,160" fill="#1e293b" stroke="#34d399" stroke-width="2"/>
  <text x="692" y="140" fill="#ffffff" font-size="12" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">Input / Output</text>
  <text x="692" y="180" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle">Jajaran Genjang</text>

  <!-- Bottom workflow example -->
  <rect x="80" y="230" width="640" height="100" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <text x="100" y="260" fill="#38bdf8" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">Contoh Alur Logika Evaluasi Mahasiswa:</text>
  <text x="100" y="285" fill="#cbd5e1" font-size="12" font-family="system-ui, sans-serif">[Mulai] → [Input Nilai Akhir] → {Jika Nilai &gt;= 75} → [Lulus / Grade A &amp; B] → [Selesai]</text>
  <text x="100" y="308" fill="#94a3b8" font-size="11" font-family="system-ui, sans-serif">Menggunakan struktur percabangan If-Else dengan visualisasi simbolik yang terstandar.</text>
</svg>
`)}`,
  },
];
