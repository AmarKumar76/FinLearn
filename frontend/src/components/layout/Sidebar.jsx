import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/formatters';
import api from '../../services/api';
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
  ShieldCheck,
  Trophy,
  User,
  ArrowRight,
  Loader2
} from 'lucide-react';

const MAIN_NAV_ITEMS = [
  { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Budgets & Goals', path: '/budgets', icon: PiggyBank },
  { name: 'Commitments & EMIs', path: '/commitments', icon: CalendarClock },
  { name: 'Learning Lab', path: '/learning', icon: GraduationCap },
  { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  { name: 'AI Money Coach', path: '/ai-coach', icon: Sparkles },
  { name: 'Safety Lab', path: '/safety', icon: ShieldAlert },
  { name: 'Smart Borrowing / EMI', path: '/loans', icon: Landmark },
  { name: 'Investment Guide', path: '/investments', icon: TrendingUp },
  { name: 'Reports & Insights', path: '/insights', icon: BarChart3 },
  { name: 'Profile', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const ADMIN_NAV_ITEMS = [
  { name: 'Admin Portal', path: '/admin', icon: ShieldCheck, badge: 'Staff' },
];

export function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();
  const [hubSummary, setHubSummary] = useState(null);
  const [loadingHub, setLoadingHub] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchSummary() {
      try {
        const res = await api.get('/courses/hub-summary');
        if (isMounted && res && res.data) {
          setHubSummary(res.data);
        }
      } catch (err) {
        // Soft fallback if network fails
      } finally {
        if (isMounted) setLoadingHub(false);
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-aubergine/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-aubergine text-ivory flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto shrink-0 border-r border-aubergine-light',
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
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
          <div className="px-3 pb-2 text-[10px] font-semibold text-lilac/70 uppercase tracking-wider">
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
                      ? 'bg-terracotta text-white shadow-xs font-bold'
                      : 'text-ivory/90 hover:bg-aubergine-light hover:text-white'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0 text-lilac group-hover:text-white transition-colors" />
                  <span>{item.name}</span>
                </div>
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 px-3 pb-2 text-[10px] font-semibold text-lilac/70 uppercase tracking-wider">
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
                          ? 'bg-terracotta text-white shadow-xs font-bold'
                          : 'text-ivory/90 hover:bg-aubergine-light hover:text-white'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 text-brass-light group-hover:text-white transition-colors" />
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

        {/* Dynamic Learning Hub Footer Card */}
        <div className="p-3 border-t border-theme-border">
          <div className="p-3 rounded-xl bg-white/5 border border-theme-border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-brass font-bold text-[11px]">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Learning Hub</span>
              </div>
              {hubSummary && (
                <span className="text-[10px] font-bold text-terracotta bg-terracotta/20 px-1.5 py-0.5 rounded">
                  {hubSummary.overallProgressPct}% Done
                </span>
              )}
            </div>

            {loadingHub ? (
              <div className="flex items-center gap-2 text-ivory/50 text-[11px] py-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading progress...</span>
              </div>
            ) : hubSummary?.continueLesson ? (
              <div className="space-y-1.5">
                <div className="text-[11px] text-ivory/90 font-medium truncate" title={hubSummary.continueLesson.title}>
                  {hubSummary.continueLesson.title}
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-terracotta h-full rounded-full transition-all duration-300"
                    style={{ width: `${hubSummary.overallProgressPct}%` }}
                  />
                </div>
                <Link
                  to={`/lesson?courseId=${hubSummary.continueLesson.courseId}&lessonId=${hubSummary.continueLesson.lessonId}`}
                  onClick={() => onClose && onClose()}
                  className="mt-1 flex items-center justify-between text-[11px] font-bold text-terracotta hover:text-white transition-colors pt-1"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[11px] text-ivory/70 leading-relaxed">
                  {hubSummary?.overallProgressPct === 100
                    ? '🎉 All current courses completed! Review lessons anytime.'
                    : 'Explore certified personal finance curriculum & reading lab.'}
                </p>
                <Link
                  to="/learning"
                  onClick={() => onClose && onClose()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-terracotta hover:text-white pt-1"
                >
                  <span>Open Library</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
