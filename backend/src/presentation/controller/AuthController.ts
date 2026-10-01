import type { Request, Response } from "express";
import { ZodError } from "zod";

import type { IAuthController } from "../interface/IAuthController.js";

import type { ISignUpUserUsercase } from "../../application/interfaces/use-case/auth/ISignUpUserUsecase.js";
import type { IVerifyOtpUseCase } from "../../application/interfaces/use-case/auth/IVerifyOtpUseCase.js";
import type { ILoginUserUseCase } from "../../application/interfaces/use-case/auth/ILoginUserUseCase.js";
import type { IGoogleAuthUseCase } from "../../application/interfaces/use-case/auth/IGoogleAuthUseCase.js";
import type { IForgotPasswordUseCase } from "../../application/interfaces/use-case/auth/IForgotPasswordUseCase.js";
import type { IVerifyResetOtpUseCase } from "../../application/interfaces/use-case/auth/IVerifyResetOtpUseCase.js";
import type { IResetPasswordUseCase } from "../../application/interfaces/use-case/auth/IResetPasswordUseCase.js";
import type { IJwtService } from "../../application/interfaces/services/IJwtServices.js";

import { SignUpUserRequestSchema } from "../utils/validators/zod/AuthSchema.js";
import { VerifyOtpRequestSchema } from "../utils/validators/zod/VerifyOtpRequestSchema.js";
import { LoginRequestSchema } from "../utils/validators/zod/LoginSchema.js";
import { GoogleAuthRequestSchema } from "../utils/validators/zod/GoogleAuthRequestSchema.js";
import { ForgetPasswordSchema } from "../utils/validators/zod/ForgotPasswordSchema.js";
import { VerifyResetOtpSchema } from "../utils/validators/zod/VerifyResetOtpSchema.js";
import { ResetPasswordSchema } from "../utils/validators/zod/ResetPasswordSchema.js";

export class AuthController implements IAuthController {
    private readonly _signUpUsecase: ISignUpUserUsercase;
    private readonly _verifyOtpUseCase: IVerifyOtpUseCase;
    private readonly _loginUseCase: ILoginUserUseCase;
    private readonly _googleAuthUseCase: IGoogleAuthUseCase;
    private readonly _forgotPasswordUseCase: IForgotPasswordUseCase;
    private readonly _verifyResetOtpUseCase: IVerifyResetOtpUseCase;
    private readonly _resetPasswordUseCase: IResetPasswordUseCase;
    private readonly _jwtService?: IJwtService | undefined;

    constructor(
        signUpUsecase: ISignUpUserUsercase,
        verifyOtpUseCase: IVerifyOtpUseCase,
        loginUseCase: ILoginUserUseCase,
        googleUseCase: IGoogleAuthUseCase,
        forgotPasswordUseCase: IForgotPasswordUseCase,
        verifyResetOtpUseCase: IVerifyResetOtpUseCase,
        resetPasswordUseCase: IResetPasswordUseCase,
        jwtService?: IJwtService | undefined
    ) {
        this._signUpUsecase = signUpUsecase;
        this._verifyOtpUseCase = verifyOtpUseCase;
        this._loginUseCase = loginUseCase;
        this._googleAuthUseCase = googleUseCase;
        this._forgotPasswordUseCase = forgotPasswordUseCase;
        this._verifyResetOtpUseCase = verifyResetOtpUseCase;
        this._resetPasswordUseCase = resetPasswordUseCase;
        this._jwtService = jwtService;
    }

    async signUp(req: Request, res: Response): Promise<void> {
        try {
            const value = SignUpUserRequestSchema.parse(req.body);

            console.log("SignUp Value", value);

            const result = await this._signUpUsecase.execute(value);

            res.status(200).json({
                success: true,
                message: "User created successfully",
                payload: result
            });
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid signup data"
                });
                return;
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Sign up failed."
            });
        }
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            const value = VerifyOtpRequestSchema.parse(req.body);

            const result = await this._verifyOtpUseCase.exicute(value);

            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });

        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid OTP data"
                });
                return;
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "OTP verification failed."
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const value = LoginRequestSchema.parse(req.body);

            const result = await this._loginUseCase.exicute(value);

            // Generate refresh token and set as httpOnly cookie if jwtService is available
            if (this._jwtService && result.id && result.email) {
                const refreshToken = this._jwtService.generateRefreshToken({
                    userId: result.id,
                    email: result.email
                });
                res.setHeader("Set-Cookie", `refreshToken=${refreshToken}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
            }

            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });

        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid login data"
                });
                return;
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Login failed"
            });
        }
    }

    async googleAuth(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = GoogleAuthRequestSchema.parse(req.body);

            const result = await this._googleAuthUseCase.execute(validatedData);

            if (this._jwtService && result.id && result.email) {
                const refreshToken = this._jwtService.generateRefreshToken({
                    userId: result.id,
                    email: result.email
                });
                res.setHeader("Set-Cookie", `refreshToken=${refreshToken}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);
            }

            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });

        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid request data"
                });
                return;
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error
                    ? error.message
                    : "Google authentication failed"
            });
        }
    }

    async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const value = ForgetPasswordSchema.parse(req.body);
            const result = await this._forgotPasswordUseCase.execute(value);
            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid email format"
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Forgot password request failed."
            });
        }
    }

    async verifyResetOtp(req: Request, res: Response): Promise<void> {
        try {
            const value = VerifyResetOtpSchema.parse(req.body);
            const result = await this._verifyResetOtpUseCase.exicute(value);
            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid OTP data"
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Reset OTP verification failed."
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const value = ResetPasswordSchema.parse(req.body);
            const result = await this._resetPasswordUseCase.execute(value);
            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid password data"
                });
                return;
            }
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Password reset failed."
            });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const cookieHeader = req.headers.cookie;
            let refreshToken: string | undefined;

            if (cookieHeader) {
                const match = cookieHeader.split('; ').find(row => row.startsWith('refreshToken='));
                if (match) refreshToken = match.split('=')[1];
            }

            if (!refreshToken && req.body && req.body.refreshToken) {
                refreshToken = req.body.refreshToken;
            }

            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    message: "Refresh token is missing or expired."
                });
                return;
            }

            if (!this._jwtService) {
                res.status(500).json({ success: false, message: "JWT service not initialized." });
                return;
            }

            const decoded = this._jwtService.verifyToken(refreshToken, true);
            if (!decoded) {
                res.status(401).json({
                    success: false,
                    message: "Invalid or expired refresh token."
                });
                return;
            }

            const newToken = this._jwtService.generateToken({
                userId: decoded.userId,
                email: decoded.email
            });

            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                payload: { token: newToken }
            });
        } catch (error: unknown) {
            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : "Token refresh failed."
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            res.setHeader("Set-Cookie", "refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
            res.status(200).json({
                success: true,
                message: "Logged out successfully"
            });
        } catch (error: unknown) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : "Logout failed."
            });
        }
    }
}