export interface ChangePasswordRequestDto {
    userId: string;
    currentPassword?: string | undefined;
    newPassword: string;
    confirmPassword: string;
}

export interface ChangePasswordResponseDto {
    message: string;
}
