import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@presentation/middleware/AuthMiddleware";

export interface IAgreementController {
    createOrGet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    checkUnlock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    proposeTerms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    respondTerms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    draftClause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    proposeClause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    respondClause(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createPaymentOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    sign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
