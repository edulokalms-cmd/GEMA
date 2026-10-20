import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Department, User as UserType, DegreeConfig } from '../../types';
import {
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  Award,
  Users,
  Layers,
  Building2,
  CheckCircle2,
  X,
  School,
  BookOpen,
  Sliders,
  Settings,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Info,
  Sparkles,
} from 'lucide-react';

interface DepartmentManagementViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const DepartmentManagementView: React.FC<DepartmentManagementViewProps> = ({ onNavigateTab }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDegree, setFilterDegree] = useState<string>('all');

  // Degree Management State
  const [degrees, setDegrees] = useState<DegreeConfig[]>([]);
  const [degreeModalOpen, setDegreeModalOpen] = useState(false);
  const [savingDegrees, setSavingDegrees] = useState(false);
  const [showAddDegreeForm, setShowAddDegreeForm] = useState(false);
  const [newDegreeForm, setNewDegreeForm] = useState({
    code: '',
    name: '',
    level: '',
    description: '',
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    degree: 'S1',
    faculty: 'Fakultas Ilmu Pendidikan dan Humaniora',
    head_id: '',
    head_name: '',
    head_nidn: '',
    accreditation: 'Unggul',
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptList, lecturerList, degreeList] = await Promise.all([
        api.departments.getAll(),
        api.users.getAll('dosen').catch(() => []),
        api.settings.getDegrees().catch(() => []),
      ]);
      setDepartments(deptList);
      setLecturers(lecturerList);
      if (Array.isArray(degreeList) && degreeList.length > 0) {
        setDegrees(degreeList);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data Program Studi',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute active degrees list
  const activeDegrees = degrees.length > 0
    ? degrees.filter((d) => d.is_active)
    : [
        { code: 'S1', name: 'Sarjana', level: 'Level 6 KKNI', is_active: true },
        { code: 'S2', name: 'Magister', level: 'Level 8 KKNI', is_active: true },
      ];

  // Options for Department form dropdown: includes active degrees plus current department's degree
  const modalDegreeOptions = Array.from(
    new Set([
      ...activeDegrees.map((d) => d.code),
      ...(form.degree ? [form.degree] : []),
    ])
  ).map((code) => {
    const found = degrees.find((d) => d.code === code);
    return found || { code, name: code, is_active: true };
  });

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
      setSavingDegrees(true);
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
        message: err.message || 'Gagal memperbarui status jenjang.',
      });
    } finally {
      setSavingDegrees(false);
    }
  };

  const handleAddDegree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDegreeForm.code.trim() || !newDegreeForm.name.trim()) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Kode dan nama jenjang wajib diisi.',
      });
      return;
    }
    const cleanCode = newDegreeForm.code.trim().toUpperCase();
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
      name: newDegreeForm.name.trim(),
      level: newDegreeForm.level.trim() || undefined,
      description: newDegreeForm.description.trim() || undefined,
      is_active: true,
      is_default: false,
    };
    const updated = [...degrees, newDeg];
    setDegrees(updated);
    try {
      setSavingDegrees(true);
      await api.settings.saveDegrees(updated);
      showToast({
        type: 'success',
        title: 'Jenjang Baru Ditambahkan',
        message: `Jenjang "${cleanCode} (${newDeg.name})" berhasil ditambahkan dan aktif.`,
      });
      setNewDegreeForm({ code: '', name: '', level: '', description: '' });
      setShowAddDegreeForm(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menambah Jenjang',
        message: err.message || 'Gagal menyimpan jenjang baru.',
      });
    } finally {
      setSavingDegrees(false);
    }
  };

  const handleDeleteDegree = async (code: string) => {
    const deptsUsing = departments.filter((d) => d.degree === code);
    if (deptsUsing.length > 0) {
      showToast({
        type: 'error',
        title: 'Tidak Dapat Dihapus',
        message: `Jenjang ${code} sedang digunakan oleh ${deptsUsing.length} Program Studi (${deptsUsing.map((d) => d.name).join(', ')}).`,
      });
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus jenjang "${code}" dari sistem?`)) return;
    const updated = degrees.filter((d) => d.code !== code);
    setDegrees(updated);
    try {
      setSavingDegrees(true);
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
      setSavingDegrees(false);
    }
  };

  const openCreateModal = () => {
    setEditingDept(null);
    const defaultLecturer = lecturers[0];
    const initialDegree = activeDegrees[0]?.code || 'S1';
    setForm({
      code: '',
      name: '',
      degree: initialDegree,
      faculty: 'Fakultas Ilmu Pendidikan dan Humaniora',
      head_id: defaultLecturer?.id || '',
      head_name: defaultLecturer?.name || 'Dr. Sri Wahyuni, M.Kom.',
      head_nidn: defaultLecturer?.nidn || '0018067901',
      accreditation: 'Unggul',
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      code: dept.code,
      name: dept.name,
      degree: dept.degree || activeDegrees[0]?.code || 'S1',
      faculty: dept.faculty || 'Fakultas Ilmu Pendidikan dan Humaniora',
      head_id: dept.head_id || '',
      head_name: dept.head_name || '',
      head_nidn: dept.head_nidn || '',
      accreditation: dept.accreditation || 'Unggul',
      description: dept.description || '',
    });
    setModalOpen(true);
  };

  const handleLecturerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedUser = lecturers.find((l) => l.id === selectedId);
    if (selectedUser) {
      setForm((prev) => ({
        ...prev,
        head_id: selectedUser.id,
        head_name: selectedUser.name,
        head_nidn: selectedUser.nidn || selectedUser.nip || '',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        head_id: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Kode dan nama program studi wajib diisi.',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingDept) {
        await api.departments.update(editingDept.id, form);
        showToast({
          type: 'success',
          title: 'Program Studi Diperbarui',
          message: `Program Studi "${form.name}" berhasil diperbarui dan disinkronkan.`,
        });
      } else {
        await api.departments.create(form);
        showToast({
          type: 'success',
          title: 'Program Studi Ditambahkan',
          message: `Program Studi baru "${form.name}" (${form.code}) berhasil dibuat.`,
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Data',
        message: err.message || 'Terjadi kesalahan pada sistem.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (departments.length <= 1) {
      showToast({
        type: 'info',
        title: 'Tidak Bisa Dihapus',
        message: 'Minimal harus ada 1 program studi aktif di sistem.',
      });
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus Program Studi "${dept.name}" (${dept.code})? Data kelas dan mahasiswa yang terkait akan tetap tersimpan.`)) {
      return;
    }

    try {
      await api.departments.delete(dept.id);
      showToast({
        type: 'success',
        title: 'Program Studi Dihapus',
        message: `Program Studi "${dept.name}" berhasil dihapus.`,
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  const filteredDepartments = departments.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      (d.head_name && d.head_name.toLowerCase().includes(search.toLowerCase())) ||
      (d.faculty && d.faculty.toLowerCase().includes(search.toLowerCase()));
    const matchesDegree = filterDegree === 'all' || d.degree === filterDegree;
    return matchesSearch && matchesDegree;
  });

  const totalClasses = departments.reduce((acc, d) => acc + (d.classes_count || 0), 0);
  const totalStudents = departments.reduce((acc, d) => acc + (d.students_count || 0), 0);
  const totalCourses = departments.reduce((acc, d) => acc + (d.courses_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <GraduationCap className="w-5 h-5 text-emerald-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kelola Program Studi (Prodi)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data master program studi, fakultas, jenjang akademik, akreditasi BAN-PT/LAM, dan Ketua Program Studi (Kaprodi).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setDegreeModalOpen(true)}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
              title="Atur ketersediaan Jenjang Pendidikan di perguruan tinggi"
            >
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Atur Jenjang Pendidikan</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                {activeDegrees.length} Tersedia
              </span>
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-[#012E26] hover:bg-[#012E26]/90 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#EAA736]" />
              <span>Tambah Program Studi</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <School className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Prodi</p>
            <p className="text-xl font-black text-slate-900">{departments.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Akreditasi Unggul</p>
            <p className="text-xl font-black text-slate-900">
              {departments.filter((d) => d.accreditation === 'Unggul' || d.accreditation === 'A').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Kelas Terkait</p>
            <p className="text-xl font-black text-slate-900">{totalClasses}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mahasiswa Terdaftar</p>
            <p className="text-xl font-black text-slate-900">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode, nama prodi, kaprodi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Jenjang:</span>
          <select
            value={filterDegree}
            onChange={(e) => setFilterDegree(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 cursor-pointer"
          >
            <option value="all">Semua Jenjang ({activeDegrees.length} Tersedia)</option>
            {activeDegrees.map((deg) => (
              <option key={deg.code} value={deg.code}>
                {deg.code} ({deg.name})
              </option>
            ))}
          </select>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setDegreeModalOpen(true)}
              className="p-2 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Kelola Jenjang Pendidikan yang Tersedia"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List of Departments */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat data program studi...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Program Studi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search ? 'Tidak ada prodi yang cocok dengan pencarian Anda.' : 'Belum ada data program studi tersimpan.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black rounded-md tracking-wider">
                        {dept.code}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-md">
                        {dept.degree}
                      </span>
                      {dept.accreditation && (
                        <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold rounded-md flex items-center gap-1">
                          <Award className="w-2.5 h-2.5 text-sky-600" />
                          {dept.accreditation}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {dept.faculty}
                    </p>
                  </div>
                </div>

                {/* Kaprodi info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 my-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ketua Program Studi (Kaprodi)
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {dept.head_name || 'Belum Ditentukan'}
                  </p>
                  {dept.head_nidn && (
                    <p className="text-[11px] text-slate-500 font-mono">NIDN: {dept.head_nidn}</p>
                  )}
                </div>

                {/* Description */}
                {dept.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                    {dept.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-center">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Kelas</p>
                    <p className="text-sm font-black text-slate-800">{dept.classes_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Mahasiswa</p>
                    <p className="text-sm font-black text-emerald-800">{dept.students_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Mata Kuliah</p>
                    <p className="text-sm font-black text-sky-700">{dept.courses_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {currentUser?.role === 'admin' && (
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-2 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Edit Program Studi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Hapus Program Studi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Program Studi */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingDept ? 'Edit Program Studi' : 'Tambah Program Studi Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi identitas akademik dan penugasan Kaprodi.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Prodi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: PBI-S1"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Jenjang Pendidikan <span className="text-rose-500">*</span>
                    </label>
                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setDegreeModalOpen(true)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors"
                        title="Atur jenjang yang tersedia"
                      >
                        <Sliders className="w-3 h-3 text-emerald-700" />
                        <span>Atur Jenjang Tersedia</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={form.degree}
                    onChange={(e) => setForm({ ...form, degree: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                  >
                    {modalDegreeOptions.map((deg) => (
                      <option key={deg.code} value={deg.code}>
                        {deg.code} ({deg.name}) {deg.level ? `— ${deg.level}` : ''} {!deg.is_active ? '(Non-Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hanya menampilkan jenjang yang tersedia/aktif. Klik tombol 'Atur Jenjang Tersedia' untuk menambah atau mengaktifkan jenjang lain.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Program Studi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: S1 Pendidikan Biologi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fakultas
                  </label>
                  <input
                    type="text"
                    placeholder="Fakultas Ilmu Pendidikan..."
                    value={form.faculty}
                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peringkat Akreditasi
                  </label>
                  <select
                    value={form.accreditation}
                    onChange={(e) => setForm({ ...form, accreditation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Unggul">Unggul</option>
                    <option value="A">A</option>
                    <option value="Baik Sekali">Baik Sekali</option>
                    <option value="B">B</option>
                    <option value="Baik">Baik</option>
                  </select>
                </div>
              </div>

              {/* Pilih Kaprodi dari Dosen yang terdaftar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Ketua Program Studi (Kaprodi)
                </label>
                <select
                  value={form.head_id}
                  onChange={handleLecturerSelect}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">-- Pilih Dosen Pengampu --</option>
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} {lec.nidn ? `(NIDN: ${lec.nidn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kaprodi (Manual)
                  </label>
                  <input
                    type="text"
                    value={form.head_name}
                    onChange={(e) => setForm({ ...form, head_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIDN / NIP Kaprodi
                  </label>
                  <input
                    type="text"
                    value={form.head_nidn}
                    onChange={(e) => setForm({ ...form, head_nidn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Visi Misi Ringkas
                </label>
                <textarea
                  rows={2}
                  placeholder="Fokus bidang keilmuan dan keunggulan kompetensi..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#012E26]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#EAA736]" />
                  <span>{submitting ? 'Menyimpan...' : editingDept ? 'Perbarui Prodi' : 'Simpan Prodi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Degree Management Modal */}
      {degreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#012E26] to-[#024438] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-white/10 rounded-2xl border border-white/15">
                  <GraduationCap className="w-5 h-5 text-[#EAA736]" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Pengaturan Jenjang Pendidikan yang Tersedia
                  </h3>
                  <p className="text-xs text-emerald-100/80 mt-0.5">
                    Hanya jenjang yang aktif yang akan disediakan dan ditampilkan pada pilihan Program Studi & Filter.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDegreeModalOpen(false)}
                className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Informational callout */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <p className="font-bold">
                    Konfigurasi Ketersediaan Jenjang (Degree Levels)
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Klik tombol status pada setiap jenjang untuk mengaktifkan atau menonaktifkannya. Misalnya jika kampus saat ini hanya menyelenggarakan program <strong>S1 (Sarjana)</strong> dan <strong>S2 (Magister)</strong>, nonaktifkan jenjang lainnya agar form tidak memuat pilihan yang tidak tersedia.
                  </p>
                </div>
              </div>

              {/* List of Degrees */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daftar Jenjang Pendidikan ({degrees.length} Terdaftar, {activeDegrees.length} Aktif)
                  </h4>
                  {!showAddDegreeForm && currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setShowAddDegreeForm(true)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Jenjang Baru</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {degrees.map((deg) => {
                    const deptsUsing = departments.filter((d) => d.degree === deg.code);
                    return (
                      <div
                        key={deg.code}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          deg.is_active ? 'bg-white' : 'bg-slate-50/80 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-10 h-10 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 border ${
                              deg.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {deg.code}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900">
                                {deg.name}
                              </span>
                              {deg.level && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                                  {deg.level}
                                </span>
                              )}
                              {deptsUsing.length > 0 && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                                  {deptsUsing.length} Prodi Menggunakan
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {deg.description || `Program Pendidikan ${deg.name}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {currentUser?.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleToggleDegree(deg.code)}
                              disabled={savingDegrees}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                deg.is_active
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {deg.is_active ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  <span>Tersedia & Aktif</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                                  <span>Non-Aktif</span>
                                </>
                              )}
                            </button>
                          )}

                          {!deg.is_default && currentUser?.role === 'admin' && deptsUsing.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDegree(deg.code)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Jenjang Kustom"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Tambah Jenjang Baru */}
              {showAddDegreeForm && (
                <form
                  onSubmit={handleAddDegree}
                  className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Form Tambah Jenjang Pendidikan Baru</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddDegreeForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Kode Singkat (misal: S3 / Profesi) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: S3"
                        value={newDegreeForm.code}
                        onChange={(e) => setNewDegreeForm({ ...newDegreeForm, code: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nama Jenjang *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Doktor"
                        value={newDegreeForm.name}
                        onChange={(e) => setNewDegreeForm({ ...newDegreeForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Level KKNI (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="misal: Level 9 KKNI"
                        value={newDegreeForm.level}
                        onChange={(e) => setNewDegreeForm({ ...newDegreeForm, level: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Deskripsi Ringkas (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Program Pascasarjana Doktoral"
                      value={newDegreeForm.description}
                      onChange={(e) => setNewDegreeForm({ ...newDegreeForm, description: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddDegreeForm(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-white cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={savingDegrees}
                      className="px-4 py-1.5 bg-[#012E26] hover:bg-[#023e33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#EAA736]" />
                      <span>{savingDegrees ? 'Menyimpan...' : 'Simpan Jenjang Baru'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Pilihan otomatis tersinkronisasi dengan form Program Studi & Kurikulum.
              </span>
              <button
                type="button"
                onClick={() => setDegreeModalOpen(false)}
                className="px-4 py-2 bg-[#012E26] hover:bg-[#023e33] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
