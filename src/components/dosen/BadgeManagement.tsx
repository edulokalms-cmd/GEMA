import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { Badge, BadgeConditionType } from '../../types';
import {
  Award,
  Plus,
  Zap,
  Target,
  Trophy,
  Flame,
  Compass,
  X,
  Save,
} from 'lucide-react';

export const BadgeManagement: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useNotification();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requirement, setRequirement] = useState('');
  const [icon, setIcon] = useState('award');
  const [conditionType, setConditionType] = useState<BadgeConditionType>('materials_count');
  const [conditionValue, setConditionValue] = useState(3);
  const [saving, setSaving] = useState(false);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const data = await api.badges.getAll();
      setBadges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !requirement) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Nama dan syarat badge wajib diisi.',
      });
      return;
    }
    try {
      setSaving(true);
      await api.badges.create({
        name,
        description,
        requirement,
        icon,
        condition_type: conditionType,
        condition_value: Number(conditionValue),
      });
      showToast({
        type: 'success',
        title: 'Badge Baru Ditambahkan',
        message: `Badge "${name}" siap diraih oleh mahasiswa!`,
      });
      setModalOpen(false);
      setName('');
      setDescription('');
      setRequirement('');
      loadBadges();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Membuat Badge',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'award':
        return <Award className="w-6 h-6" />;
      case 'zap':
        return <Zap className="w-6 h-6" />;
      case 'target':
        return <Target className="w-6 h-6" />;
      case 'trophy':
        return <Trophy className="w-6 h-6" />;
      case 'flame':
        return <Flame className="w-6 h-6" />;
      case 'compass':
        return <Compass className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Pengaturan Badge & Gamifikasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Konfigurasi lencana pencapaian, syarat kelulusan otomatis, dan penghargaan mahasiswa.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Badge Baru</span>
        </button>
      </div>

      {/* Badges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {badges.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  {getBadgeIcon(b.icon)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {b.condition_type}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{b.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 text-xs">
              <span className="font-bold text-slate-700 block mb-0.5">Syarat Membuka:</span>
              <p className="text-slate-500">{b.requirement}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Badge */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tambah Badge Baru</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Badge</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Super Researcher"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan penghargaan badge..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Syarat Terbuka</label>
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Contoh: Selesaikan 4 materi praktikum"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kondisi</label>
                  <select
                    value={conditionType}
                    onChange={(e) => setConditionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="first_material">Materi Pertama</option>
                    <option value="first_quiz">Kuis Pertama</option>
                    <option value="materials_count">Jumlah Materi</option>
                    <option value="quiz_perfect">Nilai Kuis 100</option>
                    <option value="points_threshold">Batas Poin Total</option>
                    <option value="all_materials">Seluruh Materi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Target</label>
                  <input
                    type="number"
                    min="1"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ikon Badge</label>
                <div className="flex gap-2">
                  {['award', 'trophy', 'zap', 'target', 'flame', 'compass'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        icon === ic
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                          : 'border-slate-200 text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {getBadgeIcon(ic)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Badge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
