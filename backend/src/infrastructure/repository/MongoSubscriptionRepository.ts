import type { ClientSession } from "mongoose";
import type { ISubscriptionRepository } from "@application/interfaces/repository/ISubscriptionRepository";
import type { SubscriptionEntity, SubscriptionStatus } from "@domain/entities/SubscriptionEntity";
import {
    subscriptionModel,
    type SubscriptionDoc,
} from "@infrastructure/database/model/SubscriptionModel";

export class MongoSubscriptionRepository implements ISubscriptionRepository {
    private mapToEntity(doc: SubscriptionDoc): SubscriptionEntity {
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            planId: doc.planId.toString(),
            status: doc.status as SubscriptionStatus,
            startDate: doc.startDate ?? undefined,
            endDate: doc.endDate ?? undefined,
            purchasedAt: doc.purchasedAt ?? undefined,
            benefitsUsedAt: doc.benefitsUsedAt ?? null,
            paymentId: doc.paymentId ? doc.paymentId.toString() : undefined,
            cancelledAt: doc.cancelledAt ?? undefined,
            refundAmount: doc.refundAmount ?? 0,
            refundStatus: (doc.refundStatus as "none" | "pending" | "completed" | "failed") ?? "none",
            createdAt: doc.createdAt ?? undefined,
            updatedAt: doc.updatedAt ?? undefined,
        };
    }

    async create(
        data: Omit<SubscriptionEntity, "id" | "createdAt" | "updatedAt">,
        session?: unknown
    ): Promise<SubscriptionEntity> {
        const created = await subscriptionModel.create(
            [
                {
                    userId: data.userId,
                    planId: data.planId,
                    status: data.status,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    purchasedAt: data.purchasedAt || new Date(),
                    benefitsUsedAt: data.benefitsUsedAt ?? null,
                    paymentId: data.paymentId,
                    cancelledAt: data.cancelledAt,
                    refundAmount: data.refundAmount,
                    refundStatus: data.refundStatus,
                },
            ],
            { session: (session as ClientSession) || undefined }
        );
        return this.mapToEntity(created[0]);
    }

    async findById(id: string, session?: unknown): Promise<SubscriptionEntity | null> {
        const doc = await subscriptionModel
            .findById(id)
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findActiveByUserId(userId: string, session?: unknown): Promise<SubscriptionEntity | null> {
        const doc = await subscriptionModel
            .findOne({
                userId,
                status: "active",
                endDate: { $gt: new Date() },
            })
            .session((session as ClientSession) || null)
            .sort({ endDate: -1 })
            .exec();

        return doc ? this.mapToEntity(doc) : null;
    }

    async isHostPremium(userId: string, session?: unknown): Promise<boolean> {
        const sub = await this.findActiveByUserId(userId, session);
        return sub !== null;
    }

    async updateStatus(
        id: string,
        status: SubscriptionStatus,
        extra?: Partial<SubscriptionEntity>,
        session?: unknown
    ): Promise<SubscriptionEntity | null> {
        const doc = await subscriptionModel
            .findByIdAndUpdate(
                id,
                {
                    status,
                    ...extra,
                },
                {
                    returnDocument: "after",
                    session: (session as ClientSession) || undefined,
                }
            )
            .exec();

        return doc ? this.mapToEntity(doc) : null;
    }
}
