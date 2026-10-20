import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Course } from '../../types';
import { getUserInitials } from '../../utils/initials';
import {
  User,
  Mail,
  GraduationCap,
  Lock,
  Layers,
  Users,
  Save,
  CheckCircle2,
  BookOpen,
  Award,
  KeyRound,
  ShieldCheck,
  Calendar,
  Briefcase,
} from 'lucide-react';

export const DosenProfileView: React.FC = () => {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useNotification();

  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [nidn, setNidn] = useState(user?.nidn || '');
  const [nip, setNip] = useState(user?.nip || '');
  const [department, setDepartment] = useState(user?.department || 'Pendidikan Biologi');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setNidn(user.nidn || '');
      setNip(user.nip || '');
      setDepartment(user.department || 'Pendidikan Biologi');
      setEmail(user.email || '');
    }

    // Load courses assigned to this lecturer
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const allCourses = await api.courses.getAll();
        // Backend filters or we filter by lecturer
        const filtered = allCourses.filter(
          (c) =>
            !c.lecturer_id ||
            c.lecturer_id === user?.id ||
            (c.lecturer_name && user?.name && c.lecturer_name.toLowerCase().includes(user.name.toLowerCase()))
        );
        setMyCourses(filtered);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Aggregate taught classes
  const taughtClasses = Array.from(
    new Set(myCourses.flatMap((c) => c.enrolled_classes || []))
  );

  const totalSks = myCourses.reduce((sum, c) => sum + (c.sks || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword && newPassword !== confirmPassword) {
      showToast({
        type: 'error',
        title: 'Konfirmasi Sandi Gagal',
        message: 'Konfirmasi kata sandi baru tidak sesuai.',
      });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name,
        nidn,
        nip,
        department,
        email,
      };

      if (newPassword) {
        payload.password = newPassword;
      }

      const updated = await api.users.update(user.id, payload);
      updateLocalUser(updated);
      setNewPassword('');
      setConfirmPassword('');

      showToast({
        type: 'success',
        title: 'Profil Dosen Diperbarui',
        message: 'Informasi identitas dosen dan kredensial akun berhasil disimpan.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Profil',
        message: err.message || 'Terjadi kesalahan saat menyimpan profil.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>Profil Dosen Pengampu</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Informasi identitas dosen, NIDN/NIP, data penugasan perkuliahan, dan kredensial akun di GEMA BIO.
        </p>
      </div>

      {/* Main Identity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#012E26]/5 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#012E26] to-[#024a3e] text-[#EAA736] font-black text-2xl flex items-center justify-center shadow-lg shadow-[#012E26]/10 border-2 border-[#EAA736]/30 shrink-0">
            {getUserInitials(user?.name)}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.name}</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Dosen Pengampu Aktif
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {user?.nidn && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                  NIDN: {user.nidn}
                </span>
              )}
              {user?.nip && (
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                  NIP: {user.nip}
                </span>
              )}
              <span className="font-medium text-slate-600">
                {user?.department || 'Program Studi Pendidikan Biologi'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                @{user?.username || 'dosen'}
              </span>
              <span className="text-slate-300">•</span>
              <span>Universitas Hamzanwadi</span>
            </div>
          </div>
        </div>

        {/* Teaching Scope Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="p-4 rounded-2xl bg-[#012E26]/5 border border-[#012E26]/10 text-center">
            <span className="text-[11px] font-bold text-[#012E26] uppercase tracking-wider block">
              Mata Kuliah Diampu
            </span>
            <span className="text-2xl font-black text-[#012E26] mt-1 block">
              {myCourses.length} MK
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Kelas Perkuliahan
            </span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              {taughtClasses.length > 0 ? taughtClasses.length : 1} Kelas
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
              Beban SKS Total
            </span>
            <span className="text-2xl font-black text-indigo-900 mt-1 block">
              {totalSks > 0 ? totalSks : 3} SKS
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Status Akademik
            </span>
            <span className="text-sm font-black text-emerald-700 mt-2 block">
              Pengampu Aktif
            </span>
          </div>
        </div>
      </div>

      {/* Courses Taught List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#012E26]" />
              Mata Kuliah yang Diampu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar mata kuliah yang resmi terdaftar di bawah bimbingan Anda.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {myCourses.length} Mata Kuliah
          </span>
        </div>

        {loadingCourses ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
            Memuat daftar mata kuliah pengampu...
          </div>
        ) : myCourses.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            Belum ada mata kuliah yang ditugaskan khusus untuk akun ini. Anda dapat mengelola mata kuliah melalui menu &quot;Kelola Mata Kuliah&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {myCourses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#012E26]/40 bg-slate-50/50 hover:bg-white transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">
                      {c.code || 'BIO-MK'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug pt-1">
                      {c.name}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#012E26] bg-[#012E26]/5 px-2.5 py-1 rounded-lg shrink-0">
                    {c.sks || 3} SKS
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {c.description || 'Deskripsi silabus perkuliahan'}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    Kelas Diajar:
                  </span>
                  {c.enrolled_classes && c.enrolled_classes.length > 0 ? (
                    c.enrolled_classes.map((cls) => (
                      <span
                        key={cls}
                        className="text-[10px] font-bold bg-[#EAA736]/15 text-[#925c04] border border-[#EAA736]/30 px-2 py-0.5 rounded-md"
                      >
                        {cls}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">Semua Kelas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-[#012E26]" />
            Perbarui Data Profil Dosen
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan data identitas akademik dan kredensial akses Anda selalu valid.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap & Gelar Akademik *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dr. Sri Wahyuni, M.Pd."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Resmi Dosen *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dosen@hamzanwadi.ac.id"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Induk Dosen Nasional (NIDN)
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={nidn}
                  onChange={(e) => setNidn(e.target.value)}
                  placeholder="Contoh: 0812058401"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Induk Pegawai (NIP)
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 198405122010122001"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Program Studi / Fakultas
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Pendidikan Biologi - Fakultas Ilmu Pendidikan"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                />
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-slate-500" />
              Keamanan Akun & Ubah Kata Sandi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru (Opsional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan bila tidak ingin diubah"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang kata sandi baru"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#012E26] text-white hover:bg-[#024a3e] font-semibold text-xs sm:text-sm shadow-md shadow-[#012E26]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan Profil</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
