import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { AdminAuthResult, AdminStats, AdminUser } from '@/types/admin.types';

export const adminService = {
  async login(email: string, password: string): Promise<AdminAuthResult> {
    const response = await api.post<{ success: boolean; data: AdminAuthResult }>(
      API_ENDPOINTS.ADMIN.LOGIN,
      { email, password }
    );
    return response.data.data;
  },

  async getStats(): Promise<AdminStats> {
    const response = await api.get<{ success: boolean; data: AdminStats }>(
      API_ENDPOINTS.ADMIN.STATS
    );
    return response.data.data;
  },

  async getUsers(search?: string): Promise<AdminUser[]> {
    const response = await api.get<{ success: boolean; data: AdminUser[] }>(
      API_ENDPOINTS.ADMIN.USERS,
      {
        params: search && search.trim() ? { search: search.trim() } : undefined,
      }
    );
    return response.data.data;
  },

  async verifyIdentity(userId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const response = await api.patch<{ success: boolean; data: { message: string } }>(
      API_ENDPOINTS.ADMIN.VERIFY_IDENTITY(userId),
      { action, rejectionReason }
    );
    return response.data.data;
  },

  async toggleBlock(userId: string) {
    const response = await api.patch<{ success: boolean; data: { isBlocked: boolean; message: string } }>(
      API_ENDPOINTS.ADMIN.TOGGLE_BLOCK(userId)
    );
    return response.data.data;
  },
};
