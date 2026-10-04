import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

/**
 * Route protection for authenticated users.
 * If user is not onboarded yet, redirects them to /onboarding/profile.
 */
export function AuthProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If user is authenticated but not onboarded, enforce onboarding completion
  if (!user?.isOnboarded) {
    return <Navigate to={ROUTES.ONBOARDING_PROFILE} replace />;
  }

  return <Outlet />;
}

/**
 * Route protection specifically for /onboarding/profile.
 * ONBOARDING CAN BE COMPLETED ONLY ONCE.
 * If user has already completed onboarding (isOnboarded === true),
 * they can NEVER access the onboarding page again and are redirected to /dashboard.
 */
export function OnboardingRouteGuard() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Once onboarding is completed, user cannot visit onboarding again
  if (user?.isOnboarded) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

/** Signed-in users visiting guest routes (login/signup) are redirected based on onboarding status. */
export function GuestRoute() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return user?.isOnboarded ? (
      <Navigate to={ROUTES.DASHBOARD} replace />
    ) : (
      <Navigate to={ROUTES.ONBOARDING_PROFILE} replace />
    );
  }
  return <Outlet />;
}
