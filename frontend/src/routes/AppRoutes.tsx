import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  AuthProtectedRoute,
  GuestRoute,
  OnboardingRouteGuard,
} from '@/components/auth/AuthProtectedRoute';
import { AdminProtectedRoute, AdminGuestRoute } from '@/components/auth/AdminProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ROUTES } from '@/constants/routes';

// Code-splitting: each page is downloaded only when visited
const NotFound = lazy(() => import('@/pages/common/NotFound'));
const CustomerSignup = lazy(() => import('@/pages/customer/CustomerSignup'));
const Login = lazy(() => import('@/pages/customer/Login'));
const Otp = lazy(() => import('@/pages/customer/Otp'));
const ForgotPassword = lazy(() => import('@/pages/customer/ForgotPassword'));
const VerifyResetOtp = lazy(() => import('@/pages/customer/VerifyResetOtp'));
const ResetPassword = lazy(() => import('@/pages/customer/ResetPassword'));
const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));
const MatchedPage = lazy(() => import('@/pages/customer/MatchedPage'));
const MessagesPage = lazy(() => import('@/pages/customer/MessagesPage'));
const RoomDetailsPage = lazy(() => import('@/pages/customer/RoomDetailsPage'));
const UserProfilePage = lazy(() => import('@/pages/customer/UserProfilePage'));
const OnboardingProfilePage = lazy(() => import('@/pages/onboarding/OnboardingProfilePage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));

// Dedicated Admin Portal Lazy Imports
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));

function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return user?.isOnboarded ? (
      <Navigate to={ROUTES.DASHBOARD} replace />
    ) : (
      <Navigate to={ROUTES.ONBOARDING_PROFILE} replace />
    );
  }
  return <Navigate to={ROUTES.LOGIN} replace />;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<RootRedirect />} />

        {/* Guest Routes (Login, Signup, OTP, Password Reset) */}
        <Route element={<GuestRoute />}>
          <Route path={ROUTES.SIGN_UP} element={<CustomerSignup />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.OTP} element={<Otp />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_RESET_OTP} element={<VerifyResetOtp />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        </Route>

        {/* Admin Guest Route (Admin Login Page Only) */}
        <Route element={<AdminGuestRoute />}>
          <Route path={ROUTES.ADMIN_LOGIN} element={<AdminLoginPage />} />
        </Route>

        {/* Onboarding Guard: ONBOARDING CAN BE COMPLETED ONLY ONCE */}
        <Route element={<OnboardingRouteGuard />}>
          <Route path={ROUTES.ONBOARDING_PROFILE} element={<OnboardingProfilePage />} />
        </Route>

        {/* Customer Authenticated Protected Routes (Dashboard, Matched, Messages, Profile) */}
        <Route element={<AuthProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<CustomerDashboard />} />
            <Route path={ROUTES.MATCHED} element={<MatchedPage />} />
            <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
            <Route path={ROUTES.ROOM_DETAILS} element={<RoomDetailsPage />} />
            <Route path={ROUTES.USER_PROFILE} element={<UserProfilePage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Dedicated Admin Portal Protected Routes */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
