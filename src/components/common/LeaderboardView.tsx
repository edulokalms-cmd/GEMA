import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { LevelBadge } from './LevelBadge';
import { ProgressBar } from './ProgressBar';
import {
  Trophy,
  Medal,
  Crown,
  Award,
  Zap,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Users,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'quiz' | 'badges' | 'progress'>('points');

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.progress.getStudentsOverview();
      setStudentsData(data || []);
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Available classes for filter
  const availableClasses = Array.from(
    new Set(studentsData.map((s) => s.user?.class_name).filter(Boolean))
  ).sort();

  // Filter
  const filtered = studentsData.filter((item) => {
    const student = item.user;
    const matchesSearch =
      student.name?.toLowerCase().includes(search.toLowerCase()) ||
      (student.student_id && student.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (student.department && student.department.toLowerCase().includes(search.toLowerCase()));
    const matchesClass = selectedClass === 'all' || student.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'points') {
      return (b.total_points || 0) - (a.total_points || 0);
    }
    if (sortBy === 'quiz') {
      return (b.average_quiz_score || 0) - (a.average_quiz_score || 0);
    }
    if (sortBy === 'badges') {
      return (b.badges_count || 0) - (a.badges_count || 0);
    }
    if (sortBy === 'progress') {
      return (b.progress_percent || 0) - (a.progress_percent || 0);
    }
    return 0;
  });

  // Top 3 for podium
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  // User's own rank
  const myRankIndex = currentUser?.role === 'mahasiswa'
    ? sorted.findIndex((item) => item.user?.id === currentUser?.id)
    : -1;
  const myRankData = myRankIndex !== -1 ? sorted[myRankIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#012E26] via-[#02473B] to-[#012E26] text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#012E26]/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Trophy className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-300/30">
              <Trophy className="w-4 h-4 text-[#EAA736]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Papan Peringkat Gamifikasi • Universitas Hamzanwadi
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Leaderboard Mahasiswa
          </h2>
          <p className="mt-2 text-emerald-100/90 text-xs sm:text-sm leading-relaxed">
            Peringkat keaktifan belajar, akumulasi perolehan poin gamifikasi (XP), lencana pencapaian, serta rata-rata skor evaluasi kuis praktikum.
          </p>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-100 font-medium">Total Peserta:</span>
              <strong className="text-white font-bold">{studentsData.length} Mahasiswa</strong>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-emerald-100 font-medium">Skor Tertinggi:</span>
              <strong className="text-white font-bold">
                {studentsData.length > 0 ? Math.max(...studentsData.map((s) => s.total_points || 0)) : 0} Pts
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Mahasiswa Spotlight / Personal Rank Card */}
      {myRankData && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-amber-300/70 rounded-3xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-[#012E26] text-white flex items-center justify-center font-black text-lg shadow-md border-2 border-[#EAA736]">
                  {currentUser?.avatar || currentUser?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-[#012E26] flex items-center justify-center font-black text-xs shadow-xs">
                  #{myRankIndex + 1}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    Peringkat Kamu
                  </span>
                  <span className="text-xs text-slate-500">Kelas {currentUser?.class_name || 'BIO-2A'}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Juara #{myRankIndex + 1} dari {sorted.length} Mahasiswa
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tingkatkan terus keaktifan belajar pada modul materi dan selesaikan kuis untuk menduduki peringkat teratas!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total Poin</p>
                <p className="text-base font-black text-[#012E26]">{myRankData.total_points || 0} Pts</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Level Anda</p>
                <p className="text-xs font-black text-emerald-700">{myRankData.level}</p>
              </div>
              <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-2xs text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Lencana</p>
                <p className="text-base font-black text-purple-700">{myRankData.badges_count || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium Top 3 */}
      {!loading && sorted.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
          {/* Top 2 - Silver */}
          {top2 && (
            <div className="order-2 md:order-1 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-lg border-4 border-slate-300 shadow-sm">
                  {top2.user?.avatar || top2.user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-6 h-6 rounded-full bg-slate-300 text-slate-800 flex items-center justify-center font-black text-xs shadow-xs">
                  2
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Runner Up (Perak)
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2 truncate max-w-full">
                {top2.user?.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {top2.user?.student_id || '-'} • Kelas {top2.user?.class_name || 'BIO-2A'}
              </p>
              <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Poin</p>
                  <p className="font-black text-[#012E26]">{top2.total_points} Pts</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Rata-rata Kuis</p>
                  <p className="font-bold text-slate-700">{top2.average_quiz_score}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Badge</p>
                  <p className="font-bold text-purple-700">{top2.badges_count}</p>
                </div>
              </div>
            </div>
          )}

          {/* Top 1 - Gold Champion */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-300 shadow-lg text-center flex flex-col items-center relative -translate-y-2">
              <div className="absolute -top-3.5 px-3 py-1 bg-amber-400 text-[#012E26] font-black text-xs rounded-full flex items-center gap-1 shadow-md">
                <Crown className="w-3.5 h-3.5 text-[#012E26] fill-[#012E26]" />
                <span>JUARA 1 UTAMA</span>
              </div>
              <div className="relative mb-3 mt-2">
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-black text-2xl border-4 border-amber-400 shadow-md">
                  {top1.user?.avatar || top1.user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-7 h-7 rounded-full bg-amber-400 text-[#012E26] flex items-center justify-center font-black text-sm shadow-xs border-2 border-white">
                  1
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                Peringkat Tertinggi (Emas)
              </span>
              <h4 className="text-base font-black text-slate-900 mt-2 truncate max-w-full">
                {top1.user?.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {top1.user?.student_id || '-'} • Kelas {top1.user?.class_name || 'BIO-2A'}
              </p>
              <div className="mt-2">
                <LevelBadge levelTitle={top1.level} size="sm" />
              </div>
              <div className="w-full mt-4 pt-3 border-t border-amber-100 flex items-center justify-around text-xs">
                <div>
                  <p className="text-[10px] text-amber-800 font-bold uppercase">Total Poin</p>
                  <p className="text-lg font-black text-[#012E26]">{top1.total_points} Pts</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Rata-rata Kuis</p>
                  <p className="font-bold text-slate-700">{top1.average_quiz_score}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Lencana</p>
                  <p className="font-bold text-purple-700">{top1.badges_count} Badge</p>
                </div>
              </div>
            </div>
          )}

          {/* Top 3 - Bronze */}
          {top3 && (
            <div className="order-3 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-amber-900/10 text-amber-900 flex items-center justify-center font-black text-lg border-4 border-amber-600/50 shadow-sm">
                  {top3.user?.avatar || top3.user?.name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="absolute -bottom-2 inset-x-0 mx-auto w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  3
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded-md">
                Peringkat 3 (Perunggu)
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2 truncate max-w-full">
                {top3.user?.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {top3.user?.student_id || '-'} • Kelas {top3.user?.class_name || 'BIO-2A'}
              </p>
              <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-around text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Poin</p>
                  <p className="font-black text-[#012E26]">{top3.total_points} Pts</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Rata-rata Kuis</p>
                  <p className="font-bold text-slate-700">{top3.average_quiz_score}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Badge</p>
                  <p className="font-bold text-purple-700">{top3.badges_count}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIM mahasiswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#012E26] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Kelas */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 shrink-0">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
            >
              <option value="all">Semua Kelas ({studentsData.length})</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 shrink-0">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
            >
              <option value="points">Total Poin Tertinggi</option>
              <option value="quiz">Rata-rata Nilai Kuis</option>
              <option value="badges">Jumlah Lencana Terbanyak</option>
              <option value="progress">Progres Materi Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#EAA736]" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Klasemen Mahasiswa ({sorted.length} Peserta)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Diperbarui secara realtime berdasarkan aktivitas pembelajaran
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-[#012E26] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Memuat klasemen leaderboard...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada data ditemukan</p>
            <p className="text-xs text-slate-500">Coba ganti filter kelas atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                  <th className="py-3.5 px-4 text-center w-16">Peringkat</th>
                  <th className="py-3.5 px-4">Nama Mahasiswa</th>
                  <th className="py-3.5 px-4">Kelas & Prodi</th>
                  <th className="py-3.5 px-4 text-center">Level</th>
                  <th className="py-3.5 px-4 text-center">Poin (XP)</th>
                  <th className="py-3.5 px-4 text-center">Rata Kuis</th>
                  <th className="py-3.5 px-4 text-center">Lencana</th>
                  <th className="py-3.5 px-4 text-center">Progres Materi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((item, index) => {
                  const rank = index + 1;
                  const isCurrentUser = currentUser?.id === item.user?.id;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <tr
                      key={item.user?.id || index}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-amber-50/60 font-semibold'
                          : isTop1
                          ? 'bg-amber-50/20 hover:bg-amber-50/40'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Peringkat Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-[#012E26] font-black text-xs shadow-xs">
                            🥇
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 font-black text-xs shadow-xs">
                            🥈
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                            🥉
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-slate-500 text-xs">
                            #{rank}
                          </span>
                        )}
                      </td>

                      {/* Mahasiswa Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
                            isTop1
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {item.user?.avatar || item.user?.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                {item.user?.name}
                              </span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 bg-amber-400 text-[#012E26] font-black text-[10px] rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              NIM: {item.user?.student_id || '-'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kelas & Prodi */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold text-[10px] w-fit">
                            Kelas {item.user?.class_name || 'BIO-2A'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[160px]">
                            {item.user?.department || 'S1 Pendidikan Biologi'}
                          </span>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-4 text-center">
                        <LevelBadge levelTitle={item.level} size="sm" />
                      </td>

                      {/* Total Poin */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-black text-xs">
                          {item.total_points || 0} Pts
                        </span>
                      </td>

                      {/* Rata-rata Kuis */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {item.average_quiz_score || 0}%
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ({item.quizzes_taken_count || 0} kuis)
                        </span>
                      </td>

                      {/* Lencana */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px]">
                          {item.badges_count || 0} Badge
                        </span>
                      </td>

                      {/* Progres Materi */}
                      <td className="py-3.5 px-4 text-center min-w-[110px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16">
                            <ProgressBar
                              progress={item.progress_percent || 0}
                              size="sm"
                              showPercent={false}
                              colorClass="bg-gradient-to-r from-emerald-600 to-teal-500"
                            />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">
                            {item.progress_percent || 0}%
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {item.completed_materials_count || 0}/{item.total_materials_count || 0} materi
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
