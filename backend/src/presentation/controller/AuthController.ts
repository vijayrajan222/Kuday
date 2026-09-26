import type { Request, Response } from "express";
import type { IAuthController } from "../interface/IAuthController.js";
import { SignUpUserUseCase } from "../../application/use-case/auth/SignUpUserUseCase.js";
import type { ISignUpUserUsercase } from "../../application/interfaces/use-case/auth/ISignUpUserUsecase.js";
import { SignUpUserRequestSchema } from "../utils/validators/zod/AuthSchema.js";
import { success } from "zod";
import { VerifyOptUseCase } from "../../application/use-case/auth/VerifyOtpUseCase.js";
import type { IVerifyOtpUseCase } from "../../application/interfaces/use-case/auth/IVerifyOtpUseCase.js";
import { MongoOtpRepository } from "../../infrastructure/repository/MongoOtpRepository.js";
import { VerifyOtpRequestSchema } from "../utils/validators/zod/VerifyOtpRequestSchema.js";

export class AuthController implements IAuthController {
    private readonly _signUpUsecase: ISignUpUserUsercase
    private readonly _verifyOtpUseCase: IVerifyOtpUseCase


    constructor(signUpUsecase: ISignUpUserUsercase,
        verifyOtpUseCase: IVerifyOtpUseCase
    ) {
        this._signUpUsecase = signUpUsecase
        this._verifyOtpUseCase = verifyOtpUseCase

    }

    async signUp(req: Request, res: Response): Promise<void> {
        let value = SignUpUserRequestSchema.parse(req.body)
        console.log("Value", value)
        const result = await this._signUpUsecase.execute(value)

        res.status(200).json({
            success: true,
            message: "User created succesfully",
            payload: result
        })//send back the response
    }

    async verifyOtp(req: Request, res: Response): Promise<void> {
        try {
            let value = VerifyOtpRequestSchema.parse(req.body)
            const result = await this._verifyOtpUseCase.exicute(value)

            res.status(200).json({
                success: true,
                message: result.message,
                payload: result
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || "OTP verification failed."
            })
        }
    }
}