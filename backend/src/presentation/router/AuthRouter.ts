import { Router } from "express";
import type { Request, Response } from "express";
import type { IAuthController } from "../interface/IAuthController.js";


export function createAuthRouter(authController: IAuthController) {
    const router = Router()

    router.post("/signUp", async (req: Request, res: Response) => {
        return await authController.signUp(req, res)
    })

    router.post("/verify-otp", async (req: Request, res: Response) => {
        return await authController.verifyOtp(req, res)
    })

    router.post("/login", async (req: Request, res: Response) => {
        return await authController.login(req, res);
    });

    router.post("/google", async (req: Request, res: Response) => {
        return await authController.googleAuth(req, res);
    });
    
    return router
}
