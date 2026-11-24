import type { SubscriptionEntity } from "@domain/entities/SubscriptionEntity";
import type { RetryRefundDto } from "@application/dto/subscription/SubscriptionDto";

export type { RetryRefundDto };

export interface IRetryRefundUseCase {
    execute(dto: RetryRefundDto): Promise<SubscriptionEntity>;
    execute(subscriptionId: string, userId: string): Promise<SubscriptionEntity>;
    execute(dtoOrSubId: RetryRefundDto | string, userId?: string): Promise<SubscriptionEntity>;
}
