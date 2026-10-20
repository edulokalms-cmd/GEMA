import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { Material, Quiz } from '../../types';
import { QuizEditorModal } from './QuizEditorModal';
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  Zap,
  BookOpen,
  Layers,
} from 'lucide-react';

export const QuizManagement: React.FC = () => {
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const { showToast } = useNotification();

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, mData] = await Promise.all([
        api.quizzes.getAll(),
        api.materials.getAll(),
      ]);
      setQuizzes(qData);
      setMaterials(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = async (quiz: Quiz) => {
    try {
      // fetch full quiz with questions
      const full = await api.quizzes.getById(quiz.id);
      setEditingQuiz(full);
      setModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(`Yakin ingin menghapus kuis "${quiz.title}"?`)) {
      return;
    }
    try {
      await api.quizzes.delete(quiz.id);
      showToast({
        type: 'info',
        title: 'Kuis Dihapus',
        message: `Kuis "${quiz.title}" berhasil dihapus.`,
      });
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Kuis',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.material_title && q.material_title.toLowerCase().includes(search.toLowerCase()));
    const matchesCourse =
      activeCourseId === 'all' || !q.course_id || q.course_id === activeCourseId;
    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Mini Kuis
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Buat dan atur soal evaluasi interaktif, kunci jawaban, dan bobot poin tiap kuis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {courses.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-600">MK:</span>
              <select
                value={activeCourseId}
                onChange={(e) => setActiveCourseId(e.target.value)}
                className="bg-transparent text-xs font-bold text-indigo-950 focus:outline-hidden cursor-pointer max-w-[170px] truncate"
              >
                <option value="all">Semua Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => {
              setEditingQuiz(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Mini Kuis Baru</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kuis berdasarkan judul atau materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                <th className="py-3 px-4">Judul Mini Kuis</th>
                <th className="py-3 px-4">Terkait Materi</th>
                <th className="py-3 px-4 text-center">Jumlah Soal</th>
                <th className="py-3 px-4 text-center">Poin Maks</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <h4 className="font-bold text-slate-900 text-sm">{quiz.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {quiz.description}
                    </p>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold truncate max-w-xs">{quiz.material_title}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {quiz.question_count} Soal
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                      <Zap className="w-3 h-3 fill-amber-500" />
                      {quiz.points} Pts
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(quiz)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kuis & Soal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kuis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <QuizEditorModal
          quiz={editingQuiz}
          materials={materials}
          onClose={() => setModalOpen(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
};
