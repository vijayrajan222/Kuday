import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AppRoutes } from '@/routes/AppRoutes';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
        <Toaster />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
