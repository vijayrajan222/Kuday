import type { Request, Response, NextFunction } from "express";
import { HttpStatusCodes } from "../utils/HttpStatusCodes.js";
import { logger } from "../../infrastructure/logging/Logger.js";

export class AppError extends Error {
    constructor(
        public override message: string,
        public statusCode: number = HttpStatusCodes.BAD_REQUEST
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function globalErrorHandler(
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    const statusCode = err instanceof AppError ? err.statusCode : HttpStatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || "Internal Server Error";

    logger.error(`[GlobalErrorHandler] ${message}`, err);

    res.status(statusCode).json({
        success: false,
        message,
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
}
