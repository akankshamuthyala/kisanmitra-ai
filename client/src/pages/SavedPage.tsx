import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Tractor,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAdvisories, useToggleSaveAdvisory } from '../hooks/useAdvisories.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { RiskBadge } from '../components/ui/RiskBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { formatDate, formatEnumLabel } from '../lib/format.js';

export const SavedPage: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdvisories({
    saved: true,
    page,
    limit: 12,
  });

  const toggleSave = useToggleSaveAdvisory();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={t('saved.title', 'Saved Advisories')}
        subtitle={t('saved.subtitle', 'Quick access to your bookmarked crop advisories and critical farming recommendations')}
      />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState message={t('errors.load_saved', 'Failed to load saved advisories')} onRetry={refetch} />
      ) : data?.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1">
            {t('saved.empty_title', 'No Saved Advisories Yet')}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mb-6">
            {t('saved.empty_desc', 'Whenever you find an advisory with important instructions or recommendations, click the bookmark icon to save it here for fast offline reference.')}
          </p>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <span>{t('saved.browse_history', 'Browse Advisory History')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((advisory) => (
              <div
                key={advisory.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-card hover:border-amber-300 hover:shadow-md transition p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {advisory.crop_name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {advisory.risk_level && <RiskBadge level={advisory.risk_level} />}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSave.mutateAsync(advisory.id);
                        }}
                        title={t('saved.remove_bookmark', 'Remove bookmark')}
                        className="p-1 rounded-lg text-amber-600 hover:bg-amber-50 transition"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Link to={`/advisory/${advisory.id}`} className="block focus:outline-none">
                    <h3 className="font-bold text-stone-900 group-hover:text-emerald-700 transition line-clamp-1 mb-1.5">
                      {advisory.result?.title || advisory.crop_name}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {advisory.result?.summary || `${formatEnumLabel(advisory.growth_stage)} • ${formatEnumLabel(advisory.season)}`}
                    </p>
                  </Link>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                  <div className="flex items-center gap-1 text-stone-600 font-medium">
                    <Tractor className="w-3.5 h-3.5 text-stone-400" />
                    <span className="truncate max-w-[120px]">{advisory.farm_name || 'Farm'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(advisory.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-200/80 shadow-card p-4">
              <span className="text-xs text-stone-500 font-medium">
                {t('history.page_info', 'Page {{page}} of {{totalPages}} ({{total}} total)', {
                  page: data.page,
                  totalPages: data.total_pages,
                  total: data.total,
                })}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={data.page >= data.total_pages}
                  className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
