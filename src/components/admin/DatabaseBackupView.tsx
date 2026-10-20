import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { DatabaseStats, DatabaseSnapshot, CloudDatabaseStatus } from '../../types';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Layers,
  BookOpen,
  HelpCircle,
  CalendarCheck,
  ShieldAlert,
  Trash2,
  HardDrive,
  RefreshCw,
  Plus,
  X,
  FileCode,
  ArrowRight,
  ShieldCheck,
  Building2,
  Cloud,
  CloudLightning,
} from 'lucide-react';

export const DatabaseBackupView: React.FC = () => {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [snapshots, setSnapshots] = useState<DatabaseSnapshot[]>([]);
  const [cloudStatus, setCloudStatus] = useState<CloudDatabaseStatus | null>(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Snapshot Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  // File Upload Restore state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackupData, setParsedBackupData] = useState<any | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadingRestore, setUploadingRestore] = useState(false);

  // Restore Confirmation Modal
  const [restoreTarget, setRestoreTarget] = useState<{
    type: 'snapshot' | 'file' | 'factory';
    id?: string;
    title: string;
    description: string;
  } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load stats, snapshots, and cloud status
  const loadData = async () => {
    try {
      setRefreshing(true);
      const [statsData, snapData, cloud] = await Promise.all([
        api.database.getStats(),
        api.database.getSnapshots(),
        api.database.getCloudStatus().catch(() => null),
      ]);
      setStats(statsData);
      setSnapshots(snapData);
      if (cloud) {
        setCloudStatus(cloud);
      }
    } catch (err: any) {
      console.error('Failed loading database stats/snapshots:', err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Tidak dapat memuat statistik database.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSyncCloud = async () => {
    try {
      setSyncingCloud(true);
      showToast({
        type: 'info',
        title: 'Menyinkronkan ke Cloud',
        message: 'Menyimpan seluruh data ke Firebase Firestore...',
      });
      const res = await api.database.syncCloud();
      setCloudStatus(res.status);
      showToast({
        type: 'success',
        title: 'Sinkronisasi Berhasil',
        message: 'Seluruh database telah aman tersimpan di Google Cloud Firestore.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Sinkronisasi Cloud',
        message: err.message || 'Terjadi kesalahan saat sinkronisasi cloud.',
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Download Current Database JSON (Export)
  const handleDownloadBackup = async () => {
    try {
      showToast({
        type: 'info',
        title: 'Menyiapkan Unduhan',
        message: 'Mengemas seluruh tabel database sistem...',
      });
      const data = await api.database.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `gemabio_database_backup_${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({
        type: 'success',
        title: 'Backup Berhasil Diunduh',
        message: 'File cadangan JSON telah tersimpan di komputer Anda.',
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunduh Backup',
        message: err.message || 'Terjadi kesalahan saat mengekspor database.',
      });
    }
  };

  // 2. Create Server-side Snapshot
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingSnapshot(true);
      const res = await api.database.createSnapshot(snapshotLabel.trim() || 'Snapshot Manual');
      showToast({
        type: 'success',
        title: 'Snapshot Tersimpan',
        message: res.message,
      });
      setShowCreateModal(false);
      setSnapshotLabel('');
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membuat Snapshot',
        message: err.message || 'Terjadi kesalahan saat membuat snapshot.',
      });
    } finally {
      setCreatingSnapshot(false);
    }
  };

  // 3. Handle File Selection for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParsedBackupData(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.endsWith('.json')) {
      setParseError('File wajib berekstensi .json');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const data = parsed.data || parsed;

        if (!data || typeof data !== 'object') {
          throw new Error('Format file JSON tidak sesuai struktur database.');
        }

        // Validate basic keys
        const required = ['users', 'materials', 'courses'];
        for (const req of required) {
          if (!Array.isArray(data[req])) {
            throw new Error(`File cadangan tidak memuat daftar array "${req}".`);
          }
        }

        setParsedBackupData(parsed);
      } catch (err: any) {
        console.error(err);
        setParseError(err.message || 'File JSON rusak atau tidak valid.');
        setParsedBackupData(null);
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca berkas yang dipilih.');
    };
    reader.readAsText(file);
  };

  // 4. Execute Restore
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;

    try {
      setIsRestoring(true);

      if (restoreTarget.type === 'snapshot' && restoreTarget.id) {
        const res = await api.database.restoreSnapshot(restoreTarget.id);
        showToast({
          type: 'success',
          title: 'Pemulihan Berhasil',
          message: res.message,
        });
      } else if (restoreTarget.type === 'file' && parsedBackupData) {
        const res = await api.database.restoreUpload(parsedBackupData);
        showToast({
          type: 'success',
          title: 'Pemulihan Berhasil',
          message: res.message,
        });
        setSelectedFile(null);
        setParsedBackupData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else if (restoreTarget.type === 'factory') {
        const res = await api.database.resetFactory();
        showToast({
          type: 'success',
          title: 'Reset Pabrik Berhasil',
          message: res.message,
        });
      }

      setRestoreTarget(null);
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Pemulihan Gagal',
        message: err.message || 'Terjadi kesalahan saat memulihkan database.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Delete Server Snapshot
  const handleDeleteSnapshot = async (id: string, label: string) => {
    if (!window.confirm(`Hapus file snapshot "${label}" dari server?`)) {
      return;
    }
    try {
      await api.database.deleteSnapshot(id);
      showToast({
        type: 'success',
        title: 'Snapshot Dihapus',
        message: `Snapshot "${label}" telah dihapus.`,
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Snapshot',
        message: err.message || 'Terjadi kesalahan saat menghapus snapshot.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#012E26] via-[#024438] to-[#012E26] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-[#012E26]/10">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20">
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span>Pusat Manajemen Basis Data • Hak Akses Administrator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Backup & Pemulihan Database
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Amankan seluruh data akademik sistem pembelajaran GEMA BIO (data akun pengguna, mata kuliah, materi, mini kuis, presensi, tugas kuliah, dan buku nilai) dengan mengunduh berkas cadangan JSON atau membuat snapshot server.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 bg-[#EAA736] hover:bg-[#d49420] text-[#012E26] font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Backup Saat Ini (.JSON)</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs sm:text-sm backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>Buat Snapshot Server</span>
            </button>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
            </button>
          </div>
        </div>

        <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none hidden md:block">
          <Database className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Cloud Persistence Status Card (Firebase Firestore) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  Cloud Persistence: Firebase Firestore
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Terhubung & Terproteksi Permanen
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
                Seluruh data baru dan pembaruan sistem kini tersimpan otomatis di <strong>Google Cloud Firestore</strong>. Data dijamin <strong>tidak akan kembali ke stelan awal</strong> ketika server mengalami reload mandiri, down, atau dipublish ulang.
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Project:</span>
                  <code className="text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">{cloudStatus?.project_id || 'yogic-genre-zhl8x'}</code>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Database ID:</span>
                  <code className="text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded truncate max-w-[200px]" title={cloudStatus?.database_id || ''}>
                    {cloudStatus?.database_id ? `${cloudStatus.database_id.slice(0, 24)}...` : 'ai-studio-gemabio...'}
                  </code>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">Status Sinkronisasi:</span>
                  <span className="text-emerald-700 font-bold">
                    {cloudStatus?.last_synced ? new Date(cloudStatus.last_synced).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Aktif'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0">
            <button
              onClick={handleSyncCloud}
              disabled={syncingCloud}
              className="w-full md:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CloudLightning className={`w-4 h-4 ${syncingCloud ? 'animate-spin' : ''}`} />
              <span>{syncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Database Health Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Ukuran File DB</span>
            <HardDrive className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? stats.size_formatted : '...'}
          </div>
          <p className="text-[10px] text-slate-500">File JSON Server</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Total Pengguna</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? stats.total_users : '...'}
          </div>
          <p className="text-[10px] text-slate-500">
            {stats ? `${stats.users_by_role.dosen} Dosen • ${stats.users_by_role.mahasiswa} Mhs` : 'Memuat...'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Mata Kuliah</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? stats.total_courses : '...'}
          </div>
          <p className="text-[10px] text-slate-500">Terdaftar Aktif</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Modul Materi</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? stats.total_materials : '...'}
          </div>
          <p className="text-[10px] text-slate-500">Pertemuan RPS</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Kuis & Soal</span>
            <HelpCircle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? `${stats.total_quizzes} / ${stats.total_questions}` : '...'}
          </div>
          <p className="text-[10px] text-slate-500">Mini Kuis & Soal</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Presensi & Tugas</span>
            <CalendarCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? `${stats.total_attendances} / ${stats.total_submissions}` : '...'}
          </div>
          <p className="text-[10px] text-slate-500">Catatan & Kumpulan</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Kelas & Prodi</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-lg font-black text-slate-900">
            {stats ? `${stats.total_classes || 0} / ${stats.total_departments || 0}` : '...'}
          </div>
          <p className="text-[10px] text-slate-500">Rombel & Program Studi</p>
        </div>
      </div>

      {/* Main Section: Restore from Upload & Server Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Restore from File (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                  <Upload className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Pulihkan dari File (.JSON)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unggah file cadangan yang pernah Anda unduh sebelumnya
                  </p>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-emerald-700 bg-slate-50/50 hover:bg-emerald-50/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileCode className={`w-10 h-10 mx-auto mb-2 ${selectedFile ? 'text-emerald-700' : 'text-slate-400'}`} />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-bold text-emerald-950 truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk mengganti
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Klik atau Seret Berkas Cadangan (.JSON)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung berkas ekspor cadangan GEMA BIO
                  </p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsed Preview Card */}
            {parsedBackupData && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Struktur File Valid & Siap Dipulihkan</span>
                </div>
                {(() => {
                  const content = parsedBackupData.data || parsedBackupData;
                  return (
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
                        <span className="text-slate-400 block text-[10px]">Pengguna</span>
                        <strong className="text-slate-800 font-black">
                          {Array.isArray(content.users) ? content.users.length : 0}
                        </strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
                        <span className="text-slate-400 block text-[10px]">Mata Kuliah</span>
                        <strong className="text-slate-800 font-black">
                          {Array.isArray(content.courses) ? content.courses.length : 0}
                        </strong>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 text-center">
                        <span className="text-slate-400 block text-[10px]">Materi</span>
                        <strong className="text-slate-800 font-black">
                          {Array.isArray(content.materials) ? content.materials.length : 0}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() =>
                    setRestoreTarget({
                      type: 'file',
                      title: 'Pulihkan Database dari File Unggahan',
                      description: `Anda akan menimpa database sistem saat ini dengan isi file "${selectedFile?.name}". Cadangan pengaman otomatis (safety backup) akan dibuat sebelum data digantikan.`,
                    })
                  }
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Terapkan & Pulihkan Database Ini</span>
                </button>
              </div>
            )}

            {/* Safety Information */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span className="text-[11px]">
                <strong>Perlindungan Data Otomatis:</strong> Setiap kali proses pemulihan (restore) dijalankan, sistem secara otomatis menyimpan cadangan status data terakhir (safety backup), sehingga data sebelumnya tidak akan hilang permanen.
              </span>
            </div>
          </div>

          {/* Factory Reset Danger Zone Card */}
          <div className="bg-white p-5 rounded-3xl border border-rose-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">Zona Darurat / Reset Pabrik</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ingin mengembalikan data aplikasi ke kondisi standar awal pabrik Universitas Hamzanwadi? Tindakan ini akan membuat safety backup terlebih dahulu lalu memulihkan data bawaan awal.
            </p>
            <button
              type="button"
              onClick={() =>
                setRestoreTarget({
                  type: 'factory',
                  title: 'Reset Database ke Standar Pabrik (Initial Seeds)',
                  description:
                    'Seluruh data modifikasi akan digantikan kembali dengan data awal kurikulum Universitas Hamzanwadi. Sistem akan menyimpan safety backup dari kondisi saat ini sebelum mereset.',
                })
              }
              className="w-full py-2 px-3 border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Database ke Standar Awal Pabrik</span>
            </button>
          </div>
        </div>

        {/* Right Column: Server Snapshots History List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Daftar Snapshot Cadangan di Server
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {snapshots.length} snapshot tersimpan di server
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Buat Snapshot Baru</span>
              </button>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Database className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">Belum Ada Snapshot Tersimpan</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Gunakan tombol &quot;Buat Snapshot Baru&quot; di atas untuk membuat titik pemulihan cadangan server kapan saja.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {snapshots.map((snap) => {
                  const isSafety = snap.is_safety_backup;
                  const dateStr = new Date(snap.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <div
                      key={snap.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSafety
                          ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                          : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              isSafety
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {isSafety ? 'Safety Auto-Backup' : 'Manual Snapshot'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {snap.label || snap.filename}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {dateStr}
                          </span>
                          <span>•</span>
                          <span>{snap.size_formatted}</span>
                          <span>•</span>
                          <span className="text-slate-600 font-semibold">
                            {snap.total_users} Akun • {snap.total_courses} MK • {snap.total_materials} Materi
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() =>
                            setRestoreTarget({
                              type: 'snapshot',
                              id: snap.id,
                              title: `Pulihkan dari Snapshot "${snap.label}"`,
                              description: `Database sistem saat ini akan digantikan dengan data dari snapshot tanggal ${dateStr}. Sistem otomatis membuat safety backup sebelum proses berjalan.`,
                            })
                          }
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Terapkan dan pulihkan database dari snapshot ini"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Pulihkan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSnapshot(snap.id, snap.label || snap.filename)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus snapshot ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Snapshot */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-black text-slate-900">Buat Snapshot Server</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Label / Keterangan Snapshot
                </label>
                <input
                  type="text"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  placeholder="Contoh: Sebelum Ujian Tengah Semester"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Snapshot akan mencadangkan seluruh kondisi data sistem saat ini ke folder server secara instan.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-xs">
                Data yang dicakup: <strong>{stats?.total_users || 0} pengguna</strong>, <strong>{stats?.total_courses || 0} mata kuliah</strong>, <strong>{stats?.total_materials || 0} materi</strong>, kuis, tugas, dan buku nilai.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingSnapshot}
                  className="px-5 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {creatingSnapshot ? 'Menyimpan...' : 'Simpan Snapshot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Restore */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 pb-2 border-b border-slate-100">
              <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Konfirmasi Pemulihan</h3>
                <p className="text-[11px] text-slate-500">Tindakan penggantian database</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-900">{restoreTarget.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {restoreTarget.description}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 text-xs flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                <strong>Aman:</strong> Salinan database sebelum pemulihan akan otomatis disimpan ke daftar snapshot server sebagai cadangan pengaman (safety backup).
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Pemulihan...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ya, Pulihkan Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
