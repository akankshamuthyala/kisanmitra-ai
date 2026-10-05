import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  X,
  CheckCircle,
  Tractor,
  Leaf,
  Settings2,
} from 'lucide-react';
import { advisoryInputSchema, type AdvisoryInput } from '@shared/schemas.js';
import {
  SEASONS,
  GROWTH_STAGES,
  ADVISORY_FOCUS_AREAS,
  WEATHER_CONDITIONS,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  DETAIL_LEVELS,
  type SupportedLanguage,
} from '@shared/enums.js';
import { useFarms } from '../hooks/useFarms.js';
import { useCreateAdvisory } from '../hooks/useAdvisories.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { ApiError } from '../lib/apiClient.js';
import { formatEnumLabel } from '../lib/format.js';

const STEPS = ['farm_crop', 'conditions', 'preferences'] as const;

const NewAdvisoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: farms, isLoading: loadingFarms } = useFarms();
  const createAdvisory = useCreateAdvisory();

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AdvisoryInput>({
    resolver: zodResolver(advisoryInputSchema),
    defaultValues: {
      focus_areas: ['general_health'],
      output_language: 'en',
      detail_level: 'detailed',
      season: 'kharif',
      growth_stage: 'vegetative',
      recent_weather: 'normal',
      area_acres: 1,
    },
  });

  const selectedFocusAreas = watch('focus_areas') || [];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setServerError(t('advisory.photo_too_large', 'Photo must be under 5MB'));
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nextStep = async () => {
    let valid = true;
    if (step === 0) {
      valid = await trigger(['farm_id', 'crop_name', 'crop_category', 'season', 'growth_stage', 'area_acres']);
    } else if (step === 1) {
      valid = await trigger(['recent_weather', 'focus_areas']);
    }
    if (valid) setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const onSubmit = async (data: AdvisoryInput) => {
    setServerError(null);
    try {
      const result = await createAdvisory.mutateAsync({ input: data, photo });
      navigate(`/advisory/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(t('errors.generic', 'Something went wrong.'));
      }
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none";

  if (loadingFarms) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (farms && farms.length === 0) {
    return (
      <ErrorState
        message={t('advisory.no_farms', 'You need to add a farm first before creating an advisory.')}
        actionLabel={t('farms.add_farm', 'Add Farm')}
        onRetry={() => navigate('/farms/new')}
      />
    );
  }

  const stepIcons = [Tractor, Leaf, Settings2];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back', 'Back')}
      </button>

      <PageHeader
        title={t('advisory.new_title', 'New Advisory')}
        subtitle={t('advisory.new_subtitle', 'Get AI-powered farming guidance')}
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-stone-100 shadow-card p-4">
        {STEPS.map((s, i) => {
          const Icon = stepIcons[i];
          const isActive = i === step;
          const isDone = i < step;
          return (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isActive
                      ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-600'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${isActive ? 'text-emerald-700' : 'text-stone-500'}`}>
                  {t(`advisory.step_${s}`, formatEnumLabel(s))}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-emerald-500' : 'bg-stone-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-8">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium" role="alert">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Farm & Crop */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="adv-farm" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.farm', 'Select Farm')} *
                </label>
                <select id="adv-farm" {...register('farm_id')} className={inputClass}>
                  <option value="">{t('advisory.select_farm', '— Select a farm —')}</option>
                  {farms?.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.district}, {f.state})</option>
                  ))}
                </select>
                {errors.farm_id && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.farm_id.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adv-crop" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.crop_name', 'Crop Name')} *
                  </label>
                  <input id="adv-crop" {...register('crop_name')} className={inputClass} placeholder="e.g. Rice, Tomato" />
                  {errors.crop_name && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.crop_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="adv-category" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.crop_category', 'Category')} *
                  </label>
                  <select id="adv-category" {...register('crop_category')} className={inputClass}>
                    {['cereals', 'pulses', 'oilseeds', 'vegetables', 'fruits', 'cash_crops', 'plantation_spices', 'floriculture'].map(c => (
                      <option key={c} value={c}>{formatEnumLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="adv-variety" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.variety', 'Variety')} ({t('common.optional', 'Optional')})
                </label>
                <input id="adv-variety" {...register('variety')} className={inputClass} placeholder="e.g. Basmati-370" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="adv-season" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.season', 'Season')} *
                  </label>
                  <select id="adv-season" {...register('season')} className={inputClass}>
                    {SEASONS.map(s => (
                      <option key={s} value={s}>{formatEnumLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="adv-stage" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.growth_stage', 'Growth Stage')} *
                  </label>
                  <select id="adv-stage" {...register('growth_stage')} className={inputClass}>
                    {GROWTH_STAGES.map(g => (
                      <option key={g} value={g}>{formatEnumLabel(g)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="adv-area" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.area', 'Crop Area (acres)')} *
                  </label>
                  <input id="adv-area" type="number" step="0.1" min="0.01" {...register('area_acres', { valueAsNumber: true })} className={inputClass} />
                  {errors.area_acres && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.area_acres.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="adv-sowing" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.sowing_date', 'Sowing Date')} ({t('common.optional', 'Optional')})
                </label>
                <input id="adv-sowing" type="date" {...register('sowing_date')} className={inputClass} />
              </div>
            </div>
          )}

          {/* Step 2: Conditions */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="adv-weather" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.weather', 'Recent Weather')} *
                </label>
                <select id="adv-weather" {...register('recent_weather')} className={inputClass}>
                  {WEATHER_CONDITIONS.map(w => (
                    <option key={w} value={w}>{formatEnumLabel(w)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t('advisory.focus_areas', 'Focus Areas')} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ADVISORY_FOCUS_AREAS.map(area => (
                    <label
                      key={area}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedFocusAreas.includes(area)
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={area}
                        {...register('focus_areas')}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedFocusAreas.includes(area) ? 'bg-emerald-600 border-emerald-600' : 'border-stone-300'
                      }`}>
                        {selectedFocusAreas.includes(area) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{formatEnumLabel(area)}</span>
                    </label>
                  ))}
                </div>
                {errors.focus_areas && <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.focus_areas.message}</p>}
              </div>

              <div>
                <label htmlFor="adv-symptoms" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.symptoms', 'Observed Symptoms')} ({t('common.optional', 'Optional')})
                </label>
                <textarea
                  id="adv-symptoms"
                  rows={3}
                  {...register('symptoms')}
                  className={inputClass}
                  placeholder={t('advisory.symptoms_placeholder', 'e.g. Yellow spots on lower leaves, curling at tips...')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adv-fertilizer" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.last_fertilizer', 'Last Fertilizer')} ({t('common.optional', 'Optional')})
                  </label>
                  <input id="adv-fertilizer" {...register('last_fertilizer_applied')} className={inputClass} placeholder="e.g. DAP 50kg/acre" />
                </div>
                <div>
                  <label htmlFor="adv-pesticide" className="block text-sm font-semibold text-stone-700 mb-1.5">
                    {t('advisory.last_pesticide', 'Last Pesticide')} ({t('common.optional', 'Optional')})
                  </label>
                  <input id="adv-pesticide" {...register('last_pesticide_applied')} className={inputClass} placeholder="e.g. Chlorpyrifos spray" />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.photo', 'Crop Photo')} ({t('common.optional', 'Optional')})
                </label>
                {photoPreview ? (
                  <div className="relative inline-block">
                    <img src={photoPreview} alt="Crop preview" className="w-40 h-40 object-cover rounded-xl border border-stone-200" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 px-6 py-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('advisory.upload_photo', 'Upload a photo (max 5MB)')}</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label htmlFor="adv-lang" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.output_language', 'Advisory Language')}
                </label>
                <select id="adv-lang" {...register('output_language')} className={inputClass}>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l} value={l}>
                      {LANGUAGE_LABELS[l as SupportedLanguage].label} ({LANGUAGE_LABELS[l as SupportedLanguage].native})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adv-detail" className="block text-sm font-semibold text-stone-700 mb-1.5">
                  {t('advisory.detail_level', 'Detail Level')}
                </label>
                <select id="adv-detail" {...register('detail_level')} className={inputClass}>
                  {DETAIL_LEVELS.map(d => (
                    <option key={d} value={d}>{formatEnumLabel(d)}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <h4 className="text-sm font-bold text-emerald-800 mb-1">
                  {t('advisory.ready', 'Ready to generate your advisory!')}
                </h4>
                <p className="text-xs text-emerald-700">
                  {t('advisory.ready_desc', 'Our AI will analyze your farm conditions and provide comprehensive guidance with actionable recommendations.')}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            {step > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.previous', 'Previous')}
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
              >
                {t('common.next', 'Next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {t('advisory.generate', 'Generate Advisory')}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewAdvisoryPage;
