import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Award, Zap, CheckCircle2, AlertCircle, Info, Radio, X, ShieldCheck, BookOpen } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotification();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        let borderClass = 'border-emerald-200 bg-white shadow-emerald-50/50';

        if (toast.type === 'badge') {
          icon = <Award className="w-5 h-5 text-amber-500 shrink-0" />;
          borderClass = 'border-amber-300 bg-amber-50/90 shadow-amber-100';
        } else if (toast.type === 'points') {
          icon = <Zap className="w-5 h-5 text-indigo-500 shrink-0" />;
          borderClass = 'border-indigo-200 bg-indigo-50/90 shadow-indigo-100';
        } else if (toast.type === 'live_activity') {
          const r = (toast.userRole || '').toLowerCase();
          if (r === 'admin' || r === 'administrator') {
            icon = <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0" />;
            borderClass = 'border-purple-200 bg-purple-50/95 shadow-purple-100';
          } else if (r === 'dosen') {
            icon = <BookOpen className="w-5 h-5 text-emerald-600 shrink-0" />;
            borderClass = 'border-emerald-200 bg-emerald-50/95 shadow-emerald-100';
          } else {
            icon = <Radio className="w-5 h-5 text-sky-500 animate-pulse shrink-0" />;
            borderClass = 'border-sky-200 bg-sky-50/90 shadow-sky-100';
          }
        } else if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderClass = 'border-rose-200 bg-rose-50/90 shadow-rose-100';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-slate-500 shrink-0" />;
          borderClass = 'border-slate-200 bg-white shadow-slate-100';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all transform animate-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 leading-tight">{toast.title}</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
