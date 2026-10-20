import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Award,
  Zap,
  Target,
  Trophy,
  Flame,
  Compass,
  Lock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const MyBadgesView: React.FC = () => {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const data = await api.badges.getAll();
      setBadges(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const getBadgeIcon = (iconName: string, isEarned: boolean) => {
    const iconClass = isEarned ? 'w-8 h-8' : 'w-8 h-8 text-slate-400';
    switch (iconName) {
      case 'award':
        return <Award className={iconClass} />;
      case 'zap':
        return <Zap className={iconClass} />;
      case 'target':
        return <Target className={iconClass} />;
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'compass':
        return <Compass className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  const earnedCount = badges.filter((b) => b.is_earned).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Koleksi Lencana (Badge)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Penghargaan atas pencapaian dan konsistensi Anda dalam pembelajaran perkuliahan.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-2xl flex items-center gap-2 self-start sm:self-auto">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-bold text-amber-900">
            {earnedCount} dari {badges.length} Terbuka
          </span>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {badges.map((badge) => {
            const isEarned = badge.is_earned;

            return (
              <div
                key={badge.id}
                className={`relative rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isEarned
                    ? 'bg-gradient-to-br from-white to-amber-50/40 border-amber-200 shadow-sm hover:shadow-md'
                    : 'bg-white/60 border-slate-200/70 opacity-75'
                }`}
              >
                {/* Lock or Unlock Pill */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                      isEarned
                        ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 border-amber-300 shadow-md shadow-amber-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    {getBadgeIcon(badge.icon, isEarned)}
                  </div>

                  {isEarned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Terbuka
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Lock className="w-3 h-3 text-slate-400" />
                      Terkunci
                    </span>
                  )}
                </div>

                {/* Badge Info */}
                <div className="space-y-1.5 mb-4">
                  <h3 className="text-base font-bold text-slate-900">{badge.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
                </div>

                {/* Requirement & Date */}
                <div className="pt-3 border-t border-slate-100 text-[11px] space-y-1">
                  <div className="text-slate-500 flex items-start gap-1">
                    <span className="font-semibold text-slate-700 shrink-0">Syarat:</span>
                    <span>{badge.requirement}</span>
                  </div>

                  {isEarned && badge.earned_at && (
                    <div className="text-amber-800 font-semibold flex items-center gap-1 pt-1">
                      <Calendar className="w-3 h-3 text-amber-600" />
                      <span>
                        Diperoleh:{' '}
                        {new Date(badge.earned_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
