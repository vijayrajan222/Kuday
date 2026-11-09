export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired';

export interface SubscriptionEntity {
    id: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    paymentId?: string | undefined;
    cancelledAt?: Date | undefined;
    refundAmount?: number | undefined; // Integer in paise
    refundStatus?: 'none' | 'pending' | 'completed' | 'failed' | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}
