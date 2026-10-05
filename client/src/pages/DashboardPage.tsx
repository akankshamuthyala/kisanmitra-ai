import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Tractor,
  FilePlus,
  Camera,
  Bookmark,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { RiskBadge } from '../components/ui/RiskBadge.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { ErrorState } from '../components/ui/ErrorState.js';
import { formatDate } from '../lib/format.js';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (error) {
    return <ErrorState message={t('errors.load_dashboard', 'Failed to load dashboard')} onRetry={refetch} />;
  }

  const statCards = stats
    ? [
        {
          icon: Tractor,
          label: t('dashboard.farms', 'Farms'),
          value: stats.farms_count,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          link: '/farms',
        },
        {
          icon: FilePlus,
          label: t('dashboard.advisories', 'Advisories'),
          value: stats.advisories_count,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          link: '/history',
        },
        {
          icon: Bookmark,
          label: t('dashboard.saved', 'Saved'),
          value: stats.saved_count,
          color: 'text-amber-600',
          bg: 'bg-amber-50',
          link: '/saved',
        },
        {
          icon: Camera,
          label: t('dashboard.diagnoses', 'Diagnoses'),
          value: stats.diagnoses_count,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          link: '/diagnose',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        subtitle={t('dashboard.subtitle', 'Your farming overview at a glance')}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/advisory/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 transition"
        >
          <FilePlus className="w-4 h-4" />
          {t('dashboard.new_advisory', 'New Advisory')}
        </Link>
        <Link
          to="/diagnose"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 font-semibold rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 transition"
        >
          <Camera className="w-4 h-4" />
          {t('dashboard.diagnose_photo', 'Diagnose Photo')}
        </Link>
        <Link
          to="/farms/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-700 font-semibold rounded-xl border border-stone-200 shadow-sm hover:bg-stone-50 transition"
        >
          <Tractor className="w-4 h-4" />
          {t('dashboard.add_farm', 'Add Farm')}
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-100 shadow-card p-5">
                <Skeleton className="h-5 w-20 mb-3" />
                <Skeleton className="h-8 w-12" />
              </div>
            ))
          : statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <Link
                  key={i}
                  to={s.link}
                  className="bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover p-5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <span className="text-sm font-semibold text-stone-500">{s.label}</span>
                  </div>
                  <p className="text-3xl font-extrabold text-stone-900">{s.value}</p>
                </Link>
              );
            })}
      </div>

      {/* AI Quota */}
      {stats && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Zap className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">{t('dashboard.ai_quota', 'AI Quota Today')}</h3>
                <p className="text-xs text-stone-500">
                  {t('dashboard.resets_at', 'Resets at')} {formatDate(stats.quota_resets_at)}
                </p>
              </div>
            </div>
            <span className="text-2xl font-extrabold text-teal-600">
              {stats.quota_remaining_today}/{stats.quota_limit}
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, (stats.quota_remaining_today / stats.quota_limit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        {stats && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">{t('dashboard.risk_overview', 'Risk Overview')}</h3>
            </div>
            <div className="space-y-3">
              {([
                { level: 'critical' as const, color: 'bg-rose-500', label: t('risk.critical', 'Critical') },
                { level: 'high' as const, color: 'bg-orange-500', label: t('risk.high', 'High') },
                { level: 'moderate' as const, color: 'bg-amber-500', label: t('risk.moderate', 'Moderate') },
                { level: 'low' as const, color: 'bg-emerald-500', label: t('risk.low', 'Low') },
              ]).map(r => {
                const count = stats.risk_distribution[r.level] || 0;
                const total = Object.values(stats.risk_distribution).reduce((a, b) => a + b, 0) || 1;
                return (
                  <div key={r.level} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-stone-600 w-16">{r.label}</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-2.5">
                      <div
                        className={`${r.color} h-2.5 rounded-full transition-all duration-700`}
                        style={{ width: `${(count / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-stone-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Advisories */}
        {stats && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">{t('dashboard.recent_advisories', 'Recent Advisories')}</h3>
              </div>
              <Link to="/history" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                {t('dashboard.view_all', 'View All')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats.recent_advisories.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.no_advisories', 'No advisories yet. Create your first one!')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recent_advisories.slice(0, 5).map(adv => (
                  <Link
                    key={adv.id}
                    to={`/advisory/${adv.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-900 truncate group-hover:text-emerald-700">
                        {adv.title || adv.crop_name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {adv.farm_name && `${adv.farm_name} • `}{formatDate(adv.created_at)}
                      </p>
                    </div>
                    {adv.risk_level && <RiskBadge level={adv.risk_level} />}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
