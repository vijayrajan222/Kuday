import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  Visit,
  CreateVisitRequest,
  SuggestVisitRequest,
  VisitStatus,
} from '@/types/visit.types';

export const visitService = {
  async createVisit(payload: CreateVisitRequest): Promise<Visit> {
    const response = await api.post(API_ENDPOINTS.VISIT.CREATE, payload);
    return response.data.data;
  },

  async getVisitsByConnection(connectionId: string): Promise<Visit[]> {
    const response = await api.get(API_ENDPOINTS.VISIT.BY_CONNECTION(connectionId));
    return response.data.data ?? [];
  },

  async getVisitsByUser(userId: string): Promise<Visit[]> {
    const response = await api.get(API_ENDPOINTS.VISIT.BY_USER(userId));
    return response.data.data ?? [];
  },

  async updateStatus(
    visitId: string,
    userId: string,
    status: VisitStatus,
    note?: string
  ): Promise<Visit> {
    const response = await api.patch(API_ENDPOINTS.VISIT.UPDATE_STATUS(visitId), {
      userId,
      status,
      note,
    });
    return response.data.data;
  },

  async suggestChanges(
    visitId: string,
    userId: string,
    payload: SuggestVisitRequest
  ): Promise<Visit> {
    const response = await api.patch(API_ENDPOINTS.VISIT.SUGGEST(visitId), {
      userId,
      ...payload,
    });
    return response.data.data;
  },

  async acceptSuggestion(visitId: string, userId: string): Promise<Visit> {
    const response = await api.patch(API_ENDPOINTS.VISIT.ACCEPT_SUGGESTION(visitId), {
      userId,
    });
    return response.data.data;
  },
};
