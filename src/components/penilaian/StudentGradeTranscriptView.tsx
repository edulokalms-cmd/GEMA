import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StudentAcademicGrade } from '../../types';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  FileText,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';

export const StudentGradeTranscriptView: React.FC = () => {
  const [grade, setGrade] = useState<StudentAcademicGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.grades
      .getMyGrade()
      .then(setGrade)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="text-center py-12 text-slate-500">
        Data penilaian akademik belum tersedia untuk akun ini.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#012E26] via-[#023b31] to-[#012E26] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20 mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Transkrip Nilai Akademik Semester Berjalan</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Capaian & Evaluasi Nilai Akhir
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Penilaian transparan berbasis komponen resmi Universitas Hamzanwadi.
          </p>
        </div>

        {/* Grade Card */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
          <div className="text-center pr-3 border-r border-white/20">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">
              Nilai Akhir
            </span>
            <span className="text-3xl font-black text-white">{grade.final_score}</span>
          </div>

          <div className="text-center pl-1">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">
              Predikat
            </span>
            <span className="text-2xl font-black text-amber-400">{grade.grade_letter}</span>
            <span className="text-[10px] font-bold text-white block mt-0.5">
              {grade.status}
            </span>
          </div>
        </div>
      </div>

      {/* Components Grid Cards (Dynamic & Terintegrasi) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {(grade.components_detail && grade.components_detail.length > 0
          ? grade.components_detail
          : [
              {
                id: 'attendance',
                name: 'Kehadiran',
                weight: 15,
                source_type: 'attendance' as const,
                raw_score: grade.attendance_score,
                weighted_score: grade.weighted_attendance,
                description: 'Dihitung dari presensi pertemuan kuliah.',
              },
              {
                id: 'participation',
                name: 'Partisipasi',
                weight: 15,
                source_type: 'participation' as const,
                raw_score: grade.participation_score,
                weighted_score: grade.weighted_participation,
                description: 'Ketuntasan materi & mini kuis aplikasi.',
              },
              {
                id: 'assignment',
                name: 'Tugas Kuliah',
                weight: 20,
                source_type: 'assignment' as const,
                raw_score: grade.assignment_score,
                weighted_score: grade.weighted_assignment,
                description: 'Rata-rata pengumpulan tugas praktikum.',
              },
              {
                id: 'uts',
                name: 'UTS',
                weight: 25,
                source_type: 'uts' as const,
                raw_score: grade.uts_score,
                weighted_score: grade.weighted_uts,
                description: 'Ujian Tengah Semester (Pertemuan 8).',
              },
              {
                id: 'uas',
                name: 'UAS',
                weight: 25,
                source_type: 'uas' as const,
                raw_score: grade.uas_score,
                weighted_score: grade.weighted_uas,
                description: 'Ujian Akhir Semester & Proyek (P16).',
              },
            ]
        ).map((comp) => {
          const badge = (() => {
            switch (comp.source_type) {
              case 'attendance':
                return {
                  label: 'Presensi',
                  tagClass: 'bg-emerald-50 text-emerald-800',
                  ptsClass: 'text-emerald-700',
                  icon: CalendarCheck,
                };
              case 'participation':
                return {
                  label: 'Aktivitas',
                  tagClass: 'bg-blue-50 text-blue-800',
                  ptsClass: 'text-blue-700',
                  icon: Sparkles,
                };
              case 'assignment':
                return {
                  label: 'Penugasan',
                  tagClass: 'bg-purple-50 text-purple-800',
                  ptsClass: 'text-purple-700',
                  icon: FileText,
                };
              case 'quiz':
                return {
                  label: 'Mini Kuis',
                  tagClass: 'bg-amber-50 text-amber-800',
                  ptsClass: 'text-amber-700',
                  icon: HelpCircle,
                };
              case 'uts':
                return {
                  label: 'UTS',
                  tagClass: 'bg-orange-50 text-orange-800',
                  ptsClass: 'text-orange-700',
                  icon: GraduationCap,
                };
              case 'uas':
                return {
                  label: 'UAS',
                  tagClass: 'bg-indigo-50 text-indigo-800',
                  ptsClass: 'text-indigo-700',
                  icon: GraduationCap,
                };
              case 'manual':
              default:
                return {
                  label: 'Praktikum',
                  tagClass: 'bg-teal-50 text-teal-800',
                  ptsClass: 'text-teal-700',
                  icon: Award,
                };
            }
          })();

          return (
            <div
              key={comp.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-700 truncate" title={comp.name}>
                    {comp.name}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ${badge.tagClass}`}
                  >
                    {comp.weight}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-black text-slate-900">{comp.raw_score}</span>
                  <span className={`text-xs font-black ${badge.ptsClass}`}>
                    +{comp.weighted_score} pts
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-snug">
                {(comp as any).description || `Komponen ${comp.name} dengan bobot ${comp.weight}%.`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Formula & Policy Information Card */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-700" />
          <span>Aturan Konversi Huruf Mutu Akademik</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <strong className="block text-emerald-900 font-bold">Nilai 85 - 100</strong>
            <span className="text-[11px] text-emerald-800">Huruf: A (Bobot 4.00)</span>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <strong className="block text-blue-900 font-bold">Nilai 75 - 84</strong>
            <span className="text-[11px] text-blue-800">Huruf: B+ / B (Bobot 3.00 - 3.50)</span>
          </div>

          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <strong className="block text-amber-900 font-bold">Nilai 55 - 74</strong>
            <span className="text-[11px] text-amber-800">Huruf: C+ / C (Bobot 2.00 - 2.50)</span>
          </div>

          <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
            <strong className="block text-rose-900 font-bold">Nilai &lt; 55</strong>
            <span className="text-[11px] text-rose-800">Huruf: D / E (Tidak Lulus)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
