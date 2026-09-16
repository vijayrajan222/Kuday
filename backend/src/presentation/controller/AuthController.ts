import type { Request, Response } from "express";
import type { IAuthController } from "../intreface/IAuthController.js";
import { SignUpUserUseCase } from "../../application/use-case/auth/SignUpUserUseCase.js";
import type { ISignUpUserUsercase } from "../../application/interfaces/use-case/auth/ISignUpUserUsecase.js";
import { SignUpUserRequestSchema } from "../utils/validators/zod/AuthSchema.js";
import { success } from "zod";

export class AuthController implements IAuthController {
    private readonly _signUpUsecase : ISignUpUserUsercase
    constructor(signUpUsecase: ISignUpUserUsercase){
        this._signUpUsecase = signUpUsecase
    }

    async signUp(req: Request, res: Response): Promise<void> {
        let value = SignUpUserRequestSchema.parse(req.body)
       const result =  this._signUpUsecase.execute(value)
       
       res.status(200).json({
            success : true,
            message : "User created succesfully",
            payload : result
        })//send back the response
    }
}