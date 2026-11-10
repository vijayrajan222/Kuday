import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const MessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: String,
            required: true,
            index: true,
        },
        senderId: {
            type: String,
            required: true,
            index: true,
        },
        receiverId: {
            type: String,
            required: true,
            index: true,
        },
        content: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["text", "call"],
            default: "text",
            index: true,
        },
        callType: {
            type: String,
            enum: ["audio", "video"],
            required: false,
        },
        outcome: {
            type: String,
            enum: ["completed", "missed", "declined"],
            required: false,
        },
        startedAt: {
            type: Date,
            required: false,
        },
        endedAt: {
            type: Date,
            required: false,
        },
        durationSec: {
            type: Number,
            default: 0,
            required: false,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export type MessageDoc = HydratedDocument<
    InferSchemaType<typeof MessageSchema>
>;

export const MessageModel = mongoose.model<MessageDoc>(
    "Message",
    MessageSchema
);
