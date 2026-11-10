import type { SubscriptionEntity, SubscriptionStatus } from "@domain/entities/SubscriptionEntity";

export interface ISubscriptionRepository {
    create(
        data: Omit<SubscriptionEntity, "id" | "createdAt" | "updatedAt">,
        session?: unknown
    ): Promise<SubscriptionEntity>;
    findById(id: string, session?: unknown): Promise<SubscriptionEntity | null>;
    findActiveByUserId(userId: string, session?: unknown): Promise<SubscriptionEntity | null>;
    isHostPremium(userId: string, session?: unknown): Promise<boolean>;
    updateStatus(
        id: string,
        status: SubscriptionStatus,
        extra?: Partial<SubscriptionEntity>,
        session?: unknown
    ): Promise<SubscriptionEntity | null>;
}
