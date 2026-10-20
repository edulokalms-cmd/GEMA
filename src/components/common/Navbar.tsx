import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppLogo } from './AppLogo';
import { getUserInitials } from '../../utils/initials';
import {
  Menu,
  X,
  LogOut,
  Sparkles,
  Zap,
  ShieldCheck,
  BookOpen,
  User,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  totalPoints?: number;
  onRequestLogout: () => void;
  onNavigateToProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  totalPoints,
  onRequestLogout,
  onNavigateToProfile,
}) => {
  const { user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-rose-600" />
            Admin
          </span>
        );
      case 'dosen':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <BookOpen className="w-3 h-3 text-emerald-700" />
            Dosen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#012E26] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-[#EAA736]" />
            Mahasiswa
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Mobile hamburger & Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-3">
                <div className="p-1 bg-white rounded-xl shadow-xs border border-slate-200/80 shrink-0">
                  <AppLogo className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-[#012E26]">GEMA BIO</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-none hidden sm:block">
                    Gamifikasi E-Learning Mahasiswa Universitas Hamzanwadi
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Points counter, User profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Points counter for student */}
              {user?.role === 'mahasiswa' && totalPoints !== undefined && (
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-amber-900">{totalPoints} Poin</span>
                </div>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#012E26] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="hidden md:flex flex-col items-start text-left">
                    <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {user?.role ? user.role.toUpperCase() : ''}
                    </span>
                  </div>
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-30 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <div className="mt-2">{getRoleBadge(user?.role)}</div>
                        {user?.student_id && (
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            NIM: {user.student_id} {user.class_name ? `• Kelas ${user.class_name}` : ''}
                          </p>
                        )}
                        {user?.nidn && (
                          <p className="text-[10px] text-slate-500 mt-1 font-mono">
                            NIDN: {user.nidn}
                          </p>
                        )}
                        {user?.username && (
                          <p className="text-[10px] text-slate-400">
                            Username: @{user.username}
                          </p>
                        )}
                      </div>
                      <div className="p-1 space-y-0.5">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onNavigateToProfile?.();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>Lihat Profil Akun</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            onRequestLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Keluar (Logout)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
