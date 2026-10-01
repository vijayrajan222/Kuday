import type { Request, Response } from "express";

export interface IAuthController {
    signUp(req: Request, res: Response): Promise<void>;
    verifyOtp(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    googleAuth(req: Request, res: Response): Promise<void>;
    forgotPassword(req: Request, res: Response): Promise<void>;
    verifyResetOtp(req: Request, res: Response): Promise<void>;
    resetPassword(req: Request, res: Response): Promise<void>;
    refreshToken(req: Request, res: Response): Promise<void>;
    logout(req: Request, res: Response): Promise<void>;
}
