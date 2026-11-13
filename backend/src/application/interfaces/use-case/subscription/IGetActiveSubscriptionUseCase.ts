import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

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
    isRefundEligible: boolean;
}

export interface IGetActiveSubscriptionUseCase {
    execute(userId: string): Promise<ActiveSubscriptionDetails>;
}
