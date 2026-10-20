import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { LevelBadge } from '../common/LevelBadge';
import { getUserInitials } from '../../utils/initials';
import {
  User,
  Mail,
  GraduationCap,
  Lock,
  Zap,
  Award,
  Calendar,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const StudentProfileView: React.FC = () => {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useNotification();
  const [stats, setStats] = useState<any | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setDepartment(user.department || '');
    }
    api.progress.getMy().then(setStats).catch(console.error);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      const updatePayload: any = { name, department };
      if (newPassword) {
        updatePayload.password = newPassword;
      }
      const updated = await api.users.update(user.id, updatePayload);
      updateLocalUser(updated);
      setNewPassword('');
      showToast({
        type: 'success',
        title: 'Profil Diperbarui',
        message: 'Data profil mahasiswa berhasil disimpan.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Profil',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Profil Mahasiswa
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Informasi akun akademik dan ringkasan prestasi belajar Anda di GEMA BIO.
        </p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            {getUserInitials(user?.name)}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
              {stats && (
                <LevelBadge
                  levelTitle={stats.level.title}
                  levelNumber={stats.level.level}
                  size="sm"
                />
              )}
            </div>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                NIM: {user?.student_id || '-'}
              </span>
              {user?.class_name && (
                <span className="text-xs font-bold text-[#925c04] bg-[#EAA736]/15 px-2.5 py-0.5 rounded-full border border-[#EAA736]/30">
                  Kelas: {user.class_name}
                </span>
              )}
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {user?.department || 'Pendidikan Biologi'}
              </span>
            </div>
          </div>
        </div>

        {/* Gamification Stats Summary in Profile */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 py-6 border-b border-slate-100 text-center">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">Total Poin</span>
              <span className="text-xl font-black text-amber-900">{stats.total_points} Pts</span>
            </div>
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
              <span className="text-[10px] font-bold text-purple-600 uppercase block">Level</span>
              <span className="text-xl font-black text-purple-900">{stats.level.title}</span>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase block">Lencana</span>
              <span className="text-xl font-black text-indigo-900">{stats.earned_badges_count} Badge</span>
            </div>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <h4 className="text-sm font-bold text-slate-900">Perbarui Data Akun</h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi / Jurusan</label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ubah Kata Sandi (Kosongkan jika tidak ingin mengubah)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Kata sandi baru..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
