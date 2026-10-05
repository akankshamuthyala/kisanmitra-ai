import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, ArrowLeft } from 'lucide-react';
import { farmSchema, type FarmInput } from '@shared/schemas.js';
import { SOIL_TYPES, IRRIGATION_SOURCES } from '@shared/enums.js';
import { useFarm, useCreateFarm, useUpdateFarm } from '../hooks/useFarms.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ApiError } from '../lib/apiClient.js';
import { formatEnumLabel } from '../lib/format.js';

const FarmFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const { data: existingFarm, isLoading: loadingFarm } = useFarm(id);
  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmInput>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      soil_type: 'alluvial',
      irrigation_source: 'rainfed',
      total_area_acres: 1,
    },
  });

  useEffect(() => {
    if (existingFarm) {
      reset({
        name: existingFarm.name,
        state: existingFarm.state,
        district: existingFarm.district,
        village: existingFarm.village || undefined,
        total_area_acres: existingFarm.total_area_acres,
        soil_type: existingFarm.soil_type,
        irrigation_source: existingFarm.irrigation_source,
        latitude: existingFarm.latitude ?? undefined,
        longitude: existingFarm.longitude ?? undefined,
      });
    }
  }, [existingFarm, reset]);

  const onSubmit = async (data: FarmInput) => {
    setServerError(null);
    try {
      if (isEditing && id) {
        await updateFarm.mutateAsync({ id, input: data });
      } else {
        await createFarm.mutateAsync(data);
      }
      navigate('/farms');
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(t('errors.generic', 'Something went wrong.'));
      }
    }
  };

  if (isEditing && loadingFarm) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/farms')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back', 'Back to Farms')}
      </button>

      <PageHeader
        title={isEditing ? t('farms.edit_title', 'Edit Farm') : t('farms.add_title', 'Add New Farm')}
        subtitle={
          isEditing
            ? t('farms.edit_subtitle', 'Update your farm details')
            : t('farms.add_subtitle', 'Register your farm for personalized advisories')
        }
      />

      <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-8">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Farm Name */}
          <div>
            <label htmlFor="farm-name" className="block text-sm font-semibold text-stone-700 mb-1.5">
              {t('farms.name', 'Farm Name')} *
            </label>
            <input id="farm-name" {...register('name')} className={inputClass} placeholder={t('farms.name_placeholder', 'e.g. Green Valley Farm')} />
            {errors.name && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.name.message}</p>}
          </div>

          {/* State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="farm-state" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.state', 'State')} *
              </label>
              <input id="farm-state" {...register('state')} className={inputClass} placeholder="e.g. Karnataka" />
              {errors.state && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.state.message}</p>}
            </div>
            <div>
              <label htmlFor="farm-district" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.district', 'District')} *
              </label>
              <input id="farm-district" {...register('district')} className={inputClass} placeholder="e.g. Mysuru" />
              {errors.district && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.district.message}</p>}
            </div>
          </div>

          {/* Village */}
          <div>
            <label htmlFor="farm-village" className="block text-sm font-semibold text-stone-700 mb-1.5">
              {t('farms.village', 'Village')} ({t('common.optional', 'Optional')})
            </label>
            <input id="farm-village" {...register('village')} className={inputClass} placeholder="e.g. Hullahalli" />
          </div>

          {/* Area */}
          <div>
            <label htmlFor="farm-area" className="block text-sm font-semibold text-stone-700 mb-1.5">
              {t('farms.area', 'Total Area (acres)')} *
            </label>
            <input id="farm-area" type="number" step="0.1" min="0.01" {...register('total_area_acres', { valueAsNumber: true })} className={inputClass} />
            {errors.total_area_acres && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.total_area_acres.message}</p>}
          </div>

          {/* Soil Type & Irrigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="farm-soil" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.soil_type', 'Soil Type')} *
              </label>
              <select id="farm-soil" {...register('soil_type')} className={inputClass}>
                {SOIL_TYPES.map(s => (
                  <option key={s} value={s}>{formatEnumLabel(s)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="farm-irrigation" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.irrigation', 'Irrigation Source')} *
              </label>
              <select id="farm-irrigation" {...register('irrigation_source')} className={inputClass}>
                {IRRIGATION_SOURCES.map(i => (
                  <option key={i} value={i}>{formatEnumLabel(i)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates (optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="farm-lat" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.latitude', 'Latitude')} ({t('common.optional', 'Optional')})
              </label>
              <input id="farm-lat" type="number" step="any" {...register('latitude', { valueAsNumber: true })} className={inputClass} placeholder="12.2958" />
            </div>
            <div>
              <label htmlFor="farm-lng" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('farms.longitude', 'Longitude')} ({t('common.optional', 'Optional')})
              </label>
              <input id="farm-lng" type="number" step="any" {...register('longitude', { valueAsNumber: true })} className={inputClass} placeholder="76.6394" />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? t('common.save', 'Save Changes') : t('farms.create', 'Create Farm')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmFormPage;
