import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar.js';
import { MobileBottomNav } from './components/layout/MobileBottomNav.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { Spinner } from './components/ui/Spinner.js';
import { useAuth } from './hooks/useAuth.js';

// Lazy-loaded pages for code-splitting
const LandingPage = lazy(() => import('./pages/LandingPage.js'));
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const SignupPage = lazy(() => import('./pages/SignupPage.js'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.js'));
const FarmsPage = lazy(() => import('./pages/FarmsPage.js'));
const FarmFormPage = lazy(() => import('./pages/FarmFormPage.js'));
const NewAdvisoryPage = lazy(() => import('./pages/NewAdvisoryPage.js'));
const AdvisoryDetailPage = lazy(() => import('./pages/AdvisoryDetailPage.js'));
const DiagnosePage = lazy(() => import('./pages/DiagnosePage.js'));
const HistoryPage = lazy(() => import('./pages/HistoryPage.js'));
const SavedPage = lazy(() => import('./pages/SavedPage.js'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js'));

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <Spinner size="lg" />
    <p className="text-sm font-medium text-stone-500">Loading...</p>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage />
              }
            />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farms"
              element={
                <ProtectedRoute>
                  <FarmsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farms/new"
              element={
                <ProtectedRoute>
                  <FarmFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/farms/:id/edit"
              element={
                <ProtectedRoute>
                  <FarmFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisory/new"
              element={
                <ProtectedRoute>
                  <NewAdvisoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisory/:id"
              element={
                <ProtectedRoute>
                  <AdvisoryDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/diagnose"
              element={
                <ProtectedRoute>
                  <DiagnosePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Mobile bottom navigation for authenticated users */}
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
};

export default App;
