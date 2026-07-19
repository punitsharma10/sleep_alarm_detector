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

/** Which module a dashboard path belongs to (used for access-guarding). */
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

  const modules = user?.modules;
  const allowed = MODULE_NAV.filter((m) => modules?.[m.key]);
  const navItems = allowed.map((m) => ({ ...m, icon: MODULE_ICONS[m.key] }));

  const handleLogoutBare = async () => {
    await logout();
    navigate('/login');
  };

  // A user with zero pages enabled can't be redirected anywhere — show a message.
  if (modules && allowed.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center dark:bg-[#0b1120]">
        <div>
          <Logo className="mx-auto mb-4" />
          <h1 className="text-lg font-semibold">No pages assigned</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your administrator hasn't given you access to any pages yet.
          </p>
          <button onClick={handleLogoutBare} className="mt-4 text-sm font-medium text-brand-500 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Guard: if the user opens a page they don't have access to, send them to the
  // first page they can access.
  const currentModule = moduleForPath(location.pathname);
  if (modules && !modules[currentModule]) {
    return <Navigate to={allowed[0].to} replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <Link to="/app" onClick={() => setOpen(false)} className="block px-5 py-6">
        <Logo />
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-500/10"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02] lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b1120]">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1120]/80 sm:px-6">
          <button
            className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-sm text-slate-500 lg:block">
            Welcome back, <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
