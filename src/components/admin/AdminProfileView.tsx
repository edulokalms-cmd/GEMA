import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { getUserInitials } from '../../utils/initials';
import {
  User,
  Mail,
  ShieldCheck,
  Lock,
  Building,
  KeyRound,
  Save,
  Server,
  Layers,
  Database,
  Calendar,
} from 'lucide-react';

export const AdminProfileView: React.FC = () => {
  const { user, updateLocalUser } = useAuth();
  const { showToast } = useNotification();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [nip, setNip] = useState(user?.nip || '');
  const [department, setDepartment] = useState(user?.department || 'Biro Administrasi Akademik & Sistem Informasi');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setNip(user.nip || '');
      setDepartment(user.department || 'Biro Administrasi Akademik & Sistem Informasi');
    }
  }, [user]);

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
        email,
        nip,
        department,
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
        title: 'Profil Administrator Diperbarui',
        message: 'Data akun administrator dan kredensial sistem berhasil disimpan.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memperbarui Profil',
        message: err.message || 'Terjadi kesalahan saat menyimpan profil administrator.',
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
          <span>Profil Administrator Sistem</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pengelolaan identitas pengelola sistem, kredensial akses, hak otoritas, dan keamanan platform GEMA BIO.
        </p>
      </div>

      {/* Main Identity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-50 rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100 relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-800 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
            {getUserInitials(user?.name)}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{user?.name}</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                Administrator Sistem (Full Control)
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                ID Staf / NIP: {user?.nip || 'ADM-GEMA-01'}
              </span>
              <span className="font-medium text-slate-600">
                {user?.department || 'Biro Administrasi Akademik & Sistem Informasi'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                @{user?.username || 'admin'}
              </span>
              <span className="text-slate-300">•</span>
              <span>Universitas Hamzanwadi</span>
            </div>
          </div>
        </div>

        {/* Admin Authority Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-center">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Tingkat Akses
            </span>
            <span className="text-sm font-black text-rose-900 mt-2 block">
              Super Admin
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Status Sistem
            </span>
            <span className="text-sm font-black text-emerald-700 mt-2 block">
              Aktif & Terverifikasi
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">
              Manajemen Data
            </span>
            <span className="text-sm font-black text-indigo-900 mt-2 block">
              Semua Modul Terbuka
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Cakupan Otoritas
            </span>
            <span className="text-sm font-black text-slate-800 mt-2 block">
              Seluruh Kampus
            </span>
          </div>
        </div>
      </div>

      {/* System Privileges Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-rose-600" />
            Otoritas & Hak Akses Administrator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Akun ini memegang hak akses tertinggi pada platform GEMA BIO Universitas Hamzanwadi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Multi-Mata Kuliah</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dapat membuat, mengedit, menghapus, dan menetapkan Dosen Pengampu untuk semua mata kuliah & kelas.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Master Akun & Import Excel</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Memiliki wewenang manajemen pengguna penuh, reset kata sandi, dan import massal data mahasiswa dari Excel.
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Konfigurasi & Branding</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengatur nama institusi, logo kampus, periode semester, serta audit aktivitas seluruh pengguna.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-rose-600" />
            Perbarui Data Profil Administrator
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbarui informasi nama administrator dan kredensial keamanan akun.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Administrator *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Administrator"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Resmi Administrator *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hamzanwadi.ac.id"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Induk Pegawai / ID Staf Administrator
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: ADM-GEMA-01"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit Kerja / Divisi
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="UPT TIK / Biro Akademik"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-semibold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
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
