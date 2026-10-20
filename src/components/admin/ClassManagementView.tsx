import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { AcademicClass, Department, User as UserType } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
  X,
  UserCheck,
  Eye,
  School,
  ArrowRight,
} from 'lucide-react';

interface ClassManagementViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ClassManagementView: React.FC<ClassManagementViewProps> = ({ onNavigateTab }) => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<UserType[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<AcademicClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Class Roster Drawer Modal
  const [selectedClassRoster, setSelectedClassRoster] = useState<AcademicClass | null>(null);

  const [form, setForm] = useState({
    name: '',
    department_id: '',
    department_name: 'S1 Pendidikan Biologi',
    academic_year: '2026/2027',
    semester: 2,
    advisor_id: '',
    advisor_name: '',
    capacity: 35,
    description: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [classList, deptList, lecturerList, studentList] = await Promise.all([
        api.classes.getAll(),
        api.departments.getAll(),
        api.users.getAll('dosen').catch(() => []),
        api.users.getAll('mahasiswa').catch(() => []),
      ]);
      setClasses(classList);
      setDepartments(deptList);
      setLecturers(lecturerList);
      setStudents(studentList);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data Kelas',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    const defaultDept = departments[0];
    const defaultLecturer = lecturers[0];
    setForm({
      name: '',
      department_id: defaultDept?.id || '',
      department_name: defaultDept?.name || 'S1 Pendidikan Biologi',
      academic_year: '2026/2027',
      semester: 2,
      advisor_id: defaultLecturer?.id || '',
      advisor_name: defaultLecturer?.name || 'Dr. Sri Wahyuni, M.Kom.',
      capacity: 35,
      description: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (cls: AcademicClass) => {
    setEditingClass(cls);
    setForm({
      name: cls.name,
      department_id: cls.department_id || '',
      department_name: cls.department_name,
      academic_year: cls.academic_year || '2026/2027',
      semester: Number(cls.semester) || 2,
      advisor_id: cls.advisor_id || '',
      advisor_name: cls.advisor_name || '',
      capacity: cls.capacity || 35,
      description: cls.description || '',
    });
    setModalOpen(true);
  };

  const handleDeptSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const dept = departments.find((d) => d.id === selectedId);
    if (dept) {
      setForm((prev) => ({
        ...prev,
        department_id: dept.id,
        department_name: dept.name,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        department_id: '',
      }));
    }
  };

  const handleAdvisorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const lec = lecturers.find((l) => l.id === selectedId);
    if (lec) {
      setForm((prev) => ({
        ...prev,
        advisor_id: lec.id,
        advisor_name: lec.name,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        advisor_id: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast({
        type: 'error',
        title: 'Nama Kelas Wajib',
        message: 'Silakan isi nama kelas (misal: BIO-2A).',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingClass) {
        await api.classes.update(editingClass.id, form);
        showToast({
          type: 'success',
          title: 'Kelas Diperbarui',
          message: `Data kelas "${form.name}" berhasil diperbarui.`,
        });
      } else {
        await api.classes.create(form);
        showToast({
          type: 'success',
          title: 'Kelas Ditambahkan',
          message: `Kelas baru "${form.name}" berhasil ditambahkan dan terhubung dengan data perkuliahan.`,
        });
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Data Kelas',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cls: AcademicClass) => {
    if (classes.length <= 1) {
      showToast({
        type: 'info',
        title: 'Tidak Bisa Dihapus',
        message: 'Minimal harus ada 1 kelas aktif di sistem.',
      });
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus kelas "${cls.name}"? Kelas ini akan dihapus dari sistem dan otomatis dicabut dari seluruh daftar mata kuliah yang terhubung.`)) {
      return;
    }

    try {
      await api.classes.delete(cls.id);
      showToast({
        type: 'success',
        title: 'Kelas Dihapus',
        message: `Kelas "${cls.name}" berhasil dihapus.`,
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Kelas',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    }
  };

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.department_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.advisor_name && c.advisor_name.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = filterDept === 'all' || c.department_name === filterDept;
    return matchesSearch && matchesDept;
  });

  const totalCapacity = classes.reduce((acc, c) => acc + (c.capacity || 0), 0);
  const totalEnrolledStudents = students.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kelola Kelas Perkuliahan
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manajemen rombongan belajar, alokasi program studi, dosen pembimbing akademik (wali kelas), dan kuota mahasiswa.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#012E26] hover:bg-[#012E26]/90 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#EAA736]" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Building2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Kelas</p>
            <p className="text-xl font-black text-slate-900">{classes.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Mahasiswa Terdaftar</p>
            <p className="text-xl font-black text-slate-900">{totalEnrolledStudents}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-xl">
            <GraduationCap className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Kapasitas</p>
            <p className="text-xl font-black text-slate-900">{totalCapacity} Kursi</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <School className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Program Studi Terkait</p>
            <p className="text-xl font-black text-slate-900">{departments.length}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kelas, prodi, dosen wali..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Prodi:</span>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">Semua Program Studi</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Memuat data kelas perkuliahan...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Kelas Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search ? 'Tidak ada kelas yang cocok dengan kata kunci pencarian.' : 'Belum ada rombongan belajar kelas yang dibuat.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const classStudents = students.filter((s) => s.class_name === cls.name);
            const countStudents = cls.student_count !== undefined ? cls.student_count : classStudents.length;

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-black rounded-lg tracking-wider">
                          {cls.name}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                          Semester {cls.semester}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-2">
                        {cls.department_name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Tahun Akademik {cls.academic_year}
                      </p>
                    </div>
                  </div>

                  {/* Dosen Wali */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 my-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-700" />
                      Dosen Pembimbing Akademik / Wali
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {cls.advisor_name || 'Belum Ditentukan'}
                    </p>
                  </div>

                  {/* Description */}
                  {cls.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {cls.description}
                    </p>
                  )}

                  {/* Enrolled stats */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    countStudents === 0
                      ? 'bg-amber-50/50 border-amber-200/80'
                      : 'bg-emerald-50/50 border-emerald-100/60'
                  }`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Mahasiswa Terdaftar</span>
                        {countStudents === 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Kosong
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-black ${countStudents === 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {countStudents} <span className="text-slate-400 text-xs font-normal">/ {cls.capacity || 35} Kursi</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedClassRoster(cls)}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Siswa</span>
                    </button>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-medium text-slate-400">
                    {cls.courses_count || 1} Mata Kuliah Terhubung
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Edit Kelas"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(cls)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Kelas */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                  <Building2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingClass ? 'Edit Kelas Perkuliahan' : 'Tambah Kelas Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur nama rombel, program studi, dan dosen pembimbing akademik.
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
                    Nama Rombel / Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: BIO-2A, BIO-2B"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Studi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.department_id}
                  onChange={handleDeptSelect}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 2026/2027"
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kapasitas Kursi
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Dosen Wali */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pembimbing Akademik (Dosen Wali)
                </label>
                <select
                  value={form.advisor_id}
                  onChange={handleAdvisorSelect}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">-- Pilih Dosen Wali --</option>
                  {lecturers.map((lec) => (
                    <option key={lec.id} value={lec.id}>
                      {lec.name} {lec.nidn ? `(NIDN: ${lec.nidn})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Lokasi Ruang Kuliah
                </label>
                <textarea
                  rows={2}
                  placeholder="Ruang Laboratorium Komputer A, Gedung FIPH Lt. 2..."
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
                  <span>{submitting ? 'Menyimpan...' : editingClass ? 'Perbarui Kelas' : 'Simpan Kelas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal Roster Mahasiswa Kelas */}
      {selectedClassRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Daftar Mahasiswa - Kelas {selectedClassRoster.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedClassRoster.department_name} • TA {selectedClassRoster.academic_year}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClassRoster(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {(() => {
                const members = students.filter((s) => s.class_name === selectedClassRoster.name);
                if (members.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">Belum Ada Mahasiswa</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Belum ada mahasiswa yang dialokasikan ke kelas {selectedClassRoster.name}.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Total: {members.length} Mahasiswa Aktif
                    </p>
                    {members.map((m, idx) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">
                            {idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200/80">
                            {m.avatar || m.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{m.name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              NIM: {m.student_id || '-'} • {m.email}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              {onNavigateTab && (
                <button
                  onClick={() => {
                    setSelectedClassRoster(null);
                    onNavigateTab('users');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                >
                  <span>Kelola Akun di Manajemen Pengguna</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedClassRoster(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
