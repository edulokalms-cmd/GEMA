import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  DiscussionThread,
  DiscussionCategory,
  DiscussionComment,
  Course,
} from '../../types';
import { getUserInitials } from '../../utils/initials';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Heart,
  Pin,
  CheckCircle2,
  Award,
  Send,
  User,
  Clock,
  Sparkles,
  Layers,
  BookOpen,
  X,
  MessageCircle,
  Tag,
  ChevronRight,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export const DiscussionForumView: React.FC = () => {
  const { user } = useAuth();
  const { courses, activeCourseId } = useCourse();
  const { showToast } = useNotification();

  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [search, setSearch] = useState('');

  // Modals & Active thread
  const [activeThread, setActiveThread] = useState<DiscussionThread | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState<{
    userId: string;
    userName: string;
    threadId: string;
  } | null>(null);

  // Form states
  const [submittingThread, setSubmittingThread] = useState(false);
  const [newThreadForm, setNewThreadForm] = useState({
    course_id: activeCourseId !== 'all' ? activeCourseId : courses[0]?.id || 'course_1',
    category: 'Materi Perkuliahan' as DiscussionCategory,
    meeting_number: '',
    title: '',
    content: '',
    tags: '',
  });

  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [awardPointsValue, setAwardPointsValue] = useState(10);
  const [awardReason, setAwardReason] = useState('Apresiasi kontribusi solusi aktif dalam diskusi');

  const categories: ('Semua' | DiscussionCategory)[] = [
    'Semua',
    'Materi Perkuliahan',
    'Tanya Dosen',
    'Tugas & Praktikum',
    'Diskusi Bebas',
    'Pengumuman',
  ];

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedCourseFilter !== 'all') {
        params.course_id = selectedCourseFilter;
      }
      if (selectedCategory !== 'Semua') {
        params.category = selectedCategory;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.discussions.getAll(params);
      setThreads(res);

      // If active thread is open, reload it
      if (activeThread) {
        const updated = await api.discussions.getById(activeThread.id);
        setActiveThread(updated);
      }
    } catch (err: any) {
      console.error('Failed fetching discussions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseFilter, selectedCategory, search, activeThread?.id]);

  useEffect(() => {
    fetchThreads();
  }, [selectedCourseFilter, selectedCategory, fetchThreads]);

  const handleOpenThread = async (threadId: string) => {
    try {
      const full = await api.discussions.getById(threadId);
      setActiveThread(full);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membuka Diskusi',
        message: err.message || 'Diskusi tidak ditemukan.',
      });
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadForm.title.trim() || !newThreadForm.content.trim()) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Judul dan isi topik diskusi wajib diisi.',
      });
      return;
    }

    try {
      setSubmittingThread(true);
      const tagsArray = newThreadForm.tags
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const created = await api.discussions.create({
        course_id: newThreadForm.course_id || courses[0]?.id || 'course_1',
        title: newThreadForm.title.trim(),
        content: newThreadForm.content.trim(),
        category: newThreadForm.category,
        meeting_number: newThreadForm.meeting_number ? Number(newThreadForm.meeting_number) : undefined,
        tags: tagsArray,
      });

      showToast({
        type: 'success',
        title: 'Diskusi Berhasil Dibuat',
        message:
          user?.role === 'mahasiswa'
            ? 'Topik diskusi berhasil dipublikasikan! Anda memperoleh +10 Poin keaktifan.'
            : 'Topik diskusi berhasil dipublikasikan.',
      });

      setShowCreateModal(false);
      setNewThreadForm({
        course_id: activeCourseId !== 'all' ? activeCourseId : courses[0]?.id || 'course_1',
        category: 'Materi Perkuliahan',
        meeting_number: '',
        title: '',
        content: '',
        tags: '',
      });

      fetchThreads();
      handleOpenThread(created.id);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membuat Diskusi',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await api.discussions.addComment(activeThread.id, replyContent.trim());
      setReplyContent('');

      showToast({
        type: 'success',
        title: 'Tanggapan Terkirim',
        message:
          user?.role === 'mahasiswa'
            ? 'Tanggapan Anda berhasil diunggah! +5 Poin keaktifan diperoleh.'
            : 'Tanggapan Anda berhasil diunggah.',
      });

      // Refresh current thread
      const updated = await api.discussions.getById(activeThread.id);
      setActiveThread(updated);
      fetchThreads();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengirim Tanggapan',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleToggleLikeThread = async (threadId: string) => {
    try {
      const res = await api.discussions.toggleLike(threadId);
      if (activeThread && activeThread.id === threadId) {
        setActiveThread({
          ...activeThread,
          likes: res.likes,
          liked_by: res.liked
            ? [...(activeThread.liked_by || []), user!.id]
            : (activeThread.liked_by || []).filter((id) => id !== user!.id),
        });
      }
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                likes: res.likes,
                liked_by: res.liked
                  ? [...(t.liked_by || []), user!.id]
                  : (t.liked_by || []).filter((id) => id !== user!.id),
              }
            : t
        )
      );
    } catch (err: any) {
      console.error('Failed toggling like:', err);
    }
  };

  const handleToggleLikeComment = async (commentId: string) => {
    if (!activeThread) return;
    try {
      const res = await api.discussions.toggleCommentLike(activeThread.id, commentId);
      setActiveThread({
        ...activeThread,
        comments: (activeThread.comments || []).map((c) =>
          c.id === commentId
            ? {
                ...c,
                likes: res.likes,
                liked_by: res.liked
                  ? [...(c.liked_by || []), user!.id]
                  : (c.liked_by || []).filter((id) => id !== user!.id),
              }
            : c
        ),
      });
    } catch (err: any) {
      console.error('Failed toggling comment like:', err);
    }
  };

  const handleTogglePin = async (threadId: string) => {
    try {
      const res = await api.discussions.togglePin(threadId);
      showToast({
        type: 'info',
        title: res.is_pinned ? 'Diskusi Disematkan' : 'Sematkan Dicabut',
        message: res.is_pinned
          ? 'Diskusi kini berada di posisi teratas forum.'
          : 'Diskusi kembali ke urutan normal.',
      });
      fetchThreads();
      if (activeThread && activeThread.id === threadId) {
        setActiveThread({ ...activeThread, is_pinned: res.is_pinned });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Sematan',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleToggleEndorseComment = async (commentId: string) => {
    if (!activeThread) return;
    try {
      const res = await api.discussions.toggleCommentEndorse(activeThread.id, commentId);
      showToast({
        type: 'success',
        title: res.is_endorsed ? 'Jawaban Terverifikasi Dosen' : 'Status Dibatalkan',
        message: res.is_endorsed
          ? 'Komentar ditandai sebagai jawaban terverifikasi dari pengampu perkuliahan.'
          : 'Tanda verifikasi dicabut.',
      });
      const updated = await api.discussions.getById(activeThread.id);
      setActiveThread(updated);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memverifikasi Jawaban',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleAwardPoints = async () => {
    if (!showAwardModal) return;
    try {
      await api.discussions.awardPoint(showAwardModal.threadId, {
        target_user_id: showAwardModal.userId,
        points: awardPointsValue,
        reason: awardReason,
      });

      showToast({
        type: 'success',
        title: 'Poin Keaktifan Diberikan',
        message: `Berhasil memberikan +${awardPointsValue} poin kepada ${showAwardModal.userName}.`,
      });

      setShowAwardModal(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memberikan Poin',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleDeleteThread = async (threadId: string, title?: string) => {
    if (
      !window.confirm(
        `Yakin ingin menghapus topik diskusi "${title || 'ini'}"? Seluruh balasan komentar akan ikut terhapus permanen.`
      )
    ) {
      return;
    }
    try {
      await api.discussions.deleteThread(threadId);
      showToast({
        type: 'info',
        title: 'Topik Diskusi Dihapus',
        message: 'Topik diskusi berhasil dihapus dari forum.',
      });
      if (activeThread?.id === threadId) {
        setActiveThread(null);
      }
      fetchThreads();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Diskusi',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    if (!window.confirm('Yakin ingin menghapus tanggapan/komentar ini?')) {
      return;
    }
    try {
      await api.discussions.deleteComment(threadId, commentId);
      showToast({
        type: 'info',
        title: 'Komentar Dihapus',
        message: 'Balasan komentar berhasil dihapus.',
      });
      if (activeThread) {
        const updated = await api.discussions.getById(activeThread.id);
        setActiveThread(updated);
      }
      fetchThreads();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Komentar',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Materi Perkuliahan':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      case 'Tanya Dosen':
        return 'bg-amber-50 text-amber-900 border-amber-200/80';
      case 'Tugas & Praktikum':
        return 'bg-purple-50 text-purple-800 border-purple-200/80';
      case 'Pengumuman':
        return 'bg-rose-50 text-rose-800 border-rose-200/80';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200/80';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#012E26] text-xs font-bold border border-emerald-200/80 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#012E26]" />
            <span>Aktifitas Pembelajaran Terpadu • Forum Diskusi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Forum Diskusi Perkuliahan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ruang tanya jawab akademis, pemantik materi, solusi praktikum, dan diskusi interaktif antar mahasiswa & dosen.
          </p>
        </div>

        <button
          onClick={() => {
            setNewThreadForm((prev) => ({
              ...prev,
              course_id: activeCourseId !== 'all' ? activeCourseId : courses[0]?.id || 'course_1',
            }));
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-[#012E26]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#EAA736]" />
          <span>Mulai Topik Diskusi Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari topik diskusi atau pertanyaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Course Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white cursor-pointer"
            >
              <option value="all">Semua Mata Kuliah</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#012E26] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion Threads List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
            Memuat topik diskusi perkuliahan...
          </div>
        ) : threads.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Belum Ada Topik Diskusi</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Jadilah yang pertama memulai diskusi untuk mata kuliah ini dan peroleh poin partisipasi aktif!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#012E26] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#023b31]"
            >
              Mulai Diskusi Sekarang
            </button>
          </div>
        ) : (
          threads.map((thread) => {
            const hasLiked = user && thread.liked_by?.includes(user.id);
            const course = courses.find((c) => c.id === thread.course_id);

            return (
              <div
                key={thread.id}
                onClick={() => handleOpenThread(thread.id)}
                className={`p-5 bg-white rounded-3xl border transition-all cursor-pointer hover:border-slate-300 hover:shadow-md ${
                  thread.is_pinned
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/20 via-white to-white'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Meta Top: Pinned, Course, Category, Meeting */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {thread.is_pinned && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                          <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                          Disematkan
                        </span>
                      )}

                      <span
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-white uppercase"
                        style={{ backgroundColor: course?.color || '#012E26' }}
                      >
                        {course?.code || thread.course_name || 'Mata Kuliah'}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getCategoryBadgeClass(
                          thread.category
                        )}`}
                      >
                        {thread.category}
                      </span>

                      {thread.meeting_number && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          Pertemuan {thread.meeting_number}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                      {thread.title}
                    </h3>

                    {/* Preview Content */}
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {thread.content}
                    </p>

                    {/* Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {thread.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium"
                          >
                            <Tag className="w-2.5 h-2.5 text-slate-400" />
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Author Info & Stats */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#012E26] text-white font-bold text-[10px] flex items-center justify-center">
                      {getUserInitials(thread.user_name)}
                    </div>
                    <span className="font-bold text-slate-800">{thread.user_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {thread.user_role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">•</span>
                    <span className="text-slate-400 hidden sm:inline text-[11px]">
                      {new Date(thread.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Likes and Comments */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLikeThread(thread.id);
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-xs font-bold ${
                        hasLiked
                          ? 'text-rose-600 bg-rose-50'
                          : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-600' : ''}`}
                      />
                      <span>{thread.likes || 0}</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-xl">
                      <MessageCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>{thread.comments_count || 0} Balasan</span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL THREAD MODAL */}
      {activeThread && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeThread.is_pinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px]">
                      <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                      Disematkan
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#012E26] text-white uppercase">
                    {activeThread.course_name || 'Mata Kuliah'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${getCategoryBadgeClass(
                      activeThread.category
                    )}`}
                  >
                    {activeThread.category}
                  </span>
                  {activeThread.meeting_number && (
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                      Pertemuan {activeThread.meeting_number}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  {activeThread.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveThread(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body: Question & Comments */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
              {/* Question Main Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#012E26] text-white font-bold text-xs flex items-center justify-center">
                      {getUserInitials(activeThread.user_name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{activeThread.user_name}</p>
                      <p className="text-[10px] text-slate-500">
                        {activeThread.user_role === 'dosen' ? 'Dosen Pengampu' : 'Mahasiswa'} •{' '}
                        {new Date(activeThread.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Dosen: Pin & Award Points */}
                  <div className="flex items-center gap-1.5">
                    {(user?.role === 'dosen' || user?.role === 'admin') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(activeThread.id)}
                          className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            activeThread.is_pinned
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Sematkan / Lepas Semat"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {activeThread.is_pinned ? 'Lepas Semat' : 'Sematkan'}
                          </span>
                        </button>

                        {activeThread.user_role === 'mahasiswa' && (
                          <button
                            type="button"
                            onClick={() =>
                              setShowAwardModal({
                                userId: activeThread.user_id,
                                userName: activeThread.user_name,
                                threadId: activeThread.id,
                              })
                            }
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-100"
                            title="Beri Poin Keaktifan"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span className="hidden sm:inline">Beri Poin</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteThread(activeThread.id, activeThread.title)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-rose-100"
                          title="Hapus Topik Diskusi Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="hidden sm:inline">Hapus</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleLikeThread(activeThread.id)}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        user && activeThread.liked_by?.includes(user.id)
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          user && activeThread.liked_by?.includes(user.id)
                            ? 'fill-rose-600 text-rose-600'
                            : ''
                        }`}
                      />
                      <span>{activeThread.likes || 0}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {activeThread.content}
                </div>

                {activeThread.tags && activeThread.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/60">
                    {activeThread.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600 font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Tanggapan & Diskusi ({activeThread.comments?.length || 0})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Diskusi terbuka dan terverifikasi dosen
                  </span>
                </div>

                {(!activeThread.comments || activeThread.comments.length === 0) ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Belum ada balasan untuk topik ini. Jadilah yang pertama memberikan tanggapan!
                  </div>
                ) : (
                  activeThread.comments.map((comment) => {
                    const hasLikedComment = user && comment.liked_by?.includes(user.id);

                    return (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                          comment.is_endorsed
                            ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/50'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#012E26] text-white font-bold text-[11px] flex items-center justify-center">
                              {getUserInitials(comment.user_name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {comment.user_name}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase ${
                                    comment.user_role === 'dosen'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {comment.user_role === 'dosen' ? 'Dosen' : 'Mahasiswa'}
                                </span>
                                {comment.is_endorsed && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Jawaban Terverifikasi Dosen
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(comment.created_at).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center gap-1.5">
                            {(user?.role === 'dosen' || user?.role === 'admin') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleEndorseComment(comment.id)}
                                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                                    comment.is_endorsed
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                  title="Tandai Jawaban Terverifikasi"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {comment.is_endorsed ? 'Terverifikasi' : 'Verifikasi'}
                                  </span>
                                </button>

                                {comment.user_role === 'mahasiswa' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAwardModal({
                                        userId: comment.user_id,
                                        userName: comment.user_name,
                                        threadId: activeThread.id,
                                      })
                                    }
                                    className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                                    title="Beri Poin Keaktifan"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}

                            {(user?.role === 'dosen' || user?.role === 'admin' || user?.id === comment.user_id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(activeThread.id, comment.id)}
                                className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Hapus Balasan Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleLikeComment(comment.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                hasLikedComment
                                  ? 'text-rose-600 bg-rose-50'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${hasLikedComment ? 'fill-rose-600' : ''}`}
                              />
                              <span>{comment.likes || 0}</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                          {comment.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Tulis Tanggapan Anda:</span>
                {user?.role === 'mahasiswa' && (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    +5 Poin Keaktifan diperoleh per balasan
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Ketik tanggapan akademis, solusi, atau pertanyaan lanjutan..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="px-4 bg-[#012E26] hover:bg-[#023b31] text-white rounded-2xl font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-[#012E26]/20"
                >
                  <Send className="w-4 h-4 text-[#EAA736]" />
                  <span className="hidden sm:inline text-xs">Kirim</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE DISCUSSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#012E26]/10 text-[#012E26]">
                  <MessageSquare className="w-5 h-5 text-[#012E26]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Mulai Topik Diskusi Baru</h3>
                  <p className="text-xs text-slate-500">
                    Ajukan pertanyaan atau bagikan topik pemantik untuk perkuliahan.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mata Kuliah *
                  </label>
                  <select
                    value={newThreadForm.course_id}
                    onChange={(e) =>
                      setNewThreadForm({ ...newThreadForm, course_id: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Diskusi *
                  </label>
                  <select
                    value={newThreadForm.category}
                    onChange={(e) =>
                      setNewThreadForm({
                        ...newThreadForm,
                        category: e.target.value as DiscussionCategory,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    <option value="Materi Perkuliahan">Materi Perkuliahan</option>
                    <option value="Tanya Dosen">Tanya Dosen</option>
                    <option value="Tugas & Praktikum">Tugas & Praktikum</option>
                    <option value="Diskusi Bebas">Diskusi Bebas</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pertemuan Terkait (Opsional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  placeholder="Contoh: 2 (Pertemuan 2)"
                  value={newThreadForm.meeting_number}
                  onChange={(e) =>
                    setNewThreadForm({ ...newThreadForm, meeting_number: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Topik Diskusi *
                </label>
                <input
                  type="text"
                  placeholder="Tulis judul pertanyaan atau topik diskusi yang jelas..."
                  value={newThreadForm.title}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pertanyaan / Topik Pemantik *
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan pertanyaan Anda secara rinci, cantumkan konteks masalah praktikum atau materi yang belum dipahami..."
                  value={newThreadForm.content}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, content: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tagar / Topik Terkait (Pisahkan koma)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: formula, spreadsheet, praktikum, backup"
                  value={newThreadForm.tags}
                  onChange={(e) => setNewThreadForm({ ...newThreadForm, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
                />
              </div>

              {user?.role === 'mahasiswa' && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Anda akan memperoleh <strong>+10 Poin Keaktifan</strong> setelah mempublikasikan topik diskusi ini.
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingThread}
                  className="px-5 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold shadow-md shadow-[#012E26]/20 transition-all cursor-pointer disabled:opacity-60"
                >
                  {submittingThread ? 'Memproses...' : 'Publikasikan Diskusi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AWARD POINTS MODAL (FOR LECTURER) */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Beri Poin Keaktifan</h3>
                <p className="text-xs text-slate-500">Kepada: {showAwardModal.userName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Poin Apresiasi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 25].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setAwardPointsValue(pts)}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        awardPointsValue === pts
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      +{pts} Poin
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penghargaan
                </label>
                <input
                  type="text"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAwardModal(null)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAwardPoints}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-amber-200"
                >
                  Kirimkan Poin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
