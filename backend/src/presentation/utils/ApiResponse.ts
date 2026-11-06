import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export interface ApiResponseData<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    payload?: T;
    error?: string;
}

export class ApiResponse {
    static success<T>(
        data?: T,
        message = "Success",
        _statusCode: number = HttpStatusCodes.OK
    ): ApiResponseData<T> {
        const response: ApiResponseData<T> = {
            success: true,
            message,
        };
        if (data !== undefined) {
            response.data = data;
            response.payload = data; // Guarantees compatibility for both frontend data and payload access
        }
        return response;
    }

    static error(
        message = "An error occurred",
        _statusCode: number = HttpStatusCodes.BAD_REQUEST,
        error?: string
    ): ApiResponseData {
        const response: ApiResponseData = {
            success: false,
            message,
            error: error || message,
        };
        return response;
    }
}
