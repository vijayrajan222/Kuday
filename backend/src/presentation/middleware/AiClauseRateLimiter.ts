import rateLimit from "express-rate-limit";
import type { AuthenticatedRequest } from "./AuthMiddleware";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export const aiClausePerMinuteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.id || req.ip || "unknown",
  handler: (_req, res) => {
    res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Too many AI drafting requests. Please wait a minute or write your clause manually.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiClausePerDayLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 50,
  keyGenerator: (req) => (req as AuthenticatedRequest).user?.id || req.ip || "unknown",
  handler: (_req, res) => {
    res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: "Daily AI clause drafting limit reached (50 requests/day). You can still write and submit clauses manually.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
