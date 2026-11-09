import mongoose, { type ClientSession } from "mongoose";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { IUserRepository } from "@application/interfaces/repository/IUserRepository";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

// Full refund window: 3 days grace period
export const FULL_REFUND_WINDOW_DAYS = 3;

export interface CancelSubscriptionInput {
    userId: string;
    subscriptionId: string;
    cancellationReason?: string | undefined;
}

export interface CancelSubscriptionOutput {
    subscription: SubscriptionEntity;
    refundAmount: number; // in paise
    isFullRefund: boolean;
    refundStatus: string;
}

export class CancelSubscriptionUseCase {
    constructor(
        private readonly subRepo: ISubscriptionRepository,
        private readonly planRepo: IPlanRepository,
        private readonly paymentRepo: IPaymentRepository,
        private readonly userRepo: IUserRepository,
        private readonly walletService: IWalletService
    ) {}

    async execute(input: CancelSubscriptionInput): Promise<CancelSubscriptionOutput> {
        const { userId, subscriptionId } = input;

        // 1. Fetch Subscription
        const sub = await this.subRepo.findById(subscriptionId);
        if (!sub) {
            throw new AppError("Subscription not found", HttpStatusCodes.NOT_FOUND);
        }
        if (sub.userId !== userId) {
            throw new AppError("Unauthorized cancellation request", HttpStatusCodes.FORBIDDEN);
        }

        // 2. Edge Case: Double Cancel
        if (sub.status === "cancelled") {
            throw new AppError("Subscription has already been cancelled", HttpStatusCodes.BAD_REQUEST);
        }

        // 3. Edge Case: Cancel Expired Subscription
        const now = new Date();
        if (sub.status === "expired" || (sub.endDate && sub.endDate <= now)) {
            throw new AppError("Subscription has already expired and cannot be cancelled", HttpStatusCodes.BAD_REQUEST);
        }

        if (sub.status !== "active") {
            throw new AppError(`Cannot cancel subscription in '${sub.status}' state`, HttpStatusCodes.BAD_REQUEST);
        }

        // 4. Fetch Associated Plan & Payment to determine paid amount
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

        // 5. Calculate Prorated Refund Amount (Integer Paise)
        const startDate = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt || now);
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

        const totalDurationMs = Math.max(1, endDate.getTime() - startDate.getTime());
        const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
        const remainingMs = Math.max(0, endDate.getTime() - now.getTime());

        const fullRefundWindowMs = FULL_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        let refundAmount = 0;
        let isFullRefund = false;

        // Rule: Full refund within [X] days (3 days)
        if (elapsedMs <= fullRefundWindowMs) {
            refundAmount = paidAmount;
            isFullRefund = true;
        } else if (remainingMs > 0) {
            // Prorated by unused days: (remaining / total) * paidAmount
            const prorated = Math.floor((remainingMs / totalDurationMs) * paidAmount);
            // Cap at amount paid and non-negative
            refundAmount = Math.min(paidAmount, Math.max(0, prorated));
        }

        console.log(
            `[Subscription] Cancellation requested for sub ${sub.id}: Total: ${paidAmount} paise, Refund: ${refundAmount} paise (Full: ${isFullRefund})`
        );

        // 6. Atomic Execution inside one MongoDB transaction
        const session: ClientSession = await mongoose.startSession();
        let updatedSub!: SubscriptionEntity;

        try {
            await session.withTransaction(async () => {
                // a. Transition subscription to cancelled
                const resSub = await this.subRepo.updateStatus(
                    sub.id,
                    "cancelled",
                    {
                        cancelledAt: now,
                        refundAmount,
                        refundStatus: refundAmount > 0 ? "completed" : "none",
                    },
                    session
                );
                if (!resSub) {
                    throw new AppError("Failed to update subscription status", HttpStatusCodes.INTERNAL_SERVER_ERROR);
                }
                updatedSub = resSub;

                // b. Refund to wallet (mandatory ledger entry in same session)
                if (refundAmount > 0) {
                    await this.walletService.credit(
                        {
                            userId,
                            amount: refundAmount,
                            reason: "refund",
                            referenceId: sub.id,
                            description: isFullRefund
                                ? `Full refund for cancelled ${plan.name}`
                                : `Prorated refund for cancelled ${plan.name} (${Math.round((remainingMs / totalDurationMs) * 100)}% unused)`,
                        },
                        session
                    );
                }

                // c. Revoke user's premium badge
                await this.userRepo.updateUser(
                    userId,
                    {
                        isPremium: false,
                        premiumExpiresAt: undefined,
                    },
                    session
                );
            });

            console.log(`[Subscription] Subscription ${sub.id} cancelled. Refunded ${refundAmount} paise to wallet.`);

            return {
                subscription: updatedSub,
                refundAmount,
                isFullRefund,
                refundStatus: updatedSub.refundStatus || "none",
            };
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            // Fallback for non-replica set local dev MongoDB
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                const resSub = await this.subRepo.updateStatus(sub.id, "cancelled", {
                    cancelledAt: now,
                    refundAmount,
                    refundStatus: refundAmount > 0 ? "completed" : "none",
                });
                updatedSub = resSub!;

                if (refundAmount > 0) {
                    await this.walletService.credit({
                        userId,
                        amount: refundAmount,
                        reason: "refund",
                        referenceId: sub.id,
                        description: `Refund for cancelled ${plan.name}`,
                    });
                }

                await this.userRepo.updateUser(userId, {
                    isPremium: false,
                    premiumExpiresAt: undefined,
                });

                return {
                    subscription: updatedSub,
                    refundAmount,
                    isFullRefund,
                    refundStatus: updatedSub.refundStatus || "none",
                };
            }

            // Mark refund_failed if an unexpected error occurred so user/admin can retry
            console.error(`[Subscription] Cancellation error: ${msg}. Marking refund_failed.`);
            await this.subRepo.updateStatus(sub.id, "cancelled", {
                cancelledAt: now,
                refundAmount,
                refundStatus: "failed",
            });
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
