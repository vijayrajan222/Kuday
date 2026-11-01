export interface RefreshTokenRequestDto {
    refreshToken: string;
}

export interface RefreshTokenResultDto {
    accessToken: string;
    userId: string;
    email: string;
}
