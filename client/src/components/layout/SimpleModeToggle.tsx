import React from 'react';
import { Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';

export const SimpleModeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { user, toggleSimpleMode } = useAuth();
  const isSimpleMode = user?.simple_mode ?? (localStorage.getItem('kisanmitra_simple_mode') === 'true');

  return (
    <button
      type="button"
      onClick={toggleSimpleMode}
      aria-pressed={isSimpleMode}
      aria-label="Toggle Simple Mode with larger text"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-semibold transition shadow-sm ${
        isSimpleMode
          ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-400'
          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
      } ${className}`}
    >
      <Type className={`w-4 h-4 ${isSimpleMode ? 'text-amber-700' : 'text-stone-500'}`} />
      <span className="hidden md:inline">{t('nav.simple_mode', 'Simple Mode')}</span>
      {isSimpleMode && <span className="text-xs bg-amber-200 px-1 rounded text-amber-900 font-bold">ON</span>}
    </button>
  );
};
