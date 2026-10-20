import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

export interface ToastItem {
  id: string;
  type: 'success' | 'badge' | 'points' | 'info' | 'live_activity' | 'error';
  title: string;
  message: string;
  points?: number;
  badgeName?: string;
  userRole?: string;
}

interface NotificationContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  celebrate: () => void;
  notifyBadgeEarned: (badgeName: string) => void;
  notifyPointsEarned: (amount: number, reason: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { user } = useAuth();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
      const newToast: ToastItem = { ...toast, id };
      setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

      // Auto dismiss after 5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const celebrate = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'],
      });
    } catch {
      // ignore
    }
  }, []);

  const notifyBadgeEarned = useCallback(
    (badgeName: string) => {
      celebrate();
      showToast({
        type: 'badge',
        title: 'Badge Baru Berhasil Diperoleh!',
        message: `Selamat! Anda berhasil membuka lencana "${badgeName}".`,
        badgeName,
      });
    },
    [celebrate, showToast]
  );

  const notifyPointsEarned = useCallback(
    (amount: number, reason: string) => {
      showToast({
        type: 'points',
        title: `+${amount} Poin Berhasil Diperoleh!`,
        message: reason,
        points: amount,
      });
    },
    [showToast]
  );

  // SSE real-time stream listener for live updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/notifications/stream');

      eventSource.addEventListener('activity', (e) => {
        try {
          const act = JSON.parse(e.data);
          if (!user) return;

          // Format role label dynamically based on act.user_role
          const role = (act.user_role || '').toLowerCase().trim();
          const roleLabel =
            role === 'admin' || role === 'administrator'
              ? 'Administrator'
              : role === 'dosen'
              ? 'Dosen'
              : role === 'mahasiswa'
              ? 'Mahasiswa'
              : 'Pengguna';

          // Show live activity notification to Dosen and Admin, or to Mahasiswa if from Dosen/Admin
          if (user.role === 'dosen' || user.role === 'admin') {
            showToast({
              type: 'live_activity',
              title: `Aktivitas ${roleLabel}: ${act.user_name}`,
              message: act.detail,
              userRole: role || (roleLabel.toLowerCase()),
            });
          } else if (user.role === 'mahasiswa' && (role === 'dosen' || role === 'admin')) {
            showToast({
              type: 'live_activity',
              title: `Aktivitas ${roleLabel}: ${act.user_name}`,
              message: act.detail,
              userRole: role,
            });
          }
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        celebrate,
        notifyBadgeEarned,
        notifyPointsEarned,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
};
