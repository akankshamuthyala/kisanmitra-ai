import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@shared/enums.js';
import { useAuth } from '../../hooks/useAuth.js';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showIcon = true,
}) => {
  const { i18n } = useTranslation();
  const { user, updateProfile } = useAuth();

  const handleLanguageChange = async (newLang: SupportedLanguage) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem('kisanmitra_lang', newLang);

    if (user) {
      try {
        await updateProfile({ preferred_language: newLang });
      } catch {
        // Continue locally
      }
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {showIcon && <Globe className="w-4 h-4 text-stone-500 pointer-events-none" aria-hidden="true" />}
      <select
        value={i18n.language.split('-')[0]}
        onChange={e => handleLanguageChange(e.target.value as SupportedLanguage)}
        aria-label="Select Application Language"
        className="text-xs sm:text-sm font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang} value={lang}>
            {LANGUAGE_LABELS[lang].native} ({LANGUAGE_LABELS[lang].label})
          </option>
        ))}
      </select>
    </div>
  );
};
