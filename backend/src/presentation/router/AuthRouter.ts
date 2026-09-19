import { Router } from "express";
import type { Request, Response } from "express";
import type { IAuthController } from "../intreface/IAuthController.js";


export function createAuthRouter(authController : IAuthController){
    const router = Router()

    router.post("/signUp",async (req:Request,res:Response)=>{
        return await authController.signUp(req,res)
    })

    return router
}
