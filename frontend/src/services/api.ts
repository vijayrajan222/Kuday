import axios from 'axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { AUTH_UNAUTHORIZED_EVENT } from '@/constants/events';
import { HttpStatusCodes } from '@/shared/enums/HttpStatusCodes';
import { storage } from '@/utils/storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // Avoid infinite loop on auth endpoints
    if (
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN) ||
      originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH_TOKEN)
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === HttpStatusCodes.UNAUTHORIZED && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token as string}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
        const { data } = await axios.post(
          `${baseURL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
          {},
          { withCredentials: true },
        );
        const newToken = (data as any).payload?.token ?? data.data?.token ?? data.token;

        if (newToken) {
          storage.setToken(newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
