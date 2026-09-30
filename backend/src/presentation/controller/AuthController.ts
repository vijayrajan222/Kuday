import type { Request, Response } from "express";
import { ZodError } from "zod";

import type { IAuthController } from "../interface/IAuthController.js";

import type { ISignUpUserUsercase } from "../../application/interfaces/use-case/auth/ISignUpUserUsecase.js";
import type { IVerifyOtpUseCase } from "../../application/interfaces/use-case/auth/IVerifyOtpUseCase.js";
import type { ILoginUserUseCase } from "../../application/interfaces/use-case/auth/ILoginUserUseCase.js";
import type { IGoogleAuthUseCase } from "../../application/interfaces/use-case/auth/IGoogleAuthUseCase.js";

import { SignUpUserRequestSchema } from "../utils/validators/zod/AuthSchema.js";
import { VerifyOtpRequestSchema } from "../utils/validators/zod/VerifyOtpRequestSchema.js";
import { LoginRequestSchema } from "../utils/validators/zod/LoginSchema.js";
import { GoogleAuthRequestSchema } from "../utils/validators/zod/GoogleAuthRequestSchema.js";

export class AuthController implements IAuthController {
    private readonly _signUpUsecase: ISignUpUserUsercase;
    private readonly _verifyOtpUseCase: IVerifyOtpUseCase;
    private readonly _loginUseCase: ILoginUserUseCase;
    private readonly _googleAuthUseCase: IGoogleAuthUseCase;

    constructor(
        signUpUsecase: ISignUpUserUsercase,
        verifyOtpUseCase: IVerifyOtpUseCase,
        loginUseCase: ILoginUserUseCase,
        googleUseCase: IGoogleAuthUseCase
    ) {
        this._signUpUsecase = signUpUsecase;
        this._verifyOtpUseCase = verifyOtpUseCase;
        this._loginUseCase = loginUseCase;
        this._googleAuthUseCase = googleUseCase;
    }

    async signUp(req: Request, res: Response): Promise<void> {
        const value = SignUpUserRequestSchema.parse(req.body);

        console.log("Value", value);

        const result = await this._signUpUsecase.execute(value);

        res.status(200).json({
            success: true,
            message: "User created successfully",
            payload: result
        });
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

            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            });

        } catch (error: unknown) {
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
}