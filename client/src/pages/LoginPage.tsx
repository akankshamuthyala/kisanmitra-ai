import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn, Sprout } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { loginSchema, type LoginInput } from '@shared/schemas.js';
import { Spinner } from '../components/ui/Spinner.js';
import { ApiError } from '../lib/apiClient.js';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nextPath = searchParams.get('next') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data);
      navigate(decodeURIComponent(nextPath), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(t('errors.generic', 'Something went wrong. Please try again.'));
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 mx-auto">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900">{t('auth.login_title', 'Welcome Back')}</h1>
          <p className="text-stone-500">
            {t('auth.login_subtitle', 'Sign in to your KisanMitra account')}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-8">
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
                placeholder="farmer@example.com"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t('auth.password', 'Password')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-rose-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {t('auth.login_button', 'Sign In')}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-stone-500">
          {t('auth.no_account', "Don't have an account?")}{' '}
          <Link to="/signup" className="text-emerald-600 font-semibold hover:text-emerald-700 transition">
            {t('auth.signup_link', 'Create one')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
