import { useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    toast.info(MESSAGES.LOGOUT_SUCCESS);
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between text-slate-800">
      <Header onLogout={handleLogout} />
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
