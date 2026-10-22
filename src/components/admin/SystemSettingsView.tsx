import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useSettings } from '../../context/SettingsContext';
import { AppLogo } from '../common/AppLogo';
import { GradeComponentConfig, GradeComponentSource, DegreeConfig } from '../../types';
import {
  Settings,
  Save,
  RotateCcw,
  Zap,
  Building,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  GraduationCap,
  CalendarCheck,
  FileText,
  Percent,
  Database,
  Download,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Info,
  X,
  Layers,
  HelpCircle,
  Sparkles,
  Sliders,
  Shield,
  UserCheck,
  Check,
} from 'lucide-react';

interface SystemSettingsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const isDosen = user?.role === 'dosen';
  const { showToast } = useNotification();
  const { updateAppLogo, refreshSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<any>({
    campus_name: 'Universitas Hamzanwadi',
    course_name: 'Aplikasi Komputer (APLI-201)',
    course_code: 'APLI-201',
    semester: 'Ganjil 2026/2027',
    academic_year: '2026/2027',
    lecturer_name: 'Dr. Sri Wahyuni, M.Kom.',
    app_logo: '',
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
  });

  // Dynamic Grade Components state
  const [components, setComponents] = useState<GradeComponentConfig[]>([
    { id: 'attendance', name: 'Kehadiran', weight: 15, source_type: 'attendance', description: 'Dihitung otomatis dari presensi pertemuan', is_default: true },
    { id: 'participation', name: 'Partisipasi', weight: 15, source_type: 'participation', description: 'Ketuntasan modul materi dan gamifikasi', is_default: true },
    { id: 'assignment', name: 'Tugas', weight: 20, source_type: 'assignment', description: 'Rata-rata penugasan dan laporan praktikum', is_default: true },
    { id: 'uts', name: 'UTS', weight: 25, source_type: 'uts', description: 'Evaluasi Ujian Tengah Semester', is_default: true },
    { id: 'uas', name: 'UAS', weight: 25, source_type: 'uas', description: 'Evaluasi Ujian Akhir Semester / Proyek Akhir', is_default: true },
  ]);

  // Standard grade components reference (always displayed)
  const [standardComponents, setStandardComponents] = useState<GradeComponentConfig[]>([
    { id: 'attendance', name: 'Kehadiran', weight: 15, source_type: 'attendance', description: 'Dihitung otomatis dari presensi pertemuan', is_default: true },
    { id: 'participation', name: 'Partisipasi', weight: 15, source_type: 'participation', description: 'Ketuntasan modul materi dan gamifikasi', is_default: true },
    { id: 'assignment', name: 'Tugas', weight: 20, source_type: 'assignment', description: 'Rata-rata penugasan dan laporan praktikum', is_default: true },
    { id: 'uts', name: 'UTS', weight: 25, source_type: 'uts', description: 'Evaluasi Ujian Tengah Semester', is_default: true },
    { id: 'uas', name: 'UAS', weight: 25, source_type: 'uas', description: 'Evaluasi Ujian Akhir Semester / Proyek Akhir', is_default: true },
  ]);
  const [isCustomized, setIsCustomized] = useState(false);

  // Modal Component Form state
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingCompIndex, setEditingCompIndex] = useState<number | null>(null);
  const [compForm, setCompForm] = useState<{
    id: string;
    name: string;
    weight: number;
    source_type: GradeComponentSource;
    description: string;
  }>({
    id: '',
    name: '',
    weight: 15,
    source_type: 'manual',
    description: '',
  });

  // Degree Management State
  const [degrees, setDegrees] = useState<DegreeConfig[]>([]);
  const [savingDegree, setSavingDegree] = useState(false);
  const [showAddDegreeModal, setShowAddDegreeModal] = useState(false);
  const [degreeForm, setDegreeForm] = useState({
    code: '',
    name: '',
    level: '',
    description: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const resizeImageToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 384;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png'));
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        img.onerror = () => resolve(readerEvent.target?.result as string);
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    Promise.all([
      api.settings.get().catch(() => null),
      api.grades.getComponentsDetail().catch(() => null),
      api.settings.getDegrees().catch(() => []),
    ])
      .then(([data, compDetail, degData]) => {
        const sData = data as any;
        if (sData && sData.campus_name) {
          setSettings({
            ...sData,
            grade_weights: sData.grade_weights || {
              attendance: 15,
              participation: 15,
              assignment: 20,
              uts: 25,
              uas: 25,
            },
          });
          setLogoPreview(sData.app_logo || '');
        }
        if (compDetail) {
          if (Array.isArray(compDetail.standard_components) && compDetail.standard_components.length > 0) {
            setStandardComponents(compDetail.standard_components);
          }
          if (Array.isArray(compDetail.components) && compDetail.components.length > 0) {
            setComponents(compDetail.components);
          }
          setIsCustomized(!!compDetail.is_customized);
        }
        if (Array.isArray(degData) && degData.length > 0) {
          setDegrees(degData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDegree = async (code: string) => {
    const updated = degrees.map((d) =>
      d.code === code ? { ...d, is_active: !d.is_active } : d
    );
    if (!updated.some((d) => d.is_active)) {
      showToast({
        type: 'info',
        title: 'Minimal 1 Jenjang Aktif',
        message: 'Minimal harus ada 1 jenjang pendidikan yang berstatus aktif.',
      });
      return;
    }
    setDegrees(updated);
    try {
      setSavingDegree(true);
      await api.settings.saveDegrees(updated);
      showToast({
        type: 'success',
        title: 'Status Jenjang Diperbarui',
        message: `Ketersediaan jenjang "${code}" berhasil diubah.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSavingDegree(false);
    }
  };

  const handleAddDegree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!degreeForm.code.trim() || !degreeForm.name.trim()) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Kode dan nama jenjang wajib diisi.',
      });
      return;
    }
    const cleanCode = degreeForm.code.trim().toUpperCase();
    if (degrees.some((d) => d.code.toUpperCase() === cleanCode)) {
      showToast({
        type: 'error',
        title: 'Kode Jenjang Sudah Ada',
        message: `Jenjang dengan kode "${cleanCode}" sudah terdaftar.`,
      });
      return;
    }
    const newDeg: DegreeConfig = {
      code: cleanCode,
      name: degreeForm.name.trim(),
      level: degreeForm.level.trim() || undefined,
      description: degreeForm.description.trim() || undefined,
      is_active: true,
      is_default: false,
    };
    const updated = [...degrees, newDeg];
    setDegrees(updated);
    try {
      setSavingDegree(true);
      await api.settings.saveDegrees(updated);
      showToast({
        type: 'success',
        title: 'Jenjang Baru Ditambahkan',
        message: `Jenjang "${cleanCode} (${newDeg.name})" berhasil ditambahkan.`,
      });
      setDegreeForm({ code: '', name: '', level: '', description: '' });
      setShowAddDegreeModal(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menambah Jenjang',
        message: err.message || 'Gagal menyimpan jenjang baru.',
      });
    } finally {
      setSavingDegree(false);
    }
  };

  const handleDeleteDegree = async (code: string) => {
    if (!window.confirm(`Yakin ingin menghapus jenjang "${code}" dari sistem?`)) return;
    const updated = degrees.filter((d) => d.code !== code);
    setDegrees(updated);
    try {
      setSavingDegree(true);
      await api.settings.saveDegrees(updated);
      showToast({
        type: 'success',
        title: 'Jenjang Dihapus',
        message: `Jenjang "${code}" berhasil dihapus.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus jenjang.',
      });
    } finally {
      setSavingDegree(false);
    }
  };

  const handleSaveLogoOnly = async (logoValue?: string) => {
    const logoToApply = logoValue !== undefined ? logoValue : (settings.app_logo || logoPreview);
    try {
      setSavingLogo(true);
      await updateAppLogo(logoToApply || '');
      setSettings((prev: any) => ({ ...prev, app_logo: logoToApply || '' }));
      setLogoPreview(logoToApply || '');
      showToast({
        type: 'success',
        title: 'Logo Berhasil Diterapkan!',
        message: logoToApply
          ? 'Logo baru langsung aktif pada Navbar, Sidebar, dan Halaman Login.'
          : 'Kembali menggunakan Logo Resmi Universitas Hamzanwadi.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Logo',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSavingLogo(false);
    }
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Ukuran Terlalu Besar',
        message: 'Maksimal ukuran file logo adalah 5 MB.',
      });
      return;
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setLogoPreview(dataUrl);
      setSettings((prev: any) => ({ ...prev, app_logo: dataUrl }));
      await handleSaveLogoOnly(dataUrl);
    } catch {
      showToast({
        type: 'error',
        title: 'Gagal Memproses Gambar',
        message: 'Tidak dapat memproses berkas gambar yang dipilih.',
      });
    }
  };

  const handleResetToDefaultLogo = async () => {
    await handleSaveLogoOnly('');
  };

  const handleOpenAddCompModal = () => {
    setEditingCompIndex(null);
    setCompForm({
      id: '',
      name: '',
      weight: 15,
      source_type: 'manual',
      description: '',
    });
    setShowCompModal(true);
  };

  const handleOpenEditCompModal = (index: number) => {
    setEditingCompIndex(index);
    const target = components[index];
    setCompForm({
      id: target.id,
      name: target.name,
      weight: target.weight,
      source_type: target.source_type,
      description: target.description || '',
    });
    setShowCompModal(true);
  };

  const handleSaveCompModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name.trim()) {
      showToast({
        type: 'info',
        title: 'Nama Wajib Diisi',
        message: 'Silakan isi nama komponen penilaian.',
      });
      return;
    }
    const weightVal = Math.max(0, Math.min(100, Number(compForm.weight) || 0));

    let updatedList = [...components];
    if (editingCompIndex !== null) {
      updatedList[editingCompIndex] = {
        ...updatedList[editingCompIndex],
        name: compForm.name.trim(),
        weight: weightVal,
        source_type: compForm.source_type,
        description: compForm.description.trim() || undefined,
      };
    } else {
      const baseSlug = compForm.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      const generatedId = `${baseSlug || 'comp'}_${Date.now().toString().slice(-4)}`;
      const newComp: GradeComponentConfig = {
        id: generatedId,
        name: compForm.name.trim(),
        weight: weightVal,
        source_type: compForm.source_type,
        description: compForm.description.trim() || undefined,
        is_default: false,
      };
      updatedList.push(newComp);
    }

    setComponents(updatedList);
    setShowCompModal(false);

    try {
      const res = await api.grades.updateComponents(updatedList);
      showToast({
        type: 'success',
        title: editingCompIndex !== null ? 'Komponen Diperbarui' : 'Komponen Ditambahkan',
        message: `${res.message} Komponen kini terintegrasi dengan perhitungan nilai semester.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Komponen',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  const handleDeleteComp = async (index: number) => {
    const target = components[index];
    if (!window.confirm(`Yakin ingin menghapus komponen penilaian "${target.name}"?`)) {
      return;
    }

    const updatedList = components.filter((_, i) => i !== index);
    setComponents(updatedList);

    try {
      const res = await api.grades.updateComponents(updatedList);
      showToast({
        type: 'success',
        title: 'Komponen Dihapus',
        message: `Komponen "${target.name}" berhasil dihapus dan disinkronkan.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Komponen',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  const handleResetComponents = async () => {
    if (
      !window.confirm(
        isDosen
          ? 'Kembalikan komponen penilaian akun Anda ke standar resmi aplikasi Universitas Hamzanwadi (Kehadiran 15%, Partisipasi 15%, Tugas 20%, UTS 25%, UAS 25%)?'
          : 'Kembalikan aturan komponen penilaian ke standar awal Universitas Hamzanwadi (Kehadiran 15%, Partisipasi 15%, Tugas 20%, UTS 25%, UAS 25%)?'
      )
    ) {
      return;
    }

    try {
      const res = await api.grades.resetComponents();
      setComponents(res.components);
      setIsCustomized(false);
      showToast({
        type: 'success',
        title: 'Komponen Direset',
        message: res.message,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mereset Komponen',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCompWeight !== 100) {
      showToast({
        type: 'error',
        title: 'Akumulasi Bobot Harus 100%',
        message: `Total bobot saat ini ${totalCompWeight}%. Harap sesuaikan bobot hingga tepat 100% sebelum menyimpan.`,
      });
      return;
    }

    try {
      setSaving(true);
      if (isDosen) {
        const res = await api.grades.updateComponents(components);
        setIsCustomized(true);
        showToast({
          type: 'success',
          title: 'Komponen Khusus Dosen Disimpan',
          message: res.message || 'Komponen penilaian khusus akun Anda berhasil disimpan dan diterapkan pada mata kuliah yang Anda ampu.',
        });
      } else {
        await Promise.all([
          api.settings.update(settings),
          api.grades.updateComponents(components),
        ]);
        await updateAppLogo(settings.app_logo || '');
        await refreshSettings();
        showToast({
          type: 'success',
          title: 'Pengaturan & Komponen Disimpan',
          message: 'Identitas kampus, logo aplikasi, dan seluruh komponen penilaian berhasil diperbarui dan disinkronkan.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Memuat konfigurasi sistem...</div>;
  }

  const weights = settings.grade_weights || { attendance: 15, participation: 15, assignment: 20, uts: 25, uas: 25 };
  const totalWeight =
    Number(weights.attendance) +
    Number(weights.participation) +
    Number(weights.assignment) +
    Number(weights.uts) +
    Number(weights.uas);
  const totalCompWeight = components.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#012E26]/10 text-[#012E26] text-xs font-bold border border-[#012E26]/20 mb-2">
          {isDosen ? <Percent className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
          <span>{isDosen ? 'Pengaturan Dosen Pengampu' : 'Pengaturan Administrator'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isDosen ? 'Pengaturan Komponen Nilai Perkuliahan' : 'Pengaturan Sistem & Identitas Aplikasi'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {isDosen
            ? 'Atur dan sesuaikan bobot komponen penilaian semester khusus akun Anda. Standar acuan resmi aplikasi tetap tersedia sebagai pembanding.'
            : 'Atur logo resmi universitas, identitas institusi, dan komponen penilaian semester.'}
        </p>
      </div>

      {/* Dosen Status Box */}
      {isDosen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isCustomized
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isCustomized ? (
                <Sparkles className="w-5 h-5 text-amber-600" />
              ) : (
                <Shield className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900">
                  Status Komponen Nilai Akun: {user?.name}
                </h4>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    isCustomized
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {isCustomized ? '✨ Kustom Khusus Akun Dosen' : '🏛️ Standar Resmi Aplikasi'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCustomized
                  ? 'Anda telah menyesuaikan bobot penilaian khusus untuk mata kuliah yang Anda ampu.'
                  : 'Akun Anda saat ini menggunakan acuan komponen penilaian standar bawaan aplikasi.'}
              </p>
            </div>
          </div>
          {isCustomized && (
            <button
              type="button"
              onClick={handleResetComponents}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembalikan ke Standar</span>
            </button>
          )}
        </div>
      )}

      {/* Dosen Reference Box: Standar Komponen Penilaian Aplikasi (Selalu Ditampilkan) */}
      {isDosen && (
        <div className="bg-slate-50/90 rounded-3xl p-5 sm:p-7 border border-slate-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Building className="w-4 h-4 text-[#012E26]" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Komponen Penilaian Standar Aplikasi (Universitas Hamzanwadi)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#012E26]/10 text-[#012E26] border border-[#012E26]/20">
                Acuan Baku Kampus
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Standar: 100%
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Berikut adalah komponen dan bobot standar yang telah ditetapkan oleh Administrator sebagai standar resmi di sistem aplikasi. Anda diberikan hak independen untuk mengubah bobot atau menambah/menghapus komponen penilaian sesuai kebutuhan silabus perkuliahan Anda pada panel di bawah ini:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {standardComponents.map((std, idx) => (
              <div
                key={std.id || idx}
                className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Standar #{idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black text-xs border border-emerald-200">
                    {std.weight}%
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 leading-tight">
                  {std.name}
                </h5>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  {std.description ||
                    (std.source_type === 'attendance'
                      ? 'Presensi kehadiran pertemuan'
                      : std.source_type === 'participation'
                      ? 'Modul materi & gamifikasi'
                      : std.source_type === 'assignment'
                      ? 'Rata-rata tugas kuliah'
                      : std.source_type === 'uts'
                      ? 'Ujian Tengah Semester'
                      : 'Ujian Akhir Semester')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {!isDosen && (
          <>
            {/* Section 1: Logo & Visual Brand (Special Request) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#012E26]" />
              <span>Logo & Ikon Aplikasi (Akses Khusus Admin)</span>
            </h3>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
              Aktif
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Live Logo Preview Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                <AppLogo className="w-20 h-20" logoUrl={logoPreview} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {logoPreview ? 'Logo Kustom Terpasang' : 'Logo Universitas Hamzanwadi'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Tampil pada Navbar, Sidebar, & Halaman Login
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Unggah Berkas Gambar Logo Baru (PNG, JPG, SVG)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 text-[#EAA736]" />
                    <span>Pilih Berkas Logo...</span>
                  </button>

                  {logoPreview && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultLogo}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      Kembali ke Logo Default Hamzanwadi
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Masukkan Tautan URL Logo (Eksternal)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.app_logo || ''}
                    onChange={(e) => {
                      setSettings({ ...settings, app_logo: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                    placeholder="https://contoh-domain.ac.id/logo.png"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                  />
                  <button
                    type="button"
                    disabled={savingLogo || !settings.app_logo}
                    onClick={() => handleSaveLogoOnly(settings.app_logo)}
                    className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {savingLogo ? 'Menerapkan...' : 'Terapkan URL'}
                  </button>
                </div>
              </div>

              {/* Status information note */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {logoPreview
                      ? 'Logo kustom telah siap/aktif pada sistem.'
                      : 'Saat ini menggunakan Logo Resmi Universitas Hamzanwadi (Default).'}
                  </span>
                </div>
                {logoPreview && (
                  <button
                    type="button"
                    disabled={savingLogo}
                    onClick={() => handleSaveLogoOnly(logoPreview)}
                    className="font-bold text-[#012E26] underline hover:text-emerald-900 cursor-pointer ml-2"
                  >
                    Simpan Ulang
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Academic Identity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-[#012E26]" />
            <span>Identitas Institusi & Mata Kuliah</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Perguruan Tinggi
              </label>
              <input
                type="text"
                value={settings.campus_name}
                onChange={(e) => setSettings({ ...settings, campus_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Mata Kuliah
              </label>
              <input
                type="text"
                value={settings.course_name}
                onChange={(e) => setSettings({ ...settings, course_name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semester Berjalan
              </label>
              <input
                type="text"
                value={settings.semester}
                onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                placeholder="Contoh: Ganjil 2026/2027"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tahun Akademik
              </label>
              <input
                type="text"
                value={settings.academic_year}
                onChange={(e) => setSettings({ ...settings, academic_year: e.target.value })}
                placeholder="Contoh: 2026/2027"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section: Manajemen Jenjang Pendidikan (Perguruan Tinggi) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#012E26]" />
                <h3 className="text-base font-bold text-slate-900">
                  Manajemen Jenjang Pendidikan (Perguruan Tinggi)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Atur jenjang pendidikan (S1, S2, D4, D3, S3, Profesi) yang diselenggarakan oleh perguruan tinggi. Formulir penambahan Program Studi dan filter akademik akan <strong>hanya menyediakan dan menampilkan jenjang yang aktif</strong> di bawah ini.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddDegreeModal(true)}
                className="px-3.5 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#EAA736]" />
                <span>Tambah Jenjang Baru</span>
              </button>
            </div>
          </div>

          {/* Grid of Degrees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {degrees.map((deg) => (
              <div
                key={deg.code}
                className={`p-4 rounded-2xl border transition-all ${
                  deg.is_active
                    ? 'bg-emerald-50/40 border-emerald-200 shadow-2xs'
                    : 'bg-slate-50/80 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                      deg.is_active
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {deg.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleDegree(deg.code)}
                    disabled={savingDegree}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                      deg.is_active
                        ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {deg.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span>Tersedia (Aktif)</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Non-Aktif</span>
                      </>
                    )}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{deg.name}</h4>
                {deg.level && (
                  <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                    {deg.level}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {deg.description || `Program Pendidikan ${deg.name}`}
                </p>

                {!deg.is_default && (
                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteDegree(deg.code)}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus Jenjang</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        </>
      )}

        {/* Section 3: Manajemen Komponen Penilaian Semester Terintegrasi (Fleksibel Tambah / Edit / Hapus) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#012E26]" />
                <h3 className="text-base font-bold text-slate-900">
                  {isDosen
                    ? `Komponen Penilaian Akun Anda (${user?.name})`
                    : 'Komponen Penilaian Semester & Aturan Evaluasi'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isDosen
                  ? 'Sesuaikan bobot, ubah, atau tambah komponen penilaian baru sesuai kebutuhan mata kuliah yang Anda ampu. Total akumulasi bobot harus tepat 100%.'
                  : 'Atur komponen penilaian secara fleksibel jika ada aturan baru kurikulum. Komponen yang ditambahkan terintegrasi otomatis dengan sistem LMS (presensi, progres modul, tugas, kuis, UTS, UAS, dan praktikum).'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleOpenAddCompModal}
                className="px-3.5 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#EAA736]" />
                <span>Tambah Komponen Baru</span>
              </button>

              <button
                type="button"
                onClick={handleResetComponents}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kembalikan ke standar awal Universitas Hamzanwadi (15/15/20/25/25)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Standar</span>
              </button>
            </div>
          </div>

          {/* Total Weight Status Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>Total Akumulasi Bobot:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    totalCompWeight === 100
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  {totalCompWeight}%
                </span>
              </span>

              <span
                className={`text-[11px] font-bold ${
                  totalCompWeight === 100 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {totalCompWeight === 100
                  ? 'Sesuai Standar Akreditasi (100%)'
                  : totalCompWeight < 100
                  ? `Kurang ${100 - totalCompWeight}% lagi untuk mencapai 100%`
                  : `Kelebihan ${totalCompWeight - 100}%, harap disesuaikan`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  totalCompWeight === 100
                    ? 'bg-emerald-600'
                    : totalCompWeight < 100
                    ? 'bg-amber-500'
                    : 'bg-rose-600'
                }`}
                style={{ width: `${Math.min(100, totalCompWeight)}%` }}
              />
            </div>
          </div>

          {/* Component Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {components.map((comp, idx) => {
              const badge = (() => {
                switch (comp.source_type) {
                  case 'attendance':
                    return {
                      label: 'Presensi Kehadiran',
                      desc: 'Otomatis dari absensi presensi pertemuan',
                      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      icon: CalendarCheck,
                    };
                  case 'participation':
                    return {
                      label: 'Partisipasi & Progres',
                      desc: 'Otomatis dari modul materi & gamifikasi',
                      color: 'bg-blue-50 text-blue-800 border-blue-200',
                      icon: Sparkles,
                    };
                  case 'assignment':
                    return {
                      label: 'Tugas Kuliah',
                      desc: 'Otomatis dari rata-rata nilai penugasan',
                      color: 'bg-purple-50 text-purple-800 border-purple-200',
                      icon: FileText,
                    };
                  case 'quiz':
                    return {
                      label: 'Mini Kuis',
                      desc: 'Otomatis dari rata-rata perolehan kuis',
                      color: 'bg-amber-50 text-amber-800 border-amber-200',
                      icon: HelpCircle,
                    };
                  case 'uts':
                    return {
                      label: 'Evaluasi UTS',
                      desc: 'Diinput dosen untuk Ujian Tengah Semester',
                      color: 'bg-orange-50 text-orange-800 border-orange-200',
                      icon: GraduationCap,
                    };
                  case 'uas':
                    return {
                      label: 'Evaluasi UAS',
                      desc: 'Diinput dosen untuk Ujian Akhir Semester',
                      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                      icon: GraduationCap,
                    };
                  case 'manual':
                  default:
                    return {
                      label: 'Praktikum / Kustom',
                      desc: 'Diinput dosen di Buku Nilai (fleksibel)',
                      color: 'bg-teal-50 text-teal-800 border-teal-200',
                      icon: Layers,
                    };
                }
              })();
              const IconComp = badge.icon;

              return (
                <div
                  key={comp.id || idx}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {comp.name}
                        </h4>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-[#012E26]/10 text-[#012E26] text-xs font-black shrink-0 border border-[#012E26]/20">
                        {comp.weight}%
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-dashed w-fit max-w-full truncate">
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{badge.label}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {comp.description || badge.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCompModal(idx)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                      title="Ubah nama, bobot, atau tipe integrasi komponen"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Ubah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteComp(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                      title="Hapus komponen dari aturan penilaian"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Integrasi Otomatis & Fleksibilitas Aturan:</strong>
              <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                Setiap komponen yang ditambahkan atau diubah akan langsung terintegrasi ke <strong>Buku Nilai Semester</strong> dosen, <strong>Transkrip Nilai</strong> mahasiswa, serta berkas ekspor <strong>Excel (.xlsx)</strong> tanpa perlu coding ulang.
              </p>
            </div>
          </div>
        </div>

        {!isDosen && (
          <>
            {/* Section 4: Gamifikasi Points */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Zap className="w-4 h-4 text-[#EAA736]" />
                <span>Poin Gamifikasi E-Learning</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Materi Selesai (+Pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.material_point}
                    onChange={(e) =>
                      setSettings({ ...settings, material_point: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dasar Kuis (+Pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.quiz_base_point}
                    onChange={(e) =>
                      setSettings({ ...settings, quiz_base_point: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiap Soal Benar (+Pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.quiz_correct_point}
                    onChange={(e) =>
                      setSettings({ ...settings, quiz_correct_point: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bonus 1 Topik (+Pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.category_bonus_point}
                    onChange={(e) =>
                      setSettings({ ...settings, category_bonus_point: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Cadangan Basis Data (Backup & Restore - Khusus Admin) */}
            <div className="bg-gradient-to-r from-emerald-950 via-[#012E26] to-[#01352C] rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white">
                      Backup & Pemulihan Basis Data Sistem
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-100/80 leading-relaxed max-w-xl">
                    Unduh salinan lengkap database dalam format JSON, buat snapshot titik pemulihan server, atau pulihkan data dari file cadangan kapan saja.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        showToast({
                          type: 'info',
                          title: 'Menyiapkan Unduhan',
                          message: 'Mengemas database sistem...',
                        });
                        const data = await api.database.exportData();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: 'application/json',
                        });
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
                          title: 'Backup Berhasil',
                          message: 'File cadangan JSON telah diunduh.',
                        });
                      } catch (err: any) {
                        showToast({
                          type: 'error',
                          title: 'Gagal Mengunduh',
                          message: err.message,
                        });
                      }
                    }}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File .JSON</span>
                  </button>

                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('database')}
                      className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-emerald-300" />
                      <span>Buka Panel Backup & Restore</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#012E26] hover:bg-[#023b31] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4 text-[#EAA736]" />
            <span>
              {saving
                ? isDosen
                  ? 'Menyimpan Komponen...'
                  : 'Menyimpan Konfigurasi...'
                : isDosen
                ? 'Simpan Komponen Khusus Akun Saya'
                : 'Simpan Seluruh Pengaturan'}
            </span>
          </button>
        </div>
      </form>

      {/* Modal Tambah / Ubah Komponen Penilaian */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#012E26]/10 text-[#012E26]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCompIndex !== null
                      ? 'Ubah Komponen Penilaian'
                      : 'Tambah Komponen Penilaian Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fleksibel disesuaikan dengan aturan atau standar kurikulum baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCompModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Komponen Penilaian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Praktikum Laboratorium, Proyek Kolaboratif, Sikap & Etika"
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bobot Persentase (%) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={compForm.weight}
                    onChange={(e) =>
                      setCompForm({ ...compForm, weight: Number(e.target.value) })
                    }
                    className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white text-center"
                  />
                  <span className="text-xs text-slate-500">
                    Dari total 100% penilaian akhir semester.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sumber Data & Integrasi Sistem <span className="text-rose-500">*</span>
                </label>
                <select
                  value={compForm.source_type}
                  onChange={(e) =>
                    setCompForm({
                      ...compForm,
                      source_type: e.target.value as GradeComponentSource,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white font-semibold cursor-pointer"
                >
                  <option value="manual">
                    Penilaian Kustom / Praktikum / Proyek (Diinput Dosen di Buku Nilai)
                  </option>
                  <option value="quiz">
                    Mini Kuis Interaktif (Otomatis ditarik dari hasil kuis mahasiswa)
                  </option>
                  <option value="assignment">
                    Tugas Kuliah (Otomatis ditarik dari rekap nilai tugas)
                  </option>
                  <option value="attendance">
                    Presensi Kehadiran (Otomatis dihitung dari absensi pertemuan)
                  </option>
                  <option value="participation">
                    Partisipasi & Progres (Otomatis dihitung dari progres modul)
                  </option>
                  <option value="uts">
                    Evaluasi UTS (Diinput untuk Ujian Tengah Semester)
                  </option>
                  <option value="uas">
                    Evaluasi UAS (Diinput untuk Ujian Akhir Semester)
                  </option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  {compForm.source_type === 'attendance' &&
                    '📡 Nilai akan dihitung otomatis dari kehadiran mahasiswa pada seluruh pertemuan kuliah.'}
                  {compForm.source_type === 'participation' &&
                    '📡 Nilai akan dihitung otomatis dari persentase penyelesaian modul materi dan aktivitas pembelajaran.'}
                  {compForm.source_type === 'assignment' &&
                    '📡 Nilai akan dihitung otomatis dari rata-rata nilai penugasan yang dinilai dosen.'}
                  {compForm.source_type === 'quiz' &&
                    '📡 Nilai akan dihitung otomatis dari skor rata-rata pengerjaan mini kuis mahasiswa.'}
                  {compForm.source_type === 'uts' &&
                    '📝 Nilai dapat diinput dan disunting dosen pada saat evaluasi Ujian Tengah Semester (Pertemuan 8).'}
                  {compForm.source_type === 'uas' &&
                    '📝 Nilai dapat diinput dan disunting dosen pada saat evaluasi Ujian Akhir Semester / Proyek Akhir (Pertemuan 16).'}
                  {compForm.source_type === 'manual' &&
                    '✏️ Fleksibel: Dosen dapat menginput nilai secara langsung di Buku Nilai untuk praktikum, proyek, sikap, etika, atau portofolio.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan Aturan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Penilaian praktikum laboratorium pengamatan sel dan laporan hasil mikroskopi."
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-[#EAA736]" />
                  <span>
                    {editingCompIndex !== null ? 'Simpan Perubahan' : 'Tambahkan Komponen'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Jenjang Baru */}
      {showAddDegreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#012E26] to-[#024438] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-[#EAA736]" />
                <h3 className="text-base font-bold">Tambah Jenjang Pendidikan Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDegreeModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDegree} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Jenjang (misal: S3 / Profesi / D3) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: S3"
                  value={degreeForm.code}
                  onChange={(e) => setDegreeForm({ ...degreeForm, code: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Jenjang *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Doktor"
                  value={degreeForm.name}
                  onChange={(e) => setDegreeForm({ ...degreeForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Level Kualifikasi KKNI (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Level 9 KKNI"
                  value={degreeForm.level}
                  onChange={(e) => setDegreeForm({ ...degreeForm, level: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Program Pascasarjana Doktoral"
                  value={degreeForm.description}
                  onChange={(e) => setDegreeForm({ ...degreeForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDegreeModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDegree}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4 text-[#EAA736]" />
                  <span>{savingDegree ? 'Menyimpan...' : 'Simpan Jenjang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
