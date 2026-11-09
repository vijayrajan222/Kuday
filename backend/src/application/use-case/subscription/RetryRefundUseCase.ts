import mongoose, { type ClientSession } from "mongoose";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IWalletService } from "@application/interfaces/services/IWalletService";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import { AppError } from "@application/errors/AppError";
import { HttpStatusCodes } from "@presentation/utils/HttpStatusCodes";

export class RetryRefundUseCase {
    constructor(
        private readonly subRepo: ISubscriptionRepository,
        private readonly walletService: IWalletService
    ) {}

    async execute(subscriptionId: string, userId: string): Promise<SubscriptionEntity> {
        const sub = await this.subRepo.findById(subscriptionId);
        if (!sub) {
            throw new AppError("Subscription not found", HttpStatusCodes.NOT_FOUND);
        }
        if (sub.userId !== userId) {
            throw new AppError("Unauthorized retry request", HttpStatusCodes.FORBIDDEN);
        }

        if (sub.refundStatus !== "failed") {
            throw new AppError(
                `Refund status is '${sub.refundStatus}'. Retry only applicable for 'failed' refunds`,
                HttpStatusCodes.BAD_REQUEST
            );
        }

        const refundAmount = sub.refundAmount || 0;
        if (refundAmount <= 0) {
            const updated = await this.subRepo.updateStatus(sub.id, sub.status, { refundStatus: "none" });
            return updated!;
        }

        const session: ClientSession = await mongoose.startSession();
        let updatedSub!: SubscriptionEntity;

        try {
            await session.withTransaction(async () => {
                await this.walletService.credit(
                    {
                        userId,
                        amount: refundAmount,
                        reason: "refund",
                        referenceId: sub.id,
                        description: `Retried refund credit for subscription ${sub.id}`,
                    },
                    session
                );

                const res = await this.subRepo.updateStatus(
                    sub.id,
                    sub.status,
                    { refundStatus: "completed" },
                    session
                );
                updatedSub = res!;
            });

            console.log(`[Subscription] Retry refund successful for subscription ${sub.id}: ${refundAmount} paise credited.`);
            return updatedSub;
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "";
            if (msg.includes("replica set") || msg.includes("Transaction numbers are only allowed")) {
                await this.walletService.credit({
                    userId,
                    amount: refundAmount,
                    reason: "refund",
                    referenceId: sub.id,
                    description: `Retried refund credit for subscription ${sub.id}`,
                });
                const res = await this.subRepo.updateStatus(sub.id, sub.status, { refundStatus: "completed" });
                return res!;
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
