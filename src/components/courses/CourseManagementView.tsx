import React, { useState, useEffect } from 'react';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Course, User as UserType, Department, AcademicClass } from '../../types';
import { api } from '../../services/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Layers,
  GraduationCap,
  Calendar,
  User,
  Sparkles,
  ArrowRight,
  X,
  FileText,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Users,
  School,
  Building2,
} from 'lucide-react';
import { CourseStudentsAndGroupsModal } from './CourseStudentsAndGroupsModal';

interface CourseManagementViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const CourseManagementView: React.FC<CourseManagementViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { courses, activeCourseId, setActiveCourseId, createCourse, updateCourse, deleteCourse, loading, refreshCourses } = useCourse();
  const { showToast } = useNotification();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableLecturers, setAvailableLecturers] = useState<UserType[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [availableClassObjects, setAvailableClassObjects] = useState<AcademicClass[]>([]);
  const [availableDepts, setAvailableDepts] = useState<Department[]>([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    sks: 2,
    department: 'S1 Pendidikan Biologi',
    semester: 'Ganjil 2026/2027',
    academic_year: '2026/2027',
    lecturer_id: user?.role === 'dosen' ? user.id : 'usr_dosen',
    lecturer_name: user?.role === 'dosen' ? user.name : 'Dr. Sri Wahyuni, M.Kom.',
    enrolled_classes: [] as string[],
    description: '',
    color: '#012E26',
    icon: 'BookOpen',
  });

  // Fetch lecturers, classes, and departments
  useEffect(() => {
    refreshCourses();

    if (user?.role === 'admin') {
      api.users.getAll('dosen').then((res) => {
        setAvailableLecturers(res);
      }).catch(() => {});
    }

    api.classes.getAll().then((clsList) => {
      if (Array.isArray(clsList)) {
        setAvailableClassObjects(clsList);
        setAvailableClasses(clsList.map((c) => c.name));
      }
    }).catch(() => {});

    api.departments.getAll().then((deptList) => {
      setAvailableDepts(deptList);
      if (deptList.length > 0) {
        setForm((prev) => ({ ...prev, department: deptList[0].name }));
      }
    }).catch(() => {});
  }, [user, refreshCourses]);

  const openCreateModal = () => {
    setEditingCourse(null);
    setForm({
      code: '',
      name: '',
      sks: 2,
      department: availableDepts[0]?.name || 'S1 Pendidikan Biologi',
      semester: 'Ganjil 2026/2027',
      academic_year: '2026/2027',
      lecturer_id: user?.role === 'dosen' ? user.id : 'usr_dosen',
      lecturer_name: user?.role === 'dosen' ? user.name : 'Dr. Sri Wahyuni, M.Kom.',
      enrolled_classes: availableClasses.length > 0 ? [availableClasses[0]] : [],
      description: '',
      color: '#012E26',
      icon: 'BookOpen',
    });
    setShowModal(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    const validClasses = (course.enrolled_classes || []).filter(
      (c) => availableClasses.length === 0 || availableClasses.includes(c)
    );
    setForm({
      code: course.code,
      name: course.name,
      sks: course.sks || 2,
      department: course.department || availableDepts[0]?.name || 'S1 Pendidikan Biologi',
      semester: course.semester || 'Ganjil 2026/2027',
      academic_year: course.academic_year || '2026/2027',
      lecturer_id: course.lecturer_id || (user?.role === 'dosen' ? user.id : 'usr_dosen'),
      lecturer_name: course.lecturer_name || user?.name || '',
      enrolled_classes: validClasses.length > 0 ? validClasses : (availableClasses.length > 0 ? [availableClasses[0]] : []),
      description: course.description || '',
      color: course.color || '#012E26',
      icon: course.icon || 'BookOpen',
    });
    setShowModal(true);
  };

  const handleAddClass = (className: string) => {
    if (!className) return;
    if (!form.enrolled_classes.includes(className)) {
      setForm((prev) => ({
        ...prev,
        enrolled_classes: [...prev.enrolled_classes, className],
      }));
    }
  };

  const handleRemoveClass = (className: string) => {
    setForm((prev) => ({
      ...prev,
      enrolled_classes: prev.enrolled_classes.filter((c) => c !== className),
    }));
  };

  const handleSelectAllClasses = () => {
    setForm((prev) => ({
      ...prev,
      enrolled_classes: Array.from(new Set([...prev.enrolled_classes, ...availableClasses])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Kode dan nama mata kuliah wajib diisi.',
      });
      return;
    }

    if (!form.enrolled_classes || form.enrolled_classes.length === 0) {
      showToast({
        type: 'error',
        title: 'Target Kelas Belum Dipilih',
        message: 'Pilih minimal satu kelas mahasiswa yang dapat mengikuti mata kuliah ini.',
      });
      return;
    }

    try {
      setSubmitting(true);
      if (editingCourse) {
        await updateCourse(editingCourse.id, form);
        showToast({
          type: 'success',
          title: 'Mata Kuliah Diperbarui',
          message: `Mata kuliah ${form.name} (${form.code}) berhasil diperbarui.`,
        });
      } else {
        const created = await createCourse(form);
        setActiveCourseId(created.id);
        showToast({
          type: 'success',
          title: 'Mata Kuliah Ditambahkan',
          message: `Mata kuliah ${form.name} (${form.code}) berhasil dibuat.`,
        });
      }
      setShowModal(false);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (courses.length <= 1) {
      showToast({
        type: 'error',
        title: 'Tidak Dapat Menghapus',
        message: 'Sistem harus memiliki setidaknya satu mata kuliah aktif.',
      });
      return;
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus mata kuliah "${course.name}" (${course.code})?`
      )
    ) {
      return;
    }

    try {
      await deleteCourse(course.id);
      showToast({
        type: 'success',
        title: 'Mata Kuliah Dihapus',
        message: `Mata kuliah ${course.name} telah berhasil dihapus.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.lecturer_name && c.lecturer_name.toLowerCase().includes(q))
    );
  });

  const colorPresets = [
    { name: 'Hijau Toska (Primary)', value: '#012E26' },
    { name: 'Biru Samudera', value: '#0284C7' },
    { name: 'Ungu Molekuler', value: '#7C3AED' },
    { name: 'Amber Gold', value: '#D97706' },
    { name: 'Rose Merah', value: '#E11D48' },
    { name: 'Teal Botani', value: '#0D9488' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#012E26] text-xs font-bold border border-emerald-200/80 mb-2">
            <Layers className="w-3.5 h-3.5 text-[#012E26]" />
            <span>Multi-Mata Kuliah • Universitas Hamzanwadi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Mata Kuliah & Kurikulum
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola ragam mata kuliah aktif, dosen pengampu, sks, dan silabus terintegrasi antar program studi.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#012E26]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#EAA736]" />
          <span>Tambah Mata Kuliah Baru</span>
        </button>
      </div>

      {/* Search & Active Info Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode MK, nama mata kuliah, atau dosen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-500 font-semibold">
          <span>Total: <strong>{courses.length}</strong> Mata Kuliah</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 font-bold">
            Ruang Aktif: {courses.find((c) => c.id === activeCourseId)?.name || 'Semua Mata Kuliah'}
          </span>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredCourses.map((course) => {
          const isActive = activeCourseId === course.id;
          const courseColor = course.color || '#012E26';

          return (
            <div
              key={course.id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-950/5'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Card Header Strip */}
              <div
                className="h-2.5 w-full"
                style={{ backgroundColor: courseColor }}
              />

              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide text-white uppercase"
                        style={{ backgroundColor: courseColor }}
                      >
                        {course.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                        {course.sks} SKS
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 text-xs font-semibold">
                        {course.semester}
                      </span>
                    </div>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sedang Aktif
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedCourseForModal(course)}
                    className="text-lg font-black text-slate-900 tracking-tight mt-3 hover:text-emerald-800 transition-colors cursor-pointer flex items-center justify-between group"
                    title="Klik untuk melihat mahasiswa & kelompok belajar"
                  >
                    <span>{course.name}</span>
                    <Users className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {course.description || 'Deskripsi kurikulum dan capaian pembelajaran mata kuliah.'}
                  </p>
                </div>

                {/* Lecturer & Class Meta */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {course.lecturer_name || 'Dosen Pengampu'}
                    </span>
                  </div>

                  {/* Enrolled Classes Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(() => {
                      const validClasses = (course.enrolled_classes || []).filter(
                        (cls) => availableClasses.length === 0 || availableClasses.includes(cls)
                      );
                      return validClasses.length > 0 ? (
                        validClasses.map((cls) => (
                          <span
                            key={cls}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                          >
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Belum ada kelas terdaftar</span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Tahun Akademik: <strong>{course.academic_year || '2026/2027'}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedCourseForModal(course)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200/80 transition-colors cursor-pointer"
                      title="Lihat daftar mahasiswa terdaftar & kelompok belajar"
                    >
                      <Users className="w-3 h-3 text-emerald-600" />
                      <span>{course.enrolled_students_count ?? 0} Mahasiswa</span>
                    </button>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveCourseId(course.id);
                        setSelectedCourseForModal(course);
                        showToast({
                          type: 'success',
                          title: 'Mata Kuliah Aktif Dibuka',
                          message: `Membuka daftar mahasiswa & kelompok untuk "${course.name}".`,
                        });
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80'
                      }`}
                    >
                      <span>{isActive ? 'Ruang Aktif (Buka Data)' : 'Pilih / Masuk Ruang MK'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(course)}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Mata Kuliah"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {(user?.role === 'admin' || user?.role === 'dosen') && (
                        <button
                          onClick={() => handleDelete(course)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Mata Kuliah"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dedicated Button: Buka Mahasiswa & Kelompok Belajar */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCourseId(course.id);
                      setSelectedCourseForModal(course);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#012E26] hover:bg-[#024438] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-300" />
                    <span>Lihat Mahasiswa & Kelompok MK ({course.enrolled_students_count ?? 0})</span>
                  </button>
                </div>

                {/* Quick Shortcuts to Course Modules */}
                {onNavigateTab && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Akses Cepat Halaman & Menu Mata Kuliah:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('materials');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Materi & Silabus"
                      >
                        <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">Silabus/Materi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('tugas');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Tugas Kuliah"
                      >
                        <FileText className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">Tugas Kuliah</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('quizzes');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Mini Kuis"
                      >
                        <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">Mini Kuis</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('presensi');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Presensi Kehadiran"
                      >
                        <Calendar className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate">Presensi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('penilaian');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Buku Nilai Semester"
                      >
                        <GraduationCap className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">Buku Nilai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseId(course.id);
                          onNavigateTab('discussions');
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-100"
                        title="Buka Forum Diskusi"
                      >
                        <MessageSquare className="w-3 h-3 text-indigo-600 shrink-0" />
                        <span className="truncate">Diskusi</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Mata Kuliah */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#012E26]/10 text-[#012E26]">
                  <Layers className="w-5 h-5 text-[#012E26]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCourse ? 'Perbarui Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi rincian informasi kurikulum dan identitas perkuliahan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Mata Kuliah *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BIO-101"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Mata Kuliah *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Biologi Umum & Selular"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bobot SKS
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={form.sks}
                    onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Semester
                  </label>
                  <select
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  >
                    <option value="Ganjil 2026/2027">Ganjil 2026/2027</option>
                    <option value="Genap 2026/2027">Genap 2026/2027</option>
                    <option value="Antara / Pendek 2026">Antara / Pendek 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun Akademik
                  </label>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                  />
                </div>
              </div>

              {/* Program Studi Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Program Studi Pengampu Mata Kuliah
                </label>
                {availableDepts.length > 0 ? (
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  >
                    {availableDepts.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                    {!availableDepts.some((d) => d.name === form.department) && form.department && (
                      <option value={form.department}>{form.department}</option>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: S1 Pendidikan Biologi"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  />
                )}
              </div>

              {/* Dosen Pengampu Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosen Pengampu Perkuliahan *
                </label>
                {user?.role === 'admin' && availableLecturers.length > 0 ? (
                  <select
                    value={form.lecturer_id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedLecturer = availableLecturers.find((l) => l.id === selectedId);
                      setForm({
                        ...form,
                        lecturer_id: selectedId,
                        lecturer_name: selectedLecturer?.name || form.lecturer_name,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  >
                    {availableLecturers.map((lec) => (
                      <option key={lec.id} value={lec.id}>
                        {lec.name} {lec.nidn ? `(NIDN: ${lec.nidn})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nama Lengkap & Gelar Akademik Dosen"
                    value={form.lecturer_name}
                    onChange={(e) => setForm({ ...form, lecturer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                    required
                    readOnly={user?.role === 'dosen'}
                  />
                )}
                {user?.role === 'dosen' && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Sebagai dosen, mata kuliah yang Anda buat otomatis mengaitkan akun Anda sebagai Dosen Pengampu.
                  </p>
                )}
              </div>

              {/* Target Kelas Mahasiswa Dropdown & Selected Classes Display */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Target Kelas Mahasiswa *
                  </label>
                  <div className="flex items-center gap-2">
                    {availableClasses.length > form.enrolled_classes.length && (
                      <button
                        type="button"
                        onClick={handleSelectAllClasses}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        + Pilih Semua Kelas
                      </button>
                    )}
                    {form.enrolled_classes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, enrolled_classes: [] }))}
                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Kosongkan
                      </button>
                    )}
                  </div>
                </div>

                {/* Dropdown to select a class */}
                <select
                  value=""
                  onChange={(e) => {
                    handleAddClass(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26] cursor-pointer"
                >
                  <option value="">-- Pilih Kelas Mahasiswa untuk Ditambahkan --</option>
                  {availableClasses.map((cls) => {
                    const isAlreadySelected = form.enrolled_classes.includes(cls);
                    const clsObj = availableClassObjects.find((c) => c.name === cls);
                    return (
                      <option key={cls} value={cls} disabled={isAlreadySelected}>
                        {isAlreadySelected ? `✓ Kelas ${cls} (Sudah Terpilih)` : `+ Kelas ${cls}`}
                        {clsObj ? ` — ${clsObj.department_name} (Semester ${clsObj.semester})` : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Termuat Kelas yang Sudah Dipilih di Bawahnya */}
                <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      Kelas Terpilih ({form.enrolled_classes.length} kelas)
                    </span>
                    {form.enrolled_classes.length === 0 && (
                      <span className="text-amber-700 font-semibold text-[10px] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Wajib memilih minimal 1 kelas
                      </span>
                    )}
                  </div>

                  {form.enrolled_classes.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {form.enrolled_classes.map((cls) => {
                        const clsObj = availableClassObjects.find((c) => c.name === cls);
                        return (
                          <div
                            key={cls}
                            className="inline-flex items-center gap-2 bg-white border border-emerald-300 text-emerald-950 px-3 py-1.5 rounded-xl shadow-2xs text-xs font-bold transition-all hover:border-emerald-400"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>Kelas {cls}</span>
                            {clsObj && (
                              <span className="text-[10px] text-slate-500 font-normal">
                                • {clsObj.department_name}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveClass(cls)}
                              className="w-4 h-4 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-1 cursor-pointer"
                              title={`Hapus Kelas ${cls}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-2.5 text-slate-400">
                      <p className="text-xs font-semibold text-slate-500">Belum ada kelas yang dipilih</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pilih rombel kelas dari menu dropdown di atas untuk memasukkan kelas ke mata kuliah ini.
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1">
                  Hanya mahasiswa di kelas yang dipilih di atas yang akan menampilkan mata kuliah ini di beranda mereka.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi & Capaian Pembelajaran
                </label>
                <textarea
                  rows={3}
                  placeholder="Ringkasan silabus, kompetensi yang dicapai, serta fokus perkuliahan..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white resize-none"
                />
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tema Warna Mata Kuliah
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setForm({ ...form, color: preset.value })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        form.color === preset.value
                          ? 'border-slate-800 bg-slate-100 font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md shadow-[#012E26]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingCourse
                    ? 'Simpan Perubahan'
                    : 'Tambahkan Mata Kuliah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mahasiswa Terdaftar & Manajemen Kelompok Belajar */}
      <CourseStudentsAndGroupsModal
        course={selectedCourseForModal}
        isOpen={!!selectedCourseForModal}
        onClose={() => setSelectedCourseForModal(null)}
        onRefreshCourses={refreshCourses}
      />
    </div>
  );
};
