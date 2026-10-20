import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ProgressBar } from '../common/ProgressBar';
import { LevelBadge } from '../common/LevelBadge';
import { StudentDetailModal } from './StudentDetailModal';
import { BadgeManagement } from './BadgeManagement';
import {
  Users,
  Search,
  Filter,
  Eye,
  Award,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react';

export const StudentProgressView: React.FC = () => {
  const [overview, setOverview] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.progress.getStudentsOverview();
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableClasses = Array.from(
    new Set(overview.map((item) => item.user.class_name).filter(Boolean))
  ).sort();

  const filtered = overview.filter((item) => {
    const matchesSearch =
      item.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.user.student_id && item.user.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (item.user.department && item.user.department.toLowerCase().includes(search.toLowerCase()));
    const matchesClass = selectedClass === 'all' || item.user.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Progres Belajar Seluruh Mahasiswa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring terperinci pencapaian materi, rata-rata skor kuis, dan akumulasi poin per mahasiswa.
          </p>
        </div>
        <button
          onClick={() => setShowBadgeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Award className="w-4 h-4 text-[#EAA736]" />
          <span>Master Badge Mahasiswa</span>
        </button>
      </div>

      {/* Search and Class Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mahasiswa berdasarkan nama, NIM, atau jurusan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Filter Kelas:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-indigo-950 focus:bg-white cursor-pointer w-full sm:w-auto"
          >
            <option value="all">Semua Kelas ({overview.length})</option>
            {availableClasses.map((cls) => {
              const count = overview.filter((o) => o.user.class_name === cls).length;
              return (
                <option key={cls} value={cls}>
                  Kelas {cls} ({count} mhs)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Daftar Mahasiswa: <strong className="text-slate-900">{filtered.length} Mahasiswa</strong>
            {selectedClass !== 'all' && (
              <span className="ml-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/80">
                Kelas {selectedClass}
              </span>
            )}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Progres Materi</th>
                <th className="py-3 px-4 text-center">Poin</th>
                <th className="py-3 px-4 text-center">Level</th>
                <th className="py-3 px-4 text-center">Rata-rata Nilai</th>
                <th className="py-3 px-4 text-center">Lencana</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.user.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-bold text-slate-900 text-sm">{item.user.name}</div>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-bold text-[10px]">
                        Kelas {item.user.class_name || 'BIO-2A'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      NIM: {item.user.student_id || '-'} • {item.user.department || '-'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 min-w-[150px]">
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
                      {item.completed_materials_count} dari {item.total_materials_count} materi
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
                    {item.average_quiz_score}% ({item.quizzes_taken_count} kuis)
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
                      <span>Lihat Detail</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      {/* Master Badge Management Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowBadgeModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#EAA736]" />
                Master Lencana & Badge Mahasiswa
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Atur kriteria pencapaian badge dan lencana gamifikasi yang dapat diperoleh mahasiswa.
              </p>
            </div>
            <BadgeManagement />
          </div>
        </div>
      )}
    </div>
  );
};
