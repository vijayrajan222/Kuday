export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignUpResult {
  id?: string;
  email?: string;
}

export interface SignUpResponse extends SignUpResult {
  message?: string;
  data?: SignUpResult;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResult {
  message?: string;
  isVerified?: boolean;
  token?: string;
}

export interface VerifyOtpResponse extends VerifyOtpResult {
  data?: VerifyOtpResult;
}

export interface ResendOtpRequest {
  email: string;
}

export interface AuthUser {
  email: string;
  firstName: string;
}

export interface PendingSignup {
  email: string;
  firstName: string;
}
