import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react';

interface UserImportModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

export const UserImportModal: React.FC<UserImportModalProps> = ({
  onClose,
  onImportSuccess,
}) => {
  const { showToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Generate and download template Excel (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const headers = ['Username', 'Password', 'Nama Lengkap', 'Role', 'NIM', 'Kelas', 'Program Studi', 'Semester'];
      const sampleData = [
        headers,
        ['mhs_ani', '12345*', 'Ani Suryani', 'mahasiswa', '230302011', 'BIO-2A', 'S1 Pendidikan Biologi', 2],
        ['mhs_bambang', '12345*', 'Bambang Pamungkas', 'mahasiswa', '230302012', 'BIO-2A', 'S1 Pendidikan Biologi', 2],
        ['mhs_citra', '12345*', 'Citra Kirana', 'mahasiswa', '230302013', 'BIO-2B', 'S1 Pendidikan Biologi', 2],
        ['mhs_dimas', '12345*', 'Dimas Pratama', 'mahasiswa', '230302014', 'BIO-2C', 'S1 Pendidikan Biologi', 2],
        ['dosen_dewi', '12345*', 'Dewi Lestari, M.Si.', 'dosen', '0015098201', '', 'S1 Pendidikan Biologi', ''],
      ];

      const ws = XLSX.utils.aoa_to_sheet(sampleData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Username
        { wch: 12 }, // Password
        { wch: 25 }, // Nama Lengkap
        { wch: 14 }, // Role
        { wch: 16 }, // NIM / NIDN
        { wch: 12 }, // Kelas
        { wch: 25 }, // Program Studi
        { wch: 10 }, // Semester
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Pengguna');
      XLSX.writeFile(wb, 'Template_Import_Pengguna_GEMA_BIO.xlsx');

      showToast({
        type: 'success',
        title: 'Template Diunduh',
        message: 'Berkas "Template_Import_Pengguna_GEMA_BIO.xlsx" dengan kolom Kelas & Prodi berhasil disimpan.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengunduh Template',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  // 2. Read and parse uploaded Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          setErrorMsg('Berkas Excel kosong atau tidak memiliki baris data.');
          setParsedRows([]);
          return;
        }

        // Map and validate rows
        const formatted = data.map((row, idx) => ({
          username: String(row.Username || row.username || '').trim(),
          password: String(row.Password || row.password || '12345*').trim(),
          name: String(row['Nama Lengkap'] || row.name || row.nama || '').trim(),
          role: String(row.Role || row.role || 'mahasiswa').trim().toLowerCase(),
          nim: String(row.NIM || row.nim || row.student_id || '').trim(),
          kelas: String(row.Kelas || row.kelas || row.class_name || '').trim(),
          prodi: String(row['Program Studi'] || row.prodi || row.Prodi || row.department || '').trim(),
          semester: row.Semester || row.semester || '',
          rawIndex: idx + 1,
        }));

        setParsedRows(formatted);
      } catch (err: any) {
        setErrorMsg('Format file tidak didukung atau rusak: ' + err.message);
        setParsedRows([]);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. Submit rows to backend
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg('Pilih berkas Excel yang memiliki data pengguna terlebih dahulu.');
      return;
    }

    try {
      setImporting(true);
      setErrorMsg(null);
      const res: any = await api.users.import(parsedRows);

      if (res.imported > 0) {
        const autoClsMsg = res.new_classes_created > 0 ? ` dan ${res.new_classes_created} rombel kelas baru otomatis dibuat` : '';
        showToast({
          type: 'success',
          title: 'Import Pengguna Berhasil',
          message: `${res.imported} akun berhasil diimpor${autoClsMsg}.`,
        });
        onImportSuccess();
        onClose();
      } else {
        setErrorMsg(
          res.errors && res.errors.length > 0
            ? res.errors.join(' | ')
            : 'Tidak ada baris yang berhasil diimpor.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses import data pengguna.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Import Pengguna Massal (.xlsx)
              </h3>
              <p className="text-xs text-slate-500">
                Unggah daftar mahasiswa atau dosen sekaligus menggunakan format Excel.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Download Template */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Langkah 1: Unduh Format Template Excel Terintegrasi
              </h4>
              <p className="text-[11px] text-indigo-900 mt-1">
                Kolom isian lengkap: <strong>Username</strong>, <strong>Password</strong>, <strong>Nama Lengkap</strong>, <strong>Role</strong>, <strong>NIM</strong>, <strong>Kelas</strong>, <strong>Program Studi</strong>, <strong>Semester</strong>.
              </p>
              <p className="text-[10px] text-emerald-800 font-bold bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mt-1.5">
                💡 Kelas & Prodi otomatis dibuat dan disinkronkan jika belum ada di sistem!
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template .xlsx</span>
            </button>
          </div>

          {/* Step 2: Upload File */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-slate-500" />
              Langkah 2: Pilih Berkas Excel yang Sudah Diisi
            </h4>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                {fileName ? fileName : 'Klik di sini untuk memilih berkas Excel (.xlsx / .csv)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Kolom otomatis dipetakan sesuai header pada template.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Pratinjau Data ({parsedRows.length} Calon Pengguna)
                </span>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Siap Diimpor
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Nama Lengkap</th>
                      <th className="py-2 px-3">Role</th>
                      <th className="py-2 px-3">NIM / ID</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Program Studi</th>
                      <th className="py-2 px-3">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          <div>{r.name}</div>
                          <div className="text-[10px] text-indigo-600 font-mono">@{r.username}</div>
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] font-semibold text-slate-500">
                          {r.role}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.nim || '-'}</td>
                        <td className="py-2 px-3">
                          {r.kelas ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                              {r.kelas}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[140px]">
                          {r.prodi || 'S1 Pendidikan Biologi'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-mono">
                          {r.semester ? `Sem ${r.semester}` : 'Sem 2'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p><strong>💡 Efisiensi Tanpa Kerja Dua Kali:</strong> Rombel kelas baru (misalnya BIO-2A, BIO-2B, BIO-2C) yang terdapat di file Excel akan otomatis dibuatkan wadah kelasnya di menu <strong>Kelola Kelas</strong> dan siap ditautkan ke mata kuliah.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            disabled={importing || parsedRows.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{importing ? 'Memproses Import...' : `Impor ${parsedRows.length} Pengguna`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
