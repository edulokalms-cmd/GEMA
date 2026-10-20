import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';
import { ProgressBar } from '../common/ProgressBar';
import { LevelBadge } from '../common/LevelBadge';
import { StudentDetailModal } from './StudentDetailModal';
import {
  Users,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Award,
  Zap,
  Activity,
  ArrowRight,
  Eye,
  Radio,
  CalendarCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  Layers,
  Filter,
} from 'lucide-react';

interface DosenDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const DosenDashboard: React.FC<DosenDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [studentsOverview, setStudentsOverview] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, stOverview] = await Promise.all([
        api.dosen.getDashboard(),
        api.progress.getStudentsOverview(),
      ]);
      setStats(dash);
      setStudentsOverview(stOverview);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const availableClasses = Array.from(
    new Set(studentsOverview.map((item) => item.user.class_name).filter(Boolean))
  ).sort();

  const filteredOverview = studentsOverview.filter((item) => {
    return selectedClass === 'all' || item.user.class_name === selectedClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Dosen Pengampu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring aktivitas belajar, efektivitas materi, dan capaian gamifikasi mahasiswa.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Monitoring Aktif</span>
        </div>
      </div>

      {/* Quick Action Cards: Multi-Course, Forum, and Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div
          onClick={() => onNavigateTab('courses')}
          className="p-3.5 bg-white rounded-2xl border border-emerald-200 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
              <Layers className="w-4 h-4 text-[#012E26]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#012E26]">Mata Kuliah</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Kelola Kurikulum</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#012E26] group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('discussions')}
          className="p-3.5 bg-white rounded-2xl border border-purple-200 hover:border-purple-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
              <MessageSquare className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-800">Forum Diskusi</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Tanya Jawab Kelas</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('presensi')}
          className="p-3.5 bg-white rounded-2xl border border-teal-200 hover:border-teal-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
              <CalendarCheck className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-800">Presensi</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Input 16 Pertemuan</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('tugas')}
          className="p-3.5 bg-white rounded-2xl border border-blue-200 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
              <FileText className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-800">Tugas</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Penilaian Mandiri</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          onClick={() => onNavigateTab('penilaian')}
          className="p-3.5 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
              <GraduationCap className="w-4 h-4 text-[#EAA736]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#012E26]">Buku Nilai</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Nilai Akhir Semester</p>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#012E26] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Mahasiswa"
          value={stats.totalStudents}
          subtitle="Terdaftar pada mata kuliah"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-200"
          onClick={() => onNavigateTab('students')}
        />

        <StatCard
          title="Materi Silabus"
          value={stats.totalMaterials}
          subtitle="Topik & pertemuan aktif"
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600 border-blue-200"
          onClick={() => onNavigateTab('materials')}
        />

        <StatCard
          title="Rata-rata Progres"
          value={`${stats.avgStudentProgress}%`}
          subtitle="Tingkat penyelesaian materi"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border-emerald-200"
        />

        <StatCard
          title="Rata-rata Nilai Kuis"
          value={`${stats.avgQuizScore}%`}
          subtitle="Evaluasi pemahaman konsep"
          icon={<HelpCircle className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border-amber-200"
          onClick={() => onNavigateTab('quizzes')}
        />
      </div>

      {/* Students Summary Table (Requested in prompt) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Progres dan Capaian Belajar Mahasiswa
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar rekapitulasi poin, level, dan hasil mini kuis tiap mahasiswa.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] font-bold text-slate-600">Kelas:</span>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-transparent text-xs font-bold text-indigo-900 focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">Semua Kelas ({studentsOverview.length})</option>
                    {availableClasses.map((cls) => {
                      const count = studentsOverview.filter((s) => s.user.class_name === cls).length;
                      return (
                        <option key={cls} value={cls}>
                          Kelas {cls} ({count} mhs)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  onClick={() => onNavigateTab('student_progress')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer ml-2"
                >
                  <span>Semua Progres</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                    <th className="py-3 px-4 rounded-l-xl">Nama Mahasiswa</th>
                    <th className="py-3 px-4">Progres Materi</th>
                    <th className="py-3 px-4 text-center">Total Poin</th>
                    <th className="py-3 px-4 text-center">Level</th>
                    <th className="py-3 px-4 text-center">Rata-rata Kuis</th>
                    <th className="py-3 px-4 text-center">Badge</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOverview.map((item) => (
                    <tr key={item.user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.user.name}</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold text-[10px]">
                            {item.user.class_name || 'BIO-2A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          NIM: {item.user.student_id || '-'} • {item.user.department || '-'}
                        </div>
                      </td>
                  <td className="py-3.5 px-4 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar
                          progress={item.progress_percent}
                          size="sm"
                          showPercent={false}
                          colorClass="bg-gradient-to-r from-indigo-500 to-emerald-500"
                        />
                      </div>
                      <span className="font-bold text-slate-700">{item.progress_percent}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {item.completed_materials_count} dari {item.total_materials_count} selesai
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-amber-700">
                    <span className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                      {item.total_points} Pts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <LevelBadge levelTitle={item.level} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {item.average_quiz_score}%
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-purple-700">
                    <span className="bg-purple-50 px-2 py-0.5 rounded-md">
                      {item.badges_count} Badge
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedStudentId(item.user.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-500 animate-pulse" />
            Aktivitas Terkini Perkuliahan
          </h3>
          <span className="text-xs text-slate-400">Live SSE Feed</span>
        </div>

        <div className="space-y-2.5">
          {stats.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((act: any) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800">{act.user_name}</span>
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        act.user_role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : act.user_role === 'dosen'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {act.user_role === 'admin'
                        ? 'Admin'
                        : act.user_role === 'dosen'
                        ? 'Dosen'
                        : 'Mahasiswa'}
                    </span>
                  </div>
                  <span className="text-slate-600 mt-0.5 block">{act.detail}</span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(act.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">Belum ada aktivitas tercatat.</p>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
};
