import type { Request, Response } from "express";

export interface IAdminController {
    login(req: Request, res: Response): Promise<void>;
    getStats(req: Request, res: Response): Promise<void>;
    getUsers(req: Request, res: Response): Promise<void>;
    verifyIdentity(req: Request, res: Response): Promise<void>;
    toggleBlock(req: Request, res: Response): Promise<void>;
    getRevenue(req: Request, res: Response): Promise<void>;
    getReports(req: Request, res: Response): Promise<void>;
    updateReportStatus(req: Request, res: Response): Promise<void>;
    warnReportedUser(req: Request, res: Response): Promise<void>;
}
