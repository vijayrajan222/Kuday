import type {
    ActiveSubscriptionDetailsDto,
    ActiveSubscriptionDetails,
} from "@application/dto/subscription/SubscriptionDto";

export type { ActiveSubscriptionDetails, ActiveSubscriptionDetailsDto };

export interface IGetActiveSubscriptionUseCase {
    execute(userId: string): Promise<ActiveSubscriptionDetailsDto>;
}
