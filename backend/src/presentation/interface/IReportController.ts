import type { Request, Response, NextFunction } from "express";

export interface IReportController {
    createReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    getReports(req: Request, res: Response, next: NextFunction): Promise<void>;
}
