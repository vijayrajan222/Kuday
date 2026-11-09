import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { IPlanRepository } from "@application/interfaces/repository/IPlanRepository";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import { FULL_REFUND_WINDOW_DAYS } from "./CancelSubscriptionUseCase";

export interface ActiveSubscriptionDetails {
    subscription: SubscriptionEntity | null;
    plan: {
        id: string;
        name: string;
        price: number;
        durationDays: number;
    } | null;
    remainingDays: number;
    estimatedRefund: number; // in paise
    isFullRefundEligible: boolean;
}

export class GetActiveSubscriptionUseCase {
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
        const endDate = sub.endDate ? new Date(sub.endDate) : new Date(startDate.getTime() + (plan?.durationDays || 30) * 24 * 60 * 60 * 1000);

        const totalDurationMs = Math.max(1, endDate.getTime() - startDate.getTime());
        const elapsedMs = Math.max(0, now.getTime() - startDate.getTime());
        const remainingMs = Math.max(0, endDate.getTime() - now.getTime());
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

        const fullRefundWindowMs = FULL_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
        let estimatedRefund = 0;
        let isFullRefundEligible = false;

        if (elapsedMs <= fullRefundWindowMs) {
            estimatedRefund = paidAmount;
            isFullRefundEligible = true;
        } else if (remainingMs > 0) {
            const prorated = Math.floor((remainingMs / totalDurationMs) * paidAmount);
            estimatedRefund = Math.min(paidAmount, Math.max(0, prorated));
        }

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
            estimatedRefund,
            isFullRefundEligible,
        };
    }
}
