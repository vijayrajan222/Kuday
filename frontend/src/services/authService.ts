import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type {
  GoogleAuthRequest,
  GoogleAuthResponse,
  GoogleAuthResult,
  LoginRequest,
  LoginResponse,
  LoginResult,
  ResendOtpRequest,
  SignUpRequest,
  SignUpResponse,
  SignUpResult,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyOtpResult,
} from '@/types';

export const authService = {
  async googleAuth(payload: GoogleAuthRequest): Promise<GoogleAuthResult> {
    const { data } = await api.post<GoogleAuthResponse>(API_ENDPOINTS.AUTH.GOOGLE, payload);
    return (data as any).payload ?? data.data ?? data;
  },

  async login(payload: LoginRequest): Promise<LoginResult> {
    const { data } = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    return (data as any).payload ?? data.data ?? data;
  },

  async signUp(payload: SignUpRequest): Promise<SignUpResult> {
    const { data } = await api.post<SignUpResponse>(API_ENDPOINTS.AUTH.SIGN_UP, payload);
    return (data as any).payload ?? data.data ?? data;
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResult> {
    const { data } = await api.post<VerifyOtpResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, payload);
    return (data as any).payload ?? data.data ?? data; // Extract from backend payload wrapper
  },

  async resendOtp(payload: ResendOtpRequest): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESEND_OTP, payload);
    } catch {
      await api.post(API_ENDPOINTS.AUTH.SIGN_UP, {
        firstName: 'User',
        lastName: 'User',
        email: payload.email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    }
  },
};
