import type { Request, Response } from "express";
import { ZodError } from "zod";

import type { IAuthController } from "@presentation/interface/IAuthController";

import type { ISignUpUserUsercase } from "@application/interfaces/use-case/auth/ISignUpUserUsecase";
import type { IVerifyOtpUseCase } from "@application/interfaces/use-case/auth/IVerifyOtpUseCase";
import type { ILoginUserUseCase } from "@application/interfaces/use-case/auth/ILoginUserUseCase";
import type { IGoogleAuthUseCase } from "@application/interfaces/use-case/auth/IGoogleAuthUseCase";
import type { IForgotPasswordUseCase } from "@application/interfaces/use-case/auth/IForgotPasswordUseCase";
import type { IVerifyResetOtpUseCase } from "@application/interfaces/use-case/auth/IVerifyResetOtpUseCase";
import type { IResetPasswordUseCase } from "@application/interfaces/use-case/auth/IResetPasswordUseCase";
import type { IRefreshTokenUseCase } from "@application/interfaces/use-case/auth/IRefreshTokenUseCase";
import type { IJwtService } from "@application/interfaces/services/IJwtServices";

import { SignUpUserRequestSchema } from "@presentation/utils/validators/zod/AuthSchema";
import { VerifyOtpRequestSchema } from "@presentation/utils/validators/zod/VerifyOtpRequestSchema";
import { LoginRequestSchema } from "@presentation/utils/validators/zod/LoginSchema";
import { GoogleAuthRequestSchema } from "@presentation/utils/validators/zod/GoogleAuthRequestSchema";
import { ForgetPasswordSchema } from "@presentation/utils/validators/zod/ForgotPasswordSchema";
import { VerifyResetOtpSchema } from "@presentation/utils/validators/zod/VerifyResetOtpSchema";
import { ResetPasswordSchema } from "@presentation/utils/validators/zod/ResetPasswordSchema";
import { ApiResponse } from "@presentation/utils/ApiResponse";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class AuthController implements IAuthController {
    private readonly _signUpUsecase: ISignUpUserUsercase;
    private readonly _verifyOtpUseCase: IVerifyOtpUseCase;
    private readonly _loginUseCase: ILoginUserUseCase;
    private readonly _googleAuthUseCase: IGoogleAuthUseCase;
    private readonly _forgotPasswordUseCase: IForgotPasswordUseCase;
    private readonly _verifyResetOtpUseCase: IVerifyResetOtpUseCase;
    private readonly _resetPasswordUseCase: IResetPasswordUseCase;
    private readonly _refreshTokenUseCase?: IRefreshTokenUseCase | undefined;
    private readonly _jwtService?: IJwtService | undefined;

    constructor(
        signUpUsecase: ISignUpUserUsercase,
        verifyOtpUseCase: IVerifyOtpUseCase,
        loginUseCase: ILoginUserUseCase,
        googleUseCase: IGoogleAuthUseCase,
        forgotPasswordUseCase: IForgotPasswordUseCase,
        verifyResetOtpUseCase: IVerifyResetOtpUseCase,
        resetPasswordUseCase: IResetPasswordUseCase,
        jwtService?: IJwtService | undefined,
        refreshTokenUseCase?: IRefreshTokenUseCase | undefined
    ) {
        this._signUpUsecase = signUpUsecase;
        this._verifyOtpUseCase = verifyOtpUseCase;
        this._loginUseCase = loginUseCase;
        this._googleAuthUseCase = googleUseCase;
        this._forgotPasswordUseCase = forgotPasswordUseCase;
        this._verifyResetOtpUseCase = verifyResetOtpUseCase;
        this._resetPasswordUseCase = resetPasswordUseCase;
        this._jwtService = jwtService;
        this._refreshTokenUseCase = refreshTokenUseCase;
    }

    async signUp(req: Request, res: Response): Promise<void> {
        try {
            const value = SignUpUserRequestSchema.parse(req.body);  
            const result = await this._signUpUsecase.execute(value);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "User created successfully")
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid signup data")
                );
                return;
            }

            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Sign up failed.")
            );
        }
    }
     

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const value = VerifyOtpRequestSchema.parse(req.body);
            const result = await this._verifyOtpUseCase.execute(value);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid OTP data")
                );
                return;
            }

            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "OTP verification failed.")
            );
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const value = LoginRequestSchema.parse(req.body);
            const result = await this._loginUseCase.execute(value);

            // Generate refresh token and set as httpOnly cookie if jwtService is available
            if (this._jwtService && result.id && result.email) {
                const refreshToken = this._jwtService.generateRefreshToken({
                    userId: result.id,
                    email: result.email,
                });
                const isProduction = process.env.NODE_ENV === "production";
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    path: "/",
                });
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid login data")
                );
                return;
            }

            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Login failed")
            );
        }
    }

    async googleAuth(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = GoogleAuthRequestSchema.parse(req.body);
            const result = await this._googleAuthUseCase.execute(validatedData);

            if (this._jwtService && result.id && result.email) {
                const refreshToken = this._jwtService.generateRefreshToken({
                    userId: result.id,
                    email: result.email,
                });
                const isProduction = process.env.NODE_ENV === "production";
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                    path: "/",
                });
            }

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid request data")
                );
                return;
            }

            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Google authentication failed")
            );
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const value = ForgetPasswordSchema.parse(req.body);
            const result = await this._forgotPasswordUseCase.execute(value);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid email format")
                );
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Forgot password request failed.")
            );
        }
    }

    async verifyResetOtp(req: Request, res: Response): Promise<void> {
        try {
            const value = VerifyResetOtpSchema.parse(req.body);
            const result = await this._verifyResetOtpUseCase.execute(value);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid OTP data")
                );
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Reset OTP verification failed.")
            );
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const value = ResetPasswordSchema.parse(req.body);
            const result = await this._resetPasswordUseCase.execute(value);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, result.message)
            );
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error(error.issues[0]?.message ?? "Invalid password data")
                );
                return;
            }
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Password reset failed.")
            );
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const cookieHeader = req.headers.cookie;
            let refreshToken: string | undefined;

            if (cookieHeader) {
                const match = cookieHeader.split("; ").find((row) => row.startsWith("refreshToken="));
                if (match) refreshToken = match.split("=")[1];
            }

            if (!refreshToken && req.body && req.body.refreshToken) {
                refreshToken = req.body.refreshToken;
            }

            if (!refreshToken) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Refresh token is missing or expired.", HttpStatusCodes.UNAUTHORIZED)
                );
                return;
            }

            if (!this._refreshTokenUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Refresh token service not initialized.", HttpStatusCodes.INTERNAL_SERVER_ERROR)
                );
                return;
            }

            const result = await this._refreshTokenUseCase.execute({ refreshToken });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success({ token: result.accessToken }, "Token refreshed successfully")
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Token refresh failed.";
            if (message.includes("blocked")) {
                const isProduction = process.env.NODE_ENV === "production";
                res.clearCookie("refreshToken", {
                    httpOnly: true,
                    secure: isProduction,
                    sameSite: isProduction ? "none" : "lax",
                    path: "/",
                });
                res.status(HttpStatusCodes.FORBIDDEN).json(
                    ApiResponse.error(message, HttpStatusCodes.FORBIDDEN)
                );
                return;
            }

            res.status(HttpStatusCodes.UNAUTHORIZED).json(
                ApiResponse.error(message, HttpStatusCodes.UNAUTHORIZED)
            );
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            const isProduction = process.env.NODE_ENV === "production";
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: isProduction,
                sameSite: isProduction ? "none" : "lax",
                path: "/",
            });
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(null, "Logged out successfully")
            );
        } catch (error: unknown) {
            res.status(HttpStatusCodes.BAD_REQUEST).json(
                ApiResponse.error(error instanceof Error ? error.message : "Logout failed.")
            );
        }
    }
}
