import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthProtectedRoute, GuestRoute } from '@/components/auth/AuthProtectedRoute';
import { PageLoader } from '@/components/common/PageLoader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ROUTES } from '@/constants/routes';

// Code-splitting: each page is downloaded only when visited
const LandingPage = lazy(() => import('@/pages/common/LandingPage'));
const NotFound = lazy(() => import('@/pages/common/NotFound'));
const CustomerSignup = lazy(() => import('@/pages/customer/CustomerSignup'));
const Login = lazy(() => import('@/pages/customer/Login'));
const Otp = lazy(() => import('@/pages/customer/Otp'));
const CustomerDashboard = lazy(() => import('@/pages/customer/CustomerDashboard'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<LandingPage />} />

        <Route element={<GuestRoute />}>
          <Route path={ROUTES.SIGN_UP} element={<CustomerSignup />} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.OTP} element={<Otp />} />
        </Route>

        <Route element={<AuthProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<CustomerDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
