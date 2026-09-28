import axios from 'axios';
import { AUTH_UNAUTHORIZED_EVENT } from '@/constants/events';
import { HttpStatusCodes } from '@/shared/enums/HttpStatusCodes';
import { storage } from '@/utils/storage';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // Expired / invalid session: let the store log the user out
    if (
      axios.isAxiosError(error) &&
      error.response?.status === HttpStatusCodes.UNAUTHORIZED &&
      storage.getToken()
    ) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
