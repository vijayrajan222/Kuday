import type { Request, Response, NextFunction } from "express";

export interface IVisitController {
    createVisit(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVisitsByConnection(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVisitsByUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateVisitStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    suggestVisitChanges(req: Request, res: Response, next: NextFunction): Promise<void>;
    acceptVisitSuggestion(req: Request, res: Response, next: NextFunction): Promise<void>;
}
