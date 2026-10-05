import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tractor,
  Calendar,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useAdvisories, useToggleSaveAdvisory, useDeleteAdvisory } from '../hooks/useAdvisories.js';
import { useFarms } from '../hooks/useFarms.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { RiskBadge } from '../components/ui/RiskBadge.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatDate, formatEnumLabel } from '../lib/format.js';
import { RISK_LEVELS, type RiskLevel } from '@shared/enums.js';

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | ''>('');
  const [selectedFarm, setSelectedFarm] = useState('');
  const [page, setPage] = useState(1);

  const { data: farms } = useFarms();
  const { data, isLoading, isError, refetch } = useAdvisories({
    q: debouncedSearch || undefined,
    crop: selectedCrop || undefined,
    risk: selectedRisk || undefined,
    farm_id: selectedFarm || undefined,
    page,
    limit: 10,
  });

  const toggleSave = useToggleSaveAdvisory();
  const deleteAdvisory = useDeleteAdvisory();

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCrop('');
    setSelectedRisk('');
    setSelectedFarm('');
    setPage(1);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(t('history.confirm_delete', 'Are you sure you want to delete this advisory?'))) {
      await deleteAdvisory.mutateAsync(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={t('history.title', 'Advisory History')}
          subtitle={t('history.subtitle', 'Browse and search all your past crop advisories and AI recommendations')}
        />
        <Link
          to="/advisory/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('advisory.create_new', 'New Advisory')}</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('history.search_placeholder', 'Search crop, title, issue...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
          </div>

          {/* Farm Filter */}
          <div>
            <select
              value={selectedFarm}
              onChange={(e) => {
                setSelectedFarm(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="">{t('history.all_farms', 'All Farms')}</option>
              {farms?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value as RiskLevel | '');
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              <option value="">{t('history.all_risks', 'All Risk Levels')}</option>
              {RISK_LEVELS.map((risk) => (
                <option key={risk} value={risk}>
                  {formatEnumLabel(risk)} Risk
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(search || selectedCrop || selectedRisk || selectedFarm) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
            >
              {t('common.clear_filters', 'Clear Filters')}
            </button>
          )}
        </div>
      </div>

      {/* Advisories List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState message={t('errors.load_history', 'Failed to load advisories')} onRetry={refetch} />
      ) : data?.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-800 mb-1">
            {t('history.empty_title', 'No Advisories Found')}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mb-6">
            {search || selectedFarm || selectedRisk
              ? t('history.no_matches', 'Try adjusting your search filters to find what you are looking for.')
              : t('history.no_advisories_yet', 'You have not generated any crop advisories yet. Start by generating your first tailored advisory.')}
          </p>
          <Link
            to="/advisory/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('advisory.create_new', 'Generate First Advisory')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {data?.items.map((advisory) => (
              <div
                key={advisory.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-card hover:border-emerald-300 hover:shadow-md transition p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <Link
                  to={`/advisory/${advisory.id}`}
                  className="flex-1 space-y-1.5 focus:outline-none"
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-base text-stone-900 group-hover:text-emerald-700 transition">
                      {advisory.result?.title || advisory.crop_name}
                    </span>
                    {advisory.risk_level && <RiskBadge level={advisory.risk_level} />}
                    {advisory.status === 'failed' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-1">
                    {advisory.result?.summary || `${formatEnumLabel(advisory.growth_stage)} stage • ${formatEnumLabel(advisory.season)}`}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-stone-400 pt-1">
                    {advisory.farm_name && (
                      <span className="flex items-center gap-1 text-stone-500 font-medium">
                        <Tractor className="w-3.5 h-3.5 text-stone-400" />
                        {advisory.farm_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(advisory.created_at)}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-100">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSave.mutateAsync(advisory.id);
                    }}
                    title={advisory.is_saved ? 'Unsave' : 'Save'}
                    className={`p-2 rounded-xl transition ${
                      advisory.is_saved
                        ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                        : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    {advisory.is_saved ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDelete(advisory.id, e)}
                    title={t('common.delete', 'Delete')}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
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

export default HistoryPage;
