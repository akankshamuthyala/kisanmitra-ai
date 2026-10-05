import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { Spinner } from '../ui/Spinner.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-stone-500">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const nextPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextPath}`} replace />;
  }

  return <>{children}</>;
};
