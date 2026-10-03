export interface GoogleAuthRequestDto {
  email: string;
  firstName: string;
  lastName: string;
  googleId?: string | undefined;
  picture?: string | undefined;
}

export interface GoogleAuthResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  message: string;
  isOnboarded?: boolean | undefined;
  role?: string | undefined;
  identityVerified?: boolean | undefined;
}