export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface PaymentEntity {
    id: string;
    razorpayOrderId: string;
    razorpayPaymentId?: string | undefined;
    amount: number; // Integer in paise
    status: PaymentStatus;
    userId: string;
    idempotencyKey?: string | undefined;
    planId?: string | undefined;
    currency?: string | undefined;
    method?: string | undefined;
    errorReason?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
