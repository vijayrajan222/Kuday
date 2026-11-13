import type { ClientSession } from "mongoose";
import type { IPaymentRepository } from "@application/interfaces/repository/IPaymentRepository";
import type { PaymentEntity, PaymentStatus } from "@domain/entities/PaymentEntity";
import { paymentModel, type PaymentDoc } from "@infrastructure/database/model/PaymentModel";

export class MongoPaymentRepository implements IPaymentRepository {
    private mapToEntity(doc: PaymentDoc): PaymentEntity {
        return {
            id: doc._id.toString(),
            razorpayOrderId: doc.razorpayOrderId,
            razorpayPaymentId: doc.razorpayPaymentId ?? undefined,
            amount: doc.amount,
            status: doc.status as PaymentStatus,
            purpose: (doc.purpose as "premium" | "wallet_topup") ?? "premium",
            userId: doc.userId.toString(),
            planId: doc.planId ? doc.planId.toString() : undefined,
            idempotencyKey: doc.idempotencyKey ?? undefined,
            currency: doc.currency ?? "INR",
            method: doc.method ?? undefined,
            errorReason: doc.errorReason ?? undefined,
            createdAt: doc.createdAt ?? undefined,
            updatedAt: doc.updatedAt ?? undefined,
        };
    }

    async create(
        data: Omit<PaymentEntity, "id" | "createdAt" | "updatedAt">,
        session?: unknown
    ): Promise<PaymentEntity> {
        const payload: Record<string, unknown> = {
            razorpayOrderId: data.razorpayOrderId,
            amount: data.amount,
            status: data.status,
            purpose: data.purpose || (data.planId ? "premium" : "wallet_topup"),
            userId: data.userId,
            currency: data.currency || "INR",
        };
        if (data.razorpayPaymentId) payload.razorpayPaymentId = data.razorpayPaymentId;
        if (data.planId) payload.planId = data.planId;
        if (data.idempotencyKey) payload.idempotencyKey = data.idempotencyKey;
        if (data.method) payload.method = data.method;
        if (data.errorReason) payload.errorReason = data.errorReason;

        const created = await paymentModel.create([payload as never], {
            session: (session as ClientSession) || undefined,
        });
        const first = created[0];
        if (!first) throw new Error("Failed to create payment record");
        return this.mapToEntity(first);
    }

    async findById(id: string, session?: unknown): Promise<PaymentEntity | null> {
        const doc = await paymentModel
            .findById(id)
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByRazorpayOrderId(orderId: string, session?: unknown): Promise<PaymentEntity | null> {
        const doc = await paymentModel
            .findOne({ razorpayOrderId: orderId })
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByRazorpayPaymentId(paymentId: string, session?: unknown): Promise<PaymentEntity | null> {
        const doc = await paymentModel
            .findOne({ razorpayPaymentId: paymentId })
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async findByIdempotencyKey(key: string, session?: unknown): Promise<PaymentEntity | null> {
        const doc = await paymentModel
            .findOne({ idempotencyKey: key })
            .session((session as ClientSession) || null)
            .exec();
        return doc ? this.mapToEntity(doc) : null;
    }

    async updateStatus(
        id: string,
        status: PaymentStatus,
        extra?: { razorpayPaymentId?: string; errorReason?: string; method?: string },
        session?: unknown
    ): Promise<PaymentEntity | null> {
        const doc = await paymentModel
            .findByIdAndUpdate(
                id,
                {
                    status,
                    ...(extra?.razorpayPaymentId && { razorpayPaymentId: extra.razorpayPaymentId }),
                    ...(extra?.errorReason && { errorReason: extra.errorReason }),
                    ...(extra?.method && { method: extra.method }),
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
