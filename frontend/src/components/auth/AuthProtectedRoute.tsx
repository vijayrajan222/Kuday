import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

/** Only authenticated users may pass. */
export function AuthProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.SIGN_UP} state={{ from: location }} replace />;
}

/** Signed-in users are routed to onboarding or dashboard. */
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
