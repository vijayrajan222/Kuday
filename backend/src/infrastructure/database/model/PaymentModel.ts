import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const paymentSchema = new mongoose.Schema(
    {
        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            sparse: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v > 0,
                message: "Amount must be a positive integer in paise",
            },
        },
        status: {
            type: String,
            enum: ["created", "authorized", "captured", "failed", "refunded"],
            default: "created",
            index: true,
        },
        purpose: {
            type: String,
            enum: ["premium", "wallet_topup"],
            default: "premium",
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "plan",
        },
        idempotencyKey: {
            type: String,
            sparse: true,
            unique: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String,
        },
        errorReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

export type PaymentDoc = HydratedDocument<InferSchemaType<typeof paymentSchema>>;
export const paymentModel = mongoose.model<PaymentDoc>("payment", paymentSchema);
