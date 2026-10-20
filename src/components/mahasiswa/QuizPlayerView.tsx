import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Zap,
  RotateCcw,
  Award,
  BookOpen,
  Sparkles,
  Info,
  CheckSquare,
  ListChecks,
  ToggleLeft,
  GitCompare,
  FileEdit,
  FileText,
  Briefcase,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { QuestionType } from '../../types';

interface QuizPlayerViewProps {
  quizId: string;
  onBack: () => void;
  onViewProgress: () => void;
  onRefreshStats?: () => void;
}

export const QuizPlayerView: React.FC<QuizPlayerViewProps> = ({
  quizId,
  onBack,
  onViewProgress,
  onRefreshStats,
}) => {
  const [quiz, setQuiz] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [unansweredList, setUnansweredList] = useState<number[]>([]);
  const { showToast, celebrate, notifyBadgeEarned } = useNotification();

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await api.quizzes.getById(quizId);
      setQuiz(data);
      setResult(null);
      setAnswers({});
    } catch (err) {
      console.error(err);
      showToast({
        type: 'error',
        title: 'Gagal Memuat Kuis',
        message: 'Tidak dapat mengambil butir soal mini kuis.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  // Handler for single choice / case study
  const handleSelectRadio = (questionId: string, option: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  // Handler for multiple choice kompleks (checkbox)
  const handleToggleCheckbox = (questionId: string, option: string) => {
    if (result) return;
    setAnswers((prev) => {
      const current: string[] = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      let updated: string[];
      if (current.includes(option)) {
        updated = current.filter((item) => item !== option);
      } else {
        updated = [...current, option].sort();
      }
      return { ...prev, [questionId]: updated };
    });
  };

  // Handler for true / false
  const handleSelectTrueFalse = (questionId: string, val: 'true' | 'false') => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
  };

  // Handler for text inputs (short answer & essay)
  const handleTextChange = (questionId: string, text: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: text }));
  };

  // Handler for matching pairs
  const handleMatchingSelect = (questionId: string, pairId: string, targetValue: string) => {
    if (result) return;
    setAnswers((prev) => {
      const currentPairs = typeof prev[questionId] === 'object' && prev[questionId] !== null ? prev[questionId] : {};
      return {
        ...prev,
        [questionId]: {
          ...currentPairs,
          [pairId]: targetValue,
        },
      };
    });
  };

  const isQuestionAnswered = (q: any): boolean => {
    const val = answers[q.id];
    const type: QuestionType = q.type || 'single_choice';

    switch (type) {
      case 'single_choice':
      case 'case_study':
        return Boolean(val);
      case 'true_false':
        return val === 'true' || val === 'false';
      case 'multiple_choice':
        return Array.isArray(val) && val.length > 0;
      case 'short_answer':
      case 'essay':
        return typeof val === 'string' && val.trim().length > 0;
      case 'matching':
        if (!val || typeof val !== 'object') return false;
        const pairs = q.matching_pairs || [];
        return pairs.length > 0 && pairs.every((p: any) => Boolean(val[p.id]));
      default:
        return Boolean(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || !quiz.questions) return;

    // Check if all questions are answered and collect question numbers
    const unanswered = quiz.questions
      .map((q: any, idx: number) => ({ q, num: idx + 1 }))
      .filter(({ q }: { q: any; num: number }) => !isQuestionAnswered(q));

    if (unanswered.length > 0) {
      const missingNums: number[] = unanswered.map((u: { q: any; num: number }) => u.num);
      setUnansweredList(missingNums);
      const numbersText = missingNums.map((n: number) => `Soal No. ${n}`).join(', ');
      showToast({
        type: 'info',
        title: 'Soal Belum Lengkap',
        message: `Masih ada ${unanswered.length} butir soal yang belum Anda isi/jawab secara lengkap: ${numbersText}. Silakan periksa dan lengkapi terlebih dahulu.`,
      });

      // Smooth scroll to the first unanswered question
      const targetEl = document.getElementById(`question-card-${missingNums[0]}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setUnansweredList([]);

    try {
      setSubmitting(true);
      const res = await api.quizzes.submit(quizId, answers);
      setResult(res);

      if (res.result.score >= 80) {
        celebrate();
      }

      if (res.points_earned > 0) {
        showToast({
          type: 'points',
          title: `+${res.points_earned} Poin Berhasil Diperoleh!`,
          message: `Nilai Kuis: ${res.result.score}% (${res.result.correct_count}/${res.result.total_questions} terjawab benar).`,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Kuis Telah Selesai',
          message: `Nilai: ${res.result.score}%. Tidak ada tambahan poin baru (sistem anti-eksploitasi poin kuis berulang).`,
        });
      }

      if (res.new_badges && res.new_badges.length > 0) {
        res.new_badges.forEach((b: string) => notifyBadgeEarned(b));
      }

      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengirim Jawaban',
        message: err.message || 'Terjadi kesalahan saat memproses penilaian kuis.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !quiz) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded-lg" />
        <div className="h-40 bg-slate-200 rounded-3xl" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const answeredCount = questions.filter(isQuestionAnswered).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Materi</span>
        </button>

        {!result && (
          <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
            Terjawab: <span className="text-indigo-600 font-black">{answeredCount}</span>/{questions.length}
          </div>
        )}
      </div>

      {/* Quiz Title Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Mini Kuis Beragam Tipe Soal
          </span>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            Maks. {quiz.points} Poin
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {quiz.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{quiz.description}</p>
      </div>

      {/* Submission Result Summary Card */}
      {result && (
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl animate-in zoom-in-95 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-700/60 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Hasil Penilaian Otomatis Sistem
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Skor Anda: {result.result.score}%
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {result.result.correct_count} dari {result.result.total_questions} pertanyaan terjawab benar/sempurna.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs text-center border border-white/20">
                <span className="text-[10px] font-bold text-amber-300 block uppercase">Poin Diperoleh</span>
                <span className="text-xl font-black text-amber-400">+{result.points_earned} Pts</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-indigo-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-300 shrink-0" />
            <span>
              Periksa pembahasan di bawah untuk melihat rincian umpan balik setiap tipe soal dan kunci jawaban lengkap.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Coba Kuis Lagi</span>
            </button>

            <button
              onClick={onViewProgress}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Lihat Progress Saya</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const type: QuestionType = q.type || 'single_choice';
          const feedback = result?.feedback?.find((f: any) => f.id === q.id);
          const isUnansweredWarning = unansweredList.includes(idx + 1) && !isQuestionAnswered(q);

          return (
            <div
              key={q.id}
              id={`question-card-${idx + 1}`}
              className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all ${
                feedback
                  ? feedback.is_correct
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : feedback.earned_ratio > 0
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-rose-300 bg-rose-50/15'
                  : isUnansweredWarning
                  ? 'border-amber-400 bg-amber-50/20 shadow-md ring-2 ring-amber-300/70'
                  : 'border-slate-200/90 shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border mt-0.5 ${
                    isUnansweredWarning
                      ? 'bg-amber-500 text-white border-amber-600 animate-bounce'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    {/* Badge question type */}
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {isUnansweredWarning && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-amber-200 border border-amber-300 px-2.5 py-0.5 rounded-md animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-amber-800" />
                          Belum Lengkap / Belum Dijawab (Soal No. {idx + 1})
                        </span>
                      )}
                      {type === 'multiple_choice' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          <ListChecks className="w-3 h-3" />
                          Pilihan Ganda Kompleks (Bisa &gt;1 Pilihan)
                        </span>
                      )}
                      {type === 'true_false' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <ToggleLeft className="w-3 h-3" />
                          Benar / Salah (True/False)
                        </span>
                      )}
                      {type === 'matching' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <GitCompare className="w-3 h-3" />
                          Menjodohkan (Matching)
                        </span>
                      )}
                      {type === 'short_answer' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md">
                          <FileEdit className="w-3 h-3" />
                          Isian Singkat
                        </span>
                      )}
                      {type === 'essay' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3" />
                          Uraian / Esai (Penilaian Rubrik Otomatis)
                        </span>
                      )}
                      {type === 'case_study' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          <Briefcase className="w-3 h-3" />
                          Studi Kasus Praktikum
                        </span>
                      )}
                      {type === 'single_choice' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Pilihan Ganda
                        </span>
                      )}
                    </div>

                    {/* Case context banner if case study */}
                    {type === 'case_study' && q.case_context && (
                      <div className="mb-3 p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-2xl text-xs text-blue-950 leading-relaxed">
                        <strong className="block text-blue-900 font-bold mb-1 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                          Skenario Kasus:
                        </strong>
                        {q.case_context}
                      </div>
                    )}

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {q.question}
                    </h3>
                  </div>
                </div>

                {/* Score Status Badge if evaluated */}
                {feedback && (
                  <div className="shrink-0">
                    {feedback.is_correct ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Benar
                      </span>
                    ) : feedback.earned_ratio > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-200">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        Sebagian ({Math.round(feedback.earned_ratio * 100)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded-full border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Salah
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Body Based on Question Type */}

              {/* 1. Single Choice & Case Study */}
              {(type === 'single_choice' || type === 'case_study') && (
                <div className="space-y-2.5 pt-1">
                  {[
                    { key: 'a', label: q.option_a },
                    { key: 'b', label: q.option_b },
                    { key: 'c', label: q.option_c },
                    { key: 'd', label: q.option_d },
                  ].map((opt) => {
                    if (!opt.label) return null;
                    const isSelected = answers[q.id] === opt.key;
                    const isCorrectAnswer = feedback && (feedback.correct_answer === opt.key || q.correct_answer === opt.key);

                    return (
                      <button
                        type="button"
                        key={opt.key}
                        disabled={!!result}
                        onClick={() => handleSelectRadio(q.id, opt.key)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? feedback
                              ? isCorrectAnswer
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                : 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-xs'
                              : 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-xs'
                            : isCorrectAnswer
                            ? 'bg-emerald-50/50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50/60 border-slate-200/90 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                        } ${result ? 'cursor-default' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center uppercase shrink-0 transition-colors ${
                              isSelected
                                ? feedback
                                  ? isCorrectAnswer
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-rose-600 text-white'
                                  : 'bg-indigo-600 text-white'
                                : 'bg-white text-slate-500 border border-slate-200'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="text-xs sm:text-sm">{opt.label}</span>
                        </div>

                        {isSelected && !feedback && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                        {isCorrectAnswer && feedback && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Multiple Choice Kompleks */}
              {type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-1">
                  <p className="text-[11px] text-purple-700 font-medium mb-1">
                    Petunjuk: Anda dapat memilih lebih dari satu opsi jawaban. Centang setiap pernyataan yang benar.
                  </p>
                  {[
                    { key: 'a', label: q.option_a },
                    { key: 'b', label: q.option_b },
                    { key: 'c', label: q.option_c },
                    { key: 'd', label: q.option_d },
                  ].map((opt) => {
                    if (!opt.label) return null;
                    const selectedList: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                    const isSelected = selectedList.includes(opt.key);
                    const isKeyCorrect = feedback && Array.isArray(feedback.correct_answer) && feedback.correct_answer.includes(opt.key);

                    return (
                      <button
                        type="button"
                        key={opt.key}
                        disabled={!!result}
                        onClick={() => handleToggleCheckbox(q.id, opt.key)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? feedback
                              ? isKeyCorrect
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                : 'bg-rose-50 border-rose-400 text-rose-950 font-semibold'
                              : 'bg-purple-50/80 border-purple-400 text-purple-950 font-bold shadow-xs'
                            : isKeyCorrect
                            ? 'bg-emerald-50/50 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50/60 border-slate-200/90 text-slate-700 hover:bg-slate-100/70 hover:border-slate-300'
                        } ${result ? 'cursor-default' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                              isSelected
                                ? feedback
                                  ? isKeyCorrect
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-rose-600 border-rose-600 text-white'
                                  : 'bg-purple-600 border-purple-600 text-white'
                                : 'bg-white border-slate-300'
                            }`}
                          >
                            {isSelected && <span className="text-xs font-bold leading-none">✓</span>}
                          </div>
                          <span className="text-xs sm:text-sm font-medium">
                            <span className="font-bold uppercase mr-1">{opt.key}:</span>
                            {opt.label}
                          </span>
                        </div>

                        {isKeyCorrect && feedback && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                            Kunci Benar
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. True / False */}
              {type === 'true_false' && (
                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    {[
                      { key: 'true', label: 'Benar (True)', icon: CheckCircle2, color: 'emerald' },
                      { key: 'false', label: 'Salah (False)', icon: XCircle, color: 'rose' },
                    ].map((item) => {
                      const isSelected = answers[q.id] === item.key;
                      const isCorrectAnswer = feedback && feedback.correct_answer === item.key;

                      return (
                        <button
                          type="button"
                          key={item.key}
                          disabled={!!result}
                          onClick={() => handleSelectTrueFalse(q.id, item.key as any)}
                          className={`p-4 rounded-2xl border text-center font-bold text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                            isSelected
                              ? feedback
                                ? isCorrectAnswer
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200'
                                  : 'bg-rose-50 border-rose-400 text-rose-800 ring-2 ring-rose-200'
                                : 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200'
                              : isCorrectAnswer
                              ? 'bg-emerald-50/50 border-emerald-400 text-emerald-800'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          } ${result ? 'cursor-default' : ''}`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Matching */}
              {type === 'matching' && (
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-amber-950 font-medium bg-amber-50/90 p-3 rounded-2xl border border-amber-200">
                    💡 <strong>Petunjuk:</strong> Jodohkan setiap premis di sebelah kiri dengan target jawaban yang paling sesuai di sebelah kanan. Anda dapat memilih dari menu pilihan atau mengklik tombol pilihan jawaban.
                  </p>

                  {/* Get all unique available target choices */}
                  {(() => {
                    let rawOptions = (
                      q.matching_available_targets && q.matching_available_targets.length > 0
                        ? q.matching_available_targets
                        : (q.matching_pairs || []).map((p: any) => p.target)
                    ).filter((t: any) => typeof t === 'string' && t.trim().length > 0);

                    if (rawOptions.length === 0) {
                      // Fallback for standard matching question
                      rawOptions = [
                        'Mengeksekusi instruksi program dan logika komputasi',
                        'Penyimpanan memori sementara kecepatan tinggi untuk aplikasi aktif',
                        'Media penyimpanan data dan berkas sistem operasi secara permanen',
                        'Pemrosesan komputasi grafis dan visualisasi matriks 3D',
                      ];
                    }

                    const targetOptions: string[] = Array.from(new Set(rawOptions));

                    return (
                      <div className="space-y-3">
                        {/* Bank Pilihan Jawaban */}
                        <div className="p-3.5 sm:p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/90 space-y-2">
                          <span className="text-xs font-bold text-[#012E26] flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-[#EAA736]" />
                            <span>Pilihan Jawaban yang Tersedia (Bank Jawaban):</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {targetOptions.map((optText: string, tIdx: number) => {
                              const letter = String.fromCharCode(65 + tIdx);
                              return (
                                <div
                                  key={tIdx}
                                  className="p-2 sm:p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-slate-800 flex items-start gap-2 shadow-2xs"
                                >
                                  <span className="w-5 h-5 rounded-md bg-[#012E26] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {letter}
                                  </span>
                                  <span className="leading-snug font-medium">{optText}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Premises Rows */}
                        <div className="space-y-3">
                          {(q.matching_pairs || []).map((pair: any, pIdx: number) => {
                            const selectedVal = answers[q.id]?.[pair.id] || '';

                            // Retrieve the correct target for this pair (from feedback or original pair)
                            let correctTargetForPair = pair.target || '';
                            if (!correctTargetForPair && feedback && Array.isArray(feedback.correct_answer)) {
                              const matched = feedback.correct_answer.find(
                                (ca: any) => ca.id === pair.id || ca.premise === pair.premise
                              );
                              if (matched && matched.target) {
                                correctTargetForPair = matched.target;
                              }
                            }

                            const isPairCorrect =
                              feedback &&
                              selectedVal &&
                              correctTargetForPair &&
                              selectedVal.trim().toLowerCase() === correctTargetForPair.trim().toLowerCase();

                            return (
                              <div
                                key={pair.id || pIdx}
                                className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all ${
                                  feedback
                                    ? isPairCorrect
                                      ? 'bg-emerald-50/70 border-emerald-300'
                                      : 'bg-rose-50/70 border-rose-300'
                                    : selectedVal
                                    ? 'bg-slate-50/90 border-emerald-300/80 shadow-2xs'
                                    : 'bg-slate-50/70 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-6 h-6 rounded-lg bg-[#012E26] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                    {pIdx + 1}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                                    {pair.premise}
                                  </span>
                                </div>

                                <div className="flex flex-col md:items-end gap-1.5 w-full md:w-auto">
                                  <div className="flex items-center gap-2 w-full md:w-auto">
                                    <span className="text-slate-400 font-bold hidden md:inline">➔</span>
                                    <select
                                      disabled={!!result}
                                      value={selectedVal}
                                      onChange={(e) =>
                                        handleMatchingSelect(q.id, pair.id, e.target.value)
                                      }
                                      className={`w-full md:w-[380px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26] cursor-pointer shadow-2xs ${
                                        feedback
                                          ? isPairCorrect
                                            ? 'border-emerald-400 text-emerald-950 font-bold bg-emerald-50/50'
                                            : 'border-rose-400 text-rose-950 bg-rose-50/50'
                                          : selectedVal
                                          ? 'border-emerald-500 text-slate-900 font-medium'
                                          : 'border-slate-300 text-slate-800'
                                      } ${result ? 'cursor-default' : ''}`}
                                    >
                                      <option value="">-- Pilih Pasangan Jawaban --</option>
                                      {targetOptions.map((optText: string, tIdx: number) => {
                                        const letter = String.fromCharCode(65 + tIdx);
                                        return (
                                          <option key={tIdx} value={optText}>
                                            {letter}. {optText}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  {feedback && !isPairCorrect && correctTargetForPair && (
                                    <div className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 self-start md:self-auto">
                                      Pasangan benar: <span className="font-bold underline">{correctTargetForPair}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 5. Short Answer */}
              {type === 'short_answer' && (
                <div className="pt-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ketik Jawaban Singkat Anda:
                  </label>
                  <input
                    type="text"
                    disabled={!!result}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Contoh: linux, solid state drive, dll..."
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                      feedback
                        ? feedback.is_correct
                          ? 'border-emerald-400 bg-emerald-50/40 font-bold'
                          : 'border-rose-400 bg-rose-50/40'
                        : 'border-slate-200'
                    } ${result ? 'cursor-default' : ''}`}
                  />
                  {feedback && (
                    <div className="text-[11px] text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
                      <strong>Kunci Jawaban Diterima:</strong>{' '}
                      {Array.isArray(feedback.correct_answer)
                        ? feedback.correct_answer.join(' / ')
                        : feedback.correct_answer}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Essay */}
              {type === 'essay' && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <label className="font-bold text-slate-700">
                      Tulis Jawaban Uraian / Esai Anda:
                    </label>
                    <span>
                      {(answers[q.id] || '').trim().split(/\s+/).filter(Boolean).length} Kata
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    disabled={!!result}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    placeholder="Tuliskan penjelasan ilmiah Anda secara komprehensif..."
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 ${
                      feedback
                        ? feedback.is_correct
                          ? 'border-emerald-400 bg-emerald-50/30'
                          : 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-200'
                    } ${result ? 'cursor-default' : ''}`}
                  />
                  <p className="text-[11px] text-slate-500">
                    Sistem secara otomatis mengevaluasi pemahaman konsep menggunakan rubrik kata kunci esensial.
                  </p>
                </div>
              )}

              {/* Evaluation Feedback and Scientific Explanation */}
              {feedback && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                  {feedback.detail_feedback && (
                    <div className="p-3 bg-slate-100/90 rounded-xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-slate-900">Ulasan Penilaian:</strong>
                        <span>{feedback.detail_feedback}</span>
                      </div>
                    </div>
                  )}

                  {feedback.explanation && (
                    <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold text-indigo-950">Pembahasan Ilmiah:</strong>
                        <span>{feedback.explanation}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unanswered questions alert banner */}
        {unansweredList.length > 0 && !result && (
          <div className="p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl text-amber-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  Soal Belum Lengkap ({unansweredList.length} butir soal belum terisi/dijawab)
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800">
                  Masih ada butir soal yang belum Anda jawab atau belum dijodohkan secara lengkap. Klik tombol di bawah ini untuk langsung menuju butir soal yang belum selesai:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200/80">
              {unansweredList.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`question-card-${num}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Periksa Soal No. {num}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {!result && (
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm sm:text-base shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <span>Menilai Jawaban Kuis Secara Otomatis...</span>
              ) : (
                <>
                  <span>Kirim Jawaban & Dapatkan Poin</span>
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
