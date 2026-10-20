import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentStats } from '../../types';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { ProgressBar } from '../common/ProgressBar';
import { LevelBadge } from '../common/LevelBadge';
import { StatCard } from '../common/StatCard';
import {
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Flame,
  Layers,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';

interface MyProgressViewProps {
  onNavigateToBadges: () => void;
  onNavigateToMaterials: () => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = ({
  onNavigateToBadges,
  onNavigateToMaterials,
}) => {
  const { setActiveCourseId } = useCourse();
  const { showToast } = useNotification();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.progress.getMy();
      setStats(data);
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
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const uncompleted = stats.total_materials - stats.completed_materials;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Progress Belajar Saya
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pantau rekam jejak penyelesaian materi, perolehan skor kuis, dan akumulasi poin Anda.
        </p>
      </div>

      {/* Main Big Stats Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pencapaian Keseluruhan
            </span>
            <div className="flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {stats.materials_progress_percent}%
              </span>
              <LevelBadge
                levelTitle={stats.level.title}
                levelNumber={stats.level.level}
                size="md"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {stats.completed_materials} dari {stats.total_materials} materi silabus telah tuntas diselesaikan.
            </p>
          </div>

          {/* Level Next Threshold Bar */}
          <div className="lg:w-80 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-600">Poin ke Level Berikutnya</span>
              <span className="text-indigo-600">{stats.total_points} / {stats.level.nextThreshold} Pts</span>
            </div>
            <ProgressBar
              progress={stats.level.progressPercent}
              size="sm"
              showPercent={false}
              colorClass="bg-gradient-to-r from-indigo-500 to-purple-600"
            />
            <p className="text-[11px] text-slate-400 text-right">
              Tingkat Level: {stats.level.title}
            </p>
          </div>
        </div>

        {/* Big visual progress bar */}
        <ProgressBar
          progress={stats.materials_progress_percent}
          size="lg"
          showPercent={false}
          colorClass="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500"
        />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Materi Selesai"
          value={stats.completed_materials}
          subtitle={`Sisa ${uncompleted} materi belum dipelajari`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600 border-emerald-200"
          onClick={onNavigateToMaterials}
        />

        <StatCard
          title="Kuis Dikerjakan"
          value={stats.total_quizzes_taken}
          subtitle="Total evaluasi mini kuis"
          icon={<HelpCircle className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600 border-indigo-200"
        />

        <StatCard
          title="Rata-rata Nilai"
          value={`${stats.average_quiz_score}%`}
          subtitle="Akumulasi skor kuis"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-purple-50 text-purple-600 border-purple-200"
        />

        <StatCard
          title="Badge Diraih"
          value={stats.earned_badges_count}
          subtitle="Klik untuk melihat koleksi lencana"
          icon={<Award className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600 border-amber-200"
          onClick={onNavigateToBadges}
        />
      </div>

      {/* Progres Belajar per Mata Kuliah */}
      {stats.courses_progress && stats.courses_progress.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#012E26]" />
                Progres Belajar per Mata Kuliah
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau sejauh mana capaian silabus dan mini kuis Anda pada setiap mata kuliah yang terdaftar.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
              {stats.courses_progress.length} Mata Kuliah
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {stats.courses_progress.map((cp) => {
              const isDone = cp.status === 'completed';
              const isOngoing = cp.status === 'in_progress';

              return (
                <div
                  key={cp.course_id}
                  className="p-5 rounded-2xl border border-slate-200/90 hover:border-[#012E26]/40 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#012E26]/10 text-[#012E26] border border-[#012E26]/20">
                        {cp.course_code || 'MK'}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {cp.course_name}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-[#012E26] block">
                        {cp.materials_progress_percent}%
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Tuntas
                        </span>
                      ) : isOngoing ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Berjalan
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Belum Mulai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-600 to-teal-500"
                      style={{ width: `${Math.min(100, Math.max(0, cp.materials_progress_percent))}%` }}
                    />
                  </div>

                  {/* Detailed Counters */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-center">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Materi Selesai</span>
                      <span className="font-bold text-slate-800">{cp.completed_materials} / {cp.total_materials}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Kuis Dikerjakan</span>
                      <span className="font-bold text-slate-800">{cp.completed_quizzes} / {cp.total_quizzes}</span>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70">
                      <span className="text-[10px] text-slate-400 block font-medium">Rata-rata Skor</span>
                      <span className="font-bold text-indigo-700">{cp.average_quiz_score > 0 ? `${cp.average_quiz_score}%` : '-'}</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <button
                    onClick={() => {
                      setActiveCourseId(cp.course_id);
                      showToast({
                        type: 'success',
                        title: 'Mata Kuliah Dibuka',
                        message: `Beralih ke ruang materi "${cp.course_name}".`,
                      });
                      onNavigateToMaterials();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#012E26] hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <span>Masuki Ruang Materi Kuliah Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Riwayat Aktivitas & Perolehan Poin
          </h3>
          <span className="text-xs text-slate-400">Terbaru</span>
        </div>

        <div className="divide-y divide-slate-100">
          {stats.recent_activities.length > 0 ? (
            stats.recent_activities.map((act) => (
              <div key={act.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {act.source}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(act.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 font-black text-indigo-600 text-sm bg-indigo-50 px-3 py-1 rounded-xl">
                  +{act.amount} Poin
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada riwayat aktivitas tercatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
