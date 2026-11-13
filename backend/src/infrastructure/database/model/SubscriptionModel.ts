import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const subscriptionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "plan",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "refunded", "expired", "cancelled"],
            default: "pending",
            index: true,
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        purchasedAt: {
            type: Date,
            default: Date.now,
        },
        benefitsUsedAt: {
            type: Date,
            default: null,
        },
        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "payment",
        },
        cancelledAt: {
            type: Date,
        },
        cancellationReason: {
            type: String,
        },
        refundAmount: {
            type: Number,
            default: 0,
        },
        refundStatus: {
            type: String,
            enum: ["none", "pending", "completed", "failed"],
            default: "none",
        },
    },
    {
        timestamps: true,
    }
);

export type SubscriptionDoc = HydratedDocument<InferSchemaType<typeof subscriptionSchema>>;
export const subscriptionModel = mongoose.model<SubscriptionDoc>("subscription", subscriptionSchema);
