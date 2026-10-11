import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
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

export class ValidationError extends AppError {
    constructor(message: string = "Validation failed") {
        super(message, HttpStatusCodes.BAD_REQUEST);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(message, HttpStatusCodes.UNAUTHORIZED);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, HttpStatusCodes.FORBIDDEN);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(message, HttpStatusCodes.NOT_FOUND);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource already exists") {
        super(message, HttpStatusCodes.CONFLICT);
    }
}

export function globalErrorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        logger.error(`[AppError] (${err.statusCode}): ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
        return;
    }

    if (err instanceof ZodError) {
        const message = err.issues[0]?.message || "Validation Error";
        logger.error(`[ZodValidationError] ${message}`);
        res.status(HttpStatusCodes.BAD_REQUEST).json({
            success: false,
            message,
            errors: err.issues,
        });
        return;
    }

    // Check for MongoDB duplicate key error code 11000
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
        logger.error(`[MongoDuplicateKeyError] Conflict detected`);
        res.status(HttpStatusCodes.CONFLICT).json({
            success: false,
            message: "User or resource with this unique value already exists.",
        });
        return;
    }

    // Map common domain error messages to proper status codes if thrown as standard Error
    if (err instanceof Error) {
        const msg = err.message;
        let statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;

        if (
            msg.includes("already exists") ||
            msg.includes("Conflict")
        ) {
            statusCode = HttpStatusCodes.CONFLICT;
        } else if (
            msg.includes("Invalid email or password") ||
            msg.includes("Invalid credentials") ||
            msg.includes("Token expired") ||
            msg.includes("Invalid token")
        ) {
            statusCode = HttpStatusCodes.UNAUTHORIZED;
        } else if (
            msg.includes("blocked") ||
            msg.includes("Forbidden") ||
            msg.includes("Access denied")
        ) {
            statusCode = HttpStatusCodes.FORBIDDEN;
        } else if (
            msg.includes("not found") ||
            msg.includes("does not exist")
        ) {
            statusCode = HttpStatusCodes.NOT_FOUND;
        } else if (
            msg.includes("required") ||
            msg.includes("must be") ||
            msg.includes("Invalid") ||
            msg.includes("cannot be") ||
            msg.includes("match")
        ) {
            statusCode = HttpStatusCodes.BAD_REQUEST;
        }

        logger.error(`[ErrorHandler] (${statusCode}) ${msg}`, err);
        res.status(statusCode).json({
            success: false,
            message: msg,
            error: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
        return;
    }

    const fallbackMessage = "Internal Server Error";
    logger.error(`[GlobalErrorHandler] ${fallbackMessage}`, err);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: fallbackMessage,
    });
}
