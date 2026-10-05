import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0 mt-0.5">{icon}</div>}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-stone-500 mt-1 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};
