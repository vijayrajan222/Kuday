import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { MESSAGES } from '@/constants/messages';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // stable references so memoised children don't re-render needlessly
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const handleLogout = useCallback(() => {
    logout();
    toast.info(MESSAGES.LOGOUT_SUCCESS);
    navigate(ROUTES.LOGIN, { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="lg:pl-64">
        <Header onMenuClick={openSidebar} onLogout={handleLogout} />
        <main className="mx-auto max-w-6xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
