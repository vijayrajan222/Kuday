import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { AdminAuthResult, AdminRevenueSummary, AdminStats, AdminUser } from '@/types/admin.types';
import type { ReportItem, ReportStatus } from '@/types/report.types';

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

  async getRevenue(): Promise<AdminRevenueSummary> {
    const response = await api.get<{ success: boolean; data: AdminRevenueSummary }>(
      API_ENDPOINTS.ADMIN.REVENUE
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

  async getReports(status?: string): Promise<ReportItem[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const response = await api.get<{ success: boolean; data: ReportItem[] }>(
      `${API_ENDPOINTS.ADMIN.REPORTS}${query}`
    );
    return response.data.data || [];
  },

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    adminNotes?: string,
    reporterMessage?: string
  ): Promise<ReportItem> {
    const response = await api.patch<{ success: boolean; data: ReportItem }>(
      API_ENDPOINTS.ADMIN.UPDATE_REPORT_STATUS(reportId),
      { status, adminNotes, reporterMessage }
    );
    return response.data.data;
  },

  async warnReportedUser(
    reportId: string,
    warningMessage?: string
  ): Promise<ReportItem> {
    const response = await api.post<{ success: boolean; data: ReportItem }>(
      API_ENDPOINTS.ADMIN.WARN_REPORTED_USER(reportId),
      { warningMessage }
    );
    return response.data.data;
  },
};
