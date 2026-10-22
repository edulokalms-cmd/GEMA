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
  Video,
  Play,
  Youtube,
  Wand2,
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

  // Video insertion state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoModalTab, setVideoModalTab] = useState<'url' | 'upload'>('url');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoUploadedDataUrl, setVideoUploadedDataUrl] = useState('');
  const [videoUploadedFileName, setVideoUploadedFileName] = useState('');
  const [videoUploadedSize, setVideoUploadedSize] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);
  const videoUploadInputRef = useRef<HTMLInputElement>(null);
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

  // Function to clean up bloated base64 data URLs in content text
  const cleanUpBloatedDataUrls = () => {
    let newContent = content;
    let cleanedCount = 0;
    const newAttachments = [...attachments];

    // 1. Regex for markdown images with data: URL
    // ![alt](data:...)
    const imgDataRegex = /!\[(.*?)\]\((data:[^)]+)\)/g;
    newContent = newContent.replace(imgDataRegex, (match, alt, dataUrl) => {
      cleanedCount++;
      let existing = newAttachments.find((a) => a.url === dataUrl);
      if (!existing) {
        const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        existing = {
          id,
          name: alt || 'Gambar Materi',
          type: 'image',
          url: dataUrl,
          size: 'Gambar Konten',
        };
        newAttachments.push(existing);
      }
      return `![${alt || existing.name}](attachment:${existing.id})`;
    });

    // 2. Regex for markdown links with data: URL
    // [title](data:...) or 📎 [title](data:...)
    const linkDataRegex = /(?:📎\s*)?\[(.*?)\]\((data:[^)]+)\)/g;
    newContent = newContent.replace(linkDataRegex, (match, title, dataUrl) => {
      cleanedCount++;
      const cleanTitle = title.replace(/^(?:Unduh Dokumen|File|Dokumen|Unduh Berkas|Berkas|Video):\s*/i, '').trim();
      let fileType: MaterialAttachment['type'] = 'doc';
      if (dataUrl.startsWith('data:application/pdf')) fileType = 'pdf';
      else if (dataUrl.startsWith('data:image/')) fileType = 'image';
      else if (dataUrl.startsWith('data:video/')) fileType = 'video';

      let existing = newAttachments.find((a) => a.url === dataUrl);
      if (!existing) {
        const id = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        existing = {
          id,
          name: cleanTitle || 'Dokumen Materi',
          type: fileType,
          url: dataUrl,
          size: 'Dokumen Perkuliahan',
        };
        newAttachments.push(existing);
      }

      if (fileType === 'video') {
        return `🎥 [Video: ${cleanTitle || existing.name}](attachment:${existing.id})`;
      }
      return `📎 [Dokumen: ${cleanTitle || existing.name}](attachment:${existing.id})`;
    });

    if (cleanedCount > 0) {
      setContent(newContent);
      setAttachments(newAttachments);
      showToast({
        type: 'success',
        title: 'Teks Naskah Berhasil Dirapikan!',
        message: `${cleanedCount} data berkas/gambar base64 panjang telah diringkas menjadi nama dokumen rapi. File tetap aman tersimpan di lampiran.`,
      });
    } else {
      showToast({
        type: 'info',
        title: 'Teks Sudah Bersih & Rapi',
        message: 'Tidak ditemukan deretan data berkas base64 panjang di dalam teks.',
      });
    }
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
            const newAttId = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

            // Also add to attachments list
            const newAtt: MaterialAttachment = {
              id: newAttId,
              name: caption + '.png',
              type: 'image',
              url: dataUrl,
              size: (file.size / 1024).toFixed(1) + ' KB',
            };
            setAttachments((prev) => [...prev, newAtt]);

            // Insert clean tag using attachment ID so textarea is not bloated
            const tag = `\n\n![${caption}](attachment:${newAttId})\n\n`;
            insertAtCursor(tag);

            showToast({
              type: 'success',
              title: 'Gambar Berhasil Ditempel!',
              message: 'Tangkapan layar disisipkan ke naskah dan lampiran secara ringkas.',
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

    // Auto-add to attachments
    const attId = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setAttachments((prev) => [
      ...prev,
      {
        id: attId,
        name: finalCaption,
        type: 'image',
        url: finalUrl,
        size: 'Gambar Konten',
      },
    ]);

    // Insert clean tag at cursor
    const cleanTagUrl = finalUrl.startsWith('data:') ? `attachment:${attId}` : finalUrl;
    const tag = `\n\n![${finalCaption}](${cleanTagUrl})\n\n`;
    insertAtCursor(tag);

    setShowImageModal(false);
    setImageUploadedDataUrl('');
    setImageUrlInput('');
    setImageCaptionInput('');
    setSelectedPreset(null);

    showToast({
      type: 'success',
      title: 'Gambar Berhasil Disisipkan',
      message: `"${finalCaption}" telah dicantumkan ke dalam naskah materi secara ringkas.`,
    });
  };

  // Insert Video from modal
  const handleConfirmInsertVideo = () => {
    let finalUrl = '';
    let finalTitle = videoTitleInput.trim();

    if (videoModalTab === 'url') {
      if (!videoUrlInput.trim()) {
        showToast({
          type: 'error',
          title: 'URL Video Belum Diisi',
          message: 'Masukkan tautan video YouTube, Google Drive, Vimeo, atau MP4.',
        });
        return;
      }
      finalUrl = videoUrlInput.trim();
      if (!finalTitle) finalTitle = 'Video Pembelajaran';

      const attId = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      setAttachments((prev) => [
        ...prev,
        {
          id: attId,
          name: finalTitle,
          type: 'video',
          url: finalUrl,
          size: 'Tautan Video Daring',
        },
      ]);

      // Direct embeddable link in markdown
      insertAtCursor(`\n\n🎥 [Video: ${finalTitle}](${finalUrl})\n\n`);
    } else {
      // Upload
      if (!videoUploadedDataUrl) {
        showToast({
          type: 'error',
          title: 'Berkas Belum Dipilih',
          message: 'Silakan pilih berkas video MP4 atau WebM dari perangkat Anda.',
        });
        return;
      }
      if (!finalTitle) finalTitle = videoUploadedFileName || 'Video Rekaman Materi';

      const attId = 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      setAttachments((prev) => [
        ...prev,
        {
          id: attId,
          name: finalTitle,
          type: 'video',
          url: videoUploadedDataUrl,
          size: videoUploadedSize || 'Berkas Video',
        },
      ]);

      // Use clean attachment reference so textarea is not clogged with millions of base64 characters
      insertAtCursor(`\n\n🎥 [Video: ${finalTitle}](attachment:${attId})\n\n`);
    }

    setShowVideoModal(false);
    setVideoUrlInput('');
    setVideoTitleInput('');
    setVideoUploadedDataUrl('');
    setVideoUploadedFileName('');
    setVideoUploadedSize('');

    showToast({
      type: 'success',
      title: 'Video Berhasil Disisipkan!',
      message: `Video "${finalTitle}" dapat diputar langsung di halaman naskah materi.`,
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
      else if (['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext)) fileType = 'video';

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

        // Clean reference using attachment ID so textarea is not bloated with 300,000 characters of base64
        if (fileType === 'image') {
          insertAtCursor(`\n\n![${file.name}](attachment:${newAtt.id})\n\n`);
        } else if (fileType === 'video') {
          insertAtCursor(`\n\n🎥 [Video: ${file.name}](attachment:${newAtt.id})\n\n`);
        } else {
          insertAtCursor(`\n\n📎 [Dokumen: ${file.name}](attachment:${newAtt.id})\n\n`);
        }

        showToast({
          type: 'success',
          title: 'Berkas Berhasil Disisipkan!',
          message: `"${file.name}" otomatis ditambahkan ke lampiran & naskah materi secara ringkas dan rapi.`,
        });
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddManualLink = () => {
    const name = window.prompt('Masukkan nama berkas/dokumen/video (contoh: Modul Praktikum 1.pdf atau Video Demo):');
    if (!name || !name.trim()) return;

    const url = window.prompt(
      'Masukkan URL atau tautan berkas/video (contoh: https://youtube.com/watch?v=... atau https://drive.google.com/...):',
      'https://'
    );
    if (!url || !url.trim()) return;

    const ext = name.split('.').pop()?.toLowerCase() || '';
    let fileType: MaterialAttachment['type'] = 'doc';
    if (ext === 'pdf') fileType = 'pdf';
    else if (['ppt', 'pptx'].includes(ext)) fileType = 'presentation';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'spreadsheet';
    else if (['jpg', 'jpeg', 'png', 'svg'].includes(ext)) fileType = 'image';
    else if (
      ['mp4', 'webm'].includes(ext) ||
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('vimeo.com')
    ) {
      fileType = 'video';
    }

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
    } else if (fileType === 'video') {
      insertAtCursor(`\n\n🎥 [Video: ${name.trim()}](${url.trim()})\n\n`);
    } else {
      insertAtCursor(`\n\n📎 [Dokumen: ${name.trim()}](${url.trim()})\n\n`);
    }
  };

  const handleInsertAttachmentToContent = (att: MaterialAttachment) => {
    // If att.url is a data URL, always insert clean reference `attachment:${att.id}` to prevent cluttering textarea
    const targetUrl = att.url.startsWith('data:') ? `attachment:${att.id}` : att.url;
    if (att.type === 'image') {
      insertAtCursor(`\n\n![${att.name}](${targetUrl})\n\n`);
    } else if (att.type === 'video') {
      insertAtCursor(`\n\n🎥 [Video: ${att.name}](${targetUrl})\n\n`);
    } else {
      insertAtCursor(`\n\n📎 [Dokumen: ${att.name}](${targetUrl})\n\n`);
    }
    showToast({
      type: 'success',
      title: 'Disisipkan ke Naskah',
      message: `Tautan "${att.name}" telah ditambahkan ke isi materi secara rapi.`,
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
                  onClick={() => setShowVideoModal(true)}
                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Sisipkan video YouTube, Google Drive, Vimeo, atau unggah video yang dapat ditayangkan langsung"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Sisipkan Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Unggah berkas dokumen (PDF, Word, PPT, Excel, dll) dan sisipkan ke naskah"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Sisipkan File / Dokumen</span>
                </button>

                {content.includes('](data:') && (
                  <button
                    type="button"
                    onClick={cleanUpBloatedDataUrls}
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer animate-pulse"
                    title="Rapikan deretan teks base64 panjang menjadi referensi nama file rapi"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Rapikan Naskah</span>
                  </button>
                )}

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
                Paste gambar langsung (Ctrl+V) &amp; video didukung
              </span>
            </div>

            {/* Content Area View: Editor vs Live Preview Sebelum Disimpan */}
            {contentViewMode === 'edit' ? (
              <div className="space-y-2">
                {/* Banner Rapikan jika terdapat base64 panjang */}
                {content.includes('](data:') && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Teks naskah memuat deretan kode berkas panjang (Base64).</strong> Klik tombol di samping untuk merapikannya sehingga hanya nama dokumen yang tampil.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={cleanUpBloatedDataUrls}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Rapikan Teks Sekarang</span>
                    </button>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  rows={10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handleTextareaPaste}
                  placeholder="Tuliskan naskah materi pembelajaran di sini... Anda dapat menyisipkan foto diagram, memutar video tayangan langsung, atau menyisipkan berkas dokumen PDF modul kuliah."
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      Mendukung 🎥 Video (YouTube/Drive/Direct), ![Gambar](url), &amp; 📎 Dokumen rapi
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
                      <strong>Mode Pratinjau Langsung (Sebelum Disimpan):</strong> Video dapat diputar langsung di sini, gambar diagram, dan dokumen berkas tampil rapi.
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
                  <RichContentRenderer content={content} attachments={attachments} />
                </div>
              </div>
            )}
          </div>

          {/* Lampiran Dokumen, File, Video, atau Gambar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Lampiran Dokumen, Video, Modul PDF, &amp; Slide ({attachments.length})</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Berkas bahan ajar pendukung yang dapat diunduh atau diputar mahasiswa. Klik &quot;+ Sisipkan ke Naskah&quot; untuk mencantumkannya ke isi bacaan materi secara rapi.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.svg,.webp,.mp4,.webm,.ogg"
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
                    content.includes(att.id) ||
                    content.includes(att.url) ||
                    content.includes(att.name);

                  return (
                    <div
                      key={att.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                          {att.type === 'image' ? (
                            <ImageIcon className="w-4 h-4 text-purple-600" />
                          ) : att.type === 'video' ? (
                            <Video className="w-4 h-4 text-rose-600" />
                          ) : att.type === 'spreadsheet' ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600" />
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

      {/* ========================================================================= */}
      {/* MODAL SISIPKAN VIDEO KE DALAM NASKAH */}
      {/* ========================================================================= */}
      {showVideoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Sisipkan Video Pembelajaran</h4>
                  <p className="text-xs text-slate-500">
                    Video dapat diputar langsung di halaman naskah materi oleh mahasiswa dan dosen.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Tab Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setVideoModalTab('url')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  videoModalTab === 'url'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-rose-600" />
                <span>Tautan Video (YouTube / Drive / Web)</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoModalTab('upload')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  videoModalTab === 'upload'
                    ? 'bg-white text-rose-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Berkas Video</span>
              </button>
            </div>

            {/* Tab 1: Video URL (YouTube, Vimeo, Google Drive, Direct MP4) */}
            {videoModalTab === 'url' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Video Daring
                  </label>
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                  <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-500 space-y-0.5">
                    <p className="font-semibold text-slate-700">Platform video yang didukung &amp; diputar langsung:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      <li>YouTube &amp; YouTube Shorts (pemutar terintegrasi)</li>
                      <li>Google Drive Video Preview (link file /preview)</li>
                      <li>Vimeo Video</li>
                      <li>Tautan langsung berkas (.mp4, .webm)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul / Keterangan Video
                  </label>
                  <input
                    type="text"
                    value={videoTitleInput}
                    onChange={(e) => setVideoTitleInput(e.target.value)}
                    placeholder="Contoh: Video Penjelasan Materi Konsep Sistem Operasi &amp; GUI"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Upload Video File */}
            {videoModalTab === 'upload' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={videoUploadInputRef}
                  accept="video/mp4,video/webm,video/ogg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formatSize = (bytes: number) => {
                      if (bytes < 1024) return bytes + ' B';
                      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
                    };
                    setVideoUploadedFileName(file.name);
                    setVideoUploadedSize(formatSize(file.size));
                    if (!videoTitleInput) {
                      setVideoTitleInput(file.name.replace(/\.[^/.]+$/, ''));
                    }
                    const reader = new FileReader();
                    reader.onload = (loadEvt) => {
                      setVideoUploadedDataUrl((loadEvt.target?.result as string) || '');
                    };
                    reader.readAsDataURL(file);
                  }}
                />

                <div
                  onClick={() => videoUploadInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/30 hover:bg-rose-50/60 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  {videoUploadedDataUrl ? (
                    <div className="space-y-2 w-full">
                      <video
                        src={videoUploadedDataUrl}
                        controls
                        className="max-h-44 w-auto mx-auto rounded-xl shadow-md border border-slate-200"
                      />
                      <p className="text-xs font-bold text-rose-700">
                        {videoUploadedFileName} ({videoUploadedSize})
                      </p>
                      <p className="text-[11px] text-slate-500">Klik untuk mengganti berkas video</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-white rounded-2xl shadow-xs text-rose-600 mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik untuk memilih video dari komputer Anda
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Format didukung: MP4, WebM, OGG
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Judul Video
                  </label>
                  <input
                    type="text"
                    value={videoTitleInput}
                    onChange={(e) => setVideoTitleInput(e.target.value)}
                    placeholder="Contoh: Rekaman Demonstrasi Praktikum Mandiri"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmInsertVideo}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Sisipkan Video ke Naskah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

