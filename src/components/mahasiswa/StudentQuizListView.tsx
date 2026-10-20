import React, { useState, useEffect, useMemo } from 'react';
import { useCourse } from '../../context/CourseContext';
import { api } from '../../services/api';
import {
  HelpCircle,
  BookOpen,
  Zap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Search,
  Layers,
} from 'lucide-react';

interface StudentQuizListViewProps {
  onSelectQuiz: (quizId: string) => void;
}

export const StudentQuizListView: React.FC<StudentQuizListViewProps> = ({
  onSelectQuiz,
}) => {
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>(activeCourseId || 'all');

  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseTab(activeCourseId);
    }
  }, [activeCourseId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const data = await api.quizzes.getAll();
      setQuizzes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleSelectTab = (tabId: string) => {
    setSelectedCourseTab(tabId);
    if (tabId !== 'all') {
      setActiveCourseId(tabId);
    }
  };

  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      // 1. Course filter
      if (selectedCourseTab !== 'all') {
        const qCourseId = q.course_id || 'course_1';
        if (qCourseId !== selectedCourseTab) {
          return false;
        }
      }

      // 2. Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesMat = (q.material_title || '').toLowerCase().includes(query);
        const matchesDesc = (q.description || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesMat && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [quizzes, selectedCourseTab, search]);

  const completedQuizzesCount = filtered.filter((q) => !!q.user_result).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daftar Mini Kuis Interaktif
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Uji pemahaman Anda pada setiap materi perkuliahan, kumpulkan poin gamifikasi, dan raih prestasi akademik.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-900 shrink-0 self-start sm:self-auto shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {completedQuizzesCount} dari {filtered.length} Kuis Selesai
          </span>
        </div>
      </div>

      {/* Course Navigation Selector Tabs */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-emerald-700" />
            <span>Pilih Ruang Mata Kuliah:</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {courses.length} Mata Kuliah Terdaftar
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => handleSelectTab('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
              selectedCourseTab === 'all'
                ? 'bg-[#012E26] text-white border-[#012E26] shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>Semua Mata Kuliah</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedCourseTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {quizzes.length}
            </span>
          </button>

          {courses.map((course) => {
            const isSelected = selectedCourseTab === course.id;
            const courseQuizzes = quizzes.filter(
              (q) => (q.course_id || 'course_1') === course.id
            );

            return (
              <button
                key={course.id}
                onClick={() => handleSelectTab(course.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#012E26] text-white border-[#012E26] shadow-sm ring-2 ring-[#012E26]/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-800/10 text-emerald-800 border border-emerald-300/40">
                  {course.code}
                </span>
                <span>{course.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {courseQuizzes.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kuis berdasarkan topik materi atau judul kuis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Grid of Quizzes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-52 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada kuis ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Coba gunakan kata kunci pencarian yang lain atau pilih ruang mata kuliah lainnya.
            </p>
          </div>
          {(search || selectedCourseTab !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCourseTab('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Reset Filter & Lihat Semua Kuis</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => {
            const hasResult = !!quiz.user_result;
            const score = quiz.user_result?.score;
            const course = courses.find((c) => c.id === (quiz.course_id || 'course_1'));

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {course && (
                        <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {course.code}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1 truncate max-w-[150px]">
                        <BookOpen className="w-3 h-3 text-emerald-700" />
                        <span className="truncate">{quiz.material_title || 'Materi Perkuliahan'}</span>
                      </span>
                    </div>

                    {hasResult ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Skor: {score}%
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                        Belum Dikerjakan
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {quiz.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span>{quiz.question_count || 5} Pertanyaan</span>
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      +{quiz.points || 30} Poin
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => onSelectQuiz(quiz.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      hasResult
                        ? 'bg-slate-800 hover:bg-slate-900 text-white'
                        : 'bg-[#012E26] hover:bg-[#023b31] text-white'
                    }`}
                  >
                    {hasResult ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kerjakan Ulang ({score}%)</span>
                      </>
                    ) : (
                      <>
                        <span>Mulai Kerjakan Kuis</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
