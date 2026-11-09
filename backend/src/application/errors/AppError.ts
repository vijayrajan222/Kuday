export class ApplicationError extends Error {
    constructor(
        public override message: string,
        public statusCode: number = 400
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends ApplicationError {
    constructor(message: string = "Resource not found") {
        super(message, 404);
    }
}

export class ConflictError extends ApplicationError {
    constructor(message: string = "Resource already exists") {
        super(message, 409);
    }
}

export class UnauthorizedError extends ApplicationError {
    constructor(message: string = "Unauthorized") {
        super(message, 401);
    }
}

export class ForbiddenError extends ApplicationError {
    constructor(message: string = "Forbidden") {
        super(message, 403);
    }
}

export class ValidationError extends ApplicationError {
    constructor(message: string = "Validation failed") {
        super(message, 400);
    }
}

export const AppError = ApplicationError;
export type AppError = ApplicationError;

