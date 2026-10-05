import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sprout,
  LayoutDashboard,
  Tractor,
  FilePlus,
  Camera,
  History,
  Bookmark,
  User as UserIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { SimpleModeToggle } from './SimpleModeToggle.js';

export const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 font-bold'
        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-stone-900 flex items-center gap-1.5">
                KisanMitra <span className="text-emerald-600 text-xs px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 uppercase font-black tracking-wider">AI</span>
              </span>
              <p className="text-[10px] text-stone-500 font-medium hidden sm:block">
                Crop Advisory Assistant
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.dashboard')}</span>
              </NavLink>
              <NavLink to="/farms" className={navLinkClass}>
                <Tractor className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.farms')}</span>
              </NavLink>
              <NavLink to="/advisory/new" className={navLinkClass}>
                <FilePlus className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.new_advisory')}</span>
              </NavLink>
              <NavLink to="/diagnose" className={navLinkClass}>
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>{t('nav.diagnose')}</span>
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History className="w-4 h-4 text-stone-500" />
                <span>{t('nav.history')}</span>
              </NavLink>
              <NavLink to="/saved" className={navLinkClass}>
                <Bookmark className="w-4 h-4 text-stone-500" />
                <span>{t('nav.saved')}</span>
              </NavLink>
            </nav>
          )}

          {/* Controls: Language, Simple Mode, Profile/Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <SimpleModeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  aria-label="Profile Settings"
                  className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
                >
                  <UserIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="p-2 rounded-lg text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition hidden sm:inline-flex"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-semibold text-stone-700 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition"
                >
                  {t('nav.signup')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-4 space-y-1 shadow-lg">
          <NavLink
            to="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <LayoutDashboard className="w-5 h-5 text-emerald-600" />
            <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink
            to="/farms"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <Tractor className="w-5 h-5 text-emerald-600" />
            <span>{t('nav.farms')}</span>
          </NavLink>
          <NavLink
            to="/advisory/new"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <FilePlus className="w-5 h-5 text-emerald-600" />
            <span>{t('nav.new_advisory')}</span>
          </NavLink>
          <NavLink
            to="/diagnose"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>{t('nav.diagnose')}</span>
          </NavLink>
          <NavLink
            to="/history"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <History className="w-5 h-5 text-stone-500" />
            <span>{t('nav.history')}</span>
          </NavLink>
          <NavLink
            to="/saved"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <Bookmark className="w-5 h-5 text-stone-500" />
            <span>{t('nav.saved')}</span>
          </NavLink>
          <NavLink
            to="/profile"
            onClick={() => setIsMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <UserIcon className="w-5 h-5 text-stone-500" />
            <span>{t('nav.profile')}</span>
          </NavLink>
          <div className="pt-2 border-t border-stone-100">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
