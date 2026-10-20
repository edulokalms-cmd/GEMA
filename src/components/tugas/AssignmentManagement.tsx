import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { Assignment, AssignmentSubmission } from '../../types';
import {
  FileText,
  Plus,
  Save,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Filter,
  Search,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';

export const AssignmentManagement: React.FC = () => {
  const { showToast } = useNotification();
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchSub, setSearchSub] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAsgForm, setNewAsgForm] = useState({
    meeting_number: 1,
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
  });
  const [editAsgForm, setEditAsgForm] = useState({
    id: '',
    meeting_number: 1,
    title: '',
    description: '',
    due_date: '',
    max_score: 100,
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Grading modal
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const [data, students] = await Promise.all([
        api.assignments.getAll(),
        api.users.getAll('mahasiswa'),
      ]);
      setAssignments(data);
      setAllStudents(students);
      if (data.length > 0 && !selectedAssignment) {
        setSelectedAssignment(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadSubmissions = async (asgId: string) => {
    try {
      setLoadingSubs(true);
      const subs = await api.assignments.getSubmissions(asgId);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment.id);
    }
  }, [selectedAssignment]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsgForm.title) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Judul tugas wajib diisi.',
      });
      return;
    }

    try {
      setCreating(true);
      const created = await api.assignments.create({
        ...newAsgForm,
        course_id: activeCourseId !== 'all' ? activeCourseId : courses[0]?.id || 'course_1',
      });
      showToast({
        type: 'success',
        title: 'Tugas Dibuat',
        message: `Tugas "${created.title}" berhasil ditambahkan.`,
      });
      setShowCreateModal(false);
      setNewAsgForm({
        meeting_number: 1,
        title: '',
        description: '',
        due_date: '',
        max_score: 100,
      });
      await loadAssignments();
      setSelectedAssignment(created);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membuat Tugas',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      setSavingGrade(true);
      await api.assignments.gradeSubmission(gradingSubmission.id, gradeScore, gradeFeedback);
      showToast({
        type: 'success',
        title: 'Nilai Tugas Disimpan',
        message: 'Nilai dan umpan balik tugas berhasil diperbarui.',
      });
      setGradingSubmission(null);
      if (selectedAssignment) {
        loadSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Nilai',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSavingGrade(false);
    }
  };

  const handleOpenEditModal = (asg: Assignment) => {
    setEditAsgForm({
      id: asg.id,
      meeting_number: asg.meeting_number,
      title: asg.title,
      description: asg.description || '',
      due_date: asg.due_date ? asg.due_date.split('T')[0] : '',
      max_score: asg.max_score || 100,
    });
    setShowEditModal(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAsgForm.title) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Judul tugas wajib diisi.',
      });
      return;
    }

    try {
      setUpdating(true);
      const updated = await api.assignments.update(editAsgForm.id, {
        meeting_number: editAsgForm.meeting_number,
        title: editAsgForm.title,
        description: editAsgForm.description,
        due_date: editAsgForm.due_date ? new Date(editAsgForm.due_date).toISOString() : undefined,
        max_score: editAsgForm.max_score,
      });

      showToast({
        type: 'success',
        title: 'Tugas Diperbarui',
        message: `Tugas "${updated.title}" berhasil diperbarui.`,
      });
      setShowEditModal(false);
      await loadAssignments();
      setSelectedAssignment(updated);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Tugas',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAssignment = async (asg: Assignment) => {
    if (!window.confirm(`Yakin ingin menghapus tugas "${asg.title}" (Pertemuan #${asg.meeting_number})? Seluruh pengumpulan tugas mahasiswa juga akan dihapus permanen.`)) {
      return;
    }

    try {
      await api.assignments.delete(asg.id);
      showToast({
        type: 'info',
        title: 'Tugas Dihapus',
        message: `Tugas "${asg.title}" telah dihapus dari sistem.`,
      });

      const remaining = assignments.filter((a) => a.id !== asg.id);
      setAssignments(remaining);
      if (selectedAssignment?.id === asg.id) {
        setSelectedAssignment(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Tugas',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleDeleteSubmission = async (sub: AssignmentSubmission) => {
    if (!window.confirm(`Hapus pengumpulan tugas mahasiswa "${sub.student_name}"?`)) {
      return;
    }

    try {
      await api.assignments.deleteSubmission(sub.id);
      showToast({
        type: 'info',
        title: 'Pengumpulan Dihapus',
        message: `Pengumpulan tugas milik "${sub.student_name}" telah dihapus.`,
      });
      if (selectedAssignment) {
        loadSubmissions(selectedAssignment.id);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const availableClasses = Array.from(
    new Set([
      ...allStudents.map((s) => s.class_name).filter(Boolean),
      ...submissions.map((s) => s.class_name).filter(Boolean),
    ]) as Set<string>
  ).sort();

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.student_name || '').toLowerCase().includes(searchSub.toLowerCase()) ||
      (sub.student_id || '').toLowerCase().includes(searchSub.toLowerCase());
    const matchesClass = selectedClass === 'all' || sub.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const totalInClass =
    selectedClass === 'all'
      ? allStudents.length
      : allStudents.filter((s) => s.class_name === selectedClass).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 text-xs font-bold border border-purple-200/80 mb-2">
            <FileText className="w-3.5 h-3.5 text-purple-700" />
            <span>Komponen Penilaian Tugas Mahasiswa</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Tugas Perkuliahan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buat penugasan per pertemuan dan periksa pengumpulan tugas mahasiswa untuk nilai semester.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-[#012E26]" />
              <span className="text-xs font-bold text-slate-600">MK:</span>
              <select
                value={activeCourseId}
                onChange={(e) => setActiveCourseId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#012E26] focus:outline-hidden cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Semua Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 text-[#EAA736]" />
            <span>Tambah Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Assignment List (Left) and Submissions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Assignments */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daftar Tugas ({assignments.filter((a) => activeCourseId === 'all' || !a.course_id || a.course_id === activeCourseId).length})
            </h3>
            {activeCourseId !== 'all' && (
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                MK Terpilih
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {assignments
              .filter((a) => activeCourseId === 'all' || !a.course_id || a.course_id === activeCourseId)
              .map((asg) => {
              const isSelected = selectedAssignment?.id === asg.id;
              return (
                <div
                  key={asg.id}
                  onClick={() => setSelectedAssignment(asg)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-100'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      Pertemuan #{asg.meeting_number}
                    </span>
                    <span className="text-slate-400 font-medium text-[11px]">
                      {asg.submissions_count || 0} Pengumpulan
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                    {asg.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {asg.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Submissions for Selected Assignment */}
        <div className="lg:col-span-7 space-y-4">
          {selectedAssignment ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                    Pertemuan #{selectedAssignment.meeting_number}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2">
                    {selectedAssignment.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedAssignment.description}
                  </p>
                  {selectedAssignment.due_date && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Batas Pengumpulan: {new Date(selectedAssignment.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-start">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedAssignment)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Edit Tugas Ini"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAssignment(selectedAssignment)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="Hapus Tugas Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pengumpulan Mahasiswa ({filteredSubmissions.length}
                    {selectedClass !== 'all' ? ` di Kelas ${selectedClass}` : ` dari ${submissions.length}`})
                  </h4>
                  {totalInClass > 0 && (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60 self-start sm:self-auto">
                      {filteredSubmissions.length} / {totalInClass} mhs mengumpulkan
                    </span>
                  )}
                </div>

                {/* Filter and Search Bar for Submissions */}
                <div className="flex flex-col sm:flex-row gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari mahasiswa pengumpul (nama / NIM)..."
                      value={searchSub}
                      onChange={(e) => setSearchSub(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white px-2 py-1 rounded-xl border border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] font-bold text-slate-600">Kelas:</span>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="bg-transparent text-xs font-bold text-purple-900 focus:outline-hidden cursor-pointer py-0.5"
                    >
                      <option value="all">Semua Kelas ({submissions.length})</option>
                      {availableClasses.map((cls) => {
                        const subCount = submissions.filter((s) => s.class_name === cls).length;
                        return (
                          <option key={cls} value={cls}>
                            Kelas {cls} ({subCount} submisi)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {loadingSubs ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Memuat data pengumpulan...
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    {submissions.length === 0
                      ? 'Belum ada mahasiswa yang mengumpulkan tugas ini.'
                      : 'Tidak ada pengumpulan yang sesuai dengan filter kelas atau pencarian.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredSubmissions.map((sub) => (
                      <div key={sub.id} className="py-3.5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {sub.student_name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              ({sub.student_id})
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80 font-bold text-[10px]">
                              Kelas {sub.class_name || 'BIO-2A'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {sub.content}
                          </p>
                          {sub.feedback && (
                            <p className="text-[11px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded-lg">
                              Catatan Dosen: {sub.feedback}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {sub.score !== undefined ? (
                            <div className="mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                Nilai
                              </span>
                              <span className="text-base font-black text-purple-700">
                                {sub.score} / 100
                              </span>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold mb-1.5">
                              Belum Dinilai
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeScore(sub.score || 85);
                                setGradeFeedback(sub.feedback || '');
                              }}
                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              {sub.score !== undefined ? 'Ubah Nilai' : 'Beri Nilai'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub)}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Submisi Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Pilih salah satu tugas di sebelah kiri untuk melihat pengumpulan.
            </div>
          )}
        </div>
      </div>

      {/* Modal Buat Tugas */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Tugas Perkuliahan Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pertemuan Ke-
                  </label>
                  <select
                    value={newAsgForm.meeting_number}
                    onChange={(e) =>
                      setNewAsgForm({ ...newAsgForm, meeting_number: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Pertemuan #{m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tenggat Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    value={newAsgForm.due_date}
                    onChange={(e) =>
                      setNewAsgForm({ ...newAsgForm, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={newAsgForm.title}
                  onChange={(e) => setNewAsgForm({ ...newAsgForm, title: e.target.value })}
                  placeholder="Contoh: Tugas 1: Pengolahan Data Lab dengan Spreadsheet"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Petunjuk & Instruksi Tugas
                </label>
                <textarea
                  rows={3}
                  value={newAsgForm.description}
                  onChange={(e) =>
                    setNewAsgForm({ ...newAsgForm, description: e.target.value })
                  }
                  placeholder="Tuliskan format pengumpulan, tautan dokumen acuan, dll..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{creating ? 'Menyimpan...' : 'Simpan Tugas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tugas */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Edit Tugas Perkuliahan
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAssignment} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pertemuan Ke-
                  </label>
                  <select
                    value={editAsgForm.meeting_number}
                    onChange={(e) =>
                      setEditAsgForm({ ...editAsgForm, meeting_number: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Pertemuan #{m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tenggat Waktu (Deadline)
                  </label>
                  <input
                    type="date"
                    value={editAsgForm.due_date}
                    onChange={(e) =>
                      setEditAsgForm({ ...editAsgForm, due_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Tugas
                </label>
                <input
                  type="text"
                  value={editAsgForm.title}
                  onChange={(e) => setEditAsgForm({ ...editAsgForm, title: e.target.value })}
                  placeholder="Judul tugas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Petunjuk & Instruksi Tugas
                </label>
                <textarea
                  rows={3}
                  value={editAsgForm.description}
                  onChange={(e) =>
                    setEditAsgForm({ ...editAsgForm, description: e.target.value })
                  }
                  placeholder="Petunjuk tugas..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{updating ? 'Menyimpan...' : 'Perbarui Tugas'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Beri Nilai */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Penilaian Tugas</h3>
                <p className="text-xs text-slate-500">{gradingSubmission.student_name}</p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai Tugas (Skala 0 - 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-purple-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Umpan Balik / Catatan Dosen
                </label>
                <textarea
                  rows={2}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Catatan penguatan atau revisi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingGrade}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{savingGrade ? 'Menyimpan...' : 'Simpan Nilai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
