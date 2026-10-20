import React, { useState, useEffect } from 'react';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { CourseProgressSummary } from '../../types';
import {
  Layers,
  BookOpen,
  User,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  Award,
  PlayCircle,
  Clock,
} from 'lucide-react';

interface StudentCoursesViewProps {
  onNavigateTab: (tab: string) => void;
}

export const StudentCoursesView: React.FC<StudentCoursesViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const { showToast } = useNotification();
  const [search, setSearch] = useState('');
  const [coursesProgress, setCoursesProgress] = useState<Record<string, CourseProgressSummary>>({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  useEffect(() => {
    api.progress
      .getMy()
      .then((data) => {
        if (data.courses_progress) {
          const map: Record<string, CourseProgressSummary> = {};
          data.courses_progress.forEach((cp) => {
            map[cp.course_id] = cp;
          });
          setCoursesProgress(map);
        }
      })
      .catch((err) => console.error('Failed to load courses progress:', err))
      .finally(() => setLoadingProgress(false));
  }, []);

  const filteredCourses = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.lecturer_name && c.lecturer_name.toLowerCase().includes(q))
    );
  });

  const progressList = Object.values(coursesProgress);
  const avgProgress =
    progressList.length > 0
      ? Math.round(
          progressList.reduce((sum, cp) => sum + cp.materials_progress_percent, 0) /
            progressList.length
        )
      : 0;
  const totalCompletedMaterials = progressList.reduce(
    (sum, cp) => sum + cp.completed_materials,
    0
  );

  const handleSelectCourse = (courseId: string, courseName: string) => {
    setActiveCourseId(courseId);
    showToast({
      type: 'success',
      title: 'Mata Kuliah Dipilih',
      message: `Ruang belajar beralih ke "${courseName}".`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#012E26] to-[#034d40] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-[#012E26]/10">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Perkuliahan Mahasiswa • Kelas {user?.class_name || 'BIO-2A'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Mata Kuliah Terdaftar Anda
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Hanya mata kuliah yang terdaftar untuk kelas <strong>{user?.class_name || 'Anda'}</strong> yang ditampilkan di halaman ini. Pilih dan masuki ruang perkuliahan Anda untuk mengakses materi pembelajaran, mini kuis, penugasan, presensi, serta forum diskusi aktif.
          </p>

          {/* Quick Aggregate Stats in Banner */}
          {courses.length > 0 && !loadingProgress && (
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
                <span>Rata-rata Progres: <strong className="text-white">{avgProgress}%</strong></span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs font-semibold flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>Materi Tuntas: <strong className="text-white">{totalCompletedMaterials} Materi</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari mata kuliah atau dosen pengampu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          Menampilkan <strong>{filteredCourses.length}</strong> dari {courses.length} Mata Kuliah Terdaftar
        </div>
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Belum Ada Mata Kuliah Terdaftar</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Akun Anda (Kelas {user?.class_name || '-'}) belum terdaftar pada jadwal perkuliahan aktif. Hubungi Dosen Pengampu atau Administrator prodi untuk didaftarkan ke kelas terkait.
          </p>
        </div>
      )}

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCourses.map((course) => {
          const isActive = activeCourseId === course.id;
          const courseColor = course.color || '#012E26';

          return (
            <div
              key={course.id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-lg'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
              }`}
            >
              <div className="h-2.5 w-full" style={{ backgroundColor: courseColor }} />

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-black tracking-wide text-white uppercase"
                        style={{ backgroundColor: courseColor }}
                      >
                        {course.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                        {course.sks} SKS
                      </span>
                    </div>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Ruang Belajar Aktif
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-3">
                    {course.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {course.description || 'Deskripsi silabus dan capaian perkuliahan.'}
                  </p>
                </div>

                {/* Progres Belajar di Mata Kuliah Ini */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  {loadingProgress ? (
                    <div className="p-3 bg-slate-50 rounded-2xl animate-pulse space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-2 bg-slate-200 rounded w-full" />
                    </div>
                  ) : (() => {
                    const cp = coursesProgress[course.id];
                    const percent = cp ? cp.materials_progress_percent : 0;
                    const isDone = cp?.status === 'completed';
                    const isOngoing = cp?.status === 'in_progress';

                    return (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/25 border border-slate-200/90 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-xs font-bold text-slate-800">Progres Belajar</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#012E26]">
                              {percent}%
                            </span>
                            {isDone ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Tuntas
                              </span>
                            ) : isOngoing ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Berjalan
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Belum Mulai
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-600 to-teal-500"
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>

                        {/* Metrics Badges */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="text-slate-600 truncate">
                              Materi: <strong className="text-slate-900">{cp ? `${cp.completed_materials}/${cp.total_materials}` : '0/0'}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="text-slate-600 truncate">
                              Kuis: <strong className="text-slate-900">{cp ? `${cp.completed_quizzes}/${cp.total_quizzes}` : '0/0'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Next material recommendation */}
                        {cp?.next_material_title && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCourse(course.id, course.name);
                              onNavigateTab('materials');
                            }}
                            className="p-2 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-[11px] text-slate-600 cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 truncate pr-2">
                              <PlayCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">Lanjut: <strong className="text-slate-800">{cp.next_material_title}</strong></span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 shrink-0 flex items-center gap-0.5">
                              Buka <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Lecturer and Meta */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Dosen: <strong>{course.lecturer_name}</strong></span>
                  </div>

                  {/* Registered Class Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400">Terdaftar untuk:</span>
                    {course.enrolled_classes && course.enrolled_classes.length > 0 ? (
                      course.enrolled_classes.map((cls) => (
                        <span
                          key={cls}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            cls === user?.class_name
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/30'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          Kelas {cls}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">Semua Kelas</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>Semester: <strong>{course.semester}</strong></span>
                    <span>Tahun: <strong>{course.academic_year}</strong></span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => {
                      handleSelectCourse(course.id, course.name);
                      onNavigateTab('materials');
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#012E26] hover:bg-[#023b31] text-white shadow-md shadow-[#012E26]/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    <span>{isActive ? 'Buka Ruang Belajar Materi' : 'Masuk ke Ruang Kuliah Ini'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Activity Shortcuts */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => {
                        handleSelectCourse(course.id, course.name);
                        onNavigateTab('materials');
                      }}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <BookOpen className="w-3 h-3 text-emerald-600" />
                      <span>Materi</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSelectCourse(course.id, course.name);
                        onNavigateTab('discussions');
                      }}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3 h-3 text-purple-600" />
                      <span>Forum</span>
                    </button>
                    <button
                      onClick={() => {
                        handleSelectCourse(course.id, course.name);
                        onNavigateTab('quizzes');
                      }}
                      className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-600" />
                      <span>Kuis</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
