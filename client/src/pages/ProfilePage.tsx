import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Globe,
  Zap,
  Sparkles,
  Shield,
  Save,
  AlertTriangle,
  LogOut,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Spinner } from '../components/ui/Spinner.js';
import { updateProfileSchema, type UpdateProfileInput } from '@shared/schemas.js';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type SupportedLanguage } from '@shared/enums.js';
import { formatDate } from '../lib/format.js';
import { ApiError } from '../lib/apiClient.js';

export const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, deleteAccount, logout } = useAuth();

  const [serverSuccess, setServerSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      preferred_language: user?.preferred_language || 'en',
      simple_mode: user?.simple_mode ?? false,
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError(null);
    setServerSuccess(null);
    try {
      await updateProfile(data);
      if (data.preferred_language && data.preferred_language !== i18n.language) {
        i18n.changeLanguage(data.preferred_language);
        localStorage.setItem('kisanmitra_lang', data.preferred_language);
      }
      setServerSuccess(t('profile.updated_success', 'Profile updated successfully!'));
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(t('errors.generic', 'Failed to update profile.'));
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError(t('profile.password_required', 'Please enter your password to confirm.'));
      return;
    }
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteAccount({ password: deletePassword });
    } catch (err) {
      setIsDeleting(false);
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError(t('errors.generic', 'Failed to delete account.'));
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <PageHeader
        title={t('profile.title', 'Farmer Profile & Settings')}
        subtitle={t('profile.subtitle', 'Manage your personal preferences, application language, and AI quotas')}
      />

      {serverSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
          {serverSuccess}
        </div>
      )}

      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
          {serverError}
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-4">
          <User className="w-5 h-5 text-emerald-600" />
          <span>{t('profile.personal_details', 'Personal Preferences')}</span>
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email (Readonly) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              {t('auth.email', 'Email Address')}
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-sm cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              {t('profile.email_cannot_change', 'Your email is tied to your account credentials and cannot be changed.')}
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="prof-name" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              {t('auth.name', 'Full Name')} *
            </label>
            <input
              id="prof-name"
              type="text"
              {...register('full_name')}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.full_name.message}</p>
            )}
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="prof-lang" className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-stone-500" />
              <span>{t('profile.language', 'Preferred Language')}</span>
            </label>
            <select
              id="prof-lang"
              {...register('preferred_language')}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang as SupportedLanguage].label} ({LANGUAGE_LABELS[lang as SupportedLanguage].native})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-400 mt-1">
              {t('profile.language_desc', 'This language will be used across the app and for AI crop advisory generations.')}
            </p>
          </div>

          {/* Simple Mode Toggle */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer hover:bg-stone-100 transition">
              <input
                type="checkbox"
                {...register('simple_mode')}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  {t('profile.simple_mode', 'Simple High-Contrast Mode')}
                </span>
                <p className="text-xs text-stone-500">
                  {t('profile.simple_mode_desc', 'Enlarges text and buttons with bold high contrast colors for easy outdoors viewing on the field.')}
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              <span>{t('common.save', 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Info & AI Quota Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-card p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-4">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <span>{t('profile.account_status', 'Account & Quota Status')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {t('profile.daily_quota', 'Daily AI Advisory Limit')}
            </span>
            <p className="text-2xl font-black text-emerald-950">
              {user?.daily_ai_quota || 20} <span className="text-xs font-normal text-emerald-700">requests/day</span>
            </p>
            <p className="text-[11px] text-emerald-600">
              {t('profile.quota_reset', 'Resets daily at midnight local time')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {t('profile.member_since', 'Member Since')}
            </span>
            <p className="text-base font-bold text-stone-800">
              {user?.created_at ? formatDate(user.created_at) : 'N/A'}
            </p>
            <p className="text-[11px] text-stone-400">
              {t('profile.account_type', 'Standard Farmer Tier')}
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-sm font-semibold transition"
          >
            <LogOut className="w-4 h-4 text-stone-500" />
            <span>{t('auth.logout', 'Sign Out')}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-200/80 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-600" />
          <span>{t('profile.danger_zone', 'Danger Zone')}</span>
        </h2>
        <p className="text-xs text-rose-700">
          {t('profile.delete_warning', 'Permanently delete your account, registered farms, and all historical crop advisories. This action cannot be reversed.')}
        </p>

        {!showDeleteModal ? (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
          >
            {t('profile.delete_account', 'Delete My Account')}
          </button>
        ) : (
          <div className="p-5 rounded-xl bg-white border border-rose-200 space-y-3">
            <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              {t('profile.confirm_deletion_title', 'Confirm Permanent Account Deletion')}
            </h3>

            {deleteError && (
              <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                {t('profile.enter_password_confirm', 'Please enter your password to confirm:')}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isDeleting ? <Spinner size="sm" /> : t('profile.confirm_delete_btn', 'Yes, Delete My Account')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition"
              >
                {t('common.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
