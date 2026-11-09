import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./AuthMiddleware";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

interface RateLimitRecord {
    count: number;
    resetTime: number;
}

const windowMs = 60 * 1000; // 1 minute window
const maxRequests = 20; // 20 requests per window
const store = new Map<string, RateLimitRecord>();

// Clean expired records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
        if (now > record.resetTime) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function paymentRateLimiter(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    const key = req.user?.id || req.ip || "unknown";
    const now = Date.now();
    const record = store.get(key);

    if (!record || now > record.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
        next();
        return;
    }

    if (record.count >= maxRequests) {
        console.warn(`[Payment Rate Limit] Too many requests from ${key}`);
        res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
            success: false,
            message: "Too many payment requests. Please wait a minute and try again.",
        });
        return;
    }

    record.count++;
    next();
}
