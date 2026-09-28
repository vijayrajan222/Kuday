import jwt from "jsonwebtoken";
import type { IJwtService } from "../../application/interfaces/services/IJwtServices.js";

export class JwtService implements IJwtService {
    private readonly _secretKey: string;

    constructor() {
        this._secretKey = process.env.JWT_SECRET || "default_super_secret_key_change_in_production";
    }

    generateToken(payload: { userId: string; email: string }): string {
        return jwt.sign(payload, this._secretKey, {
            expiresIn: "7d", // Token valid for 7 days
        });
    }
}