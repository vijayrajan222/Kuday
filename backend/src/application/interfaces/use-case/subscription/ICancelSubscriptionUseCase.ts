import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

export interface RequestRefundInput {
    userId: string;
    subscriptionId: string;
    reason?: string | undefined;
    cancellationReason?: string | undefined;
}

export type CancelSubscriptionInput = RequestRefundInput;

export interface RequestRefundOutput {
    subscription: SubscriptionEntity;
    refundAmount: number; // in paise
    isFullRefund: boolean;
    refundStatus: string;
}

export type CancelSubscriptionOutput = RequestRefundOutput;

export interface ICancelSubscriptionUseCase {
    execute(input: RequestRefundInput): Promise<RequestRefundOutput>;
}
