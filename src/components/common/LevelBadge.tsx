import React from 'react';
import { ShieldAlert, Compass, Sparkles, Zap, Award, Crown } from 'lucide-react';

interface LevelBadgeProps {
  levelTitle: string;
  levelNumber?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ levelTitle, levelNumber, size = 'md' }) => {
  const getLevelConfig = () => {
    switch (levelTitle.toLowerCase()) {
      case 'master':
        return {
          icon: <Crown className="shrink-0" />,
          bg: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-amber-200/50',
          border: 'border-yellow-300',
        };
      case 'advanced':
        return {
          icon: <Award className="shrink-0" />,
          bg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200/50',
          border: 'border-purple-300',
        };
      case 'skilled':
        return {
          icon: <Zap className="shrink-0" />,
          bg: 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-blue-200/50',
          border: 'border-blue-300',
        };
      case 'learner':
        return {
          icon: <Sparkles className="shrink-0" />,
          bg: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-200/50',
          border: 'border-emerald-300',
        };
      case 'explorer':
        return {
          icon: <Compass className="shrink-0" />,
          bg: 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-sky-200/50',
          border: 'border-sky-300',
        };
      default:
        return {
          icon: <ShieldAlert className="shrink-0" />,
          bg: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-slate-200/50',
          border: 'border-slate-300',
        };
    }
  };

  const config = getLevelConfig();

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5 font-medium shadow-xs',
    md: 'text-xs px-3 py-1 gap-1.5 font-semibold shadow-xs',
    lg: 'text-sm px-4 py-1.5 gap-2 font-bold shadow-md',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.border} ${config.bg} ${sizeClasses}`}
    >
      <span className={iconSizes}>{config.icon}</span>
      <span>
        {levelNumber ? `Lv.${levelNumber} ` : ''}
        {levelTitle}
      </span>
    </span>
  );
};
