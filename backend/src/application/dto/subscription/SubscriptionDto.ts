import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

export interface ActivateFromPaymentDto {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    method?: string | undefined;
}

export interface ActivateFromWalletDto {
    userId: string;
    planId: string;
}

export interface CancelSubscriptionInputDto {
    userId: string;
    subscriptionId: string;
    reason?: string | undefined;
    cancellationReason?: string | undefined;
}

export interface CancelSubscriptionOutputDto {
    subscription: SubscriptionEntity;
    refundAmount: number; // in paise
    isFullRefund: boolean;
    refundStatus: string;
}

export interface ActiveSubscriptionDetailsDto {
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

export interface RetryRefundDto {
    subscriptionId: string;
    userId: string;
}

// Aliases for backwards compatibility
export type ActivateFromPaymentInput = ActivateFromPaymentDto;
export type ActivateFromWalletInput = ActivateFromWalletDto;
export type RequestRefundInput = CancelSubscriptionInputDto;
export type CancelSubscriptionInput = CancelSubscriptionInputDto;
export type RequestRefundOutput = CancelSubscriptionOutputDto;
export type CancelSubscriptionOutput = CancelSubscriptionOutputDto;
export type ActiveSubscriptionDetails = ActiveSubscriptionDetailsDto;
