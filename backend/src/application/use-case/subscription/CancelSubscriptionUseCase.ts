import mongoose, { type ClientSession } from "mongoose";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository.js";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository.js";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository.js";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository.js";
import type { IWalletService } from "@application/interfaces/services/IWalletService.js";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity.js";
import { AppError } from "@application/errors/AppError.js";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes.js";

// Refund window: 3 days grace period (configurable via env, default 3)
export const REFUND_WINDOW_DAYS = Number(process.env.REFUND_WINDOW_DAYS) || 3;
export const FULL_REFUND_WINDOW_DAYS = REFUND_WINDOW_DAYS; // Alias for backwards compatibility

export interface RequestRefundInput {
    userId: string;
    subscriptionId: string;
    reason?: string | undefined;
}

// Alias for backwards compatibility
export type CancelSubscriptionInput = RequestRefundInput;

export interface RequestRefundOutput {
    subscription: SubscriptionEntity;
    refundAmount: number; // in paise
    isFullRefund: boolean;
    refundStatus: string;
}

export type CancelSubscriptionOutput = RequestRefundOutput;

export class RequestRefundUseCase {
    constructor(
        private readonly subRepo: ISubscriptionRepository,
        private readonly planRepo: IPlanRepository,
        private readonly paymentRepo: IPaymentRepository,
        private readonly userRepo: IUserRepository,
        private readonly walletService: IWalletService
    ) {}

    async execute(input: RequestRefundInput): Promise<RequestRefundOutput> {
        const { userId, subscriptionId, reason } = input;

        // 1. Fetch Subscription
        const sub = await this.subRepo.findById(subscriptionId);
        if (!sub) {
            throw new AppError("Subscription not found", HttpStatusCodes.NOT_FOUND);
        }
        if (sub.userId !== userId) {
            throw new AppError("Unauthorized refund request", HttpStatusCodes.FORBIDDEN);
        }

        // 2. Double Refund / Already Cancelled Defense
        if (sub.status === "refunded" || sub.status === "cancelled") {
            throw new AppError("Subscription has already been refunded", HttpStatusCodes.BAD_REQUEST);
        }

        // 3. Expiry Defense
        const now = new Date();
        if (sub.status === "expired" || (sub.endDate && new Date(sub.endDate) <= now)) {
            throw new AppError("Subscription has already expired and cannot be refunded", HttpStatusCodes.BAD_REQUEST);
        }

        if (sub.status !== "active") {
            throw new AppError(`Cannot refund subscription in '${sub.status}' state`, HttpStatusCodes.BAD_REQUEST);
        }

        // 4. Rule 7 Condition A: benefitsUsedAt must be null
        if (sub.benefitsUsedAt !== null && sub.benefitsUsedAt !== undefined) {
            throw new AppError(
                "Refund is not permitted because premium benefits have already been used.",
                HttpStatusCodes.BAD_REQUEST
            );
        }

        // 5. Rule 7 Condition B: now < purchasedAt + REFUND_WINDOW_DAYS (default 3 days)
        const purchasedAt = sub.purchasedAt
            ? new Date(sub.purchasedAt)
            : sub.startDate
            ? new Date(sub.startDate)
            : new Date(sub.createdAt || now);

        const refundWindowMs = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        const elapsedMs = Math.max(0, now.getTime() - purchasedAt.getTime());

        if (elapsedMs > refundWindowMs) {
            throw new AppError(
                `Refund window has expired. Premium subscriptions can only be refunded within ${REFUND_WINDOW_DAYS} days of purchase.`,
                HttpStatusCodes.BAD_REQUEST
            );
        }

        // 6. Fetch Paid Amount (Capped at amount paid)
        const plan = await this.planRepo.findById(sub.planId);
        if (!plan) {
            throw new AppError("Associated plan not found", HttpStatusCodes.NOT_FOUND);
        }

        let paidAmount = plan.price;
        if (sub.paymentId) {
            const payment = await this.paymentRepo.findById(sub.paymentId);
            if (payment && Number.isInteger(payment.amount) && payment.amount > 0) {
                paidAmount = payment.amount;
            }
        }
        const refundAmount = paidAmount; // 100% full refund within window

        console.log(
            `[Refund] Requesting refund for sub ${subscriptionId} (User: ${userId}). Amount: ${refundAmount} paise (₹${refundAmount / 100})`
        );

        // 7. Atomic Execution inside one MongoDB transaction:
        // status -> refunded, user premium ends immediately, ledger credit (reason: premium_refund)
        const session: ClientSession = await mongoose.startSession();
        let updatedSub!: SubscriptionEntity;

        try {
            await session.withTransaction(async () => {
                // a. Transition Subscription to 'refunded'
                const res = await this.subRepo.updateStatus(
                    subscriptionId,
                    "refunded",
                    {
                        refundAmount,
                        refundStatus: "completed",
                        cancellationReason: reason || "User requested refund within 3-day window",
                        cancelledAt: now,
                    },
                    session
                );
                if (!res) throw new Error("Failed updating subscription status to refunded");
                updatedSub = res;

                // b. Credit User Wallet with reason 'premium_refund'
                await this.walletService.credit(
                    {
                        userId,
                        amount: refundAmount,
                        reason: "premium_refund",
                        referenceId: subscriptionId,
                        description: `Premium membership refund: ${plan.name}`,
                    },
                    session
                );

                // c. Immediately end premium status on user entity
                await this.userRepo.updateUser(
                    userId,
                    {
                        isPremium: false,
                        premiumExpiresAt: undefined,
                    },
                    session
                );
            });

            console.log(
                `[Refund] Successfully refunded sub ${subscriptionId}. ₹${refundAmount / 100} credited to wallet.`
            );

            return {
                subscription: updatedSub,
                refundAmount,
                isFullRefund: true,
                refundStatus: "completed",
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            // Fallback for non-replica set dev MongoDB
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                console.warn("[Refund] Running in non-replica set fallback");
                const res = await this.subRepo.updateStatus(subscriptionId, "refunded", {
                    refundAmount,
                    refundStatus: "completed",
                    cancellationReason: reason || "User requested refund within 3-day window",
                    cancelledAt: now,
                });
                updatedSub = res!;

                await this.walletService.credit({
                    userId,
                    amount: refundAmount,
                    reason: "premium_refund",
                    referenceId: subscriptionId,
                    description: `Premium membership refund: ${plan.name}`,
                });

                await this.userRepo.updateUser(userId, {
                    isPremium: false,
                    premiumExpiresAt: undefined,
                });

                return {
                    subscription: updatedSub,
                    refundAmount,
                    isFullRefund: true,
                    refundStatus: "completed",
                };
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

// Export under both names for Clean Architecture & backwards compatibility
export const CancelSubscriptionUseCase = RequestRefundUseCase;
