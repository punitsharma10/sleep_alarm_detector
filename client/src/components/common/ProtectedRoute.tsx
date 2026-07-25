import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageSpinner } from '@/components/ui/Spinner';
import type { UserRole } from '@/types';

export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Wrong area for this role → send them to their own home.
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'superadmin' ? '/admin' : '/app'} replace />;
  }
  return <Outlet />;
}
