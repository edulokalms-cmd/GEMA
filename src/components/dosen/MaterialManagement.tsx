import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { Material } from '../../types';
import { MaterialEditorModal } from './MaterialEditorModal';
import { MaterialPreviewModal } from './MaterialPreviewModal';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Clock,
  Zap,
  Layers,
  Eye,
  Paperclip,
} from 'lucide-react';

export const MaterialManagement: React.FC = () => {
  const { courses, activeCourseId, setActiveCourseId } = useCourse();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const { showToast } = useNotification();

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await api.materials.getAll();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleDelete = async (mat: Material) => {
    if (!window.confirm(`Yakin ingin menghapus materi "${mat.title}" beserta mini kuisnya?`)) {
      return;
    }
    try {
      await api.materials.delete(mat.id);
      showToast({
        type: 'info',
        title: 'Materi Dihapus',
        message: `Materi "${mat.title}" telah dihapus.`,
      });
      loadMaterials();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Materi',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const categories = ['all', ...Array.from(new Set(materials.map((m) => m.category)))];

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesCourse = activeCourseId === 'all' || !m.course_id || m.course_id === activeCourseId;
    return matchesSearch && matchesCategory && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Materi Pembelajaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola silabus, topik pertemuan, dan modul materi perkuliahan terstruktur.
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
              setEditingMaterial(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Materi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari materi berdasarkan judul atau topik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'Semua Topik' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                <th className="py-3 px-4 w-12 text-center">Urutan</th>
                <th className="py-3 px-4">Judul & Topik</th>
                <th className="py-3 px-4">Estimasi</th>
                <th className="py-3 px-4">Lampiran Berkas</th>
                <th className="py-3 px-4">Mini Kuis</th>
                <th className="py-3 px-4 text-right">Aksi & Pratinjau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat: any) => (
                <tr key={mat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 text-center font-bold text-slate-400">
                    #{mat.order_number}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                      {mat.category}
                    </span>
                    <h4
                      onClick={() => setPreviewMaterial(mat)}
                      className="font-bold text-slate-900 text-sm mt-1 hover:text-indigo-600 cursor-pointer transition-colors"
                      title="Klik untuk pratinjau materi"
                    >
                      {mat.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {mat.description}
                    </p>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {mat.estimated_time}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {mat.attachments && mat.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                        <Paperclip className="w-3 h-3 text-purple-600" />
                        <span>{mat.attachments.length} Berkas</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">Tidak ada</span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    {mat.has_quiz ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Belum dibuat</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewMaterial(mat)}
                        className="px-2.5 py-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
                        title="Lihat / Pratinjau Tampilan Materi Mahasiswa"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat / Preview</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingMaterial(mat);
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Materi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mat)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Materi"
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

      {/* Preview Modal */}
      {previewMaterial && (
        <MaterialPreviewModal
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onEdit={(m) => {
            setPreviewMaterial(null);
            setEditingMaterial(m);
            setModalOpen(true);
          }}
        />
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <MaterialEditorModal
          material={editingMaterial}
          onClose={() => setModalOpen(false)}
          onSaved={loadMaterials}
        />
      )}
    </div>
  );
};
