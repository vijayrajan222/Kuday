import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@presentation/middleware/AuthMiddleware";

export interface IPaymentController {
    createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    verifyPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    getConfig(req: Request, res: Response, next: NextFunction): Promise<void>;
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
    cancelSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    requestRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    retryRefund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getActiveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    payWithWallet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createTopUpOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
