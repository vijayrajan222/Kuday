import type { Request, Response } from "express";

export interface IAdminController {
    login(req: Request, res: Response): Promise<void>;
    getStats(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    verifyIdentity(req: Request, res: Response): Promise<void>;
    toggleBlock(req: Request, res: Response): Promise<void>;
}
