import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-stone-200 shadow-sm ${className}`}
    >
      {icon && <div className="mb-4 text-stone-400">{icon}</div>}
      <h3 className="text-lg font-bold text-stone-800 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
