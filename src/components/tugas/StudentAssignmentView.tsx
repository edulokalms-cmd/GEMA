import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Assignment, AssignmentSubmission } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Send,
  Award,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const StudentAssignmentView: React.FC = () => {
  const { showToast } = useNotification();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit modal / form
  const [activeAsg, setActiveAsg] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [asgs, subs] = await Promise.all([
        api.assignments.getAll(),
        api.assignments.getMySubmissions(),
      ]);
      setAssignments(asgs);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenSubmit = (asg: Assignment) => {
    const existing = submissions.find((s) => s.assignment_id === asg.id);
    setActiveAsg(asg);
    setSubmissionContent(existing?.content || '');
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsg || !submissionContent) return;

    try {
      setSubmitting(true);
      await api.assignments.submit(activeAsg.id, submissionContent);
      showToast({
        type: 'success',
        title: 'Tugas Terkirim',
        message: `Pengumpulan untuk "${activeAsg.title}" berhasil disimpan.`,
      });
      setActiveAsg(null);
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengirim Tugas',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#012E26] via-[#023b31] to-[#012E26] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Tagihan Tugas Praktikum Perkuliahan</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Penugasan Perkuliahan
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Penugasan terintegrasi langsung dengan modul pembelajaran dan penilaian semester.
          </p>
        </div>

        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">
            Status Tugas
          </span>
          <span className="text-3xl font-black text-white">
            {submissions.length}/{assignments.length}
          </span>
          <span className="text-xs font-semibold text-emerald-200 block mt-0.5">
            Tugas Selesai Dikumpulkan
          </span>
        </div>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-4">
        {assignments.map((asg) => {
          const sub = submissions.find((s) => s.assignment_id === asg.id);
          const isGraded = sub && sub.score !== undefined;

          return (
            <div
              key={asg.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold">
                    Pertemuan #{asg.meeting_number}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                </div>

                {isGraded ? (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Nilai: {sub.score} / 100
                  </span>
                ) : sub ? (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    Sudah Dikumpulkan (Menunggu Nilai)
                  </span>
                ) : (
                  <span className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Belum Dikumpulkan
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {asg.description}
              </p>

              {sub && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-700 block">Tautan / Jawaban Anda:</span>
                  <p className="text-slate-600 break-all">{sub.content}</p>
                  {sub.feedback && (
                    <div className="mt-2 p-2.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100">
                      <strong>Catatan Dosen:</strong> {sub.feedback}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenSubmit(asg)}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{sub ? 'Perbarui Pengumpulan' : 'Kumpulkan Tugas'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Modal */}
      {activeAsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-purple-700">
                Pertemuan #{activeAsg.meeting_number}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Kumpulkan: {activeAsg.title}
              </h3>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tautan File (Google Drive / GitHub / OneDrive) atau Catatan Tugas
                </label>
                <textarea
                  rows={4}
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Tempelkan tautan tugas (pastikan izin akses telah dibuka untuk publik/dosen) atau ketikkan ringkasan hasil praktikum..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAsg(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-[#EAA736]" />
                  <span>{submitting ? 'Mengirim...' : 'Kirim Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
