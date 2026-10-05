import React from 'react';
import type { ConfidenceLevel } from '@shared/enums.js';

interface ConfidenceBadgeProps {
  confidence?: ConfidenceLevel | null;
  className?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence, className = '' }) => {
  if (!confidence) return null;

  const colorStyles = {
    high: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-purple-50 text-purple-700 border-purple-200',
    low: 'bg-stone-100 text-stone-700 border-stone-200',
  }[confidence];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorStyles} ${className}`}
    >
      Confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
    </span>
  );
};
