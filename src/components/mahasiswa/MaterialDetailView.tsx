import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { MaterialAttachment } from '../../types';
import { RichContentRenderer } from '../common/RichContentRenderer';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  HelpCircle,
  Share2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Paperclip,
  Download,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Play,
} from 'lucide-react';

interface MaterialDetailViewProps {
  materialId: string;
  onBack: () => void;
  onStartQuiz: (quizId: string) => void;
  onRefreshStats?: () => void;
}

export const MaterialDetailView: React.FC<MaterialDetailViewProps> = ({
  materialId,
  onBack,
  onStartQuiz,
  onRefreshStats,
}) => {
  const [material, setMaterial] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const { showToast, notifyBadgeEarned, notifyPointsEarned } = useNotification();

  const loadMaterial = async () => {
    try {
      setLoading(true);
      const data = await api.materials.getById(materialId);
      setMaterial(data);
    } catch (err) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Materi',
        message: 'Tidak dapat mengambil detail materi perkuliahan.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterial();
  }, [materialId]);

  const handleMarkComplete = async () => {
    try {
      setCompleting(true);
      const res = await api.materials.complete(materialId);

      if (res.points_awarded > 0) {
        notifyPointsEarned(res.points_awarded, `Menyelesaikan materi: ${material.title}`);
      }

      if (res.category_bonus_awarded) {
        showToast({
          type: 'points',
          title: 'Bonus Topik Selesai! (+25 Poin)',
          message: `Selamat! Anda telah menyelesaikan seluruh materi pada topik "${material.category}".`,
        });
      }

      if (res.new_badges && res.new_badges.length > 0) {
        res.new_badges.forEach((b: string) => notifyBadgeEarned(b));
      }

      showToast({
        type: 'success',
        title: 'Materi Berhasil Diselesaikan!',
        message: 'Progres belajar Anda telah tersimpan.',
      });

      setMaterial((prev: any) => ({
        ...prev,
        status: 'completed',
        completed_at: res.progress.completed_at,
      }));

      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Progres',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !material) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const isCompleted = material.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Materi</span>
        </button>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Materi Telah Selesai</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Belum Diselesaikan</span>
            </span>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
            {material.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            Estimasi: {material.estimated_time}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            +10 Poin Kelulusan
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
          {material.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed border-l-4 border-indigo-500 pl-4 py-1 bg-slate-50/80 rounded-r-xl">
          {material.description}
        </p>

        {/* Learning Objectives */}
        {material.learning_objectives && material.learning_objectives.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              Tujuan Pembelajaran:
            </h3>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
              {material.learning_objectives.map((obj: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Material Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-none text-slate-800">
        <RichContentRenderer content={material.content} attachments={material.attachments} />
      </div>

      {/* Attachments Section */}
      {material.attachments && material.attachments.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              <span>Lampiran & Berkas Pembelajaran ({material.attachments.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Silakan unduh atau baca dokumen pendukung</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {material.attachments.map((att: MaterialAttachment) => (
              <div
                key={att.id}
                className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200/60 shrink-0">
                    {att.type === 'image' ? (
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                    ) : att.type === 'video' ? (
                      <Video className="w-5 h-5 text-rose-600" />
                    ) : att.type === 'spreadsheet' ? (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {att.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="uppercase font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                        {att.type}
                      </span>
                      {att.size && <span>• {att.size}</span>}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (att.url.startsWith('data:') || att.url.startsWith('blob:')) {
                      const a = document.createElement('a');
                      a.href = att.url;
                      a.download = att.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } else {
                      window.open(att.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 hover:border-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Completion & Quiz Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">Langkah Selanjutnya</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
            {isCompleted
              ? 'Materi ini sudah Anda tandai selesai. Uji pemahaman Anda dengan mengikuti mini kuis untuk mengumpulkan skor dan badge Quiz Master!'
              : 'Tandai materi ini sebagai selesai untuk mencatat progres belajar dan klaim +10 poin Anda, lalu uji pemahaman dengan mini kuis.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
          {!isCompleted && (
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className="flex-1 md:flex-initial px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{completing ? 'Menyimpan...' : 'Tandai Selesai (+10 Pts)'}</span>
            </button>
          )}

          {material.quiz ? (
            <button
              onClick={() => onStartQuiz(material.quiz.id)}
              className="flex-1 md:flex-initial px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Kerjakan Mini Kuis ({material.quiz.points} Pts)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs text-slate-400 italic">Mini kuis belum tersedia untuk topik ini</div>
          )}
        </div>
      </div>
    </div>
  );
};
