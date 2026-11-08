import type { Request, Response } from "express";

export interface IInterestController {
    sendInterest(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    getReceivedInterests(req: Request, res: Response): Promise<void>;
    getSentInterests(req: Request, res: Response): Promise<void>;
}
