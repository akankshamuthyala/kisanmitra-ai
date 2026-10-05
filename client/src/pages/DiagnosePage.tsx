import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Camera,
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { useSubmitDiagnosis, useDiagnoses } from '../hooks/useDiagnosis.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Spinner } from '../components/ui/Spinner.js';
import { RiskBadge } from '../components/ui/RiskBadge.js';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge.js';
import { ApiError } from '../lib/apiClient.js';
import { formatDate, formatEnumLabel } from '../lib/format.js';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@shared/enums.js';
import type { DiagnosisRecord } from '@shared/types.js';

export const DiagnosePage: React.FC = () => {
  const { t } = useTranslation();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropHint, setCropHint] = useState('');
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeDiagnosis, setActiveDiagnosis] = useState<DiagnosisRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pastDiagnoses, isLoading: loadingHistory } = useDiagnoses();
  const submitDiagnosis = useSubmitDiagnosis();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg(t('diagnose.invalid_file', 'Please select a valid image file (JPG, PNG, WebP).'));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg(t('diagnose.photo_too_large', 'Image file is too large. Maximum size is 10MB.'));
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setActiveDiagnosis(null);
    }
  };

  const handleClearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photo) {
      setErrorMsg(t('diagnose.select_photo_first', 'Please upload or capture a crop photo first.'));
      return;
    }
    setErrorMsg(null);

    try {
      const result = await submitDiagnosis.mutateAsync({
        input: {
          crop_hint: cropHint.trim() || undefined,
          notes: notes.trim() || undefined,
          output_language: language,
        },
        image: photo,
      });
      setActiveDiagnosis(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg(t('errors.generic', 'Failed to diagnose image. Please try again.'));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title={t('diagnose.title', 'AI Photo Crop Diagnosis')}
        subtitle={t('diagnose.subtitle', 'Upload a leaf or plant photo to instantly detect diseases, pest infestations, and nutrient deficiencies.')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload and Form Section */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-6 sm:p-7">
            <h2 className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              {t('diagnose.upload_section', 'Upload Plant Photo')}
            </h2>

            {errorMsg && (
              <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo Area */}
              <div>
                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-stone-900 aspect-video flex items-center justify-center">
                    <img src={photoPreview} alt="Crop preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white transition shadow-md"
                      title={t('common.remove', 'Remove')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 transition">
                      <Upload className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-stone-800 group-hover:text-emerald-700 mb-1">
                      {t('diagnose.click_to_upload', 'Click to upload or take a photo')}
                    </p>
                    <p className="text-xs text-stone-400">
                      JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Hints & Optional Fields */}
              <div className="space-y-4 pt-1">
                <div>
                  <label htmlFor="diag-crop-hint" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {t('diagnose.crop_name', 'Crop Name (Optional)')}
                  </label>
                  <input
                    id="diag-crop-hint"
                    type="text"
                    value={cropHint}
                    onChange={(e) => setCropHint(e.target.value)}
                    placeholder={t('diagnose.crop_hint_placeholder', 'e.g. Tomato, Cotton, Rice, Chilli')}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="diag-notes" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {t('diagnose.notes', 'Observed Symptoms (Optional)')}
                  </label>
                  <textarea
                    id="diag-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('diagnose.notes_placeholder', 'e.g. Yellow patches on underside of leaves, sudden wilting...')}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  />
                </div>

                <div>
                  <label htmlFor="diag-lang" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    {t('diagnose.output_language', 'Report Language')}
                  </label>
                  <select
                    id="diag-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {LANGUAGE_LABELS[lang].label} ({LANGUAGE_LABELS[lang].native})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!photo || submitDiagnosis.isPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitDiagnosis.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span>{t('diagnose.analyzing', 'Analyzing Image with AI...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('diagnose.diagnose_button', 'Diagnose Plant Health')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Photography Tips Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <Info className="w-4 h-4 text-amber-600" />
              {t('diagnose.photo_tips_title', 'Tips for high diagnostic accuracy')}
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-amber-800">
              <li>{t('diagnose.tip_1', 'Take clear close-up shots of affected leaves, stems, or fruits.')}</li>
              <li>{t('diagnose.tip_2', 'Ensure bright, natural sunlight without harsh reflections.')}</li>
              <li>{t('diagnose.tip_3', 'Show both the healthy and unhealthy parts for comparison if possible.')}</li>
            </ul>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-6 space-y-6">
          {activeDiagnosis ? (
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-6 sm:p-7 space-y-6 animate-fadeIn">
              {/* Header result */}
              <div className="border-b border-stone-100 pb-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {activeDiagnosis.result.plant_identified || cropHint || 'Crop Identified'}
                  </span>
                  <RiskBadge level={activeDiagnosis.result.risk_level} />
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  {t('diagnose.results_header', 'AI Diagnostic Analysis')}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {formatDate(activeDiagnosis.created_at)} • {activeDiagnosis.model_used}
                </p>
              </div>

              {/* Quality / Tips Warning if photo not ideal */}
              {activeDiagnosis.result.needs_better_photo && (
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    {t('diagnose.needs_better_photo', 'A clearer photo is recommended')}
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {activeDiagnosis.result.better_photo_tips?.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visible Observations */}
              {activeDiagnosis.result.visible_observations?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    {t('diagnose.observations', 'Visible Observations')}
                  </h4>
                  <ul className="space-y-1.5">
                    {activeDiagnosis.result.visible_observations.map((obs, idx) => (
                      <li key={idx} className="text-xs text-stone-700 flex items-start gap-2 bg-stone-50 p-2 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Possible Causes */}
              {activeDiagnosis.result.possible_causes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
                    {t('diagnose.possible_causes', 'Probable Causes & Diagnoses')}
                  </h4>
                  <div className="space-y-3">
                    {activeDiagnosis.result.possible_causes.map((cause, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-stone-200/70 bg-stone-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-stone-900">{cause.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                              {formatEnumLabel(cause.category)}
                            </span>
                            <ConfidenceBadge level={cause.confidence} />
                          </div>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">{cause.reasoning}</p>
                        {cause.recommended_actions?.length > 0 && (
                          <div className="pt-2 border-t border-stone-200/50">
                            <p className="text-[11px] font-bold text-emerald-800 mb-1">
                              {t('diagnose.actions_heading', 'Recommended Actions:')}
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-stone-700">
                              {cause.recommended_actions.map((act, actIdx) => (
                                <li key={actIdx}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Next Steps */}
              {activeDiagnosis.result.next_steps?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    {t('diagnose.next_steps', 'Immediate Next Steps')}
                  </h4>
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5">
                    {activeDiagnosis.result.next_steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-medium text-emerald-950">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {activeDiagnosis.result.disclaimer && (
                <div className="text-[11px] text-stone-400 italic border-t border-stone-100 pt-3">
                  {activeDiagnosis.result.disclaimer}
                </div>
              )}
            </div>
          ) : (
            /* Empty placeholder state */
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 mb-1">
                {t('diagnose.no_result_yet', 'No Diagnosis Performed Yet')}
              </h3>
              <p className="text-xs text-stone-500 max-w-xs">
                {t('diagnose.no_result_desc', 'Upload or take a photo of your affected crop on the left and submit for instant diagnosis.')}
              </p>
            </div>
          )}

          {/* Past Diagnoses Quick Drawer */}
          {pastDiagnoses && pastDiagnoses.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-5">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-500" />
                {t('diagnose.recent_diagnoses', 'Recent Diagnoses')}
              </h3>
              <div className="space-y-2">
                {pastDiagnoses.slice(0, 4).map((diag) => (
                  <button
                    key={diag.id}
                    onClick={() => setActiveDiagnosis(diag)}
                    className="w-full text-left p-3 rounded-xl border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition flex items-center justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-800 group-hover:text-emerald-700">
                          {diag.result?.plant_identified || diag.crop_hint || 'Plant'}
                        </span>
                        <RiskBadge level={diag.result?.risk_level} />
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5">{formatDate(diag.created_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosePage;
