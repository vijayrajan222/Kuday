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
  id?: string;
  message?: string;
  isVerified?: boolean;
  token?: string;
  isOnboarded?: boolean;
  role?: 'host' | 'seeker' | 'none';
  identityVerified?: boolean;
}

export interface VerifyOtpResponse extends VerifyOtpResult {
  data?: VerifyOtpResult;
}

export interface ResendOtpRequest {
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  message?: string;
  isOnboarded?: boolean;
  role?: 'host' | 'seeker' | 'none';
  identityVerified?: boolean;
}

export interface LoginResponse extends LoginResult {
  message?: string;
  data?: LoginResult;
}

export interface GoogleAuthRequest {
  email: string;
  firstName: string;
  lastName: string;
  googleId?: string;
  picture?: string;
}

export interface GoogleAuthResult {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  token?: string;
  message?: string;
  isOnboarded?: boolean;
  role?: 'host' | 'seeker' | 'none';
  identityVerified?: boolean;
}

export interface GoogleAuthResponse extends GoogleAuthResult {
  message?: string;
  data?: GoogleAuthResult;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResult {
  email?: string;
  message?: string;
}

export interface ForgotPasswordResponse extends ForgotPasswordResult {
  data?: ForgotPasswordResult;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResult {
  email?: string;
  isVerified?: boolean;
  token?: string;
  message?: string;
}

export interface VerifyResetOtpResponse extends VerifyResetOtpResult {
  data?: VerifyResetOtpResult;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  email?: string;
  message?: string;
}

export interface ResetPasswordResponse extends ResetPasswordResult {
  data?: ResetPasswordResult;
}

export interface AuthUser {
  id?: string;
  email: string;
  firstName: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  occupation?: string;
  bio?: string;
  role?: 'host' | 'seeker' | 'none';
  isOnboarded?: boolean;
  identityVerified?: boolean;
  identityStatus?: 'none' | 'pending' | 'verified' | 'rejected' | string;
  selfieUrl?: string;
  idCardUrl?: string;
}

export interface PendingSignup {
  email: string;
  firstName: string;
}
