import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AttendanceRecord, AttendanceSummary } from '../../types';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';

export const StudentAttendanceView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.attendance
      .getMy()
      .then((data) => {
        setRecords(data.records || []);
        setSummary(data.summary || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-3xl" />
        <div className="h-64 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  const attendancePercent = summary?.attendance_percent || 100;
  const attendanceScore = Math.round((attendancePercent * 0.15) * 10) / 10;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#012E26] via-[#023b31] to-[#012E26] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20 mb-2">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Presensi Kehadiran Kuliah</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kehadiran & Keaktifan Kelas
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Presensi kehadiran Anda tercatat secara berkala dan terakumulasi ke dalam evaluasi semester.
          </p>
        </div>

        {/* Score Pill */}
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-amber-300 block">
            Capaian Kehadiran
          </span>
          <span className="text-3xl font-black text-white">{attendancePercent}%</span>
          <span className="text-xs font-semibold text-emerald-200 block mt-0.5">
            {attendanceScore} / 15 Poin Nilai
          </span>
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Hadir Tepat</span>
            <p className="text-xl font-black text-emerald-700">{summary?.hadir_count || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Izin</span>
            <p className="text-xl font-black text-blue-700">{summary?.izin_count || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Sakit</span>
            <p className="text-xl font-black text-amber-700">{summary?.sakit_count || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">Alpa</span>
            <p className="text-xl font-black text-rose-700">{summary?.alpa_count || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Attendance History Timeline / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Riwayat Presensi per Pertemuan
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Total Sesi: {records.length} Pertemuan
          </span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada rekaman sesi presensi kelas untuk akun Anda.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((r) => {
              const dateStr = r.date ? new Date(r.date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-';
              return (
                <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#012E26]/10 text-[#012E26] font-black text-xs flex items-center justify-center shrink-0">
                      P{r.meeting_number}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {r.meeting_topic}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tanggal: {dateStr} {r.notes ? `• ${r.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      r.status === 'hadir'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : r.status === 'izin'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : r.status === 'sakit'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
