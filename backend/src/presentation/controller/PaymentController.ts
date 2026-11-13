import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "@presentation/middleware/AuthMiddleware";
import type { IPaymentController } from "@presentation/interface/IPaymentController";
import type { ICreateOrderUseCase } from "@application/interfaces/use-case/payment/ICreateOrderUseCase";
import type { IVerifyPaymentUseCase } from "@application/interfaces/use-case/payment/IVerifyPaymentUseCase";
import type { IGetPlansUseCase } from "@application/interfaces/use-case/payment/IGetPlansUseCase";
import type { IHandleWebhookUseCase } from "@application/interfaces/use-case/payment/IHandleWebhookUseCase";
import type { ICreateTopUpOrderUseCase } from "@application/interfaces/use-case/payment/ICreateTopUpOrderUseCase";
import type { IActivateSubscriptionUseCase } from "@application/interfaces/use-case/subscription/IActivateSubscriptionUseCase";
import type { ICancelSubscriptionUseCase } from "@application/interfaces/use-case/subscription/ICancelSubscriptionUseCase";
import type { IRetryRefundUseCase } from "@application/interfaces/use-case/subscription/IRetryRefundUseCase";
import type { IGetActiveSubscriptionUseCase } from "@application/interfaces/use-case/subscription/IGetActiveSubscriptionUseCase";
import type { IGetWalletUseCase } from "@application/interfaces/use-case/wallet/IGetWalletUseCase";
import type { IRazorpayService } from "@application/interfaces/services/IRazorpayService";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";
import { ApiResponse } from "@presentation/utils/ApiResponse";

export class PaymentController implements IPaymentController {
    constructor(
        private readonly createOrderUseCase: ICreateOrderUseCase,
        private readonly verifyPaymentUseCase: IVerifyPaymentUseCase,
        private readonly getPlansUseCase: IGetPlansUseCase,
        private readonly razorpayService: IRazorpayService,
        private readonly handleWebhookUseCase?: IHandleWebhookUseCase,
        private readonly cancelSubscriptionUseCase?: ICancelSubscriptionUseCase,
        private readonly retryRefundUseCase?: IRetryRefundUseCase,
        private readonly getActiveSubscriptionUseCase?: IGetActiveSubscriptionUseCase,
        private readonly getWalletUseCase?: IGetWalletUseCase,
        private readonly activateSubscriptionUseCase?: IActivateSubscriptionUseCase,
        private readonly createTopUpOrderUseCase?: ICreateTopUpOrderUseCase
    ) {}

    createOrder = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const { planId, idempotencyKey } = req.body as {
                planId: string;
                idempotencyKey?: string;
            };

            if (!planId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("planId is required")
                );
                return;
            }

            const result = await this.createOrderUseCase.execute({
                userId,
                planId,
                idempotencyKey,
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(result, "Payment order created successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    verifyPayment = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
                razorpayOrderId: string;
                razorpayPaymentId: string;
                razorpaySignature: string;
            };

            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("razorpayOrderId, razorpayPaymentId, and razorpaySignature are required")
                );
                return;
            }

            const result = await this.verifyPaymentUseCase.execute({
                userId,
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Payment verified successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    getPlans = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const audience = typeof req.query.audience === "string" ? req.query.audience : undefined;
            const plans = await this.getPlansUseCase.execute(audience);
            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(plans, "Active plans retrieved successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    getConfig = async (
        _req: AuthenticatedRequest,
        res: Response
    ): Promise<void> => {
        res.status(HttpStatusCodes.OK).json(
            ApiResponse.success(
                { keyId: this.razorpayService.getKeyId() },
                "Payment configuration retrieved"
            )
        );
    };

    handleWebhook = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const signature = req.headers["x-razorpay-signature"] as string;
            const rawBody = (req as any).rawBody || JSON.stringify(req.body);

            if (!signature) {
                res.status(HttpStatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Missing x-razorpay-signature header",
                });
                return;
            }

            if (!this.handleWebhookUseCase) {
                res.status(HttpStatusCodes.OK).json({ status: "acknowledged_no_handler" });
                return;
            }

            const result = await this.handleWebhookUseCase.execute({
                rawBody,
                signature,
                eventPayload: req.body,
            });

            res.status(HttpStatusCodes.OK).json({
                success: true,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    };

    cancelSubscription = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const subscriptionId = req.params.id as string;
            const { cancellationReason } = req.body as { cancellationReason?: string };

            if (!this.cancelSubscriptionUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Cancel subscription use-case not initialized")
                );
                return;
            }

            const result = await this.cancelSubscriptionUseCase.execute({
                userId,
                subscriptionId,
                reason: cancellationReason,
            });

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Subscription refunded successfully. Full refund credited to wallet.")
            );
        } catch (error) {
            next(error);
        }
    };

    requestRefund = this.cancelSubscription;

    retryRefund = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const subscriptionId = req.params.id as string;

            if (!this.retryRefundUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Retry refund use-case not initialized")
                );
                return;
            }

            const result = await this.retryRefundUseCase.execute(subscriptionId, userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Refund retried successfully")
            );
        } catch (error) {
            next(error);
        }
    };

    getActiveSubscription = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            if (!this.getActiveSubscriptionUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Get active subscription use-case not initialized")
                );
                return;
            }

            const result = await this.getActiveSubscriptionUseCase.execute(userId);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Active subscription retrieved")
            );
        } catch (error) {
            next(error);
        }
    };

    getWallet = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const limit = Number(req.query.limit) || 20;
            const skip = Number(req.query.skip) || 0;

            if (!this.getWalletUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Get wallet use-case not initialized")
                );
                return;
            }

            const result = await this.getWalletUseCase.execute(userId, limit, skip);

            res.status(HttpStatusCodes.OK).json(
                ApiResponse.success(result, "Wallet details and transaction history retrieved")
            );
        } catch (error) {
            next(error);
        }
    };

    payWithWallet = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const { planId } = req.body as { planId: string };
            if (!planId) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("planId is required")
                );
                return;
            }

            if (!this.activateSubscriptionUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Activate subscription use-case not initialized")
                );
                return;
            }

            const subscription = await this.activateSubscriptionUseCase.activateFromWallet({
                userId,
                planId,
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(
                    subscription,
                    "Premium membership activated successfully using wallet balance"
                )
            );
        } catch (error) {
            next(error);
        }
    };

    createTopUpOrder = async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(HttpStatusCodes.UNAUTHORIZED).json(
                    ApiResponse.error("Authentication required")
                );
                return;
            }

            const { amountPaise, amount, idempotencyKey } = req.body as {
                amountPaise?: number;
                amount?: number;
                idempotencyKey?: string;
            };

            // Accept either integer paise or rupee amount
            const resolvedPaise = amountPaise ?? (amount ? Math.round(Number(amount) * 100) : 0);

            if (!resolvedPaise || resolvedPaise < 1000) {
                res.status(HttpStatusCodes.BAD_REQUEST).json(
                    ApiResponse.error("Top-up amount must be at least ₹10 (1000 paise)")
                );
                return;
            }

            if (!this.createTopUpOrderUseCase) {
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
                    ApiResponse.error("Top-up use-case not initialized")
                );
                return;
            }

            const result = await this.createTopUpOrderUseCase.execute({
                userId,
                amountPaise: resolvedPaise,
                idempotencyKey,
            });

            res.status(HttpStatusCodes.CREATED).json(
                ApiResponse.success(result, "Wallet top-up order created successfully")
            );
        } catch (error) {
            next(error);
        }
    };
}
