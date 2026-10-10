import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 600 // Automatic Mongodb TTL index deletes document after 10 minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export type OtpDoc = HydratedDocument<InferSchemaType<typeof otpSchema>>;

export const otpModel = mongoose.model<OtpDoc>("Otp", otpSchema);