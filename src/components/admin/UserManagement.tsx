import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, UserRole, Department } from '../../types';
import { UserModal } from './UserModal';
import { UserImportModal } from './UserImportModal';
import { getUserInitials } from '../../utils/initials';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Mail,
  FileSpreadsheet,
  KeyRound,
  Copy,
  Check,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  School,
  AlertTriangle,
  CheckSquare,
  Square,
  Trash,
  Loader2,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(
    currentUser?.role === 'dosen' ? 'mahasiswa' : 'all'
  );
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Batch Deletion states
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<'selected' | 'filtered'>('filtered');
  const [bulkDeleteConfirmed, setBulkDeleteConfirmed] = useState<boolean>(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState<string>('');
  const [deletingBatch, setDeletingBatch] = useState<boolean>(false);

  // Reset Password Modal states
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('12345*');
  const [resetting, setResetting] = useState<boolean>(false);
  const [resetSuccessData, setResetSuccessData] = useState<{ user: User; password: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [userData, deptData] = await Promise.all([
        api.users.getAll(),
        api.departments.getAll().catch(() => []),
      ]);
      setUsers(userData);
      setDepartments(deptData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const isDeletable = (target: User) => {
    if (target.id === currentUser?.id) return false;
    if (currentUser?.role === 'admin') {
      if (target.role === 'admin') {
        const remainingAdmins = users.filter((x) => x.role === 'admin' && x.id !== target.id);
        if (remainingAdmins.length === 0) return false;
      }
      return true;
    }
    if (currentUser?.role === 'dosen') {
      return target.role === 'mahasiswa';
    }
    return false;
  };

  const handleDelete = async (target: User) => {
    if (target.id === currentUser?.id) {
      showToast({
        type: 'error',
        title: 'Operasi Ditolak',
        message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.',
      });
      return;
    }

    if (!isDeletable(target)) {
      showToast({
        type: 'error',
        title: 'Operasi Ditolak',
        message: 'Anda tidak memiliki hak akses untuk menghapus akun ini.',
      });
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus pengguna "${target.name}" (${target.role})? Seluruh riwayatnya akan dibersihkan.`)) {
      return;
    }

    try {
      await api.users.delete(target.id);
      showToast({
        type: 'info',
        title: 'Pengguna Dihapus',
        message: `Pengguna "${target.name}" telah dihapus dari sistem.`,
      });
      setSelectedUserIds((prev) => prev.filter((id) => id !== target.id));
      loadUsers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Terjadi kesalahan.',
      });
    }
  };

  const handleOpenResetModal = (user: User) => {
    setResetModalUser(user);
    setNewPasswordInput('12345*');
    setResetSuccessData(null);
    setCopied(false);
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;

    const passToSet = newPasswordInput.trim() || '12345*';

    try {
      setResetting(true);
      const res = await api.users.resetPassword(resetModalUser.id, passToSet);
      setResetSuccessData({
        user: resetModalUser,
        password: passToSet,
      });
      showToast({
        type: 'success',
        title: 'Kata Sandi Direset',
        message: res.message || `Kata sandi ${resetModalUser.name} berhasil direset ke "${passToSet}".`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mereset Kata Sandi',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setResetting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!resetSuccessData) return;
    const loginId =
      resetSuccessData.user.student_id ||
      resetSuccessData.user.nidn ||
      resetSuccessData.user.username ||
      resetSuccessData.user.email;

    const textToCopy = `*Informasi Akun GEMA BIO Universitas Hamzanwadi*\nNama: ${resetSuccessData.user.name}\nNIM / ID Login: ${loginId}\nPassword Baru: ${resetSuccessData.password}\n\nSilakan masuk ke aplikasi dan segera perbarui profil Anda.`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      showToast({
        type: 'info',
        title: 'Disalin ke Papan Klip',
        message: 'Kredensial login berhasil disalin untuk dibagikan ke mahasiswa.',
      });
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-rose-600" />
            Admin
          </span>
        );
      case 'dosen':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <BookOpen className="w-3 h-3 text-emerald-700" />
            Dosen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#012E26] bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-[#EAA736]" />
            Mahasiswa
          </span>
        );
    }
  };

  const availableClasses = Array.from(
    new Set(users.map((u) => u.class_name).filter(Boolean))
  ).sort();

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase())) ||
      (u.nidn && u.nidn.toLowerCase().includes(search.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(search.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    const matchesClass = selectedClass === 'all' || u.class_name === selectedClass;
    const matchesDept =
      selectedDept === 'all' ||
      (u.department &&
        (u.department === selectedDept ||
          u.department.toLowerCase() === selectedDept.toLowerCase()));
    return matchesSearch && matchesRole && matchesClass && matchesDept;
  });

  const countMahasiswa = users.filter((u) => u.role === 'mahasiswa').length;
  const countDosen = users.filter((u) => u.role === 'dosen').length;
  const countAdmin = users.filter((u) => u.role === 'admin').length;

  const deletableFilteredUsers = filteredUsers.filter(isDeletable);
  const deletableFilteredIds = deletableFilteredUsers.map((u) => u.id);

  const allDeletableSelected =
    deletableFilteredUsers.length > 0 &&
    deletableFilteredUsers.every((u) => selectedUserIds.includes(u.id));

  const someDeletableSelected =
    deletableFilteredUsers.some((u) => selectedUserIds.includes(u.id)) &&
    !allDeletableSelected;

  const toggleSelectAll = () => {
    if (allDeletableSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !deletableFilteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...deletableFilteredIds])));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const hasActiveFilter =
    (currentUser?.role === 'admin' ? selectedRole !== 'all' : false) ||
    selectedClass !== 'all' ||
    selectedDept !== 'all' ||
    search.trim() !== '';

  const handleOpenBulkDeleteModal = (target: 'selected' | 'filtered') => {
    setBulkDeleteTarget(target);
    setBulkDeleteConfirmed(false);
    setBulkDeleteConfirmText('');
    setShowBulkDeleteModal(true);
  };

  const targetUsersToDelete =
    bulkDeleteTarget === 'filtered'
      ? deletableFilteredUsers
      : users.filter((u) => selectedUserIds.includes(u.id) && isDeletable(u));

  const handleExecuteBulkDelete = async () => {
    if (targetUsersToDelete.length === 0) return;

    try {
      setDeletingBatch(true);
      const userIdsToDelete = targetUsersToDelete.map((u) => u.id);
      const res = await api.users.deleteBatch(userIdsToDelete);
      showToast({
        type: 'success',
        title: 'Pengguna Dihapus Massal',
        message:
          res.message ||
          `Berhasil menghapus ${res.deleted_count || userIdsToDelete.length} akun pengguna dari sistem.`,
      });
      const deletedSet = new Set(userIdsToDelete);
      setSelectedUserIds((prev) => prev.filter((id) => !deletedSet.has(id)));
      setShowBulkDeleteModal(false);
      await loadUsers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Massal',
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setDeletingBatch(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currentUser?.role === 'dosen' ? 'Data Mahasiswa Perkuliahan' : 'Manajemen Pengguna Sistem'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {currentUser?.role === 'dosen'
              ? 'Daftar data mahasiswa terdaftar, pemantauan akun, kelas, dan reset kata sandi mahasiswa.'
              : 'Kelola akun Admin, Dosen pengampu, dan Mahasiswa serta fitur reset kata sandi lupa/salah.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Import Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => {
              setEditingUser(null);
              setModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#012E26] hover:bg-[#02473B] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#012E26]/20 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#EAA736]" />
            <span>{currentUser?.role === 'dosen' ? 'Tambah Mahasiswa Baru' : 'Tambah Pengguna Baru'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedRole('mahasiswa')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'mahasiswa'
              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mahasiswa</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
              <Sparkles className="w-4 h-4 text-[#EAA736]" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{countMahasiswa}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Akun mahasiswa aktif</p>
        </div>

        <div
          onClick={() => setSelectedRole('dosen')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'dosen'
              ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-600/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dosen Pengampu</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
              <BookOpen className="w-4 h-4 text-emerald-700" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{countDosen}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Dosen pengampu & PA</p>
        </div>

        <div
          onClick={() => setSelectedRole('admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'admin'
              ? 'bg-rose-50/60 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Administrator</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{countAdmin}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hak akses penuh sistem</p>
        </div>

        <div
          onClick={() => setSelectedRole('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedRole === 'all'
              ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Pengguna</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Users className="w-4 h-4 text-indigo-600" />
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Seluruh civitas akademik</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                currentUser?.role === 'dosen'
                  ? 'Cari mahasiswa berdasarkan nama, NIM, kelas, atau username...'
                  : 'Cari berdasarkan nama, NIM, NIDN, username, atau program studi...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
            />
          </div>

          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
              {[
                { id: 'all', label: `Semua (${users.length})` },
                { id: 'mahasiswa', label: `Mahasiswa (${countMahasiswa})` },
                { id: 'dosen', label: `Dosen (${countDosen})` },
                { id: 'admin', label: `Admin (${countAdmin})` },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedRole === r.id
                      ? 'bg-[#012E26] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Secondary Row: Class & Department Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Kelas:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#012E26] cursor-pointer"
              >
                <option value="all">Semua Kelas ({countMahasiswa} mhs)</option>
                {availableClasses.map((cls) => {
                  const count = users.filter((u) => u.class_name === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      Kelas {cls} ({count} mhs)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-slate-400" />
                Prodi:
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#012E26] cursor-pointer"
              >
                <option value="all">Semua Program Studi</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-slate-500 font-medium">
              Menampilkan <strong className="text-slate-900">{filteredUsers.length}</strong> dari {users.length} pengguna
            </span>

            {/* DELETE ALL FILTERED USERS BUTTON */}
            {deletableFilteredUsers.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenBulkDeleteModal('filtered')}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                title={`Hapus seluruh ${deletableFilteredUsers.length} pengguna yang sesuai dengan filter ini`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {hasActiveFilter
                    ? `Hapus Semua Sesuai Filter (${deletableFilteredUsers.length})`
                    : `Hapus Semua (${deletableFilteredUsers.length})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {hasActiveFilter && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs animate-in fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-500" /> Filter Aktif:
              </span>
              {selectedRole !== 'all' && (
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700 capitalize">
                  Peran: {selectedRole}
                </span>
              )}
              {selectedClass !== 'all' && (
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md font-bold text-emerald-800">
                  Kelas: {selectedClass}
                </span>
              )}
              {selectedDept !== 'all' && (
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-slate-700">
                  Prodi: {selectedDept}
                </span>
              )}
              {search.trim() && (
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md font-semibold text-amber-800">
                  Cari: &ldquo;{search}&rdquo;
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole(currentUser?.role === 'dosen' ? 'mahasiswa' : 'all');
                  setSelectedClass('all');
                  setSelectedDept('all');
                  setSearch('');
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Reset Filter
              </button>
              {deletableFilteredUsers.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenBulkDeleteModal('filtered')}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus {deletableFilteredUsers.length} Data Ini</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bulk Selection Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="p-3.5 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs border border-rose-200">
              {selectedUserIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-rose-950">
                {selectedUserIds.length} Pengguna Dipilih
              </p>
              <p className="text-[11px] text-rose-700">
                Dari {filteredUsers.length} data pengguna yang ditampilkan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!allDeletableSelected && deletableFilteredUsers.length > selectedUserIds.length && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-1.5 bg-white hover:bg-rose-100/50 text-slate-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Pilih Semua Hasil Filter ({deletableFilteredUsers.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={() => handleOpenBulkDeleteModal('selected')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedUserIds.length} Pengguna Terpilih</span>
            </button>
          </div>
        </div>
      )}

      {/* Info Banner for Default Password Feature */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
          <KeyRound className="w-4 h-4 text-amber-700" />
        </div>
        <div className="text-xs text-amber-950">
          <span className="font-bold">Fitur Reset Kata Sandi Mahasiswa / Pengguna:</span> Klik tombol icon kunci{' '}
          <KeyRound className="w-3.5 h-3.5 inline text-amber-700 mx-0.5" /> pada kolom aksi untuk mereset kata sandi akun ke kata sandi standar (default:{' '}
          <code className="font-mono bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-900 font-bold">12345*</code>). Memudahkan dosen dan admin menangani kasus lupa kata sandi.
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allDeletableSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someDeletableSelected;
                    }}
                    onChange={toggleSelectAll}
                    disabled={deletableFilteredUsers.length === 0}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 cursor-pointer disabled:opacity-40"
                    title={
                      allDeletableSelected
                        ? 'Batalkan pilihan semua pengguna'
                        : `Pilih semua ${deletableFilteredUsers.length} pengguna hasil filter`
                    }
                  />
                </th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Identitas (NIM / NIDN)</th>
                <th className="py-3 px-4">Kelas & Prodi</th>
                <th className="py-3 px-4 text-right">Aksi & Reset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const canReset =
                  currentUser?.role === 'admin' ||
                  (currentUser?.role === 'dosen' && u.role === 'mahasiswa');
                const canDelete = isDeletable(u);
                const isSelected = selectedUserIds.includes(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-rose-50/40 hover:bg-rose-50/60'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u.id)}
                        disabled={!canDelete}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 border-slate-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          !canDelete
                            ? u.id === currentUser?.id
                              ? 'Akun Anda saat ini (tidak dapat dihapus)'
                              : 'Tidak memiliki izin untuk menghapus akun ini'
                            : isSelected
                            ? 'Batal pilih'
                            : 'Pilih pengguna ini'
                        }
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#012E26] font-bold text-xs flex items-center justify-center border border-emerald-100 shrink-0">
                          {getUserInitials(u.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{u.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-xs whitespace-nowrap">
                      {u.student_id ? (
                        <span className="font-bold text-[#012E26]">NIM: {u.student_id}</span>
                      ) : u.nidn ? (
                        <span className="font-bold text-slate-800">NIDN: {u.nidn}</span>
                      ) : u.nip ? (
                        <span>NIP: {u.nip}</span>
                      ) : (
                        `@${u.username}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs truncate max-w-xs">
                      {u.class_name && (
                        <span className="inline-block mr-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#012E26] border border-emerald-200/80 font-bold text-[10px]">
                          Kelas {u.class_name}
                        </span>
                      )}
                      <span>{u.department || 'Biologi'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset Password Button */}
                        {canReset && (
                          <button
                            onClick={() => handleOpenResetModal(u)}
                            className="p-1.5 text-amber-700 hover:text-amber-800 hover:bg-amber-100/80 bg-amber-50 border border-amber-200/80 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Reset Kata Sandi (Default: 12345*)"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px] font-bold">Reset Sandi</span>
                          </button>
                        )}

                        {/* Edit User Button */}
                        {(currentUser?.role === 'admin' || (currentUser?.role === 'dosen' && u.role === 'mahasiswa')) && (
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#012E26] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Mahasiswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete User Button */}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={currentUser?.role === 'dosen' ? 'Hapus Mahasiswa' : 'Hapus Pengguna'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSaved={loadUsers}
        />
      )}

      {/* Excel Import Modal */}
      {importModalOpen && (
        <UserImportModal
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={loadUsers}
        />
      )}

      {/* Dedicated Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {!resetSuccessData ? (
              // Form View: Input & Confirmation
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Reset Kata Sandi Akun</h3>
                      <p className="text-xs text-slate-500">Solusi lupa / salah kata sandi</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setResetModalUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Target User Details Box */}
                <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{resetModalUser.name}</span>
                    {getRoleBadge(resetModalUser.role)}
                  </div>
                  <div className="text-xs text-slate-600 font-mono flex items-center gap-2">
                    <span>
                      {resetModalUser.student_id
                        ? `NIM: ${resetModalUser.student_id}`
                        : resetModalUser.nidn
                        ? `NIDN: ${resetModalUser.nidn}`
                        : `@${resetModalUser.username}`}
                    </span>
                    {resetModalUser.class_name && (
                      <span className="text-slate-400 font-sans">• Kelas {resetModalUser.class_name}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{resetModalUser.email}</p>
                </div>

                <form onSubmit={handleExecuteResetPassword} className="space-y-4">
                  {/* Default Password Highlight Card */}
                  <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Kata Sandi Default Standar:</span>
                      <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
                        Direkomendasikan
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-300 font-mono text-sm font-bold text-slate-900">
                      <span>12345*</span>
                      <button
                        type="button"
                        onClick={() => setNewPasswordInput('12345*')}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                      >
                        Gunakan Default
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2">
                      Mahasiswa dapat langsung masuk kembali menggunakan kata sandi ini dan menggantinya melalui menu profil.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kata Sandi Baru yang Ditetapkan
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="12345*"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setResetModalUser(null)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      disabled={resetting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={resetting}
                      className="px-4 py-2.5 bg-[#012E26] hover:bg-[#02473B] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      <KeyRound className="w-4 h-4 text-[#EAA736]" />
                      <span>{resetting ? 'Mereset...' : 'Ya, Reset Kata Sandi'}</span>
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Success View: Credentials Card & Copy Button
              <>
                <div className="text-center py-2 space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-[#012E26]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Kata Sandi Berhasil Direset!</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Akun {resetSuccessData.user.name} kini siap digunakan.
                    </p>
                  </div>
                </div>

                <div className="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">Nama Mahasiswa:</span>
                    <span className="font-bold text-slate-900">{resetSuccessData.user.name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-medium">NIM / ID Login:</span>
                    <span className="font-bold font-mono text-[#012E26]">
                      {resetSuccessData.user.student_id ||
                        resetSuccessData.user.nidn ||
                        resetSuccessData.user.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Kata Sandi Baru:</span>
                    <span className="font-bold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-sm">
                      {resetSuccessData.password}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleCopyCredentials}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-700" />
                        <span>Kredensial Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-700" />
                        <span>Salin Kredensial untuk Mahasiswa</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setResetModalUser(null);
                      setResetSuccessData(null);
                      loadUsers();
                    }}
                    className="w-full py-2.5 bg-[#012E26] hover:bg-[#02473B] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dedicated Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {bulkDeleteTarget === 'filtered'
                      ? 'Hapus Semua Pengguna Sesuai Filter'
                      : 'Hapus Pengguna Terpilih'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Penghapusan massal {targetUsersToDelete.length} akun pengguna
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={deletingBatch}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope & Active Filters */}
            <div className="my-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Cakupan Data:</span>
                <span className="font-bold text-slate-900">
                  {bulkDeleteTarget === 'filtered'
                    ? 'Seluruh data sesuai filter aktif'
                    : 'Pengguna yang dicentang manual'}
                </span>
              </div>
              {bulkDeleteTarget === 'filtered' && hasActiveFilter && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500 font-medium block mb-1">Filter yang Sedang Aktif:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRole !== 'all' && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 capitalize">
                        Peran: {selectedRole}
                      </span>
                    )}
                    {selectedClass !== 'all' && (
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-bold text-emerald-800">
                        Kelas: {selectedClass}
                      </span>
                    )}
                    {selectedDept !== 'all' && (
                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700">
                        Prodi: {selectedDept}
                      </span>
                    )}
                    {search.trim() && (
                      <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[11px] font-bold text-amber-800">
                        Cari: &ldquo;{search}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                <span className="text-slate-500 font-medium">Total Akun Akan Dihapus:</span>
                <span className="font-mono font-bold text-sm text-rose-700">
                  {targetUsersToDelete.length} Akun
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>Rincian:</span>
                <span className="font-semibold text-slate-700">
                  {targetUsersToDelete.filter((u) => u.role === 'mahasiswa').length} Mahasiswa
                </span>
                {currentUser?.role === 'admin' && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {targetUsersToDelete.filter((u) => u.role === 'dosen').length} Dosen
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {targetUsersToDelete.filter((u) => u.role === 'admin').length} Admin
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Preview of accounts to be deleted */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Daftar Pengguna yang Akan Dihapus ({targetUsersToDelete.length}):
              </label>
              <div className="max-h-36 overflow-y-auto p-2.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                {targetUsersToDelete.slice(0, 25).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {getUserInitials(u.name)}
                      </div>
                      <span className="font-bold text-slate-800 truncate">{u.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {u.student_id ? `NIM: ${u.student_id}` : u.nidn ? `NIDN: ${u.nidn}` : `@${u.username}`}
                      </span>
                    </div>
                    {u.class_name && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 shrink-0">
                        {u.class_name}
                      </span>
                    )}
                  </div>
                ))}
                {targetUsersToDelete.length > 25 && (
                  <p className="text-[11px] text-center text-slate-500 py-1 font-medium">
                    ...dan {targetUsersToDelete.length - 25} akun pengguna lainnya
                  </p>
                )}
                {targetUsersToDelete.length === 0 && (
                  <p className="text-center text-slate-400 py-4">
                    Tidak ada akun yang dapat dihapus pada filter ini.
                  </p>
                )}
              </div>
            </div>

            {/* Warning Callout */}
            <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-950 space-y-1">
                <p className="font-bold">PERINGATAN PENTING:</p>
                <p className="text-[11px] text-rose-900 leading-relaxed">
                  Tindakan ini permanen dan tidak dapat dibatalkan. Riwayat presensi, pengumpulan tugas, kuis, nilai, dan poin akun-akun ini akan otomatis dibersihkan dari sistem.
                </p>
              </div>
            </div>

            {/* Safety Confirmation Controls */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkDeleteConfirmed}
                  onChange={(e) => setBulkDeleteConfirmed(e.target.checked)}
                  disabled={deletingBatch}
                  className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs text-slate-700 leading-tight">
                  Saya memahami dampak penghapusan massal ini dan yakin ingin menghapus{' '}
                  <strong className="text-rose-700">{targetUsersToDelete.length} akun pengguna</strong> ini secara permanen.
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ketik kata <span className="text-rose-600 font-mono font-black">HAPUS</span> di bawah ini untuk konfirmasi:
                </label>
                <input
                  type="text"
                  placeholder="Ketik HAPUS"
                  value={bulkDeleteConfirmText}
                  onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                  disabled={deletingBatch}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={deletingBatch}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                disabled={
                  deletingBatch ||
                  targetUsersToDelete.length === 0 ||
                  !bulkDeleteConfirmed ||
                  bulkDeleteConfirmText.trim().toUpperCase() !== 'HAPUS'
                }
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghapus {targetUsersToDelete.length} Pengguna...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus {targetUsersToDelete.length} Pengguna</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
