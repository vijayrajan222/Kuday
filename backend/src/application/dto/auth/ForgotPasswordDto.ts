export interface ForgotPasswordRequestDto {
    email: string;
}

export interface ForgotPasswordResponseDto {
    email: string;
    message: string;
}