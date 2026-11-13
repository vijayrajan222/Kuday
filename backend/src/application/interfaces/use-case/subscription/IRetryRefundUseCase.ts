import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";

export interface IRetryRefundUseCase {
    execute(subscriptionId: string, userId: string): Promise<SubscriptionEntity>;
}
