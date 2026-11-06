import type { Request, Response, NextFunction } from "express";
import type { IJwtService } from "@application/interfaces/services/IJwtServices.js";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes.js";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        isAdmin?: boolean | undefined;
        isBlocked?: boolean | undefined;
    };
}

export function createAuthMiddleware(jwtService: IJwtService, userRepo: IUserRepository) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authorization token missing or invalid.",
                });
                return;
            }

            const token = authHeader.split(" ")[1];
            if (!token) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Authorization token missing.",
                });
                return;
            }

            const decoded = jwtService.verifyToken(token);
            if (!decoded) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "Invalid or expired token.",
                });
                return;
            }

            const user = await userRepo.findById(decoded.userId);
            if (!user) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: "User account no longer exists.",
                });
                return;
            }

            if (user.isBlocked) {
                res.status(HttpStatusCodes.FORBIDDEN).json({
                    success: false,
                    message: "Your account has been blocked. Please contact support.",
                });
                return;
            }

            req.user = {
                id: user.id,
                email: user.email,
                isAdmin: user.isAdmin,
                isBlocked: user.isBlocked,
            };

            next();
        } catch {
            res.status(HttpStatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication failed.",
            });
        }
    };
}
