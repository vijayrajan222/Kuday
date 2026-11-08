import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer } from '@/components/layout/Footer';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleLogout = useCallback(() => {
    logout();
    toast.info(MESSAGES.LOGOUT_SUCCESS);
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between text-slate-800">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={openSidebar} onLogout={handleLogout} />
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
