import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { StudentStats, Material } from '../../types';
import { LevelBadge } from '../common/LevelBadge';
import { ProgressBar } from '../common/ProgressBar';
import { StatCard } from '../common/StatCard';
import {
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  CalendarCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  Layers,
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigateToMaterial: (materialId?: string) => void;
  onNavigateToQuiz: (quizId?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigateToMaterial,
  onNavigateToQuiz,
  onNavigateTab,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, matsData] = await Promise.all([
        api.progress.getMy(),
        api.materials.getAll(),
      ]);
      setStats(statsData);
      setMaterials(matsData);
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
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const uncompletedMaterials = materials.filter(
    (m: any) => m.status !== 'completed'
  );
  const nextTargetMaterial = stats.next_material || uncompletedMaterials[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card with Universitas Hamzanwadi identity */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#012E26] via-[#02473B] to-[#012E26] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#012E26]/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur-xs px-2.5 py-1 rounded-full text-amber-300 border border-white/20">
              Universitas Hamzanwadi • Gamifikasi E-Learning
            </span>
            <LevelBadge levelTitle={stats.level.title} levelNumber={stats.level.level} size="sm" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat datang, {user?.name}!
          </h2>
          <p className="mt-2 text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            Platform e-learning interaktif berbasis kurikulum yang berlaku. Selesaikan penugasan, pantau presensi kehadiran, tingkatkan keaktifan belajar dan partisipasi, serta raih capaian yang optimal.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {nextTargetMaterial ? (
              <button
                onClick={() => onNavigateToMaterial(nextTargetMaterial.id)}
                className="px-5 py-2.5 bg-[#EAA736] hover:bg-[#d49420] text-[#012E26] font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Lanjutkan Belajar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-500/30 text-emerald-100 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-emerald-400/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Semua modul materi pembelajaran telah selesai dipelajari.</span>
              </div>
            )}

            <button
              onClick={() => onNavigateTab('discussions')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <MessageSquare className="w-4 h-4 text-purple-300" />
              <span>Forum Diskusi</span>
            </button>

            <button
              onClick={() => onNavigateTab('courses')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <Layers className="w-4 h-4 text-emerald-300" />
              <span>Mata Kuliah</span>
            </button>

            <button
              onClick={() => onNavigateTab('quizzes')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer border border-white/20"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Mini Kuis</span>
            </button>

            <button
              onClick={() => onNavigateTab('penilaian')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-amber-300 font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer border border-amber-300/30"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Transkrip Nilai</span>
            </button>
          </div>
        </div>
      </div>

      {/* Komponen Penilaian Semester Berjalan Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#EAA736]">
              Bobot Evaluasi Perkuliahan
            </span>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
              <GraduationCap className="w-5 h-5 text-[#012E26]" />
              Komponen Penilaian Semester Berjalan
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('penilaian')}
            className="text-xs font-bold text-[#012E26] hover:text-[#02473B] flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Buku Nilai & Transkrip Saya</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div
            onClick={() => onNavigateTab('presensi')}
            className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <CalendarCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-emerald-800">Kehadiran</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Presensi 16 Pertemuan</p>
          </div>

          <div
            onClick={() => onNavigateTab('progress')}
            className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-amber-800">Partisipasi</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Ketuntasan & Keaktifan</p>
          </div>

          <div
            onClick={() => onNavigateTab('tugas')}
            className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-blue-800">Tugas</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Penugasan Terstruktur</p>
          </div>

          <div
            onClick={() => onNavigateTab('penilaian')}
            className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 hover:border-purple-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <Award className="w-5 h-5 text-purple-700" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-purple-800">UTS</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Ujian Tengah Semester</p>
          </div>

          <div
            onClick={() => onNavigateTab('penilaian')}
            className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <GraduationCap className="w-5 h-5 text-rose-700" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mt-2.5 group-hover:text-rose-800">UAS</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Ujian Akhir Semester</p>
          </div>
        </div>
      </div>

      {/* Progress Belajar Highlight Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#012E26]" />
              Progress Belajar & Partisipasi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.completed_materials} dari {stats.total_materials} materi selesai dipelajari
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-[#012E26]">{stats.materials_progress_percent}%</span>
            <button
              onClick={() => onNavigateTab('progress')}
              className="text-xs font-semibold text-slate-500 hover:text-[#012E26] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Detail Progres</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <ProgressBar
          progress={stats.materials_progress_percent}
          size="lg"
          showPercent={false}
          colorClass="bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500"
        />

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 block">Selesai</span>
            <span className="text-lg font-bold text-emerald-600">{stats.completed_materials} Materi</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 block">Belum Selesai</span>
            <span className="text-lg font-bold text-amber-600">{stats.total_materials - stats.completed_materials} Materi</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 block">Kuis Dikerjakan</span>
            <span className="text-lg font-bold text-indigo-600">{stats.total_quizzes_taken} Kali</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 block">Rata-rata Nilai</span>
            <span className="text-lg font-bold text-purple-600">{stats.average_quiz_score}%</span>
          </div>
        </div>
      </div>

      {/* Gamification Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Poin"
          value={stats.total_points}
          subtitle={`Level ${stats.level.level}: ${stats.level.title}`}
          icon={<Zap className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border-amber-200"
        />

        <StatCard
          title="Level Pencapaian"
          value={stats.level.title}
          subtitle={`${stats.level.progressPercent}% menuju level berikutnya`}
          icon={<Flame className="w-5 h-5" />}
          iconBgColor="bg-purple-50 text-purple-600 border-purple-200"
          onClick={() => onNavigateTab('progress')}
        />

        <StatCard
          title="Badge Diraih"
          value={`${stats.earned_badges_count} Lencana`}
          subtitle="Pencapaian belajar istimewa"
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-200"
          onClick={() => onNavigateTab('badges')}
        />

        <StatCard
          title="Materi Kuliah"
          value={`${stats.completed_materials}/${stats.total_materials}`}
          subtitle={`${stats.materials_progress_percent}% silabus selesai`}
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border-emerald-200"
          onClick={() => onNavigateTab('materials')}
        />
      </div>

      {/* Two columns: Next Recommended Material & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Material / Course Focus */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Materi Selanjutnya
            </h3>
            <button
              onClick={() => onNavigateTab('materials')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Lihat Semua ({materials.length})
            </button>
          </div>

          {nextTargetMaterial ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80 hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-100/80">{nextTargetMaterial.category}</span>
                <span className="flex items-center gap-1 text-slate-500 font-normal">
                  <Clock className="w-3 h-3" />
                  {nextTargetMaterial.estimated_time}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 leading-snug">
                {nextTargetMaterial.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                {nextTargetMaterial.description}
              </p>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>+10 Poin Selesai</span>
                </div>
                <button
                  onClick={() => onNavigateToMaterial(nextTargetMaterial.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Buka Materi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm">Semua Materi Selesai!</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Luar biasa! Anda telah mempelajari seluruh pertemuan dalam silabus perkuliahan.
              </p>
            </div>
          )}
        </div>

        {/* Recent Points & Activities */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Riwayat Poin & Aktivitas
            </h3>
            <button
              onClick={() => onNavigateTab('progress')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              Semua
            </button>
          </div>

          <div className="space-y-3">
            {stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{act.source}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-extrabold text-indigo-600 shrink-0 bg-indigo-50 px-2 py-1 rounded-lg">
                    +{act.amount} Pts
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Belum ada aktivitas poin tercatat. Mulai belajar untuk meraih poin pertama Anda!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
