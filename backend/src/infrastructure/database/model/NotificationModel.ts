import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const NotificationSchema = new mongoose.Schema(
    {
        // Target Recipient
        userId: {
            type: String,
            required: true,
            index: true,
        },

        // Message Content
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },

        // Classification & Delivery
        type: {
            type: String,
            enum: ["admin_verification", "interest_request", "system", "chat_message"],
            default: "system",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export type NotificationDoc = HydratedDocument<
    InferSchemaType<typeof NotificationSchema>
>;

export const NotificationModel = mongoose.model<NotificationDoc>(
    "Notification",
    NotificationSchema
);
