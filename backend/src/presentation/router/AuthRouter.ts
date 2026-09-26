import { Router } from "express";
import type { Request, Response } from "express";
import type { IAuthController } from "../interface/IAuthController.js";


export function createAuthRouter(authController : IAuthController){
    const router = Router()

    router.post("/signUp",async (req:Request,res:Response)=>{
        return await authController.signUp(req,res)
    })

    router.post("/verify-otp", async (req: Request , res: Response)=>{
        return await authController.verifyOtp(req,res)
    })

    return router
}
