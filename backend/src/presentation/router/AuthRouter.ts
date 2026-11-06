import { Router } from "express";
import type { Request, Response } from "express";
import type { IAuthController } from "@presentation/interface/IAuthController.js";

export function createAuthRouter(authController: IAuthController) {
    const router = Router();

    router.post("/signUp", async (req: Request, res: Response) => {
        return await authController.signUp(req, res);
    });

    router.post("/verify-otp", async (req: Request, res: Response) => {
        return await authController.verifyOtp(req, res);
    });

    router.post("/login", async (req: Request, res: Response) => {
        return await authController.login(req, res);
    });

    router.post("/google", async (req: Request, res: Response) => {
        return await authController.googleAuth(req, res);
    });

    router.post("/forgot-password", async (req: Request, res: Response) => {
        return await authController.forgotPassword(req, res);
    });

    router.post("/verify-reset-otp", async (req: Request, res: Response) => {
        return await authController.verifyResetOtp(req, res);
    });

    router.post("/reset-password", async (req: Request, res: Response) => {
        return await authController.resetPassword(req, res);
    });

    router.post("/refresh-token", async (req: Request, res: Response) => {
        return await authController.refreshToken(req, res);
    });

    router.post("/logout", async (req: Request, res: Response) => {
        return await authController.logout(req, res);
    });

    return router;
}
