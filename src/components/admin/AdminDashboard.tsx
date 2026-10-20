import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatCard } from '../common/StatCard';
import {
  Users,
  GraduationCap,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Activity,
  ArrowRight,
  Settings,
  Plus,
  CalendarCheck,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Layers,
  School,
  Building2,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Administrator Sistem
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat kendali akun pengguna, materi silabus, evaluasi kuis, dan audit log GEMA BIO.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200/80 px-3 py-1.5 rounded-2xl text-xs font-bold text-rose-800 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-rose-600" />
          <span>Sistem Berjalan Normal (Aktif)</span>
        </div>
      </div>

      {/* Top 5 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Akun"
          value={data.totalUsers}
          subtitle="Seluruh pengguna"
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-slate-100 text-slate-700 border-slate-200"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Mahasiswa"
          value={data.totalStudents}
          subtitle="Peserta perkuliahan"
          icon={<GraduationCap className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-200"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Dosen"
          value={data.totalLecturers}
          subtitle="Dosen pengampu"
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border-emerald-200"
          onClick={() => onNavigateTab('users')}
        />

        <StatCard
          title="Materi Silabus"
          value={data.totalMaterials}
          subtitle="Modul pembelajaran"
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600 border-blue-200"
          onClick={() => onNavigateTab('materials')}
        />

        <StatCard
          title="Mini Kuis"
          value={data.totalQuizzes}
          subtitle="Kuis evaluasi"
          icon={<HelpCircle className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border-amber-200"
          onClick={() => onNavigateTab('quizzes')}
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('departments')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <School className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                Kelola Program Studi
              </h4>
              <p className="text-xs text-slate-500">Master prodi, fakultas, kaprodi</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('classes')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Kelola Kelas Perkuliahan
              </h4>
              <p className="text-xs text-slate-500">Rombel, kuota & dosen wali</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('courses')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#012E26] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-[#012E26]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#012E26] transition-colors">
                Manajemen Mata Kuliah
              </h4>
              <p className="text-xs text-slate-500">Kelola multi-kurikulum</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#012E26] transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('discussions')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Forum Diskusi
              </h4>
              <p className="text-xs text-slate-500">Moderasi tanya jawab</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('presensi')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5 text-[#012E26]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#012E26] transition-colors">
                Presensi Kuliah
              </h4>
              <p className="text-xs text-slate-500">Rekap 16 pertemuan</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#012E26] transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('tugas')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                Tugas Kuliah
              </h4>
              <p className="text-xs text-slate-500">Penugasan & submission</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('penilaian')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#EAA736] flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#012E26] transition-colors">
                Buku Nilai
              </h4>
              <p className="text-xs text-slate-500">Rekap semester & export</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#012E26] transition-colors" />
        </div>

        <div
          onClick={() => onNavigateTab('settings')}
          className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#012E26] transition-colors">
                Ganti Logo & Sistem
              </h4>
              <p className="text-xs text-slate-500">Ubah icon/logo & bobot</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#012E26] transition-colors" />
        </div>
      </div>

      {/* System Activity Audit Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            Audit Log Aktivitas Sistem
          </h3>
          <span className="text-xs text-slate-400">10 Entri Terbaru</span>
        </div>

        <div className="divide-y divide-slate-100">
          {data.recentActivities && data.recentActivities.length > 0 ? (
            data.recentActivities.map((act: any) => (
              <div key={act.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{act.user_name}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md uppercase">
                      {act.user_role}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 truncate">{act.detail}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(act.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">Belum ada log tercatat.</p>
          )}
        </div>
      </div>
    </div>
  );
};
