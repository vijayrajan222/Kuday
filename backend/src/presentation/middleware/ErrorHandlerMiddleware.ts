import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { logger } from "@infrastructure/logging/Logger";
import {
    ApplicationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
} from "@application/errors/AppError";

export {
    ApplicationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
};

export class AppError extends ApplicationError {}

export function globalErrorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof ApplicationError) {
        logger.error(`[ApplicationError] (${err.statusCode}): ${err.message}`);
        res.status(err.statusCode).json(
            ApiResponse.error(
                err.message,
                err.statusCode,
                process.env.NODE_ENV === "development" ? err.stack : undefined
            )
        );
        return;
    }

    if (err instanceof ZodError) {
        const message = err.issues[0]?.message || "Validation Error";
        logger.error(`[ZodValidationError] ${message}`);
        res.status(HttpStatusCodes.BAD_REQUEST).json({
            success: false,
            message,
            error: message,
            errors: err.issues,
        });
        return;
    }

    // Check for MongoDB duplicate key error code 11000
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === 11000) {
        logger.error(`[MongoDuplicateKeyError] Conflict detected`);
        res.status(HttpStatusCodes.CONFLICT).json(
            ApiResponse.error("User or resource with this unique value already exists.", HttpStatusCodes.CONFLICT)
        );
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
        res.status(statusCode).json(
            ApiResponse.error(
                msg,
                statusCode,
                process.env.NODE_ENV === "development" ? err.stack : undefined
            )
        );
        return;
    }

    const fallbackMessage = "Internal Server Error";
    logger.error(`[GlobalErrorHandler] ${fallbackMessage}`, err);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
        ApiResponse.error(fallbackMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    );
}
