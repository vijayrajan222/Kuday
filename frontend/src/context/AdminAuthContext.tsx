/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminService } from '@/services/adminService';
import type { AdminAuthResult } from '@/types/admin.types';

interface AdminAuthContextType {
  adminUser: AdminAuthResult | null;
  isAdminAuthenticated: boolean;
  adminLoading: boolean;
  loginAdmin: (email: string, password: string) => Promise<AdminAuthResult>;
  logoutAdmin: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminAuthResult | null>(() => {
    const saved = localStorage.getItem('admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('admin_session', JSON.stringify(adminUser));
      localStorage.setItem('admin_token', adminUser.token);
    } else {
      localStorage.removeItem('admin_session');
      localStorage.removeItem('admin_token');
    }
  }, [adminUser]);

  const loginAdmin = async (email: string, password: string) => {
    setAdminLoading(true);
    try {
      const result = await adminService.login(email, password);
      setAdminUser(result);
      return result;
    } finally {
      setAdminLoading(false);
    }
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_token');
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated: Boolean(adminUser && adminUser.token),
        adminLoading,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
