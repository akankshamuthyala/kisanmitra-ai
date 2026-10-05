import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tractor, PlusCircle, Camera, History } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export const MobileBottomNav: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 lg:hidden px-2 py-1.5 shadow-lg"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] font-semibold transition ${
              isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/farms"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] font-semibold transition ${
              isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <Tractor className="w-5 h-5 mb-0.5" />
          <span>Farms</span>
        </NavLink>

        {/* Highlighted New Advisory CTA button */}
        <NavLink
          to="/advisory/new"
          className="flex flex-col items-center justify-center -mt-5 min-w-[56px] min-h-[56px] bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition"
          aria-label="Create New Advisory"
        >
          <PlusCircle className="w-6 h-6" />
        </NavLink>

        <NavLink
          to="/diagnose"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] font-semibold transition ${
              isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <Camera className="w-5 h-5 mb-0.5" />
          <span>Diagnose</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 text-[11px] font-semibold transition ${
              isActive ? 'text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          <History className="w-5 h-5 mb-0.5" />
          <span>History</span>
        </NavLink>
      </div>
    </nav>
  );
};
