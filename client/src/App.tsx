import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const DetectionPage = lazy(() => import('@/pages/dashboard/DetectionPage'));
const HistoryPage = lazy(() => import('@/pages/dashboard/HistoryPage'));
const SessionDetailPage = lazy(() => import('@/pages/dashboard/SessionDetailPage'));
const AnalyticsPage = lazy(() => import('@/pages/dashboard/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));
const UsersManagementPage = lazy(() => import('@/pages/dashboard/UsersManagementPage'));
const UserDetailPage = lazy(() => import('@/pages/dashboard/UserDetailPage'));
const SuperAdminDashboard = lazy(() => import('@/pages/admin/SuperAdminDashboard'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Super Admin area */}
        <Route element={<ProtectedRoute role="superadmin" />}>
          <Route path="/admin" element={<SuperAdminDashboard />} />
        </Route>

        {/* Organization users area */}
        <Route element={<ProtectedRoute role="orgUser" />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="detection" element={<DetectionPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="history/:id" element={<SessionDetailPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="users" element={<UsersManagementPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
