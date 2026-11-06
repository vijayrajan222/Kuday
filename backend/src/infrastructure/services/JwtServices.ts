import jwt from "jsonwebtoken";
import type { IJwtService } from "@application/interfaces/services/IJwtServices";

export class JwtService implements IJwtService {
    private readonly _secretKey: string;
    private readonly _refreshSecretKey: string;

    constructor() {
        this._secretKey = process.env.JWT_SECRET || "default_super_secret_key_change_in_production";
        this._refreshSecretKey = process.env.JWT_REFRESH_SECRET || "default_super_refresh_secret_key_change_in_production";
    }

    generateToken(payload: { userId: string; email: string }): string {
        return jwt.sign(payload, this._secretKey, {
            expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as `${number}${"d" | "h" | "m" | "s"}`,
        });
    }

    generateRefreshToken(payload: { userId: string; email: string }): string {
        return jwt.sign(payload, this._refreshSecretKey, {
            expiresIn: "30d",
        });
    }

    verifyToken(token: string, isRefresh: boolean = false): { userId: string; email: string } | null {
        try {
            const secret = isRefresh ? this._refreshSecretKey : this._secretKey;
            const decoded = jwt.verify(token, secret) as { userId: string; email: string };
            return decoded;
        } catch {
            return null;
        }
    }
}