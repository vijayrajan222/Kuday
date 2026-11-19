import type { Request, Response, NextFunction } from "express";

export interface IAgreementController {
    createOrGet(req: Request, res: Response, next: NextFunction): Promise<void>;
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
    acquireLock(req: Request, res: Response, next: NextFunction): Promise<void>;
    renewLockHeartbeat(req: Request, res: Response, next: NextFunction): Promise<void>;
    releaseLock(req: Request, res: Response, next: NextFunction): Promise<void>;
    submitProposal(req: Request, res: Response, next: NextFunction): Promise<void>;
    acceptProposal(req: Request, res: Response, next: NextFunction): Promise<void>;
    draftClause(req: Request, res: Response, next: NextFunction): Promise<void>;
    createPaymentOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
    verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void>;
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    getPdf(req: Request, res: Response, next: NextFunction): Promise<void>;
}
