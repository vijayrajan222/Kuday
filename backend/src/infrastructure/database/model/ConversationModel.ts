import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const ConversationSchema = new mongoose.Schema(
    {
        participants: {
            type: [String],
            required: true,
            index: true,
        },
        lastMessage: {
            content: {
                type: String,
                default: "",
            },
            senderId: {
                type: String,
                default: "",
            },
            createdAt: {
                type: String,
                default: "",
            },
        },
    },
    {
        timestamps: true,
    }
);

ConversationSchema.index({ participants: 1 });

export type ConversationDoc = HydratedDocument<
    InferSchemaType<typeof ConversationSchema>
>;

export const ConversationModel = mongoose.model<ConversationDoc>(
    "Conversation",
    ConversationSchema
);
