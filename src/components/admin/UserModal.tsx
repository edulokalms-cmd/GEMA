import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { User, UserRole, Department, AcademicClass } from '../../types';
import { X, Save, User as UserIcon, Mail, Lock, ShieldCheck, GraduationCap } from 'lucide-react';

interface UserModalProps {
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  onClose,
  onSaved,
}) => {
  const { user: currentUser, updateLocalUser } = useAuth();
  const { showToast } = useNotification();
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(user?.role || 'mahasiswa');
  const [studentId, setStudentId] = useState(user?.student_id || '');
  const [nidn, setNidn] = useState(user?.nidn || '');
  const [nip, setNip] = useState(user?.nip || '');
  const [className, setClassName] = useState(user?.class_name || 'BIO-2A');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [department, setDepartment] = useState(user?.department || 'S1 Pendidikan Biologi');
  const [availableClasses, setAvailableClasses] = useState<AcademicClass[]>([]);
  const [availableDepts, setAvailableDepts] = useState<Department[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.classes.getAll().catch(() => []),
      api.departments.getAll().catch(() => []),
    ]).then(([clsList, deptList]) => {
      setAvailableClasses(clsList);
      setAvailableDepts(deptList);
      if (!user && deptList.length > 0 && !department) {
        setDepartment(deptList[0].name);
      }
      if (!user && clsList.length > 0 && !className) {
        setClassName(clsList[0].name);
        if (clsList[0].department_name) {
          setDepartment(clsList[0].department_name);
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Nama wajib diisi.',
      });
      return;
    }
    if (!user && !password) {
      showToast({
        type: 'error',
        title: 'Kata Sandi Wajib',
        message: 'Kata sandi wajib ditentukan untuk akun baru.',
      });
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        name,
        username: username || undefined,
        email: email || undefined,
        role,
        student_id: role === 'mahasiswa' ? studentId : undefined,
        class_name: role === 'mahasiswa' ? className : undefined,
        nidn: role === 'dosen' || role === 'admin' ? nidn : undefined,
        nip: role === 'dosen' || role === 'admin' ? nip : undefined,
        department,
      };
      if (password) {
        payload.password = password;
      }

      if (user) {
        const updated = await api.users.update(user.id, payload);
        if (currentUser && currentUser.id === user.id) {
          updateLocalUser(updated);
        }
        showToast({
          type: 'success',
          title: 'Pengguna Diperbarui',
          message: `Data pengguna "${name}" berhasil diubah.`,
        });
      } else {
        await api.users.create(payload);
        showToast({
          type: 'success',
          title: 'Pengguna Ditambahkan',
          message: `Akun baru "${name}" (${role}) berhasil dibuat.`,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan Pengguna',
        message: err.message || 'Terjadi kesalahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {user ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur hak akses akun sebagai Admin, Dosen, atau Mahasiswa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Siti Nurhaliza"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: siti23"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Email (Opsional, dapat diisi/diupdate mahasiswa di profil)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@gemabio.ac.id"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran (Role)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={currentUser?.role === 'dosen'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <option value="mahasiswa">Mahasiswa</option>
                {currentUser?.role === 'admin' && (
                  <>
                    <option value="dosen">Dosen</option>
                    <option value="admin">Admin</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {user ? 'Reset Sandi (Opsional)' : 'Kata Sandi Awal'}
                </label>
                <button
                  type="button"
                  onClick={() => setPassword('12345*')}
                  className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded cursor-pointer"
                  title="Gunakan sandi standar 12345*"
                >
                  Default: 12345*
                </button>
              </div>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={user ? 'Kosongkan jika tetap (atau 12345*)' : 'Contoh: 12345*'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                required={!user}
              />
            </div>
          </div>

          {role === 'mahasiswa' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Mahasiswa (NIM)
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Contoh: 230302001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Kelas Mahasiswa *
                  </label>
                  {availableClasses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isCustomClass;
                        setIsCustomClass(nextState);
                        if (!nextState) {
                          setClassName(availableClasses[0]?.name || 'BIO-2A');
                          if (availableClasses[0]?.department_name) {
                            setDepartment(availableClasses[0].department_name);
                          }
                        } else {
                          setClassName('');
                        }
                      }}
                      className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Klik untuk mengetik nama kelas baru yang belum ada di daftar"
                    >
                      {isCustomClass ? '← Pilih dari Daftar' : '+ Tulis Kelas Baru'}
                    </button>
                  )}
                </div>

                {isCustomClass || availableClasses.length === 0 ? (
                  <div>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value.toUpperCase())}
                      placeholder="Contoh: BIO-2C"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                      required
                    />
                    <p className="text-[10px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                      <span>💡</span> Kelas baru ini akan otomatis terdaftar di Kelola Kelas.
                    </p>
                  </div>
                ) : (
                  <select
                    value={className}
                    onChange={(e) => {
                      const val = e.target.value;
                      setClassName(val);
                      const matchedCls = availableClasses.find((c) => c.name === val);
                      if (matchedCls && matchedCls.department_name) {
                        setDepartment(matchedCls.department_name);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        Kelas {c.name} ({c.department_name})
                      </option>
                    ))}
                    {!availableClasses.some((c) => c.name === className) && className && (
                      <option value={className}>Kelas {className}</option>
                    )}
                  </select>
                )}
              </div>
            </div>
          )}

          {(role === 'dosen' || role === 'admin') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIDN
                </label>
                <input
                  type="text"
                  value={nidn}
                  onChange={(e) => setNidn(e.target.value)}
                  placeholder="Contoh: 0018067901"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="Contoh: 197906182005012001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Program Studi / Unit Kerja
            </label>
            {availableDepts.length > 0 ? (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
              >
                {availableDepts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
                {!availableDepts.some((d) => d.name === department) && department && (
                  <option value={department}>{department}</option>
                )}
              </select>
            ) : (
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Contoh: S1 Pendidikan Biologi"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#012E26]"
              />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
              className="px-5 py-2 bg-[#012E26] hover:bg-[#02473B] text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
