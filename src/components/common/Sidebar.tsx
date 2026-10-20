import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from './AppLogo';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Award,
  Users,
  Settings,
  User,
  LogOut,
  GraduationCap,
  CalendarCheck,
  FileText,
  MessageSquare,
  Layers,
  Database,
  Building2,
  School,
  Trophy,
  ShieldCheck,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onRequestLogout: () => void;
}

interface MenuGroup {
  title?: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  onRequestLogout,
}) => {
  const { user } = useAuth();

  const getMenuGroups = (): MenuGroup[] => {
    // 1. Administrator Menu Groups
    if (user?.role === 'admin') {
      return [
        {
          items: [
            { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
          ],
        },
        {
          title: 'MANAJEMEN AKADEMIK',
          items: [
            { id: 'departments', label: 'Program Studi', icon: School },
            { id: 'classes', label: 'Kelas Perkuliahan', icon: Building2 },
            { id: 'courses', label: 'Mata Kuliah', icon: Layers },
            { id: 'users', label: 'Pengguna dan Hak Akses', icon: Users },
          ],
        },
        {
          title: 'PEMBELAJARAN',
          items: [
            { id: 'materials', label: 'Materi Pembelajaran', icon: BookOpen },
            { id: 'tugas', label: 'Tugas dan Pengumpulan', icon: FileText },
            { id: 'quizzes', label: 'Kuis dan Evaluasi', icon: HelpCircle },
            { id: 'presensi', label: 'Presensi Kehadiran', icon: CalendarCheck },
            { id: 'discussions', label: 'Forum Diskusi', icon: MessageSquare },
            { id: 'penilaian', label: 'Buku Nilai Semester', icon: GraduationCap },
          ],
        },
        {
          title: 'GAMIFIKASI DAN ANALITIK',
          items: [
            { id: 'badges', label: 'Level, dan Badge', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
            { id: 'student_progress', label: 'Analitik Pembelajaran', icon: TrendingUp },
          ],
        },
        {
          title: 'PENGELOLAAN SISTEM',
          items: [
            { id: 'settings', label: 'Pengaturan dan Identitas', icon: Settings },
            { id: 'audit_log', label: 'Audit Log', icon: ShieldCheck },
            { id: 'database', label: 'Backup dan Restore', icon: Database },
            { id: 'profile', label: 'Profil Administrator', icon: User },
          ],
        },
      ];
    }

    // 2. Dosen Menu Groups
    if (user?.role === 'dosen') {
      return [
        {
          items: [
            { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
          ],
        },
        {
          title: 'MANAJEMEN AKADEMIK',
          items: [
            { id: 'courses', label: 'Mata Kuliah', icon: Layers },
            { id: 'classes', label: 'Kelas Perkuliahan', icon: Building2 },
            { id: 'students', label: 'Data Mahasiswa', icon: Users },
            { id: 'departments', label: 'Program Studi', icon: School },
          ],
        },
        {
          title: 'PEMBELAJARAN',
          items: [
            { id: 'materials', label: 'Materi Pembelajaran', icon: BookOpen },
            { id: 'tugas', label: 'Tugas dan Pengumpulan', icon: FileText },
            { id: 'quizzes', label: 'Kuis dan Evaluasi', icon: HelpCircle },
            { id: 'presensi', label: 'Presensi Kehadiran', icon: CalendarCheck },
            { id: 'discussions', label: 'Forum Diskusi', icon: MessageSquare },
            { id: 'penilaian', label: 'Buku Nilai Semester', icon: GraduationCap },
          ],
        },
        {
          title: 'GAMIFIKASI DAN ANALITIK',
          items: [
            { id: 'badges', label: 'Level, dan Badge', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard Mahasiswa', icon: Trophy },
            { id: 'student_progress', label: 'Analitik Pembelajaran', icon: TrendingUp },
          ],
        },
        {
          title: 'PENGELOLAAN SISTEM',
          items: [
            { id: 'settings', label: 'Pengaturan Komponen Nilai', icon: Settings },
            { id: 'audit_log', label: 'Audit Log Perkuliahan', icon: ShieldCheck },
            { id: 'profile', label: 'Profil Dosen', icon: User },
          ],
        },
      ];
    }

    // 3. Mahasiswa Menu Groups
    return [
      {
        items: [
          { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
        ],
      },
      {
        title: 'PERKULIAHAN SAYA',
        items: [
          { id: 'courses', label: 'Mata Kuliah Saya', icon: Layers },
          { id: 'materials', label: 'Materi Pembelajaran', icon: BookOpen },
          { id: 'tugas', label: 'Tugas Kuliah', icon: FileText },
          { id: 'quizzes', label: 'Kuis Interaktif', icon: HelpCircle },
          { id: 'presensi', label: 'Presensi Kehadiran', icon: CalendarCheck },
          { id: 'discussions', label: 'Forum Diskusi', icon: MessageSquare },
        ],
      },
      {
        title: 'GAMIFIKASI & PRESTASI',
        items: [
          { id: 'penilaian', label: 'Transkrip Nilai Akhir', icon: GraduationCap },
          { id: 'badges', label: 'Level, dan Badge', icon: Award },
          { id: 'leaderboard', label: 'Leaderboard Mahasiswa', icon: Trophy },
          { id: 'progress', label: 'Partisipasi & Progres', icon: TrendingUp },
        ],
      },
      {
        title: 'AKUN',
        items: [
          { id: 'profile', label: 'Profil Mahasiswa', icon: User },
        ],
      },
    ];
  };

  const menuGroups = getMenuGroups();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 lg:hidden">
          <div className="p-1 bg-white rounded-xl shadow-xs border border-slate-200/80 shrink-0">
            <AppLogo className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#012E26] leading-tight">GEMA BIO</h2>
            <p className="text-[11px] font-semibold text-[#EAA736]">Universitas Hamzanwadi</p>
          </div>
        </div>

        {/* User Role Tag */}
        <div className="p-3.5 mx-3 my-2.5 bg-[#012E26]/5 rounded-2xl border border-[#012E26]/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran Pengguna</p>
          <p className="text-xs font-bold text-[#012E26] capitalize mt-0.5 flex items-center justify-between">
            <span>
              {user?.role === 'dosen'
                ? 'Dosen Pengampu'
                : user?.role === 'admin'
                ? 'Administrator'
                : 'Mahasiswa'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          </p>
        </div>

        {/* Navigation items grouped by category */}
        <nav className="flex-1 px-3 py-1 space-y-3 overflow-y-auto">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {group.title && (
                <div className="pt-2 pb-1 px-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {group.title}
                  </p>
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#012E26] text-white shadow-md shadow-[#012E26]/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#EAA736]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onRequestLogout();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
