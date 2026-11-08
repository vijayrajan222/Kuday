import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { InterestDetail, SendInterestPayload, InterestStatus } from '@/types/interest.types';

export const interestService = {
  async sendInterest(payload: SendInterestPayload): Promise<InterestDetail> {
    const response = await api.post(API_ENDPOINTS.INTEREST.SEND, payload);
    return response.data.data;
  },

  async updateStatus(
    interestId: string,
    userId: string,
    status: InterestStatus
  ): Promise<InterestDetail> {
    const response = await api.patch(API_ENDPOINTS.INTEREST.UPDATE_STATUS(interestId), {
      userId,
      status,
    });
    return response.data.data;
  },

  async getReceivedInterests(userId: string): Promise<InterestDetail[]> {
    const response = await api.get(API_ENDPOINTS.INTEREST.RECEIVED(userId));
    return response.data.data ?? [];
  },

  async getSentInterests(userId: string): Promise<InterestDetail[]> {
    const response = await api.get(API_ENDPOINTS.INTEREST.SENT(userId));
    return response.data.data ?? [];
  },
};
