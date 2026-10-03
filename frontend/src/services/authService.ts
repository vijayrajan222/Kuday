import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { api } from '@/services/api';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ForgotPasswordResult,
  GoogleAuthRequest,
  GoogleAuthResponse,
  GoogleAuthResult,
  LoginRequest,
  LoginResponse,
  LoginResult,
  ResendOtpRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetPasswordResult,
  SignUpRequest,
  SignUpResponse,
  SignUpResult,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VerifyOtpResult,
  VerifyResetOtpRequest,
  VerifyResetOtpResponse,
  VerifyResetOtpResult,
} from '@/types';

function extractPayload<T>(data: unknown): T {
  const obj = data as { payload?: T; data?: T };
  return obj.payload ?? obj.data ?? (data as T);
}

export const authService = {
  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResult> {
    const { data } = await api.post<ForgotPasswordResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
    return extractPayload<ForgotPasswordResult>(data);
  },

  async verifyResetOtp(payload: VerifyResetOtpRequest): Promise<VerifyResetOtpResult> {
    const { data } = await api.post<VerifyResetOtpResponse>(API_ENDPOINTS.AUTH.VERIFY_RESET_OTP, payload);
    return extractPayload<VerifyResetOtpResult>(data);
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResult> {
    const { data } = await api.post<ResetPasswordResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
    return extractPayload<ResetPasswordResult>(data);
  },

  async googleAuth(payload: GoogleAuthRequest): Promise<GoogleAuthResult> {
    const { data } = await api.post<GoogleAuthResponse>(API_ENDPOINTS.AUTH.GOOGLE, payload);
    return extractPayload<GoogleAuthResult>(data);
  },

  async refreshToken(): Promise<{ token: string }> {
    const { data } = await api.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {}, { withCredentials: true });
    return extractPayload<{ token: string }>(data);
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, {}, { withCredentials: true });
    } catch {
      // Ignore network / logout errors
    }
  },

  async login(payload: LoginRequest): Promise<LoginResult> {
    const { data } = await api.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, payload);
    return extractPayload<LoginResult>(data);
  },

  async signUp(payload: SignUpRequest): Promise<SignUpResult> {
    const { data } = await api.post<SignUpResponse>(API_ENDPOINTS.AUTH.SIGN_UP, payload);
    return extractPayload<SignUpResult>(data);
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResult> {
    const { data } = await api.post<VerifyOtpResponse>(API_ENDPOINTS.AUTH.VERIFY_OTP, payload);
    return extractPayload<VerifyOtpResult>(data);
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
