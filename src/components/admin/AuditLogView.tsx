import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SystemActivity } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  ShieldCheck,
  User,
  Building2,
  Layers,
  HelpCircle,
  Database,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { showToast } = useNotification();
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await api.activities.getAll();
      // sort latest first
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setActivities(sorted);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Log',
        message: err.message || 'Terjadi kesalahan saat memuat aktivitas sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const categorizeAction = (action: string): string => {
    const act = (action || '').toUpperCase();
    if (act.includes('USER') || act.includes('BATCH_DELETE')) return 'users';
    if (act.includes('CLASS')) return 'classes';
    if (act.includes('COURSE') || act.includes('DEPARTMENT')) return 'academics';
    if (act.includes('ASSIGNMENT') || act.includes('QUIZ') || act.includes('MATERIAL')) return 'learning';
    if (act.includes('DISCUSSION') || act.includes('POINT')) return 'discussions';
    if (act.includes('DATABASE') || act.includes('SETTINGS') || act.includes('GRADE_COMPONENTS')) return 'system';
    return 'other';
  };

  const getActionBadgeColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETED')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (act.includes('CREATED')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (act.includes('UPDATED')) return 'bg-sky-50 text-sky-800 border-sky-200';
    if (act.includes('SUBMITTED')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (act.includes('DATABASE') || act.includes('BACKUP')) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered
  const filtered = activities.filter((item) => {
    const matchesSearch =
      item.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.action?.toLowerCase().includes(search.toLowerCase()) ||
      item.detail?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = selectedRole === 'all' || item.user_role === selectedRole;
    const cat = categorizeAction(item.action);
    const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;

    return matchesSearch && matchesRole && matchesCategory;
  });

  // Export JSON
  const handleExportJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_gemabio_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Ekspor Berhasil',
        message: `${filtered.length} baris log berhasil diekspor ke format JSON.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Gagal Ekspor', message: err.message });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Waktu', 'Pengguna', 'Role', 'Aksi', 'Kategori', 'Detail'];
      const rows = filtered.map((item) => [
        `"${formatDateTime(item.created_at)}"`,
        `"${item.user_name || '-'}"`,
        `"${item.user_role || '-'}"`,
        `"${item.action || '-'}"`,
        `"${categorizeAction(item.action)}"`,
        `"${(item.detail || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_log_gemabio_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Ekspor Berhasil',
        message: `${filtered.length} baris log berhasil diekspor ke format CSV.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Gagal Ekspor', message: err.message });
    }
  };

  // Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = activities.filter((a) => a.created_at && a.created_at.startsWith(todayStr)).length;
  const adminCount = activities.filter((a) => a.user_role === 'admin').length;
  const lecturerCount = activities.filter((a) => a.user_role === 'dosen').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
              <FileText className="w-5 h-5 text-slate-700" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Audit Log & Rekam Aktivitas Sistem
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparansi dan rekam jejak riwayat tindakan pengguna, modifikasi kurikulum, evaluasi nilai, dan integritas data.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadActivities}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2.5 bg-[#012E26] hover:bg-[#023b31] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#012E26]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#EAA736]" />
            <span>Ekspor JSON</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Clock className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Aktivitas Tercatat</p>
            <p className="text-xl font-black text-slate-900">{activities.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Aktivitas Hari Ini</p>
            <p className="text-xl font-black text-emerald-800">{todayCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tindakan Admin</p>
            <p className="text-xl font-black text-slate-900">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tindakan Dosen & Mhs</p>
            <p className="text-xl font-black text-slate-900">{activities.length - adminCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pengguna, aksi, atau rincian deskripsi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#012E26] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filter Kategori */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 shrink-0">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
            >
              <option value="all">Semua Kategori</option>
              <option value="users">Manajemen Pengguna</option>
              <option value="classes">Kelas Perkuliahan</option>
              <option value="academics">Mata Kuliah & Prodi</option>
              <option value="learning">Tugas, Materi, & Kuis</option>
              <option value="discussions">Forum & Poin</option>
              <option value="system">Sistem & Database</option>
            </select>
          </div>

          {/* Filter Role */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 shrink-0">Peran:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Administrator</option>
              <option value="dosen">Dosen</option>
              <option value="mahasiswa">Mahasiswa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-700">
            Menampilkan <strong className="text-slate-900">{filtered.length}</strong> dari {activities.length} catatan log
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Log immutable untuk transparansi sistem
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-[#012E26] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Memuat catatan audit log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada log aktivitas yang cocok</p>
            <p className="text-xs text-slate-500 mt-0.5">Coba ubah kata kunci atau bersihkan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                  <th className="py-3.5 px-4 w-44">Waktu & Tanggal</th>
                  <th className="py-3.5 px-4 w-52">Pengguna</th>
                  <th className="py-3.5 px-4 w-48">Tindakan / Event</th>
                  <th className="py-3.5 px-4">Deskripsi Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Waktu */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(item.created_at)}</span>
                      </div>
                    </td>

                    {/* Pengguna */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200">
                          {item.user_name?.substring(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                            {item.user_name || 'System User'}
                          </p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold capitalize ${
                            item.user_role === 'admin'
                              ? 'bg-purple-50 text-purple-700'
                              : item.user_role === 'dosen'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            {item.user_role || 'User'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-1 rounded-lg text-[10px] font-mono font-bold border tracking-tight ${getActionBadgeColor(item.action)}`}>
                        {item.action}
                      </span>
                    </td>

                    {/* Deskripsi */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {item.detail}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
