import mongoose, { Schema, Document } from "mongoose";

export interface INotificationDocument extends Document {
    userId: string;
    title: string;
    message: string;
    type: "admin_verification" | "interest_request" | "system";
    isRead: boolean;
}

const NotificationSchema = new Schema<INotificationDocument>(
    {
        userId: { type: String, required: true, index: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ["admin_verification", "interest_request", "system"],
            default: "system",
        },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const NotificationModel = mongoose.model<INotificationDocument>(
    "Notification",
    NotificationSchema
);
