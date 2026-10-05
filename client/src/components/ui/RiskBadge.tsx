import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';
import type { RiskLevel } from '@shared/enums.js';

interface RiskBadgeProps {
  level?: RiskLevel | null;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, className = '' }) => {
  if (!level) return null;

  switch (level) {
    case 'low':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          <span>Low Risk</span>
        </span>
      );
    case 'moderate':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
          <span>Moderate Risk</span>
        </span>
      );
    case 'high':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300 ${className}`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
          <span>High Risk</span>
        </span>
      );
    case 'critical':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 ${className}`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
          <span>Critical Risk</span>
        </span>
      );
  }
};
