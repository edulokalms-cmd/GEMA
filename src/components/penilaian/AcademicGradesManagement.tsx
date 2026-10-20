import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { StudentAcademicGrade, GradeComponentConfig } from '../../types';
import {
  GraduationCap,
  FileSpreadsheet,
  Edit2,
  Save,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  Layers,
  Settings,
  Percent,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AcademicGradesManagement: React.FC = () => {
  const { showToast } = useNotification();
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [grades, setGrades] = useState<StudentAcademicGrade[]>([]);
  const [components, setComponents] = useState<GradeComponentConfig[]>([
    { id: 'attendance', name: 'Kehadiran', weight: 15, source_type: 'attendance', is_default: true },
    { id: 'participation', name: 'Partisipasi', weight: 15, source_type: 'participation', is_default: true },
    { id: 'assignment', name: 'Tugas', weight: 20, source_type: 'assignment', is_default: true },
    { id: 'uts', name: 'UTS', weight: 25, source_type: 'uts', is_default: true },
    { id: 'uas', name: 'UAS', weight: 25, source_type: 'uas', is_default: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Edit modal state
  const [editingStudent, setEditingStudent] = useState<StudentAcademicGrade | null>(null);
  const [editForm, setEditForm] = useState<{
    component_scores: Record<string, number>;
    notes: string;
  }>({
    component_scores: {},
    notes: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const [gradesData, compData] = await Promise.all([
        api.grades.getAcademicSummary(),
        api.grades.getComponents().catch(() => []),
      ]);
      setGrades(gradesData);
      if (Array.isArray(compData) && compData.length > 0) {
        setComponents(compData);
      } else if (gradesData.length > 0 && gradesData[0].components_detail) {
        setComponents(
          gradesData[0].components_detail.map((c) => ({
            id: c.id,
            name: c.name,
            weight: c.weight,
            source_type: c.source_type,
            description: (c as any).description,
          }))
        );
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Nilai',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleOpenEdit = (student: StudentAcademicGrade) => {
    const initialScores: Record<string, number> = {};
    for (const comp of components) {
      if (student.custom_scores && student.custom_scores[comp.id] !== undefined) {
        initialScores[comp.id] = student.custom_scores[comp.id];
      } else {
        const found = student.components_detail?.find((c) => c.id === comp.id);
        if (found) {
          initialScores[comp.id] = found.raw_score;
        } else if (comp.id === 'uts') {
          initialScores[comp.id] = student.uts_score;
        } else if (comp.id === 'uas') {
          initialScores[comp.id] = student.uas_score;
        } else if (comp.id === 'assignment') {
          initialScores[comp.id] = student.assignment_score;
        } else if (comp.id === 'attendance') {
          initialScores[comp.id] = student.attendance_score;
        } else if (comp.id === 'participation') {
          initialScores[comp.id] = student.participation_score;
        } else {
          initialScores[comp.id] = 80;
        }
      }
    }

    setEditingStudent(student);
    setEditForm({
      component_scores: initialScores,
      notes: '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSavingEdit(true);
      const updated = await api.grades.updateGrade({
        user_id: editingStudent.user_id,
        component_scores: editForm.component_scores,
        uts_score: editForm.component_scores['uts'],
        uas_score: editForm.component_scores['uas'],
        assignment_score: editForm.component_scores['assignment'],
        notes: editForm.notes,
      });

      setGrades((prev) =>
        prev.map((g) => (g.user_id === editingStudent.user_id ? updated : g))
      );

      showToast({
        type: 'success',
        title: 'Nilai Diperbarui',
        message: `Nilai akademik ${editingStudent.student_name} berhasil disimpan dan dihitung ulang.`,
      });
      setEditingStudent(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Nilai',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const headers = [
        'NIM',
        'Nama Mahasiswa',
        'Kelas',
        ...components.map((c) => `${c.name} (${c.weight}%)`),
        'Nilai Akhir',
        'Huruf Mutu',
        'Status',
      ];

      const dataToExport = selectedClass === 'all' ? courseFilteredGrades : filteredGrades;
      const rows = dataToExport.map((g) => {
        const compCols = components.map((c) => {
          const detail = g.components_detail?.find((d) => d.id === c.id);
          const score =
            detail?.raw_score ??
            (g.custom_scores?.[c.id] ??
              (c.id === 'uts'
                ? g.uts_score
                : c.id === 'uas'
                ? g.uas_score
                : c.id === 'assignment'
                ? g.assignment_score
                : c.id === 'attendance'
                ? g.attendance_score
                : c.id === 'participation'
                ? g.participation_score
                : 80));
          const weighted = detail ? ` (w:${detail.weighted_score})` : '';
          return `${score}${weighted}`;
        });

        return [
          g.student_id,
          g.student_name,
          g.class_name,
          ...compCols,
          g.final_score,
          g.grade_letter,
          g.status,
        ];
      });

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const colWidths = [
        { wch: 14 },
        { wch: 25 },
        { wch: 12 },
        ...components.map(() => ({ wch: 18 })),
        { wch: 14 },
        { wch: 12 },
        { wch: 14 },
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      const sheetName =
        selectedClass === 'all' ? 'Buku Nilai' : `Kelas ${selectedClass.slice(0, 20)}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const filename = `Rekap_Nilai_${selectedClass === 'all' ? 'Semua_Kelas' : selectedClass}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast({
        type: 'success',
        title: 'Buku Nilai Diunduh',
        message: `File Excel rekap nilai (${dataToExport.length} mahasiswa, ${components.length} komponen) berhasil disimpan.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengekspor Nilai',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const enrolledClassSet = activeCourse && Array.isArray(activeCourse.enrolled_classes) ? new Set(activeCourse.enrolled_classes) : null;
  const enrolledStudentIdSet = activeCourse && Array.isArray(activeCourse.enrolled_student_ids) ? new Set(activeCourse.enrolled_student_ids) : null;

  // Filter grades to ONLY students enrolled in active course
  const courseFilteredGrades = grades.filter((g) => {
    if (!activeCourse || activeCourseId === 'all') return true;
    const inClass = g.class_name && enrolledClassSet?.has(g.class_name);
    const inStudent = enrolledStudentIdSet?.has(g.user_id) || (g.student_id && enrolledStudentIdSet?.has(g.student_id));
    return inClass || inStudent;
  });

  // Available classes dynamically extracted for active course
  const availableClasses = activeCourse && Array.isArray(activeCourse.enrolled_classes) && activeCourse.enrolled_classes.length > 0
    ? activeCourse.enrolled_classes
    : Array.from(new Set(grades.map((g) => g.class_name).filter(Boolean))).sort();

  const filteredGrades = courseFilteredGrades.filter((g) => {
    const matchSearch =
      g.student_name.toLowerCase().includes(search.toLowerCase()) ||
      g.student_id.toLowerCase().includes(search.toLowerCase());
    const matchClass = selectedClass === 'all' || g.class_name === selectedClass;
    return matchSearch && matchClass;
  });

  const targetForStats = selectedClass === 'all' ? courseFilteredGrades : filteredGrades;
  const avgFinalScore =
    targetForStats.length > 0
      ? Math.round((targetForStats.reduce((acc, c) => acc + c.final_score, 0) / targetForStats.length) * 10) / 10
      : 0;
  const passedCount = targetForStats.filter((g) => g.status === 'LULUS').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/80 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
            <span>Buku Nilai & Standar Evaluasi Akademik Semester Berjalan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Penilaian Akademik Mahasiswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Komposisi penilaian terakumulasi secara terintegrasi dari seluruh aktivitas perkuliahan.
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
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Buku Nilai (.xlsx)</span>
          </button>
        </div>
      </div>

      {activeCourse && activeCourseId !== 'all' && (
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                Buku Nilai Mata Kuliah: {activeCourse.name} ({activeCourse.code})
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                Dosen: <strong>{activeCourse.lecturer_name}</strong> • Kelas Terploting:{' '}
                <span className="font-bold text-emerald-800">
                  {Array.isArray(activeCourse.enrolled_classes) && activeCourse.enrolled_classes.length > 0
                    ? activeCourse.enrolled_classes.join(', ')
                    : 'Semua'}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-200/60">
              {courseFilteredGrades.length} Mahasiswa Terdaftar
            </span>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Rata-rata Nilai Akhir</span>
            <p className="text-2xl font-black text-[#012E26] mt-0.5">{avgFinalScore} / 100</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Tingkat Kelulusan</span>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">
              {grades.length > 0 ? Math.round((passedCount / grades.length) * 100) : 0}%
            </p>
            <span className="text-[11px] text-slate-400">
              {passedCount} dari {grades.length} mahasiswa lulus
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Standar Mutu Tertinggi</span>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {grades.filter((g) => g.grade_letter === 'A' || g.grade_letter === 'A-').length} Mahasiswa
            </p>
            <span className="text-[11px] text-slate-400">Meraih Predikat A / A-</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-600 hidden sm:inline">Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#012E26] focus:bg-white cursor-pointer"
          >
            <option value="all">Semua Kelas ({grades.length})</option>
            {availableClasses.map((cls) => {
              const count = grades.filter((g) => g.class_name === cls).length;
              return (
                <option key={cls} value={cls}>
                  Kelas {cls} ({count} mhs)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Daftar Nilai Mahasiswa:{' '}
            <strong className="text-slate-900">{filteredGrades.length} Mahasiswa</strong>
            {selectedClass !== 'all' && (
              <span className="ml-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#012E26] text-[11px] font-bold border border-emerald-200/80">
                Kelas {selectedClass}
              </span>
            )}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5">Mahasiswa</th>
                <th className="py-3 px-3.5">NIM</th>
                <th className="py-3 px-3.5">Kelas</th>
                {components.map((c) => (
                  <th key={c.id} className="py-3 px-3 text-center">
                    <span>{c.name}</span>
                    <span className="block text-[9px] font-normal text-slate-400">
                      ({c.weight}%)
                    </span>
                  </th>
                ))}
                <th className="py-3 px-3.5 text-center font-black">Nilai Akhir</th>
                <th className="py-3 px-3.5 text-center">Mutu</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGrades.map((g, idx) => (
                <tr key={g.user_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3.5 font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-3.5 px-3.5 font-bold text-slate-900">{g.student_name}</td>
                  <td className="py-3.5 px-3.5 font-mono text-slate-600">{g.student_id}</td>
                  <td className="py-3.5 px-3.5 font-semibold text-slate-600">{g.class_name}</td>
                  {components.map((c) => {
                    const detail = g.components_detail?.find((d) => d.id === c.id);
                    const score =
                      detail?.raw_score ??
                      (g.custom_scores?.[c.id] ??
                        (c.id === 'uts'
                          ? g.uts_score
                          : c.id === 'uas'
                          ? g.uas_score
                          : c.id === 'assignment'
                          ? g.assignment_score
                          : c.id === 'attendance'
                          ? g.attendance_score
                          : c.id === 'participation'
                          ? g.participation_score
                          : 80));
                    return (
                      <td
                        key={c.id}
                        className="py-3.5 px-3 text-center font-semibold text-slate-800"
                      >
                        <span>{score}</span>
                        {detail && (
                          <span className="block text-[10px] text-emerald-700 font-bold">
                            +{detail.weighted_score}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3.5 px-3.5 text-center font-black text-sm text-[#012E26]">
                    {g.final_score}
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                        g.grade_letter === 'A' || g.grade_letter === 'A-'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : g.grade_letter.startsWith('B')
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : g.grade_letter.startsWith('C')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {g.grade_letter}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Ubah Nilai Komponen Mahasiswa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Nilai */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ubah Nilai: {editingStudent.student_name}
                </h3>
                <p className="text-xs text-slate-500">NIM: {editingStudent.student_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 max-h-[340px] overflow-y-auto p-1">
                {components.map((comp) => {
                  const currentScore = editForm.component_scores[comp.id] ?? 80;
                  return (
                    <div
                      key={comp.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <label
                          className="block text-xs font-bold text-slate-800 truncate"
                          title={comp.name}
                        >
                          {comp.name}
                        </label>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                          {comp.weight}%
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentScore}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            component_scores: {
                              ...editForm.component_scores,
                              [comp.id]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 text-center focus:outline-emerald-600"
                        required
                      />
                      <span
                        className="text-[10px] text-slate-400 block truncate"
                        title={comp.description}
                      >
                        {comp.source_type === 'attendance'
                          ? 'Absensi Presensi'
                          : comp.source_type === 'participation'
                          ? 'Modul & Progres'
                          : comp.source_type === 'assignment'
                          ? 'Penugasan Mahasiswa'
                          : comp.source_type === 'quiz'
                          ? 'Mini Kuis'
                          : comp.source_type === 'uts'
                          ? 'Ujian Tengah Semester'
                          : comp.source_type === 'uas'
                          ? 'Ujian Akhir Semester'
                          : 'Praktikum / Kustom'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Evaluasi Akademik (Opsional)
                </label>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Catatan perbaikan atau catatan dosen..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{savingEdit ? 'Menyimpan...' : 'Simpan Nilai'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
