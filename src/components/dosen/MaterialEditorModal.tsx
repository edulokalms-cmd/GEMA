import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { useCourse } from '../../context/CourseContext';
import { useNotification } from '../../context/NotificationContext';
import { Material, MaterialAttachment } from '../../types';
import { RichContentRenderer } from '../common/RichContentRenderer';
import { PRESET_DIAGRAMS, PresetDiagram } from '../../data/presetDiagrams';
import {
  X,
  Save,
  Plus,
  Trash2,
  Layers,
  Paperclip,
  Upload,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Table,
  Lightbulb,
  Code,
  Eye,
  Edit3,
  Sparkles,
  Link2,
  Check,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface MaterialEditorModalProps {
  material?: Material | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = [
  'Pengenalan Aplikasi Komputer',
  'Sistem Operasi',
  'Pengolah Kata',
  'Pengolah Angka',
  'Presentasi',
  'Internet dan Teknologi Informasi',
  'Keamanan Digital',
  'Aplikasi Produktivitas',
  'Kolaborasi Digital',
  'Bioinformatika',
  'Basis Data',
  'AI & Etika Akademik',
  'Proyek Terpadu',
  'Evaluasi Semester',
];

export const MaterialEditorModal: React.FC<MaterialEditorModalProps> = ({
  material,
  onClose,
  onSaved,
}) => {
  const { showToast } = useNotification();
  const { courses, activeCourseId } = useCourse();
  const [courseId, setCourseId] = useState(
    material?.course_id || (activeCourseId !== 'all' ? activeCourseId : courses[0]?.id || 'course_1')
  );
  const [title, setTitle] = useState(material?.title || '');
  const [category, setCategory] = useState(material?.category || CATEGORIES[0]);
  const [description, setDescription] = useState(material?.description || '');
  const [content, setContent] = useState(material?.content || '');
  const [estimatedTime, setEstimatedTime] = useState(material?.estimated_time || '20 Menit');
  const [orderNumber, setOrderNumber] = useState(material?.order_number || 1);
  const [objectives, setObjectives] = useState<string[]>(
    material?.learning_objectives || ['Memahami konsep dasar materi perkuliahan.']
  );
  const [attachments, setAttachments] = useState<MaterialAttachment[]>(
    material?.attachments || []
  );

  // Editor modes & helpers
  const [contentViewMode, setContentViewMode] = useState<'edit' | 'preview'>('edit');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageModalTab, setImageModalTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageCaptionInput, setImageCaptionInput] = useState('');
  const [imageUploadedDataUrl, setImageUploadedDataUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetDiagram | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const handleAddObjective = () => {
    setObjectives([...objectives, '']);
  };

  const handleUpdateObjective = (index: number, val: string) => {
    const updated = [...objectives];
    updated[index] = val;
    setObjectives(updated);
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  // Cursor insertion helper
  const insertAtCursor = (before: string, after: string = '', defaultText: string = '') => {
    if (!textareaRef.current) {
      setContent((prev) => prev + before + defaultText + after);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selected = content.substring(start, end) || defaultText;
    const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          start + before.length,
          start + before.length + selected.length
        );
      }
    }, 0);
  };

  // Paste listener for images (e.g. screenshot pasted directly)
  const handleTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const dataUrl = (loadEvt.target?.result as string) || '';
            const caption = 'Tangkapan Layar Gambar Materi ' + new Date().toLocaleTimeString();
            const tag = `\n\n![${caption}](${dataUrl})\n\n`;
            insertAtCursor(tag);

            // Also add to attachments list
            const newAtt: MaterialAttachment = {
              id: 'att_' + Date.now(),
              name: caption + '.png',
              type: 'image',
              url: dataUrl,
              size: (file.size / 1024).toFixed(1) + ' KB',
            };
            setAttachments((prev) => [...prev, newAtt]);

            showToast({
              type: 'success',
              title: 'Gambar Berhasil Ditempel!',
              message: 'Tangkapan layar disisipkan ke naskah dan lampiran materi.',
            });
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  // Insert Image from modal
  const handleConfirmInsertImage = () => {
    let finalUrl = '';
    let finalCaption = imageCaptionInput.trim();

    if (imageModalTab === 'upload') {
      if (!imageUploadedDataUrl) {
        showToast({
          type: 'error',
          title: 'Belum Ada Gambar',
          message: 'Silakan pilih berkas gambar dari perangkat Anda.',
        });
        return;
      }
      finalUrl = imageUploadedDataUrl;
      if (!finalCaption) finalCaption = 'Gambar Ilustrasi Materi';
    } else if (imageModalTab === 'url') {
      if (!imageUrlInput.trim()) {
        showToast({
          type: 'error',
          title: 'URL Belum Diisi',
          message: 'Masukkan tautan URL gambar (https://...).',
        });
        return;
      }
      finalUrl = imageUrlInput.trim();
      if (!finalCaption) finalCaption = 'Gambar Materi Perkuliahan';
    } else if (imageModalTab === 'presets') {
      if (!selectedPreset) {
        showToast({
          type: 'error',
          title: 'Pilih Diagram',
          message: 'Silakan pilih salah satu diagram perkuliahan dari daftar.',
        });
        return;
      }
      finalUrl = selectedPreset.dataUrl;
      finalCaption = imageCaptionInput.trim() || selectedPreset.caption;
    }

    // Insert markdown tag at cursor
    const tag = `\n\n![${finalCaption}](${finalUrl})\n\n`;
    insertAtCursor(tag);

    // Also auto-add to attachments if not already present
    const exists = attachments.some((a) => a.url === finalUrl);
    if (!exists) {
      setAttachments((prev) => [
        ...prev,
        {
          id: 'att_' + Date.now(),
          name: finalCaption,
          type: 'image',
          url: finalUrl,
          size: 'Gambar Konten',
        },
      ]);
    }

    setShowImageModal(false);
    setImageUploadedDataUrl('');
    setImageUrlInput('');
    setImageCaptionInput('');
    setSelectedPreset(null);

    showToast({
      type: 'success',
      title: 'Gambar Berhasil Disisipkan',
      message: `"${finalCaption}" telah dicantumkan ke dalam naskah materi.`,
    });
  };

  // Upload file to attachments and prompt to insert into text
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let fileType: MaterialAttachment['type'] = 'doc';
      if (ext === 'pdf') fileType = 'pdf';
      else if (['ppt', 'pptx', 'key'].includes(ext)) fileType = 'presentation';
      else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'spreadsheet';
      else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) fileType = 'image';

      const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      };

      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = (loadEvt.target?.result as string) || '';
        const newAtt: MaterialAttachment = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          type: fileType,
          url: dataUrl,
          size: formatSize(file.size),
        };
        setAttachments((prev) => [...prev, newAtt]);

        // If it's an image, also insert directly into markdown
        if (fileType === 'image') {
          insertAtCursor(`\n\n![${file.name}](${dataUrl})\n\n`);
        } else {
          insertAtCursor(`\n\n📎 [Unduh Dokumen: ${file.name}](${dataUrl})\n\n`);
        }

        showToast({
          type: 'success',
          title: 'Berkas Berhasil Disisipkan!',
          message: `"${file.name}" otomatis ditambahkan ke lampiran & naskah materi.`,
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddManualLink = () => {
    const name = window.prompt('Masukkan nama berkas/dokumen (contoh: Modul Praktikum 1.pdf):');
    if (!name || !name.trim()) return;

    const url = window.prompt(
      'Masukkan URL atau tautan berkas (contoh: https://drive.google.com/... atau URL dokumen):',
      'https://'
    );
    if (!url || !url.trim()) return;

    const ext = name.split('.').pop()?.toLowerCase() || '';
    let fileType: MaterialAttachment['type'] = 'doc';
    if (ext === 'pdf') fileType = 'pdf';
    else if (['ppt', 'pptx'].includes(ext)) fileType = 'presentation';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'spreadsheet';
    else if (['jpg', 'jpeg', 'png', 'svg'].includes(ext)) fileType = 'image';

    const newAtt: MaterialAttachment = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      type: fileType,
      url: url.trim(),
      size: 'Tautan Eksternal',
    };
    setAttachments((prev) => [...prev, newAtt]);

    if (fileType === 'image') {
      insertAtCursor(`\n\n![${name.trim()}](${url.trim()})\n\n`);
    } else {
      insertAtCursor(`\n\n📎 [Unduh Dokumen: ${name.trim()}](${url.trim()})\n\n`);
    }
  };

  const handleInsertAttachmentToContent = (att: MaterialAttachment) => {
    if (att.type === 'image') {
      insertAtCursor(`\n\n![${att.name}](${att.url})\n\n`);
    } else {
      insertAtCursor(`\n\n📎 [Unduh Dokumen: ${att.name}](${att.url})\n\n`);
    }
    showToast({
      type: 'success',
      title: 'Disisipkan ke Naskah',
      message: `Tautan "${att.name}" telah ditambahkan ke isi materi.`,
    });
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !content) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Judul, kategori, dan isi materi wajib diisi.',
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        course_id: courseId,
        title,
        category,
        description,
        content,
        estimated_time: estimatedTime,
        order_number: Number(orderNumber),
        learning_objectives: objectives.filter((o) => o.trim().length > 0),
        attachments,
      };

      if (material) {
        await api.materials.update(material.id, payload);
        showToast({
          type: 'success',
          title: 'Materi Diperbarui',
          message: `Materi "${title}" berhasil diubah beserta seluruh berkas dan gambarnya.`,
        });
      } else {
        await api.materials.create(payload);
        showToast({
          type: 'success',
          title: 'Materi Dibuat',
          message: `Materi baru "${title}" berhasil ditambahkan ke silabus.`,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Materi',
        message: err.message || 'Terjadi kesalahan saat menyimpan ke server.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                {material ? 'Edit Mode' : 'Baru'}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {material ? 'Ubah Materi Perkuliahan' : 'Tambah Materi Perkuliahan Baru'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola naskah pembelajaran terstruktur, lampirkan dokumen, dan sisipkan gambar diagram.
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {courses.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#012E26]" />
                <span>Mata Kuliah Target</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-[#012E26] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold cursor-pointer"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.lecturer_name || 'Dosen'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori / Topik Perkuliahan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Urutan Pertemuan
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estimasi Waktu
                </label>
                <input
                  type="text"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Contoh: 20 Menit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Materi Lengkap
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pertemuan 3: Pengolah Kata Ilmiah & Manajemen Sitasi"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Singkat / Ringkasan Topik
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi ringkas yang muncul pada kartu materi..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Learning Objectives List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Tujuan Pembelajaran Khusus
              </label>
              <button
                type="button"
                onClick={handleAddObjective}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Poin</span>
              </button>
            </div>
            <div className="space-y-2">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => handleUpdateObjective(i, e.target.value)}
                    placeholder={`Poin tujuan pembelajaran #${i + 1}`}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveObjective(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KOTAK MERAH (ISI / KONTEN MATERI) DENGAN TOOLBAR GAMBAR & FILE LENGKAP */}
          {/* ========================================================================= */}
          <div className="space-y-2 border-2 border-indigo-200/90 rounded-2xl p-3.5 sm:p-4 bg-white shadow-xs">
            {/* Top Bar: Label & View Mode Switcher (Tulis vs Pratinjau Sebelum Disimpan) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Isi Konten Pembelajaran (Mendukung Gambar, Berkas, &amp; Markdown)</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Cantumkan gambar diagram, file dokumen, sub-bab, dan tips perkuliahan secara interaktif.
                </p>
              </div>

              {/* Mode Toggle Buttons: Tulis vs Pratinjau Sebelum Disimpan */}
              <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setContentViewMode('edit')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    contentViewMode === 'edit'
                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Tulis Naskah</span>
                </button>
                <button
                  type="button"
                  onClick={() => setContentViewMode('preview')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    contentViewMode === 'preview'
                      ? 'bg-indigo-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Tampilan (Sebelum Disimpan)</span>
                </button>
              </div>
            </div>

            {/* Quick Format & Insert Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 py-1.5 px-2 bg-slate-50 rounded-xl border border-slate-200/90 text-slate-700">
              {/* Media Insertion Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowImageModal(true)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Sisipkan gambar dari komputer, URL, atau diagram siap pakai"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Sisipkan Gambar</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Unggah berkas dokumen (PDF, Word, PPT, Excel) dan sisipkan ke naskah"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Sisipkan File / Dokumen</span>
                </button>

                <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

                {/* Markdown Formatting Helpers */}
                <button
                  type="button"
                  onClick={() => insertAtCursor('**', '**', 'teks tebal')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Tebal (Bold: **teks**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('*', '*', 'teks miring')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Miring (Italic: *teks*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n\n## ', '\n', 'Judul Sub-Bab')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Sub-Bab (Heading 2: ## Judul)"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n\n### ', '\n', 'Poin Bahasan')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Poin Bahasan (Heading 3: ### Poin)"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n- ', '\n', 'Poin materi')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Daftar Poin (List)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n\n> 💡 **Tips Perkuliahan:** ', '\n\n', 'Tuliskan catatan penting atau tips untuk mahasiswa di sini.')}
                  className="px-2 py-1 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Kotak Tips & Catatan Perkuliahan"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Kotak Tips</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertAtCursor(
                      '\n\n| No | Komponen | Fungsi Utama |\n|---|---|---|\n| 1 | CPU | Pemrosesan Instruksi |\n| 2 | RAM | Memori Sementara |\n\n'
                    )
                  }
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Sisipkan Template Tabel Data"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertAtCursor('\n```text\n', '\n```\n', 'kode atau perintah')}
                  className="p-1.5 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-700 transition-colors cursor-pointer"
                  title="Blok Kode / Perintah"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[10px] text-slate-400 hidden xl:inline">
                Dapat paste gambar langsung (Ctrl+V)
              </span>
            </div>

            {/* Content Area View: Editor vs Live Preview Sebelum Disimpan */}
            {contentViewMode === 'edit' ? (
              <div>
                <textarea
                  ref={textareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handleTextareaPaste}
                  placeholder="Tuliskan naskah materi pembelajaran di sini... Anda dapat menyisipkan foto diagram menggunakan tombol 'Sisipkan Gambar' di atas, menempelkan screenshot (Ctrl+V), atau menyisipkan file modul PDF."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Mendukung format gambar ![Keterangan](url) &amp; file 📎 [Unduh](url)
                    </span>
                  </div>
                  <span>{content.length} karakter</span>
                </div>
              </div>
            ) : (
              /* LIVE PREVIEW SEBELUM DISIMPAN */
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 text-xs text-indigo-900">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Mode Pratinjau Langsung (Sebelum Disimpan):</strong> Gambar diagram, dokumen berkas, kotak tips, dan tabel ditampilkan persis seperti yang akan dilihat mahasiswa dan dosen.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContentViewMode('edit')}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Kembali ke Edit
                  </button>
                </div>

                <div className="p-4 sm:p-6 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-[460px] overflow-y-auto">
                  <RichContentRenderer content={content} />
                </div>
              </div>
            )}
          </div>

          {/* Lampiran Dokumen, File, atau Gambar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lampiran Dokumen, Modul PDF, Slide, atau Gambar ({attachments.length})</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Berkas bahan ajar pendukung yang dapat diunduh mahasiswa. Klik &quot;+ Sisipkan ke Naskah&quot; untuk mencantumkannya ke isi bacaan materi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Berkas File</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddManualLink}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tautan URL</span>
                </button>
              </div>
            </div>

            {attachments.length > 0 ? (
              <div className="space-y-2 pt-1">
                {attachments.map((att) => {
                  const isReferencedInContent =
                    content.includes(att.url) || content.includes(att.name);

                  return (
                    <div
                      key={att.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                          {att.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                          ) : att.type === 'spreadsheet' ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-rose-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{att.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="uppercase font-bold text-indigo-600">{att.type}</span>
                            {att.size && <span>• {att.size}</span>}
                            {isReferencedInContent && (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Sudah di naskah
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleInsertAttachmentToContent(att)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Cantumkan berkas ini ke dalam teks kotak naskah di atas"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Sisipkan ke Naskah</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                          title="Hapus Lampiran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-white/80 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Belum ada lampiran. Klik &quot;Pilih Berkas File&quot; atau &quot;Tautan URL&quot; untuk melampirkan modul atau slide pendukung.
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              Periksa pratinjau sebelum menyimpan untuk memastikan tampilan rapi.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
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
                <span>{saving ? 'Menyimpan...' : 'Simpan Materi'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* MODAL SISIPKAN GAMBAR KE DALAM NASKAH */}
      {/* ========================================================================= */}
      {showImageModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Sisipkan Gambar ke Naskah</h4>
                  <p className="text-xs text-slate-500">
                    Pilih sumber gambar diagram, modul, atau foto praktikum.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Tab Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setImageModalTab('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  imageModalTab === 'upload'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah dari Komputer</span>
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab('presets')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  imageModalTab === 'presets'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Diagram Perkuliahan</span>
              </button>
              <button
                type="button"
                onClick={() => setImageModalTab('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  imageModalTab === 'url'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Tautan URL</span>
              </button>
            </div>

            {/* Tab 1: Upload from Device */}
            {imageModalTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={imageUploadInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (loadEvt) => {
                      const dataUrl = (loadEvt.target?.result as string) || '';
                      setImageUploadedDataUrl(dataUrl);
                      if (!imageCaptionInput) {
                        setImageCaptionInput(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                <div
                  onClick={() => imageUploadInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  {imageUploadedDataUrl ? (
                    <div className="space-y-2">
                      <img
                        src={imageUploadedDataUrl}
                        alt="Pratinjau"
                        className="max-h-40 rounded-xl mx-auto shadow-md border border-slate-200 object-contain"
                      />
                      <p className="text-xs font-bold text-indigo-600">Klik untuk mengganti gambar</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-2xl shadow-xs text-indigo-600 mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik untuk memilih gambar dari perangkat Anda
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Format didukung: PNG, JPG, JPEG, WebP, SVG (Maks. 5 MB)
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Preset Educational Diagrams */}
            {imageModalTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Pilih diagram ilmiah vektor beresolusi tinggi yang relevan dengan topik:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {PRESET_DIAGRAMS.map((diag) => {
                    const isSelected = selectedPreset?.id === diag.id;
                    return (
                      <div
                        key={diag.id}
                        onClick={() => {
                          setSelectedPreset(diag);
                          setImageCaptionInput(diag.caption);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                        }`}
                      >
                        <div className="h-20 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                          <img
                            src={diag.dataUrl}
                            alt={diag.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{diag.title}</p>
                          <span className="text-[10px] text-indigo-600 font-semibold">{diag.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {imageModalTab === 'url' && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Tautan Gambar (URL)</label>
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/diagram-praktikum.png"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {imageUrlInput && (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <img
                      src={imageUrlInput}
                      alt="Pratinjau URL"
                      className="max-h-32 rounded-lg mx-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Caption / Keterangan Gambar Input */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Keterangan / Caption Gambar (Akan muncul di bawah gambar)
              </label>
              <input
                type="text"
                value={imageCaptionInput}
                onChange={(e) => setImageCaptionInput(e.target.value)}
                placeholder="Contoh: Gambar 1.2: Diagram Siklus Input - Proses - Output"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertImage}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sisipkan Gambar ke Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
