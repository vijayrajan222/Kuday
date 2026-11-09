import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const walletTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v > 0,
                message: "Amount must be a positive integer in paise",
            },
        },
        balanceAfter: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v >= 0,
                message: "balanceAfter must be a non-negative integer in paise",
            },
        },
        reason: {
            type: String,
            enum: ["topup", "premium_purchase", "refund"],
            required: true,
        },
        referenceId: {
            type: String,
            index: true,
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

export type WalletTransactionDoc = HydratedDocument<InferSchemaType<typeof walletTransactionSchema>>;
export const walletTransactionModel = mongoose.model<WalletTransactionDoc>(
    "wallet_transaction",
    walletTransactionSchema
);
