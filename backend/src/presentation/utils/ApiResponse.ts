import { HttpStatusCodes, type HttpStatusCode } from "./HttpStatusCodes.js";

export interface ApiResponseData<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export class ApiResponse {
    static success<T>(data?: T, message = "Success", _statusCode: HttpStatusCode = HttpStatusCodes.OK): ApiResponseData<T> {
        const response: ApiResponseData<T> = {
            success: true,
            message,
        };
        if (data !== undefined) {
            response.data = data;
        }
        return response;
    }

    static error(message = "An error occurred", _statusCode: HttpStatusCode = HttpStatusCodes.BAD_REQUEST, error?: string): ApiResponseData {
        const response: ApiResponseData = {
            success: false,
            message,
            error: error || message,
        };
        return response;
    }
}
