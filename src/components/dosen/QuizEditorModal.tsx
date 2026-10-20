import React, { useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Material, QuestionType } from '../../types';
import {
  X,
  Save,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle2,
  ListChecks,
  ToggleLeft,
  GitCompare,
  FileEdit,
  FileText,
  Briefcase,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface QuizEditorModalProps {
  quiz?: any | null;
  materials: Material[];
  onClose: () => void;
  onSaved: () => void;
}

const QUESTION_TYPE_INFO: Record<
  QuestionType,
  { label: string; desc: string; icon: any; color: string }
> = {
  single_choice: {
    label: 'Pilihan Ganda',
    desc: 'Satu opsi benar (A, B, C, D)',
    icon: CheckCircle2,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
  multiple_choice: {
    label: 'Pilihan Ganda Kompleks',
    desc: 'Beberapa opsi benar (Multi-select)',
    icon: ListChecks,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  true_false: {
    label: 'Benar / Salah (True/False)',
    desc: 'Pernyataan benar atau salah',
    icon: ToggleLeft,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  matching: {
    label: 'Menjodohkan (Matching)',
    desc: 'Memasangkan premis & target secara tepat',
    icon: GitCompare,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  short_answer: {
    label: 'Isian Singkat',
    desc: 'Jawaban kata/frasa kunci spesifik',
    icon: FileEdit,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  },
  essay: {
    label: 'Uraian / Esai',
    desc: 'Evaluasi otomatis berbasis rubrik kata kunci',
    icon: FileText,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  case_study: {
    label: 'Studi Kasus',
    desc: 'Skenario kontekstual praktikum & analisis',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
};

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  quiz,
  materials,
  onClose,
  onSaved,
}) => {
  const { showToast } = useNotification();
  const [materialId, setMaterialId] = useState(
    quiz?.material_id || (materials[0]?.id || '')
  );
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [points, setPoints] = useState(quiz?.points || 25);

  const [questions, setQuestions] = useState<any[]>(
    quiz?.questions && quiz.questions.length > 0
      ? quiz.questions.map((q: any) => ({
          ...q,
          type: q.type || 'single_choice',
          case_context: q.case_context || '',
          option_a: q.option_a || '',
          option_b: q.option_b || '',
          option_c: q.option_c || '',
          option_d: q.option_d || '',
          matching_pairs:
            q.matching_pairs && q.matching_pairs.length > 0
              ? q.matching_pairs
              : [
                  { id: 'm1', premise: '', target: '' },
                  { id: 'm2', premise: '', target: '' },
                ],
          correct_answer: q.correct_answer || (q.type === 'true_false' ? 'true' : 'a'),
          correct_answers_multi: q.correct_answers_multi || ['a'],
          correct_short_answers_str: (q.correct_short_answers || []).join(', '),
          essay_rubric_keywords_str: (q.essay_rubric_keywords || []).join(', '),
          essay_sample_answer: q.essay_sample_answer || '',
          explanation: q.explanation || '',
        }))
      : [
          {
            type: 'single_choice',
            question: '',
            option_a: '',
            option_b: '',
            option_c: '',
            option_d: '',
            correct_answer: 'a',
            explanation: '',
          },
        ]
  );
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = (type: QuestionType = 'single_choice') => {
    setQuestions([
      ...questions,
      {
        type,
        question: '',
        case_context: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        matching_pairs: [
          { id: 'm_' + Date.now() + '_1', premise: '', target: '' },
          { id: 'm_' + Date.now() + '_2', premise: '', target: '' },
        ],
        correct_answer: type === 'true_false' ? 'true' : 'a',
        correct_answers_multi: ['a'],
        correct_short_answers_str: '',
        essay_rubric_keywords_str: '',
        essay_sample_answer: '',
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  // Toggle multi-select checkbox for multiple_choice
  const handleToggleMultiChoice = (idx: number, optionKey: string) => {
    const updated = [...questions];
    const cur = updated[idx].correct_answers_multi || [];
    if (cur.includes(optionKey)) {
      if (cur.length > 1) {
        updated[idx].correct_answers_multi = cur.filter((k: string) => k !== optionKey);
      }
    } else {
      updated[idx].correct_answers_multi = [...cur, optionKey].sort();
    }
    setQuestions(updated);
  };

  // Matching pair helpers
  const handleAddMatchingPair = (qIdx: number) => {
    const updated = [...questions];
    const pairs = updated[qIdx].matching_pairs || [];
    updated[qIdx].matching_pairs = [
      ...pairs,
      { id: 'm_' + Date.now(), premise: '', target: '' },
    ];
    setQuestions(updated);
  };

  const handleRemoveMatchingPair = (qIdx: number, pIdx: number) => {
    const updated = [...questions];
    const pairs = updated[qIdx].matching_pairs || [];
    if (pairs.length > 1) {
      updated[qIdx].matching_pairs = pairs.filter((_: any, i: number) => i !== pIdx);
      setQuestions(updated);
    }
  };

  const handleUpdateMatchingPair = (
    qIdx: number,
    pIdx: number,
    field: 'premise' | 'target',
    val: string
  ) => {
    const updated = [...questions];
    const pairs = [...(updated[qIdx].matching_pairs || [])];
    pairs[pIdx] = { ...pairs[pIdx], [field]: val };
    updated[qIdx].matching_pairs = pairs;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !title) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Materi dan judul kuis wajib diisi.',
      });
      return;
    }
    if (questions.length === 0) {
      showToast({
        type: 'error',
        title: 'Soal Belum Ada',
        message: 'Minimal tambahkan 1 pertanyaan kuis.',
      });
      return;
    }

    // Format questions payload
    const formattedQuestions = questions.map((q) => {
      const qType: QuestionType = q.type || 'single_choice';
      const cleanQuestion: any = {
        id: q.id,
        type: qType,
        question: q.question,
        explanation: q.explanation || '',
      };

      if (qType === 'single_choice' || qType === 'case_study') {
        cleanQuestion.option_a = q.option_a;
        cleanQuestion.option_b = q.option_b;
        cleanQuestion.option_c = q.option_c;
        cleanQuestion.option_d = q.option_d;
        cleanQuestion.correct_answer = q.correct_answer || 'a';
        if (qType === 'case_study') {
          cleanQuestion.case_context = q.case_context || '';
        }
      } else if (qType === 'multiple_choice') {
        cleanQuestion.option_a = q.option_a;
        cleanQuestion.option_b = q.option_b;
        cleanQuestion.option_c = q.option_c;
        cleanQuestion.option_d = q.option_d;
        cleanQuestion.correct_answers_multi =
          q.correct_answers_multi && q.correct_answers_multi.length > 0
            ? q.correct_answers_multi
            : ['a'];
      } else if (qType === 'true_false') {
        cleanQuestion.correct_answer = q.correct_answer === 'false' ? 'false' : 'true';
      } else if (qType === 'matching') {
        cleanQuestion.matching_pairs = (q.matching_pairs || []).filter(
          (p: any) => p.premise && p.target
        );
      } else if (qType === 'short_answer') {
        const parsed = (q.correct_short_answers_str || '')
          .split(',')
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
        cleanQuestion.correct_short_answers =
          parsed.length > 0 ? parsed : [q.question.trim().toLowerCase()];
      } else if (qType === 'essay') {
        const keywords = (q.essay_rubric_keywords_str || '')
          .split(',')
          .map((s: string) => s.trim().toLowerCase())
          .filter(Boolean);
        cleanQuestion.essay_rubric_keywords = keywords;
        cleanQuestion.essay_sample_answer = q.essay_sample_answer || '';
      }

      return cleanQuestion;
    });

    try {
      setSaving(true);
      const payload = {
        material_id: materialId,
        title,
        description,
        points: Number(points),
        questions: formattedQuestions,
      };

      if (quiz) {
        await api.quizzes.update(quiz.id, payload);
        showToast({
          type: 'success',
          title: 'Kuis Diperbarui',
          message: `Kuis "${title}" berhasil diubah.`,
        });
      } else {
        await api.quizzes.create(payload);
        showToast({
          type: 'success',
          title: 'Kuis Dibuat',
          message: `Kuis baru "${title}" berhasil ditambahkan.`,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Kuis',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>{quiz ? 'Ubah Mini Kuis' : 'Buat Mini Kuis Baru'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mendukung 7 variasi jenis soal interaktif dengan sistem penilaian otomatis terintegrasi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Informasi Umum Kuis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Terkait Materi Perkuliahan
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  disabled={!!quiz}
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alokasi Poin Maksimal
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Kuis</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Mini Kuis 1: Arsitektur Komputer & Perangkat Keras"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Petunjuk / Deskripsi Kuis</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instruksi pengerjaan bagi mahasiswa..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Daftar Pertanyaan & Variasi Soal ({questions.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Dosen dapat memilih jenis soal yang bervariasi pada setiap butir pertanyaan.
                </p>
              </div>

              {/* Add question type buttons */}
              <div className="relative group self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('single_choice')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Butir Soal</span>
                </button>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-5">
              {questions.map((q, qIdx) => {
                const currentTypeInfo =
                  QUESTION_TYPE_INFO[q.type as QuestionType] ||
                  QUESTION_TYPE_INFO.single_choice;
                const TypeIcon = currentTypeInfo.icon;

                return (
                  <div
                    key={qIdx}
                    className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4 shadow-2xs"
                  >
                    {/* Header per question */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {qIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          Butir Pertanyaan #{qIdx + 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Type Selector Dropdown */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-bold text-slate-500">
                            Jenis Soal:
                          </label>
                          <select
                            value={q.type || 'single_choice'}
                            onChange={(e) =>
                              handleUpdateQuestion(
                                qIdx,
                                'type',
                                e.target.value as QuestionType
                              )
                            }
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="single_choice">Pilihan Ganda (Single Choice)</option>
                            <option value="multiple_choice">Pilihan Ganda Kompleks</option>
                            <option value="true_false">Benar / Salah (True/False)</option>
                            <option value="matching">Menjodohkan (Matching)</option>
                            <option value="short_answer">Isian Singkat (Short Answer)</option>
                            <option value="essay">Uraian / Esai (Keyword Rubric)</option>
                            <option value="case_study">Studi Kasus (Case Study)</option>
                          </select>
                        </div>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus butir soal ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Type Badge Indicator */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentTypeInfo.color}`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{currentTypeInfo.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        — {currentTypeInfo.desc}
                      </span>
                    </div>

                    {/* Case context if case_study */}
                    {q.type === 'case_study' && (
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
                        <label className="block text-xs font-bold text-blue-900 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                          Skenario Kasus Praktikum / Konteks Kasus
                        </label>
                        <textarea
                          rows={3}
                          value={q.case_context || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(qIdx, 'case_context', e.target.value)
                          }
                          placeholder="Tuliskan skenario studi kasus (contoh: Mahasiswa mengalami kendala freezing saat menjalankan software mikroskop 8 GB...)"
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    )}

                    {/* Question text */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Teks Pertanyaan / Pernyataan
                      </label>
                      <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) =>
                          handleUpdateQuestion(qIdx, 'question', e.target.value)
                        }
                        placeholder="Tuliskan pertanyaan di sini..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* Dynamic Fields Based on Type */}

                    {/* 1. Single Choice & Case Study */}
                    {(q.type === 'single_choice' ||
                      q.type === 'case_study' ||
                      !q.type) && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Pilihan Jawaban (Pilih satu tombol radio sebagai kunci jawaban benar):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(['a', 'b', 'c', 'd'] as const).map((opt) => (
                            <div
                              key={opt}
                              className={`flex items-center gap-2 p-2 rounded-xl border bg-white ${
                                q.correct_answer === opt
                                  ? 'border-indigo-400 bg-indigo-50/30'
                                  : 'border-slate-200'
                              }`}
                            >
                              <label className="flex items-center gap-1.5 shrink-0 font-bold text-slate-700 uppercase cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correct_answer === opt}
                                  onChange={() =>
                                    handleUpdateQuestion(qIdx, 'correct_answer', opt)
                                  }
                                  className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span>{opt}:</span>
                              </label>
                              <input
                                type="text"
                                value={q[`option_${opt}`] || ''}
                                onChange={(e) =>
                                  handleUpdateQuestion(
                                    qIdx,
                                    `option_${opt}`,
                                    e.target.value
                                  )
                                }
                                placeholder={`Teks Pilihan ${opt.toUpperCase()}`}
                                className="w-full px-2 py-1 bg-transparent border-0 text-xs text-slate-900 focus:outline-hidden"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Multiple Choice Kompleks */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Pilihan Jawaban (Centang semua kotak yang merupakan jawaban benar):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                            const isChecked = (
                              q.correct_answers_multi || []
                            ).includes(opt);
                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-2 p-2 rounded-xl border bg-white ${
                                  isChecked
                                    ? 'border-purple-400 bg-purple-50/30'
                                    : 'border-slate-200'
                                }`}
                              >
                                <label className="flex items-center gap-1.5 shrink-0 font-bold text-slate-700 uppercase cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      handleToggleMultiChoice(qIdx, opt)
                                    }
                                    className="text-purple-600 rounded-sm focus:ring-purple-500 cursor-pointer"
                                  />
                                  <span>{opt}:</span>
                                </label>
                                <input
                                  type="text"
                                  value={q[`option_${opt}`] || ''}
                                  onChange={(e) =>
                                    handleUpdateQuestion(
                                      qIdx,
                                      `option_${opt}`,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Teks Pilihan ${opt.toUpperCase()}`}
                                  className="w-full px-2 py-1 bg-transparent border-0 text-xs text-slate-900 focus:outline-hidden"
                                  required
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. True / False */}
                    {q.type === 'true_false' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Kunci Jawaban Pernyataan:
                        </label>
                        <div className="flex gap-4">
                          <label
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-bold text-xs transition-colors ${
                              q.correct_answer === 'true'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`tf_${qIdx}`}
                              checked={q.correct_answer === 'true'}
                              onChange={() =>
                                handleUpdateQuestion(qIdx, 'correct_answer', 'true')
                              }
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Benar (True)</span>
                          </label>

                          <label
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer font-bold text-xs transition-colors ${
                              q.correct_answer === 'false'
                                ? 'bg-rose-50 border-rose-400 text-rose-800'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`tf_${qIdx}`}
                              checked={q.correct_answer === 'false'}
                              onChange={() =>
                                handleUpdateQuestion(qIdx, 'correct_answer', 'false')
                              }
                              className="text-rose-600 focus:ring-rose-500"
                            />
                            <span>Salah (False)</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* 4. Matching */}
                    {q.type === 'matching' && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">
                            Pasangan Menjodohkan (Premis Kiri ➔ Target Kanan):
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAddMatchingPair(qIdx)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tambah Pasangan</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(q.matching_pairs || []).map((pair: any, pIdx: number) => (
                            <div
                              key={pIdx}
                              className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200"
                            >
                              <span className="text-xs font-bold text-slate-400 w-5">
                                #{pIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={pair.premise || ''}
                                onChange={(e) =>
                                  handleUpdateMatchingPair(
                                    qIdx,
                                    pIdx,
                                    'premise',
                                    e.target.value
                                  )
                                }
                                placeholder="Premis Kiri (contoh: CPU)"
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                required
                              />
                              <span className="text-slate-400 font-bold">➔</span>
                              <input
                                type="text"
                                value={pair.target || ''}
                                onChange={(e) =>
                                  handleUpdateMatchingPair(
                                    qIdx,
                                    pIdx,
                                    'target',
                                    e.target.value
                                  )
                                }
                                placeholder="Target Kanan (contoh: Otak Pemroses)"
                                className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                required
                              />
                              {(q.matching_pairs || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveMatchingPair(qIdx, pIdx)
                                  }
                                  className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Kunci Jawaban Isian Singkat (Pisahkan dengan koma jika ada variasi kata):
                        </label>
                        <input
                          type="text"
                          value={q.correct_short_answers_str || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(
                              qIdx,
                              'correct_short_answers_str',
                              e.target.value
                            )
                          }
                          placeholder="Contoh: linux, ubuntu, debian, os linux"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                          required
                        />
                        <p className="text-[11px] text-slate-500">
                          Sistem akan mencocokkan input mahasiswa secara otomatis (tidak membedakan huruf besar/kecil).
                        </p>
                      </div>
                    )}

                    {/* 6. Essay */}
                    {q.type === 'essay' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Kata Kunci Rubrik Penilaian Otomatis (Pisahkan dengan koma):
                          </label>
                          <input
                            type="text"
                            value={q.essay_rubric_keywords_str || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(
                                qIdx,
                                'essay_rubric_keywords_str',
                                e.target.value
                              )
                            }
                            placeholder="Contoh: volatile, non-volatile, penyimpanan, permanen, ram, ssd"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                            required
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Sistem secara cerdas menganalisis keberadaan kata kunci konsep ini dalam esai mahasiswa untuk menentukan skor secara objektif.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Contoh Jawaban / Model Acuan:
                          </label>
                          <textarea
                            rows={2}
                            value={q.essay_sample_answer || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(
                                qIdx,
                                'essay_sample_answer',
                                e.target.value
                              )
                            }
                            placeholder="Tuliskan model jawaban yang lengkap dan ideal sebagai referensi pembahasan..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Pembahasan & Penjelasan Ilmiah:
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) =>
                          handleUpdateQuestion(qIdx, 'explanation', e.target.value)
                        }
                        placeholder="Penjelasan yang tampil setelah mahasiswa submit kuis..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur-xs py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan Kuis...' : 'Simpan Seluruh Kuis'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
