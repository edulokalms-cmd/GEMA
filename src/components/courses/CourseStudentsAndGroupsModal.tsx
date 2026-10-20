import React, { useState, useEffect } from 'react';
import { Course, CourseGroup, CourseStudentInfo } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Layers,
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  Crown,
  Sparkles,
  RefreshCw,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shuffle,
  GraduationCap,
  BookOpen,
} from 'lucide-react';

interface CourseStudentsAndGroupsModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshCourses?: () => void;
}

export const CourseStudentsAndGroupsModal: React.FC<CourseStudentsAndGroupsModalProps> = ({
  course,
  isOpen,
  onClose,
  onRefreshCourses,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activeTab, setActiveTab] = useState<'students' | 'groups'>('students');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<CourseStudentInfo[]>([]);
  const [groups, setGroups] = useState<CourseGroup[]>([]);

  // Search & Filter state for students tab
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  // Create / Edit Group Modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CourseGroup | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    member_ids: [] as string[],
    leader_id: '',
  });
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  // Auto Generate Groups Modal state
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoForm, setAutoForm] = useState({
    group_count: 4,
    prefix: 'Kelompok',
    randomize: true,
    reset_existing: true,
  });
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  // Quick Add Member to Group Modal
  const [quickAddGroupId, setQuickAddGroupId] = useState<string | null>(null);
  const [selectedStudentForGroup, setSelectedStudentForGroup] = useState<string>('');

  // Load students & groups for this specific course
  const loadCourseData = async () => {
    if (!course) return;
    try {
      setLoading(true);
      const data = await api.courses.getStudents(course.id);
      setStudents(data.students);
      setGroups(data.groups);
    } catch (err: any) {
      console.error('Failed loading course students:', err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: err.message || 'Tidak dapat memuat mahasiswa mata kuliah.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && course) {
      loadCourseData();
      setActiveTab('students');
    }
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      (s.student_id && s.student_id.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q));

    const matchClass = classFilter === 'all' || s.class_name === classFilter;

    let matchGroup = true;
    if (groupFilter === 'ungrouped') {
      matchGroup = !s.group_id;
    } else if (groupFilter === 'grouped') {
      matchGroup = !!s.group_id;
    } else if (groupFilter !== 'all') {
      matchGroup = s.group_id === groupFilter;
    }

    return matchSearch && matchClass && matchGroup;
  });

  const availableClasses = Array.from(
    new Set(students.map((s) => s.class_name).filter(Boolean))
  ).sort() as string[];

  const ungroupedStudents = students.filter((s) => !s.group_id);

  // Open Create Group modal
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupForm({
      name: `Kelompok ${groups.length + 1}`,
      description: '',
      member_ids: [],
      leader_id: '',
    });
    setShowGroupModal(true);
  };

  // Open Edit Group modal
  const handleOpenEditGroup = (g: CourseGroup) => {
    setEditingGroup(g);
    setGroupForm({
      name: g.name,
      description: g.description || '',
      member_ids: [...g.member_ids],
      leader_id: g.leader_id || '',
    });
    setShowGroupModal(true);
  };

  // Submit Create or Edit Group
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      showToast({
        type: 'error',
        title: 'Nama Kelompok Kosong',
        message: 'Masukkan nama kelompok.',
      });
      return;
    }

    try {
      setGroupSubmitting(true);
      if (editingGroup) {
        await api.courses.updateGroup(course.id, editingGroup.id, groupForm);
        showToast({
          type: 'success',
          title: 'Kelompok Diperbarui',
          message: `Kelompok "${groupForm.name}" berhasil diperbarui.`,
        });
      } else {
        await api.courses.createGroup(course.id, groupForm);
        showToast({
          type: 'success',
          title: 'Kelompok Dibuat',
          message: `Kelompok "${groupForm.name}" berhasil ditambahkan.`,
        });
      }
      setShowGroupModal(false);
      await loadCourseData();
      if (onRefreshCourses) onRefreshCourses();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Kelompok',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setGroupSubmitting(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (group: CourseGroup) => {
    if (!window.confirm(`Yakin ingin menghapus kelompok "${group.name}"? Anggota akan kembali berstatus belum berkelompok.`)) {
      return;
    }

    try {
      await api.courses.deleteGroup(course.id, group.id);
      showToast({
        type: 'info',
        title: 'Kelompok Dihapus',
        message: `Kelompok "${group.name}" telah dihapus.`,
      });
      await loadCourseData();
      if (onRefreshCourses) onRefreshCourses();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  // Remove member from group
  const handleRemoveMember = async (group: CourseGroup, memberId: string) => {
    const updatedMembers = group.member_ids.filter((id) => id !== memberId);
    let updatedLeader = group.leader_id;
    if (updatedLeader === memberId) {
      updatedLeader = updatedMembers[0] || undefined;
    }

    try {
      await api.courses.updateGroup(course.id, group.id, {
        member_ids: updatedMembers,
        leader_id: updatedLeader,
      });
      showToast({
        type: 'info',
        title: 'Anggota Dikeluarkan',
        message: 'Mahasiswa telah dikeluarkan dari kelompok.',
      });
      await loadCourseData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Anggota',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  // Set Leader of group
  const handleSetLeader = async (group: CourseGroup, leaderId: string) => {
    try {
      await api.courses.updateGroup(course.id, group.id, {
        leader_id: leaderId,
      });
      showToast({
        type: 'success',
        title: 'Ketua Ditetapkan',
        message: 'Ketua kelompok berhasil diperbarui.',
      });
      await loadCourseData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menetapkan Ketua',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  // Quick add student to group
  const handleQuickAddMember = async (groupId: string, studentId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;

    if (group.member_ids.includes(studentId)) {
      showToast({
        type: 'warning',
        title: 'Sudah Terdaftar',
        message: 'Mahasiswa sudah menjadi anggota kelompok ini.',
      });
      return;
    }

    const updatedMembers = [...group.member_ids, studentId];
    try {
      await api.courses.updateGroup(course.id, group.id, {
        member_ids: updatedMembers,
      });
      showToast({
        type: 'success',
        title: 'Anggota Ditambahkan',
        message: `Mahasiswa berhasil dimasukkan ke ${group.name}.`,
      });
      setQuickAddGroupId(null);
      setSelectedStudentForGroup('');
      await loadCourseData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menambahkan',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  // Submit Auto Generate Groups
  const handleAutoGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (autoForm.group_count < 1) {
      showToast({
        type: 'error',
        title: 'Jumlah Tidak Valid',
        message: 'Jumlah kelompok minimal 1.',
      });
      return;
    }

    try {
      setAutoSubmitting(true);
      const res = await api.courses.autoGenerateGroups(course.id, autoForm);
      showToast({
        type: 'success',
        title: 'Pembagian Kelompok Berhasil',
        message: res.message,
      });
      setShowAutoModal(false);
      await loadCourseData();
      if (onRefreshCourses) onRefreshCourses();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membagi Kelompok',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setAutoSubmitting(false);
    }
  };

  const isDosenOrAdmin = user?.role === 'admin' || user?.role === 'dosen';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#012E26] via-[#024438] to-[#012E26] text-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-[#012E26] text-xs font-black uppercase tracking-wider">
                {course.code}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 text-white text-xs font-bold border border-white/20">
                {course.sks} SKS
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-emerald-200 text-xs font-medium">
                {course.semester}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {course.name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90 pt-0.5">
              <span>Dosen: <strong>{course.lecturer_name || 'Belum diploting'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Kelas Ploting:
                {Array.isArray(course.enrolled_classes) && course.enrolled_classes.length > 0 ? (
                  course.enrolled_classes.map((cls) => (
                    <span key={cls} className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-white font-bold text-[11px]">
                      {cls}
                    </span>
                  ))
                ) : (
                  <span className="italic">Semua kelas</span>
                )}
              </span>
              <span>•</span>
              <span>Total Mahasiswa Terdaftar: <strong>{students.length} Mahasiswa</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'students'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mahasiswa Terdaftar ({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'groups'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kelompok Belajar ({groups.length})</span>
            {ungroupedStudents.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                {ungroupedStudents.length} Belum
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-500">Memuat data mahasiswa dan kelompok...</p>
            </div>
          ) : activeTab === 'students' ? (
            /* TAB 1: MAHASISWA TERDAFTAR */
            <div className="space-y-4">
              {/* Notice & Filters */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Menampilkan <strong>hanya mahasiswa</strong> yang mengikuti mata kuliah <strong>{course.name}</strong> sesuai plotting kelas aktif (<strong>{(course.enrolled_classes || []).join(', ') || 'Semua'}</strong>).
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                  Total: {students.length} Mahasiswa
                </span>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari NIM atau Nama..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Kelas ({availableClasses.length} Kelas)</option>
                    {availableClasses.map((cls) => (
                      <option key={cls} value={cls}>Kelas {cls}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={groupFilter}
                    onChange={(e) => setGroupFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Status Kelompok</option>
                    <option value="ungrouped">Belum Berkelompok ({ungroupedStudents.length})</option>
                    <option value="grouped">Sudah Berkelompok ({students.length - ungroupedStudents.length})</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name} ({g.member_ids.length} orang)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {filteredStudents.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Tidak ada mahasiswa yang cocok</p>
                    <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter kelas/kelompok.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Mahasiswa</th>
                          <th className="py-3 px-4">NIM</th>
                          <th className="py-3 px-4">Kelas</th>
                          <th className="py-3 px-4">Kelompok Belajar</th>
                          {isDosenOrAdmin && <th className="py-3 px-4 text-right">Aksi Kelompok</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                  {s.avatar || s.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{s.name}</span>
                                    {s.is_leader && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-black" title="Ketua Kelompok">
                                        <Crown className="w-2.5 h-2.5 text-amber-600" />
                                        Ketua
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400">{s.email || '-'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-slate-700">
                              {s.student_id || '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                {s.class_name || 'BIO'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {s.group_name ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/80 text-xs font-bold">
                                  <Layers className="w-3 h-3 text-teal-600" />
                                  {s.group_name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium italic">
                                  Belum ada kelompok
                                </span>
                              )}
                            </td>
                            {isDosenOrAdmin && (
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1">
                                  {groups.length > 0 && (
                                    <select
                                      value={s.group_id || ''}
                                      onChange={(e) => {
                                        const newGid = e.target.value;
                                        if (newGid) {
                                          handleQuickAddMember(newGid, s.id);
                                        } else if (s.group_id) {
                                          const grp = groups.find((g) => g.id === s.group_id);
                                          if (grp) handleRemoveMember(grp, s.id);
                                        }
                                      }}
                                      className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                      <option value="">-- Pindah Kelompok --</option>
                                      {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                          {g.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: MANAJEMEN KELOMPOK BELAJAR */
            <div className="space-y-6">
              {/* Header Actions for Groups */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Manajemen Kelompok Belajar Mata Kuliah
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bagi mahasiswa menjadi kelompok kerja untuk tugas terstruktur, riset hayati, dan proyek kolaboratif.
                  </p>
                </div>

                {isDosenOrAdmin && (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowAutoModal(true)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bagi Otomatis</span>
                    </button>

                    <button
                      onClick={handleOpenCreateGroup}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Kelompok</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Ungrouped Students Alert Banner */}
              {ungroupedStudents.length > 0 && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                        {ungroupedStudents.length} Mahasiswa Belum Masuk Kelompok
                      </h4>
                      <p className="text-xs text-amber-700/90 mt-0.5">
                        Ada mahasiswa terdaftar yang belum dimasukkan ke kelompok belajar manapun.
                      </p>
                    </div>
                  </div>

                  {isDosenOrAdmin && groups.length > 0 && (
                    <button
                      onClick={() => setShowAutoModal(true)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Bagi Sisanya Otomatis
                    </button>
                  )}
                </div>
              )}

              {/* Groups Grid */}
              {groups.length === 0 ? (
                <div className="py-16 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3 p-6">
                  <Layers className="w-12 h-12 text-slate-300 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-800">Belum Ada Kelompok Belajar</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Buat kelompok secara manual atau gunakan fitur pembagian kelompok otomatis untuk membagi seluruh {students.length} mahasiswa terdaftar.
                    </p>
                  </div>
                  {isDosenOrAdmin && (
                    <div className="flex justify-center gap-2 pt-2">
                      <button
                        onClick={() => setShowAutoModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Bagi Kelompok Otomatis</span>
                      </button>
                      <button
                        onClick={handleOpenCreateGroup}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Kelompok Baru</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.map((group) => {
                    const memberUsers = students.filter((s) => group.member_ids.includes(s.id));
                    const isQuickAddOpen = quickAddGroupId === group.id;

                    return (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                      >
                        {/* Group Header Strip */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-slate-900 text-base">
                                {group.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                                {group.member_ids.length} Anggota
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-xs text-slate-500 line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>

                          {isDosenOrAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditGroup(group)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Kelompok"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group)}
                                className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Kelompok"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Members List */}
                        <div className="p-4 sm:p-5 space-y-2 flex-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Daftar Anggota</span>
                            {group.leader_id && (
                              <span className="text-amber-700 flex items-center gap-1">
                                <Crown className="w-3 h-3 text-amber-500" />
                                Ketua Terpilih
                              </span>
                            )}
                          </div>

                          {memberUsers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-4 text-center">
                              Belum ada mahasiswa dalam kelompok ini.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {memberUsers.map((m) => {
                                const isLeader = group.leader_id === m.id;
                                return (
                                  <div
                                    key={m.id}
                                    className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                                      isLeader
                                        ? 'bg-amber-50/60 border-amber-200'
                                        : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100/70'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${
                                          isLeader ? 'bg-amber-600' : 'bg-emerald-700'
                                        }`}
                                      >
                                        {m.avatar || m.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="truncate">
                                        <div className="font-bold text-slate-900 truncate flex items-center gap-1">
                                          <span>{m.name}</span>
                                          {isLeader && (
                                            <Crown className="w-3 h-3 text-amber-600 shrink-0" title="Ketua Kelompok" />
                                          )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                          <span>{m.student_id || '-'}</span>
                                          <span>•</span>
                                          <span>Kelas {m.class_name}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {isDosenOrAdmin && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        {!isLeader && (
                                          <button
                                            onClick={() => handleSetLeader(group, m.id)}
                                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/50 rounded transition-colors cursor-pointer"
                                            title="Tunjuk sebagai Ketua Kelompok"
                                          >
                                            <Crown className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleRemoveMember(group, m.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 rounded transition-colors cursor-pointer"
                                          title="Keluarkan dari kelompok"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Quick Add Member to this Group */}
                        {isDosenOrAdmin && (
                          <div className="p-3 bg-slate-50/70 border-t border-slate-100">
                            {isQuickAddOpen ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <select
                                    value={selectedStudentForGroup}
                                    onChange={(e) => setSelectedStudentForGroup(e.target.value)}
                                    className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  >
                                    <option value="">-- Pilih Mahasiswa Masuk --</option>
                                    {students
                                      .filter((s) => !group.member_ids.includes(s.id))
                                      .map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.name} ({s.student_id}) {s.group_name ? `[dari ${s.group_name}]` : '[Belum ada kelompok]'}
                                        </option>
                                      ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      if (selectedStudentForGroup) {
                                        handleQuickAddMember(group.id, selectedStudentForGroup);
                                      }
                                    }}
                                    disabled={!selectedStudentForGroup}
                                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Tambah
                                  </button>
                                  <button
                                    onClick={() => {
                                      setQuickAddGroupId(null);
                                      setSelectedStudentForGroup('');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setQuickAddGroupId(group.id);
                                  setSelectedStudentForGroup('');
                                }}
                                className="w-full py-1.5 px-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100/60 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Tambah Anggota ke Kelompok Ini</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Mata Kuliah: <strong>{course.name}</strong> ({course.code})</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Tambah/Edit Kelompok Manual */}
      {showGroupModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                <span>{editingGroup ? 'Edit Kelompok' : 'Buat Kelompok Baru'}</span>
              </h3>
              <button
                onClick={() => setShowGroupModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nama Kelompok *</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Contoh: Kelompok 1 - Genetika Populasi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Topik / Deskripsi Tugas (Opsional)</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Topik riset atau pembagian tugas kelompok..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Members Selection Checklist */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Pilih Anggota Mahasiswa ({groupForm.member_ids.length} Dipilih)</label>
                  <span className="text-[11px] text-slate-400">Total {students.length} Mahasiswa Terdaftar</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50 divide-y divide-slate-100">
                  {students.map((s) => {
                    const isChecked = groupForm.member_ids.includes(s.id);
                    const isOtherGroup = s.group_id && (!editingGroup || s.group_id !== editingGroup.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-white transition-colors ${
                          isChecked ? 'bg-emerald-50/80 font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setGroupForm((prev) => ({
                                  ...prev,
                                  member_ids: [...prev.member_ids, s.id],
                                  leader_id: prev.leader_id || s.id,
                                }));
                              } else {
                                setGroupForm((prev) => ({
                                  ...prev,
                                  member_ids: prev.member_ids.filter((id) => id !== s.id),
                                  leader_id: prev.leader_id === s.id ? '' : prev.leader_id,
                                }));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span className="text-slate-800 text-xs">{s.name} ({s.student_id || '-'})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                            {s.class_name}
                          </span>
                          {isOtherGroup && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800" title="Akan dipindahkan ke kelompok ini">
                              {s.group_name}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Leader Selection */}
              {groupForm.member_ids.length > 0 && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ketua Kelompok</label>
                  <select
                    value={groupForm.leader_id}
                    onChange={(e) => setGroupForm({ ...groupForm, leader_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                  >
                    <option value="">-- Pilih Salah Satu Anggota Sebagai Ketua --</option>
                    {students
                      .filter((s) => groupForm.member_ids.includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.student_id})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {groupSubmitting ? 'Menyimpan...' : editingGroup ? 'Simpan Perubahan' : 'Buat Kelompok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Auto Generate Groups */}
      {showAutoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-600" />
                <span>Bagi Kelompok Otomatis</span>
              </h3>
              <button
                onClick={() => setShowAutoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sistem akan membagi seluruh <strong>{students.length} mahasiswa terdaftar</strong> pada mata kuliah ini secara merata.
            </p>

            <form onSubmit={handleAutoGenerateSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Jumlah Kelompok yang Diinginkan *</label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(students.length, 1)}
                  required
                  value={autoForm.group_count}
                  onChange={(e) => setAutoForm({ ...autoForm, group_count: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[11px] text-slate-400">
                  Estimasi: ~{Math.ceil(students.length / (autoForm.group_count || 1))} mahasiswa per kelompok.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Awalan Nama Kelompok</label>
                <input
                  type="text"
                  value={autoForm.prefix}
                  onChange={(e) => setAutoForm({ ...autoForm, prefix: e.target.value })}
                  placeholder="Kelompok"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoForm.randomize}
                    onChange={(e) => setAutoForm({ ...autoForm, randomize: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-700 text-xs">Acak susunan anggota kelompok (Randomize)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoForm.reset_existing}
                    onChange={(e) => setAutoForm({ ...autoForm, reset_existing: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-slate-700 text-xs">Ganti / reset kelompok yang sudah ada di MK ini</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAutoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={autoSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {autoSubmitting ? 'Membagi Kelompok...' : 'Bagi Kelompok Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
