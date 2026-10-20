import React from 'react';

interface ProgressBarProps {
  progress: number;
  label?: string;
  subLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercent?: boolean;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  subLabel,
  size = 'md',
  showPercent = true,
  colorClass = 'bg-gradient-to-r from-indigo-500 to-indigo-600',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }[size];

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
          <span className="text-slate-700">{label}</span>
          {showPercent && <span className="text-indigo-600">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 ${heightClass}`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-700 ease-out ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {subLabel && <p className="text-xs text-slate-500 mt-1">{subLabel}</p>}
    </div>
  );
};
