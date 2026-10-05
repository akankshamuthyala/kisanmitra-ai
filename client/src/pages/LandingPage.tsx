import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  Leaf,
  Camera,
  Globe,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const features = [
  { icon: Leaf, titleKey: 'landing.feature_advisory', descKey: 'landing.feature_advisory_desc', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Camera, titleKey: 'landing.feature_diagnosis', descKey: 'landing.feature_diagnosis_desc', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Globe, titleKey: 'landing.feature_multilingual', descKey: 'landing.feature_multilingual_desc', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: ShieldCheck, titleKey: 'landing.feature_ipm', descKey: 'landing.feature_ipm_desc', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: BarChart3, titleKey: 'landing.feature_nutrient', descKey: 'landing.feature_nutrient_desc', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: MessageSquare, titleKey: 'landing.feature_chat', descKey: 'landing.feature_chat_desc', color: 'text-rose-600', bg: 'bg-rose-50' },
];

const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative text-center space-y-8 py-16 overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
          <Sparkles className="w-4 h-4" />
          {t('landing.badge', 'Powered by Google Gemini AI')}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-tight tracking-tight">
          {t('landing.hero_title', 'Your AI-Powered')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            {t('landing.hero_highlight', 'Crop Advisory')}
          </span>
          <br />
          {t('landing.hero_subtitle', 'Assistant')}
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-stone-600 leading-relaxed">
          {t(
            'landing.hero_desc',
            'Get personalized, AI-driven farming guidance in your language. From sowing to harvest — pest alerts, nutrient plans, weather risks, and more.'
          )}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-600/30 transition-all duration-200 text-lg"
          >
            {t('landing.cta_start', 'Start Free')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-stone-700 font-semibold rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 hover:shadow-md transition-all duration-200 text-lg"
          >
            {t('landing.cta_login', 'Log In')}
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-stone-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('landing.trust_free', 'Free to use')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {t('landing.trust_languages', '6 Indian languages')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('landing.trust_crops', '50+ crops supported')}
          </span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-stone-900">
            {t('landing.features_title', 'Everything Your Farm Needs')}
          </h2>
          <p className="text-stone-600 text-lg max-w-xl mx-auto">
            {t('landing.features_desc', 'Comprehensive AI tools designed specifically for Indian agriculture.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group p-6 bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">
                  {t(f.titleKey, f.titleKey.split('.')[1])}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {t(f.descKey, f.descKey.split('.')[1])}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl shadow-xl px-6">
        <div className="inline-flex items-center gap-3 p-3 rounded-2xl bg-white/10 mb-6">
          <Sprout className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          {t('landing.cta_title', 'Start Growing Smarter Today')}
        </h2>
        <p className="text-lg text-emerald-100 mb-8 max-w-xl mx-auto">
          {t('landing.cta_desc', 'Join thousands of farmers using AI to improve yields and reduce costs.')}
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-emerald-700 font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all duration-200 text-lg"
        >
          {t('landing.cta_button', 'Create Free Account')}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-stone-200 text-sm text-stone-500 space-y-2">
        <p className="font-semibold text-stone-700">KisanMitra AI — Crop Advisory Assistant</p>
        <p>{t('landing.footer_disclaimer', 'AI advisory is informational only. Always consult local agricultural experts for critical decisions.')}</p>
        <p>&copy; {new Date().getFullYear()} KisanMitra AI. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
