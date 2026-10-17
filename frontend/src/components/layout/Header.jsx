import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { Badge } from '../common/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-16 border-b border-brass/20 bg-ivory/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-aubergine hover:bg-lilac/30 lg:hidden focus:outline-none focus:ring-2 focus:ring-terracotta"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-aubergine tracking-tight flex items-center gap-2">
            <span>FinLearn Workspace</span>
          </h1>
          <p className="text-[11px] text-aubergine/60 hidden md:block">
            INR Integer Paise Precision • Grounded AI • Zero Unverified Money Transfers
          </p>
        </div>
      </div>

      {/* Right: Notifications & profile */}
      <div className="flex items-center gap-3">

        {/* Notifications link */}
        <Link
          to="/notifications"
          className="p-2 rounded-lg text-aubergine hover:bg-lilac/30 text-aubergine/80 transition-colors relative"
          aria-label="View notifications"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-terracotta rounded-full" />
        </Link>

        {/* Profile info */}
        <Link
          to="/settings"
          className="flex items-center gap-2 pl-2 border-l border-brass/20 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-aubergine text-ivory flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left text-xs">
            <span className="font-semibold text-aubergine block leading-tight truncate max-w-[120px]">
              {user?.name || 'Learner'}
            </span>
            <span className="text-[10px] text-aubergine/60 block capitalize">
              {user?.role || 'Guest'}
            </span>
          </div>
        </Link>

        {/* Logout action button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-aubergine/70 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default Header;
