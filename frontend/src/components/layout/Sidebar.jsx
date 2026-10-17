import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/formatters';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  CalendarClock,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  Landmark,
  TrendingUp,
  BarChart3,
  Settings,
  X,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Budgets & Goals', path: '/budgets', icon: PiggyBank },
  { name: 'Commitments & EMIs', path: '/commitments', icon: CalendarClock },
  { name: 'Learning Lab', path: '/learning', icon: GraduationCap },
  { name: 'AI Money Coach', path: '/ai-coach', icon: Sparkles },
  { name: 'Safety Lab', path: '/safety', icon: ShieldAlert },
  { name: 'Smart Borrowing / EMI', path: '/loans', icon: Landmark },
  { name: 'Investment Guide', path: '/investments', icon: TrendingUp },
  { name: 'Reports & Insights', path: '/insights', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { name: 'Admin Portal', path: '/admin', icon: ShieldCheck, badge: 'Staff' },
];

export function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-aubergine/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-aubergine text-ivory flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-aubergine-light">
          <NavLink to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center font-bold text-white shadow-sm">
              ₹
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-ivory">FinLearn</span>
              <span className="text-[10px] block text-brass-light font-medium tracking-wider uppercase -mt-1">Money Lab</span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-lilac hover:text-white lg:hidden focus:outline-none focus:ring-2 focus:ring-terracotta"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-lilac/50 uppercase tracking-wider">
            Money & Education
          </div>
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group select-none',
                    isActive
                      ? 'bg-terracotta text-white shadow-xs'
                      : 'text-ivory/80 hover:bg-aubergine-light hover:text-white'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-lilac group-hover:text-white" />
                  <span>{item.name}</span>
                </div>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 px-3 pb-2 text-[10px] font-semibold text-lilac/50 uppercase tracking-wider">
                Governance & Staff
              </div>
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors group select-none',
                        isActive
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'text-ivory/80 hover:bg-aubergine-light hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-brass-light group-hover:text-white" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-brass/20 text-brass-light">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer info card */}
        <div className="p-4 border-t border-aubergine-light">
          <div className="p-3 rounded-lg bg-aubergine-dark border border-brass/20 text-xs">
            <div className="flex items-center gap-2 text-brass-light font-semibold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Learning Hub Active</span>
            </div>
            <p className="text-[11px] text-ivory/60 leading-relaxed">
              Curated financial courses & certified reading lab.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
