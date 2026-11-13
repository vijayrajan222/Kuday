import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

export interface VerifyPaymentInput {
    userId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export interface VerifyPaymentOutput {
    success: boolean;
    orderId: string;
    paymentId: string;
    amount: number;
    status: string;
    alreadyProcessed?: boolean | undefined;
    subscription?: SubscriptionEntity | undefined;
}

export interface IVerifyPaymentUseCase {
    execute(input: VerifyPaymentInput): Promise<VerifyPaymentOutput>;
}
