export interface IJwtService {
    generateToken(payload: { userId: string; email: string }): string;
    generateRefreshToken(payload: { userId: string; email: string }): string;
    verifyToken(token: string, isRefresh?: boolean): { userId: string; email: string } | null;
}