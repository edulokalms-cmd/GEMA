import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from '../common/AppLogo';
import {
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  BookOpen,
  Award,
  Zap,
  CalendarCheck,
  GraduationCap,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError('Harap masukkan NIM / NIDN / Username dan kata sandi.');
      return;
    }
    try {
      setLoading(true);
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login gagal. Silakan periksa kembali NIM/NIDN dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-100 selection:text-emerald-950">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left column: Brand intro & Campus Identity */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-4">
              <div className="p-1.5 bg-white rounded-2xl shadow-md border border-slate-200/80 shrink-0">
                <AppLogo className="w-14 h-14" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#012E26] tracking-tight">
                  GEMA BIO
                </h1>
                <p className="text-sm font-bold text-[#EAA736]">
                  Gamifikasi E-Learning Mahasiswa Universitas Hamzanwadi
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Platform e-learning interaktif dan manajemen perkuliahan terpadu multi-mata kuliah. Memfasilitasi modul materi pembelajaran, mini kuis variatif, penugasan praktikum, forum diskusi interaktif, presensi kehadiran, dan pemantauan capaian penilaian.
            </p>
          </div>

          {/* Key Academic Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-[#012E26] border border-emerald-100 shrink-0">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Presensi & Tugas</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Presensi kehadiran, tugas kuliah, dan evaluasi terpadu.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-[#EAA736] border border-amber-200 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Gamifikasi Edukasi</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Peroleh poin, tingkatkan level, dan kumpulkan badge prestasi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Clean Production Login Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun Anda
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masuk menggunakan NIM (Mahasiswa) atau NIDN / Username (Dosen & Admin).
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIM / NIDN / Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan NIM atau NIDN Anda"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#012E26] focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#012E26] focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#012E26] hover:bg-[#023b31] text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <span>Masuk ke Dashboard</span>
                      <CheckCircle2 className="w-4 h-4 text-[#EAA736]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                Sistem Informasi Pembelajaran Terpadu &copy; 2026 Universitas Hamzanwadi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
