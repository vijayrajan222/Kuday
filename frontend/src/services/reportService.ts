import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { CreateReportPayload, ReportItem } from '@/types/report.types';

export const reportService = {
  async submitReport(payload: CreateReportPayload): Promise<ReportItem> {
    const { data } = await api.post(API_ENDPOINTS.REPORT.CREATE, payload);
    return data.data;
  },

  async getReports(params?: {
    status?: string;
    reportedUserId?: string;
    reporterId?: string;
  }): Promise<ReportItem[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.reportedUserId) query.append('reportedUserId', params.reportedUserId);
    if (params?.reporterId) query.append('reporterId', params.reporterId);

    const queryString = query.toString();
    const url = queryString
      ? `${API_ENDPOINTS.REPORT.GET_ALL}?${queryString}`
      : API_ENDPOINTS.REPORT.GET_ALL;

    const { data } = await api.get(url);
    return data.data;
  },
};
