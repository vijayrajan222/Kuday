import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type {
  UpdateProfilePayload,
  LifestylePayload,
  RoomPayload,
  SeekerPreferencePayload,
} from '@/types/onboarding.types';

export const onboardingService = {
  async updateProfile(userId: string, payload: UpdateProfilePayload) {
    const { data } = await api.patch(API_ENDPOINTS.USER.UPDATE_PROFILE(userId), payload);
    return data;
  },

  async updateRole(userId: string, role: 'host' | 'seeker') {
    const { data } = await api.patch(API_ENDPOINTS.USER.UPDATE_ROLE(userId), { role });
    return data;
  },

  async saveLifestyle(payload: LifestylePayload) {
    const { data } = await api.post(API_ENDPOINTS.LIFESTYLE.SAVE, payload);
    return data;
  },

  async getLifestyle(userId: string) {
    const { data } = await api.get(API_ENDPOINTS.LIFESTYLE.GET(userId));
    return data.data;
  },

  async uploadIdentity(userId: string, idCardBase64: string, selfieBase64: string) {
    const { data } = await api.post(
      API_ENDPOINTS.USER.UPLOAD_IDENTITY(userId),
      {
        idCardBase64,
        selfieBase64,
      },
      {
        timeout: 90_000,
      }
    );
    return data;
  },

  async createRoom(payload: RoomPayload) {
    const { data } = await api.post(API_ENDPOINTS.ROOM.CREATE, payload, {
      timeout: 90_000,
    });
    return data;
  },

  async getRooms(params?: { hostId?: string; userId?: string } | string) {
    let url: string = API_ENDPOINTS.ROOM.GET_ALL;
    if (typeof params === 'string') {
      url = `${API_ENDPOINTS.ROOM.GET_ALL}?hostId=${params}`;
    } else if (params?.hostId) {
      url = `${API_ENDPOINTS.ROOM.GET_ALL}?hostId=${params.hostId}`;
    } else if (params?.userId) {
      url = `${API_ENDPOINTS.ROOM.GET_ALL}?userId=${params.userId}`;
    }
    const { data } = await api.get(url);
    return data.data;
  },

  async saveSeekerPreferences(payload: SeekerPreferencePayload) {
    const { data } = await api.post(API_ENDPOINTS.SEEKER.SAVE_PREFERENCES, payload);
    return data;
  },

  async getSeekerPreferences(userId?: string) {
    const url = userId
      ? `${API_ENDPOINTS.SEEKER.GET_ALL}?userId=${userId}`
      : API_ENDPOINTS.SEEKER.GET_ALL;
    const { data } = await api.get(url);
    return data.data;
  },

  async getUserProfile(userId: string) {
    const { data } = await api.get(API_ENDPOINTS.USER.GET_USER(userId));
    return data.data;
  },

  async changePassword(userId: string, payload: { currentPassword?: string; newPassword: string; confirmPassword: string }) {
    const { data } = await api.patch(API_ENDPOINTS.USER.CHANGE_PASSWORD(userId), payload);
    return data;
  },
};
