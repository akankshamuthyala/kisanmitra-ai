import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, MapPin, Droplets, Mountain, Edit2, Trash2, Tractor } from 'lucide-react';
import { useFarms, useDeleteFarm } from '../hooks/useFarms.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.js';
import { formatEnumLabel } from '../lib/format.js';

const FarmsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: farms, isLoading, error, refetch } = useFarms();
  const deleteFarm = useDeleteFarm();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  if (error) {
    return <ErrorState message={t('errors.load_farms', 'Failed to load farms')} onRetry={refetch} />;
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteFarm.mutateAsync(deleteId);
    } catch { /* error handled by query client */ }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader
          title={t('farms.title', 'My Farms')}
          subtitle={t('farms.subtitle', 'Manage your farm profiles')}
        />
        <Link
          to="/farms/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" />
          {t('farms.add_farm', 'Add Farm')}
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : farms && farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {farms.map(farm => (
            <div
              key={farm.id}
              className="bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover p-6 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Tractor className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{farm.name}</h3>
                    <p className="text-xs text-stone-500">{farm.total_area_acres} acres</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate(`/farms/${farm.id}/edit`)}
                    className="p-2 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    aria-label={`Edit ${farm.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(farm.id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    aria-label={`Delete ${farm.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-600">
                  <MapPin className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span className="truncate">
                    {[farm.village, farm.district, farm.state].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <Mountain className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span>{formatEnumLabel(farm.soil_type)} soil</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <Droplets className="w-4 h-4 text-stone-400 flex-shrink-0" />
                  <span>{formatEnumLabel(farm.irrigation_source)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('farms.empty_title', 'No farms yet')}
          description={t('farms.empty_desc', 'Add your first farm to get personalized crop advisories.')}
          action={
            <Link
              to="/farms/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              {t('farms.add_farm', 'Add Farm')}
            </Link>
          }
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={t('farms.delete_title', 'Delete Farm')}
        message={t('farms.delete_confirm', 'Are you sure? This will also remove all advisories linked to this farm.')}
        confirmLabel={t('common.delete', 'Delete')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteFarm.isPending}
      />
    </div>
  );
};

export default FarmsPage;
