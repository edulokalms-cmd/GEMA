import React from 'react';
import { Material, MaterialAttachment } from '../../types';
import { RichContentRenderer } from '../common/RichContentRenderer';
import {
  X,
  Clock,
  Target,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Download,
  ExternalLink,
  BookOpen,
  Edit2,
  HelpCircle,
  Paperclip,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MaterialPreviewModalProps {
  material: Material;
  onClose: () => void;
  onEdit?: (material: Material) => void;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  onClose,
  onEdit,
}) => {
  const getAttachmentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'presentation':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      default:
        return <Paperclip className="w-5 h-5 text-blue-600" />;
    }
  };

  const getAttachmentBadge = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'presentation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'spreadsheet':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'image':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const handleDownloadAttachment = (att: MaterialAttachment) => {
    if (att.url.startsWith('data:') || att.url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = att.url;
      a.download = att.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(att.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto overflow-hidden">
        {/* Top Header Bar */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preview Tampilan Materi Mahasiswa</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
              Pertemuan #{material.order_number}
            </span>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {material.estimated_time}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(material);
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ubah Materi</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Title and Category */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                {material.category}
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                +10 Poin Mahasiswa
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {material.title}
            </h1>

            {material.description && (
              <p className="text-sm text-slate-600 leading-relaxed border-l-4 border-indigo-500 pl-4 py-2 bg-slate-50 rounded-r-2xl">
                {material.description}
              </p>
            )}
          </div>

          {/* Learning Objectives */}
          {material.learning_objectives && material.learning_objectives.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
              <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                Tujuan Pembelajaran Sesi Ini:
              </h3>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                {material.learning_objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main Reading Content */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#012E26]" />
              Naskah & Modul Perkuliahan:
            </h3>
            <RichContentRenderer content={material.content} />
          </div>

          {/* Attachments Section */}
          <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-slate-600" />
                Lampiran Berkas & Dokumen Perkuliahan (
                {material.attachments?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-500">
                Dapat diunduh oleh mahasiswa & dosen
              </span>
            </div>

            {material.attachments && material.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {material.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 hover:border-indigo-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 shrink-0">
                        {getAttachmentIcon(att.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {att.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${getAttachmentBadge(
                              att.type
                            )}`}
                          >
                            {att.type}
                          </span>
                          {att.size && (
                            <span className="text-[10px] text-slate-400">
                              {att.size}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(att)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      title="Unduh / Buka Dokumen"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Unduh</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Belum ada berkas lampiran (modul PDF, slide presentasi, atau diagram) yang disematkan untuk pertemuan ini.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 hidden sm:block">
            Mode pratinjau dosen/administrator — memverifikasi format sebelum diakses mahasiswa.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup Pratinjau
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(material);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Materi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
