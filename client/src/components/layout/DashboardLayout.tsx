import { useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanFace,
  History,
  BarChart3,
  Settings,
  User,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import type { ModuleKey } from '@/types';

const MODULE_ICONS: Record<ModuleKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  liveDetection: ScanFace,
  history: History,
  analytics: BarChart3,
  users: Users,
  settings: Settings,
  profile: User,
};

const MODULE_NAV: { key: ModuleKey; to: string; label: string; end?: boolean }[] = [
  { key: 'dashboard', to: '/app', label: 'Dashboard', end: true },
  { key: 'liveDetection', to: '/app/detection', label: 'Live Detection' },
  { key: 'history', to: '/app/history', label: 'History' },
  { key: 'analytics', to: '/app/analytics', label: 'Analytics' },
  { key: 'users', to: '/app/users', label: 'Users' },
  { key: 'settings', to: '/app/settings', label: 'Settings' },
  { key: 'profile', to: '/app/profile', label: 'Profile' },
];

function moduleForPath(pathname: string): ModuleKey {
  if (pathname === '/app' || pathname === '/app/') return 'dashboard';
  if (pathname.startsWith('/app/detection')) return 'liveDetection';
  if (pathname.startsWith('/app/history')) return 'history';
  if (pathname.startsWith('/app/analytics')) return 'analytics';
  if (pathname.startsWith('/app/users')) return 'users';
  if (pathname.startsWith('/app/settings')) return 'settings';
  return 'profile';
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sad_sidebar_collapsed') === '1'
  );

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      localStorage.setItem('sad_sidebar_collapsed', c ? '0' : '1');
      return !c;
    });

  // Org owner (level 10) implicitly has all pages; others are limited to their modules.
  const isOwner = (user?.level ?? 0) >= 10;
  const hasModule = (key: ModuleKey) => isOwner || !!user?.modules?.[key];
  const allowed = MODULE_NAV.filter((m) => hasModule(m.key));
  const navItems = allowed.map((m) => ({ ...m, icon: MODULE_ICONS[m.key] }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (user && allowed.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-[#0b1120]">
        <div>
          <Logo className="mx-auto mb-4" />
          <h1 className="text-lg font-semibold">No pages assigned</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your administrator hasn't given you access to any pages yet.
          </p>
          <button onClick={handleLogout} className="mt-4 text-sm font-medium text-brand-500 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const currentModule = moduleForPath(location.pathname);
  if (user && !hasModule(currentModule)) {
    return <Navigate to={allowed[0].to} replace />;
  }

  const roleLabel = `${user?.designation ?? 'User'}${isOwner ? '' : ` · L${user?.level}`}`;

  const SidebarContent = ({ mini = false }: { mini?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className={cn('py-6', mini ? 'flex justify-center px-2' : 'flex items-center px-5')}>
        <Link to="/app" onClick={() => setOpen(false)} aria-label="Home">
          <Logo showText={!mini} />
        </Link>
      </div>

      <nav className={cn('flex-1 space-y-1', mini ? 'px-1.5' : 'px-3')}>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex rounded-xl font-medium transition',
                mini ? 'flex-col items-center gap-1 px-1 py-2 text-center text-[10px] leading-tight' : 'items-center gap-3 px-3 py-2.5 text-sm',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {mini ? <span>{label}</span> : label}
          </NavLink>
        ))}
      </nav>

      {/* User + role card */}
      {!mini && (
        <div className="mx-3 mb-2 flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-brand-500">{roleLabel}</p>
          </div>
        </div>
      )}

      <div className={cn('border-t border-slate-200 py-3 dark:border-white/10', mini ? 'px-2' : 'px-3')}>
        <button
          onClick={handleLogout}
          title={mini ? 'Sign out' : undefined}
          className={cn(
            'flex w-full items-center rounded-xl text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10',
            mini ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!mini && 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-white/10 dark:bg-white/[0.02] lg:block',
          collapsed ? 'w-24' : 'w-64'
        )}
      >
        <SidebarContent mini={collapsed} />
        {/* Edge pill to collapse/expand (sits on the divider seam) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-2.5 top-1/2 z-40 grid h-9 w-5 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-brand-500 dark:border-white/10 dark:bg-[#0f172a]"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile drawer (always expanded) */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1120]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-24' : 'lg:pl-64')}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1120]/80 sm:px-6">
          <button
            className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden min-w-0 text-sm text-slate-500 sm:block">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-500 sm:inline">
              {roleLabel}
            </span>
            <ThemeToggle />
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        <main className="w-full p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
