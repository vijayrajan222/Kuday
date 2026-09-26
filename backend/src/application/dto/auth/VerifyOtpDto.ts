/**
 * Request DTO defines the exact data needed from the client to verify an OTP.
 */
export interface VerifyOtpRequestDto {
    email: string;
    otp: string;
}

/**
 * Result DTO defines the data returned by the use case after verification finishes.
 */
export interface VerifyOtpResultDto {
    message: string;
    isVerified: boolean;
}