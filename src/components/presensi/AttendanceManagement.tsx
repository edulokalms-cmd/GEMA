import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Save,
  Users,
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const AttendanceManagement: React.FC = () => {
  const { showToast } = useNotification();
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [selectedMeeting, setSelectedMeeting] = useState<number>(1);
  const [meetingTopic, setMeetingTopic] = useState<string>(
    'Pertemuan 1: Pengenalan Komputer & Ekosistem Perangkat Lunak'
  );
  const [meetingDate, setMeetingDate] = useState<string>('2026-01-12');
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'input' | 'summary'>('input');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const meetingTopics: Record<number, string> = {
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
    16: 'Pertemuan 16: Evaluasi Ujian Akhir Semester (UAS)',
  };

  const loadAttendance = async (meetingNum: number) => {
    try {
      setLoading(true);
      const [records, summs, allUsers] = await Promise.all([
        api.attendance.getAll(meetingNum),
        api.attendance.getSummary(),
        api.users.getAll('mahasiswa'),
      ]);

      const activeCourse = courses.find((c) => c.id === activeCourseId);
      let users = allUsers;

      // Filter students: ONLY those enrolled in active course
      if (activeCourse && activeCourseId !== 'all') {
        const enrolledClassSet = new Set(activeCourse.enrolled_classes || []);
        const enrolledStudentIdSet = new Set(activeCourse.enrolled_student_ids || []);
        users = allUsers.filter((u) => {
          const inClass = u.class_name && enrolledClassSet.has(u.class_name);
          const inStudent =
            enrolledStudentIdSet.has(u.id) || (u.student_id && enrolledStudentIdSet.has(u.student_id));
          return inClass || inStudent;
        });
      }

      const validUserIds = new Set(users.map((u) => u.id));
      setSummaries(summs.filter((s) => validUserIds.has(s.user_id)));
      setMeetingTopic(meetingTopics[meetingNum] || `Pertemuan ${meetingNum}`);

      // Map students to attendance records, ensuring class_name and all students are represented
      const existingMap = new Map(records.map((r) => [r.user_id, r]));

      const combined: AttendanceRecord[] = users.map((u) => {
        const existing = existingMap.get(u.id);
        if (existing) {
          return {
            ...existing,
            student_name: u.name,
            student_id: u.student_id || '-',
            class_name: u.class_name || existing.class_name || 'BIO-2A',
          };
        }
        return {
          id: `temp_${meetingNum}_${u.id}`,
          meeting_number: meetingNum,
          meeting_topic: meetingTopics[meetingNum] || `Pertemuan ${meetingNum}`,
          date: records[0]?.date ? records[0].date.split('T')[0] : new Date().toISOString().split('T')[0],
          user_id: u.id,
          student_name: u.name,
          student_id: u.student_id || '-',
          class_name: u.class_name || 'BIO-2A',
          status: 'hadir' as AttendanceStatus,
          notes: '',
          updated_at: new Date().toISOString(),
        };
      });

      if (records.length > 0 && records[0].meeting_topic) {
        setMeetingTopic(records[0].meeting_topic);
      }
      if (records.length > 0 && records[0].date) {
        setMeetingDate(records[0].date.split('T')[0]);
      }

      setAttendanceList(combined);
    } catch (err: any) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Presensi',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(selectedMeeting);
  }, [selectedMeeting, activeCourseId]);

  const handleStatusChange = (userId: string, newStatus: AttendanceStatus) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.user_id === userId ? { ...item, status: newStatus } : item))
    );
  };

  const handleNotesChange = (userId: string, notes: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.user_id === userId ? { ...item, notes } : item))
    );
  };

  const activeCourse = courses.find((c) => c.id === activeCourseId);

  // Extract all available classes dynamically for this course
  const availableClasses = activeCourse && Array.isArray(activeCourse.enrolled_classes) && activeCourse.enrolled_classes.length > 0
    ? activeCourse.enrolled_classes
    : Array.from(
        new Set([
          ...attendanceList.map((a) => a.class_name).filter(Boolean),
          ...summaries.map((s) => s.class_name).filter(Boolean),
        ]) as Set<string>
      ).sort();

  // Filtered attendance list based on search and selectedClass
  const filteredAttendance = attendanceList.filter((a) => {
    const matchesSearch =
      (a.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.student_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'all' || a.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleSetAllHadir = () => {
    const targetUserIds = new Set(filteredAttendance.map((a) => a.user_id));
    setAttendanceList((prev) =>
      prev.map((item) =>
        targetUserIds.has(item.user_id)
          ? { ...item, status: 'hadir', notes: 'Hadir tepat waktu' }
          : item
      )
    );
    showToast({
      type: 'info',
      title: 'Status Diperbarui',
      message:
        selectedClass === 'all'
          ? 'Seluruh mahasiswa disetel ke status "Hadir".'
          : `Mahasiswa kelas ${selectedClass} (${targetUserIds.size} orang) disetel ke status "Hadir".`,
    });
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      // Save the currently filtered list or entire list
      const recordsToSave = selectedClass === 'all' ? attendanceList : filteredAttendance;
      await api.attendance.saveBatch({
        meeting_number: selectedMeeting,
        meeting_topic: meetingTopic,
        date: meetingDate,
        records: recordsToSave.map((a) => ({
          user_id: a.user_id,
          status: a.status,
          notes: a.notes,
        })),
      });

      showToast({
        type: 'success',
        title: 'Presensi Disimpan',
        message:
          selectedClass === 'all'
            ? `Presensi Pertemuan ${selectedMeeting} (${recordsToSave.length} mahasiswa) berhasil disimpan.`
            : `Presensi Pertemuan ${selectedMeeting} untuk Kelas ${selectedClass} (${recordsToSave.length} mahasiswa) berhasil disimpan.`,
      });

      // Reload summary
      const summs = await api.attendance.getSummary();
      setSummaries(summs);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Presensi',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportSummaryExcel = () => {
    try {
      const dataToExport = selectedClass === 'all' ? summaries : filteredSummaries;
      const headers = [
        'NIM',
        'Nama Mahasiswa',
        'Kelas',
        'Total Pertemuan',
        'Hadir',
        'Izin',
        'Sakit',
        'Alpa',
        'Persentase Kehadiran',
        'Nilai Kehadiran',
      ];
      const rows = dataToExport.map((s) => [
        s.student_id,
        s.student_name,
        s.class_name,
        s.total_meetings,
        s.hadir_count,
        s.izin_count,
        s.sakit_count,
        s.alpa_count,
        `${s.attendance_percent}%`,
        Math.round(s.attendance_percent * 0.15 * 10) / 10,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 14 },
        { wch: 25 },
        { wch: 12 },
        { wch: 16 },
        { wch: 8 },
        { wch: 8 },
        { wch: 8 },
        { wch: 8 },
        { wch: 20 },
        { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      const sheetName = selectedClass === 'all' ? 'Rekap Presensi' : `Kelas ${selectedClass.slice(0, 20)}`;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const filename = `Rekap_Presensi_${selectedClass === 'all' ? 'Semua_Kelas' : selectedClass}_P1-P16.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast({
        type: 'success',
        title: 'Rekap Diunduh',
        message: `File Excel rekap presensi (${dataToExport.length} mahasiswa) berhasil diunduh.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunduh Rekap',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const filteredSummaries = summaries.filter((s) => {
    const matchesSearch =
      (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.student_id || '').toLowerCase().includes(search.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  const hadirCount = filteredAttendance.filter((a) => a.status === 'hadir').length;
  const izinCount = filteredAttendance.filter((a) => a.status === 'izin').length;
  const sakitCount = filteredAttendance.filter((a) => a.status === 'sakit').length;
  const alpaCount = filteredAttendance.filter((a) => a.status === 'alpa').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#012E26] text-xs font-bold border border-emerald-200/80 mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Komponen Penilaian Kehadiran Mahasiswa</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Presensi Perkuliahan Mahasiswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola kehadiran mahasiswa per pertemuan semester berjalan dan pantau rekapitulasi kehadiran kelas.
          </p>
        </div>

        {/* View switcher & Export & Course */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
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

          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab('input')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'input'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Input Presensi
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rekap Semester
            </button>
          </div>

          <button
            onClick={handleExportSummaryExcel}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {activeCourse && activeCourseId !== 'all' && (
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                Presensi Ruang Perkuliahan: {activeCourse.name} ({activeCourse.code})
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
              {attendanceList.length} Mahasiswa Terdaftar
            </span>
          </div>
        </div>
      )}

      {activeTab === 'input' ? (
        <>
          {/* Meeting Selector Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedMeeting <= 1}
                  onClick={() => setSelectedMeeting((prev) => Math.max(1, prev - 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Pilih Pertemuan:</span>
                  <select
                    value={selectedMeeting}
                    onChange={(e) => setSelectedMeeting(Number(e.target.value))}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#012E26] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26] cursor-pointer"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Pertemuan #{m} {m === 8 ? '(UTS)' : m === 16 ? '(UAS)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={selectedMeeting >= 16}
                  onClick={() => setSelectedMeeting((prev) => Math.min(16, prev + 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-600">Tanggal:</span>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSetAllHadir}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Set Semua Hadir
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Presensi'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Topik / Materi Perkuliahan
              </label>
              <input
                type="text"
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                placeholder="Tuliskan topik bahasan pertemuan..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
              />
            </div>

            {/* Quick Metrics per Meeting */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800">Hadir</span>
                  <p className="text-lg font-black text-emerald-900">{hadirCount}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800">Izin</span>
                  <p className="text-lg font-black text-blue-900">{izinCount}</p>
                </div>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>

              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800">Sakit</span>
                  <p className="text-lg font-black text-amber-900">{sakitCount}</p>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>

              <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-800">Alpa</span>
                  <p className="text-lg font-black text-rose-900">{alpaCount}</p>
                </div>
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </div>

          {/* Student List Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa berdasarkan nama atau NIM..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-600">Filter Kelas:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#012E26] focus:outline-hidden cursor-pointer py-0.5"
                  >
                    <option value="all">Semua Kelas ({attendanceList.length})</option>
                    {availableClasses.map((cls) => {
                      const count = attendanceList.filter((a) => a.class_name === cls).length;
                      return (
                        <option key={cls} value={cls}>
                          Kelas {cls} ({count} mhs)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <span className="text-xs font-bold text-slate-500">
                  Total: <strong className="text-slate-900">{filteredAttendance.length} Mahasiswa</strong>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Mahasiswa</th>
                    <th className="py-3 px-4">NIM</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4 text-center">Status Kehadiran</th>
                    <th className="py-3 px-4">Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((item, idx) => (
                    <tr key={item.user_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.student_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 font-medium">
                        {item.student_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#012E26] border border-emerald-200/80 font-bold text-[10px]">
                          {item.class_name || 'BIO-2A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(['hadir', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((st) => {
                            const isSelected = item.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(item.user_id, st)}
                                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] uppercase transition-all cursor-pointer ${
                                  isSelected
                                    ? st === 'hadir'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'izin'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : st === 'sakit'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleNotesChange(item.user_id, e.target.value)}
                          placeholder="Keterangan..."
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Summary Matrix View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rekapitulasi Kehadiran Mahasiswa (Semester Berjalan)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai kehadiran terakumulasi otomatis ke dalam rekapitulasi penilaian perkuliahan.
              </p>
            </div>

            <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Menampilkan {filteredSummaries.length} dari {summaries.length} Mahasiswa
            </div>
          </div>

          {/* Filter Bar for Summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari mahasiswa atau NIM..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Filter Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#012E26] focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kelas ({summaries.length})</option>
                {availableClasses.map((cls) => {
                  const count = summaries.filter((s) => s.class_name === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({count} mhs)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Nama Mahasiswa</th>
                  <th className="py-3 px-4">NIM</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-3 text-center">Hadir</th>
                  <th className="py-3 px-3 text-center">Izin</th>
                  <th className="py-3 px-3 text-center">Sakit</th>
                  <th className="py-3 px-3 text-center">Alpa</th>
                  <th className="py-3 px-4 text-center">% Kehadiran</th>
                  <th className="py-3 px-4 text-right">Nilai Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((s, idx) => {
                  const contribution = Math.round((s.attendance_percent * 0.15) * 10) / 10;
                  return (
                    <tr key={s.user_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.student_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.student_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#012E26] border border-emerald-200/80 font-bold text-[10px]">
                          {s.class_name}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">{s.hadir_count}</td>
                      <td className="py-3 px-3 text-center text-blue-700">{s.izin_count}</td>
                      <td className="py-3 px-3 text-center text-amber-700">{s.sakit_count}</td>
                      <td className="py-3 px-3 text-center text-rose-700">{s.alpa_count}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          s.attendance_percent >= 85
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.attendance_percent >= 75
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {s.attendance_percent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-[#012E26]">
                        {contribution} / 15
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
