import type { PaymentEntity, PaymentStatus } from "@domain/entities/PaymentEntity";

export interface IPaymentRepository {
    create(
        data: Omit<PaymentEntity, "id" | "createdAt" | "updatedAt">,
        session?: unknown
    ): Promise<PaymentEntity>;
    findById(id: string, session?: unknown): Promise<PaymentEntity | null>;
    findByRazorpayOrderId(orderId: string, session?: unknown): Promise<PaymentEntity | null>;
    findByRazorpayPaymentId(paymentId: string, session?: unknown): Promise<PaymentEntity | null>;
    findByIdempotencyKey(key: string, session?: unknown): Promise<PaymentEntity | null>;
    updateStatus(
        id: string,
        status: PaymentStatus,
        extra?: { razorpayPaymentId?: string; errorReason?: string; method?: string },
        session?: unknown
    ): Promise<PaymentEntity | null>;
}
