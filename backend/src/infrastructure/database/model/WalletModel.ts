import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            unique: true,
            index: true,
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v >= 0,
                message: "Balance must be a non-negative integer (in paise)",
            },
        },
        version: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

export type WalletDoc = HydratedDocument<InferSchemaType<typeof walletSchema>>;
export const walletModel = mongoose.model<WalletDoc>("wallet", walletSchema);
