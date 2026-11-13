import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository.js";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository.js";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository.js";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity.js";
import type {
    IGetActiveSubscriptionUseCase,
    ActiveSubscriptionDetails,
} from "@application/interfaces/use-case/subscription/IGetActiveSubscriptionUseCase.js";
import { REFUND_WINDOW_DAYS } from "./CancelSubscriptionUseCase.js";

export type { ActiveSubscriptionDetails };

export class GetActiveSubscriptionUseCase implements IGetActiveSubscriptionUseCase {
    constructor(
        private readonly subRepo: ISubscriptionRepository,
        private readonly planRepo: IPlanRepository,
        private readonly paymentRepo: IPaymentRepository
    ) {}

    async execute(userId: string): Promise<ActiveSubscriptionDetails> {
        const sub = await this.subRepo.findActiveByUserId(userId);
        if (!sub) {
            return {
                subscription: null,
                plan: null,
                remainingDays: 0,
                estimatedRefund: 0,
                isFullRefundEligible: false,
                isRefundEligible: false,
            };
        }

        const plan = await this.planRepo.findById(sub.planId);
        let paidAmount = plan?.price || 0;
        if (sub.paymentId) {
            const payment = await this.paymentRepo.findById(sub.paymentId);
            if (payment && Number.isInteger(payment.amount) && payment.amount > 0) {
                paidAmount = payment.amount;
            }
        }

        const now = new Date();
        const startDate = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt || now);
        const endDate = sub.endDate
            ? new Date(sub.endDate)
            : new Date(startDate.getTime() + (plan?.durationDays || 30) * 24 * 60 * 60 * 1000);

        const remainingMs = Math.max(0, endDate.getTime() - now.getTime());
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

        // Rule 7 Eligibility Check:
        // Eligible only if now < purchasedAt + REFUND_WINDOW_DAYS (default 3) AND subscription.benefitsUsedAt is null
        const purchasedAt = sub.purchasedAt
            ? new Date(sub.purchasedAt)
            : sub.startDate
            ? new Date(sub.startDate)
            : new Date(sub.createdAt || now);

        const refundWindowMs = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        const withinWindow = now.getTime() < purchasedAt.getTime() + refundWindowMs;
        const benefitsNotUsed = sub.benefitsUsedAt === null || sub.benefitsUsedAt === undefined;

        const isRefundEligible = withinWindow && benefitsNotUsed && sub.status === "active";

        return {
            subscription: sub,
            plan: plan
                ? {
                      id: plan.id,
                      name: plan.name,
                      price: plan.price,
                      durationDays: plan.durationDays,
                  }
                : null,
            remainingDays,
            estimatedRefund: isRefundEligible ? paidAmount : 0,
            isFullRefundEligible: isRefundEligible,
            isRefundEligible,
        };
    }
}
