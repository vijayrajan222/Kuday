import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type { UpdateProfilePayload, LifestylePayload } from '@/types/onboarding.types';

export const onboardingService = {
  async updateProfile(userId: string, payload: UpdateProfilePayload) {
    const { data } = await api.patch(API_ENDPOINTS.USER.UPDATE_PROFILE(userId), payload);
    return data;
  },

  async saveLifestyle(payload: LifestylePayload) {
    const { data } = await api.post(API_ENDPOINTS.LIFESTYLE.SAVE, payload);
    return data;
  },

  async uploadIdentity(userId: string, idCardBase64: string, selfieBase64: string) {
    const { data } = await api.post(
      API_ENDPOINTS.USER.UPLOAD_IDENTITY(userId),
      {
        idCardBase64,
        selfieBase64,
      },
      {
        timeout: 90_000, // 90 seconds timeout for image upload to backend/Cloudinary
      }
    );
    return data;
  },

  async getUserProfile(userId: string) {
    const { data } = await api.get(API_ENDPOINTS.USER.GET_USER(userId));
    return data.data;
  },
};
