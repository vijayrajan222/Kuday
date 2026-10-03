export interface VerifyOtpRequestDto {
    email: string;
    otp: string;
}

export interface VerifyOtpResultDto {
    id?: string | undefined;
    message: string;
    isVerified: boolean;
    token?: string | undefined;
    isOnboarded?: boolean | undefined;
    role?: string | undefined;
    identityVerified?: boolean | undefined;
}
