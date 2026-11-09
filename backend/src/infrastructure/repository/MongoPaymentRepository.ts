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
        const created = await paymentModel.create(
            [
                {
                    razorpayOrderId: data.razorpayOrderId,
                    razorpayPaymentId: data.razorpayPaymentId,
                    amount: data.amount,
                    status: data.status,
                    purpose: data.purpose || (data.planId ? "premium" : "wallet_topup"),
                    userId: data.userId,
                    planId: data.planId,
                    idempotencyKey: data.idempotencyKey,
                    currency: data.currency || "INR",
                    method: data.method,
                    errorReason: data.errorReason,
                },
            ],
            { session: (session as ClientSession) || undefined }
        );
        return this.mapToEntity(created[0]);
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
