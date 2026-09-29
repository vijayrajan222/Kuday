export interface loginRequestDto {
    email: string;
    password: string;
}

export interface loginResponseDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    token: string;
    message: string;
}