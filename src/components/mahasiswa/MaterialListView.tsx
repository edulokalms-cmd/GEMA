import React, { useState, useEffect, useMemo } from 'react';
import { useCourse } from '../../context/CourseContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Material } from '../../types';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Zap,
  CheckCircle2,
  Circle,
  HelpCircle,
  ArrowRight,
  Layers,
  User,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface MaterialListViewProps {
  onSelectMaterial: (materialId: string) => void;
  onSelectQuiz: (quizId: string) => void;
}

export const MaterialListView: React.FC<MaterialListViewProps> = ({
  onSelectMaterial,
  onSelectQuiz,
}) => {
  const { user } = useAuth();
  const { courses, activeCourseId, setActiveCourseId } = useCourse();

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourseTab, setSelectedCourseTab] = useState<string>(activeCourseId || 'all');

  // Keep selected tab in sync if activeCourseId changes externally (e.g. from StudentCoursesView)
  useEffect(() => {
    if (activeCourseId) {
      setSelectedCourseTab(activeCourseId);
    }
  }, [activeCourseId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // Fetch all accessible materials for this student
      const data = await api.materials.getAll();
      setMaterials(data);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseTab) || null;
  }, [courses, selectedCourseTab]);

  // Filter materials based on course selection, search, and category
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // 1. Course filter
      if (selectedCourseTab !== 'all') {
        const matCourseId = m.course_id || 'course_1';
        if (matCourseId !== selectedCourseTab) {
          return false;
        }
      }

      // 2. Category filter
      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = (m.description || '').toLowerCase().includes(q);
        const matchesCat = (m.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [materials, selectedCourseTab, selectedCategory, search]);

  // Compute categories dynamically based on current course filter
  const availableCategories = useMemo(() => {
    const courseMaterials =
      selectedCourseTab === 'all'
        ? materials
        : materials.filter((m) => (m.course_id || 'course_1') === selectedCourseTab);
    return ['all', ...Array.from(new Set(courseMaterials.map((m) => m.category).filter(Boolean)))];
  }, [materials, selectedCourseTab]);

  // Reset category if not in availableCategories
  useEffect(() => {
    if (selectedCategory !== 'all' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [availableCategories, selectedCategory]);

  // Overall stats for current view
  const currentViewMaterials = useMemo(() => {
    if (selectedCourseTab === 'all') return materials;
    return materials.filter((m) => (m.course_id || 'course_1') === selectedCourseTab);
  }, [materials, selectedCourseTab]);

  const completedCount = currentViewMaterials.filter((m) => m.status === 'completed').length;
  const totalCount = currentViewMaterials.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSelectTab = (tabId: string) => {
    setSelectedCourseTab(tabId);
    if (tabId !== 'all') {
      setActiveCourseId(tabId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <BookOpen className="w-3 h-3 text-emerald-700" />
              <span>Silabus & Modul Perkuliahan Terpadu</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Kelas {user?.class_name || 'BIO-2A'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Materi Pembelajaran Perkuliahan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Silabus materi perkuliahan terstruktur per pertemuan dengan mini kuis interaktif dan gamifikasi poin prestasi.
          </p>
        </div>

        {/* Global Progress Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-900 shrink-0 self-start sm:self-auto shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {completedCount} dari {totalCount} Materi Selesai ({progressPercent}%)
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
          {/* "Semua Mata Kuliah" Button */}
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
              {materials.length}
            </span>
          </button>

          {/* Individual Course Buttons */}
          {courses.map((course) => {
            const isSelected = selectedCourseTab === course.id;
            const courseMats = materials.filter(
              (m) => (m.course_id || 'course_1') === course.id
            );
            const courseCompleted = courseMats.filter((m) => m.status === 'completed').length;

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
                  title={`${courseCompleted} dari ${courseMats.length} selesai`}
                >
                  {courseMats.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Course Info Card Banner (When a specific course is selected) */}
      {activeCourse && (
        <div className="bg-gradient-to-r from-emerald-900/90 via-[#012E26] to-[#01382F] rounded-3xl p-5 sm:p-6 text-white border border-emerald-800/40 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-wider uppercase bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-md">
                  {activeCourse.code}
                </span>
                <span className="text-xs text-emerald-200/90">• {activeCourse.sks} SKS • {activeCourse.semester}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {activeCourse.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-emerald-100/90 pt-0.5">
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>Dosen Pengampu: <strong>{activeCourse.lecturer_name}</strong></span>
              </div>
              {activeCourse.description && (
                <p className="text-xs text-emerald-100/80 pt-1 line-clamp-2 leading-relaxed">
                  {activeCourse.description}
                </p>
              )}
            </div>

            {/* Course Progress Widget */}
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 min-w-[220px] shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-100 font-medium">Progres Materi:</span>
                <span className="font-black text-amber-300">{progressPercent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-emerald-300 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-emerald-100/80 pt-0.5">
                <span>{completedCount} Selesai</span>
                <span>{totalCount - completedCount} Belum Tuntas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi perkuliahan, topik, atau kata kunci..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 text-slate-900"
          />
        </div>

        {/* Categories Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <div className="flex gap-1.5">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'Semua Topik' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Material Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">Tidak ada materi ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {search || selectedCategory !== 'all'
                ? 'Tidak ada materi yang sesuai dengan filter pencarian atau topik Anda.'
                : 'Materi pembelajaran untuk mata kuliah ini sedang dipersiapkan atau belum dipublikasikan.'}
            </p>
          </div>
          {(search || selectedCategory !== 'all' || selectedCourseTab !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('all');
                setSelectedCourseTab('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Reset Filter & Lihat Semua Materi</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => {
            const isCompleted = mat.status === 'completed';
            const course = courses.find((c) => c.id === (mat.course_id || 'course_1'));

            return (
              <div
                key={mat.id}
                className={`bg-white rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isCompleted
                    ? 'border-emerald-200 hover:border-emerald-400'
                    : 'border-slate-200/90 hover:border-emerald-400'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-3">
                  {/* Category, Course & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {course && (
                        <span className="text-[10px] font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {course.code}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                        {mat.category}
                      </span>
                    </div>

                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        <Circle className="w-3 h-3 text-slate-400" />
                        Belum Selesai
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      onClick={() => onSelectMaterial(mat.id)}
                      className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer line-clamp-2"
                    >
                      {mat.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {mat.description}
                    </p>
                  </div>

                  {/* Meta items */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {mat.estimated_time || '50 Menit'}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Zap className="w-3.5 h-3.5 fill-amber-500" />
                      +10 Poin
                    </span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onSelectMaterial(mat.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      isCompleted
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-[#012E26] hover:bg-[#023b31] text-white'
                    }`}
                  >
                    <span>{isCompleted ? 'Pelajari Ulang' : 'Buka Materi'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {mat.has_quiz && (
                    <button
                      onClick={() => onSelectQuiz(mat.quiz_id)}
                      className="p-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200/80 rounded-xl text-xs font-bold transition-colors flex items-center justify-center cursor-pointer shadow-xs"
                      title="Kerjakan Mini Kuis"
                    >
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
