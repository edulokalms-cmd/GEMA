import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LevelBadge } from '../common/LevelBadge';
import { ProgressBar } from '../common/ProgressBar';
import { getUserInitials } from '../../utils/initials';
import {
  X,
  User,
  BookOpen,
  HelpCircle,
  Award,
  Zap,
  CheckCircle2,
  Circle,
  Calendar,
} from 'lucide-react';

interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes' | 'badges' | 'points'>('materials');

  useEffect(() => {
    setLoading(true);
    api.progress
      .getStudentDetails(studentId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
        <div className="bg-white rounded-3xl p-8 max-w-xl w-full animate-pulse text-center">
          <div className="h-6 w-36 bg-slate-200 mx-auto rounded-lg mb-4" />
          <div className="h-20 bg-slate-200 rounded-2xl mb-4" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const completedMaterials = data.materials_progress.filter((m: any) => m.status === 'completed').length;
  const totalMaterials = data.materials_progress.length;
  const progressPct = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-100">
              {getUserInitials(data.student.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{data.student.name}</h3>
                <LevelBadge levelTitle={data.level.title} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                {data.student.email} • NIM: {data.student.student_id || '-'}
              </p>
              <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                {data.student.department || 'Biologi'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-white border-b border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Progres</span>
            <span className="text-base font-black text-slate-800">{progressPct}%</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50">
            <span className="text-[10px] text-amber-600 uppercase font-semibold block">Poin</span>
            <span className="text-base font-black text-amber-900">{data.total_points} Pts</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50">
            <span className="text-[10px] text-purple-600 uppercase font-semibold block">Kuis</span>
            <span className="text-base font-black text-purple-900">{data.quiz_results.length} Kuis</span>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50">
            <span className="text-[10px] text-indigo-600 uppercase font-semibold block">Badge</span>
            <span className="text-base font-black text-indigo-900">{data.badges.length} Diraih</span>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/40">
          {[
            { id: 'materials', label: 'Progres Materi', icon: BookOpen },
            { id: 'quizzes', label: 'Hasil Kuis', icon: HelpCircle },
            { id: 'badges', label: 'Lencana', icon: Award },
            { id: 'points', label: 'Riwayat Poin', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-bold text-xs transition-colors cursor-pointer ${
                  active
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          {activeTab === 'materials' && (
            <div className="space-y-3">
              {data.materials_progress.map((mat: any) => {
                const isComp = mat.status === 'completed';
                return (
                  <div
                    key={mat.material_id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {mat.category}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1">{mat.title}</h4>
                      {mat.completed_at && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Selesai pada: {new Date(mat.completed_at).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                    {isComp ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full shrink-0">
                        <Circle className="w-3 h-3 text-slate-400" />
                        Belum
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="space-y-3">
              {data.quiz_results.length > 0 ? (
                data.quiz_results.map((qr: any) => (
                  <div
                    key={qr.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{qr.quiz_title}</h4>
                      <p className="text-[11px] text-slate-500">
                        {qr.correct_count} dari {qr.total_questions} pertanyaan benar
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Dikerjakan: {new Date(qr.completed_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-base font-black text-indigo-600 block">
                        {qr.score}%
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        +{qr.points_earned} Pts
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Mahasiswa ini belum mengerjakan mini kuis apapun.
                </p>
              )}
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.badges.length > 0 ? (
                data.badges.map((b: any) => (
                  <div
                    key={b.badge_id}
                    className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 flex items-center gap-3 text-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{b.name}</h4>
                      <p className="text-[11px] text-slate-500">{b.description}</p>
                      <p className="text-[10px] text-amber-800 font-semibold mt-1">
                        Diperoleh: {new Date(b.earned_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-xs text-slate-400 text-center py-6">
                  Belum ada badge yang diperoleh oleh mahasiswa ini.
                </p>
              )}
            </div>
          )}

          {activeTab === 'points' && (
            <div className="divide-y divide-slate-100">
              {data.points_history.length > 0 ? (
                data.points_history.map((pt: any) => (
                  <div key={pt.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{pt.source}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(pt.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      +{pt.amount} Pts
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Belum ada riwayat perolehan poin.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
