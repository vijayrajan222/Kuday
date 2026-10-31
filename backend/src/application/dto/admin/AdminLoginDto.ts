export interface AdminLoginRequestDto {
    email: string;
    password: string;
}

export interface AdminLoginResultDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isAdmin: boolean;
    token: string;
}
