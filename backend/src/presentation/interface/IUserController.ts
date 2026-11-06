import type { Request, Response } from "express";

export interface IUserController {
    updateProfile(req: Request, res: Response): Promise<void>;
    updateRole(req: Request, res: Response): Promise<void>;
    uploadIdentity(req: Request, res: Response): Promise<void>;
    getUserProfile(req: Request, res: Response): Promise<void>;
    changePassword(req: Request, res: Response): Promise<void>;
}
