import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

export interface ActivateFromPaymentInput {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    method?: string | undefined;
}

export interface ActivateFromWalletInput {
    userId: string;
    planId: string;
}

export interface IActivateSubscriptionUseCase {
    activateFromPayment(input: ActivateFromPaymentInput): Promise<SubscriptionEntity>;
    activateFromWallet(input: ActivateFromWalletInput): Promise<SubscriptionEntity>;
}
