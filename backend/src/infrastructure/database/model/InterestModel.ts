import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const InterestSchema = new mongoose.Schema(
    {
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
        targetType: {
            type: String,
            enum: ["room", "seeker"],
            required: true,
        },
        targetId: {
            type: String,
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined"],
            default: "pending",
            index: true,
        },
        message: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to guarantee uniqueness per sender, receiver, and target
InterestSchema.index({ senderId: 1, receiverId: 1, targetId: 1 }, { unique: true });

export type InterestDoc = HydratedDocument<
    InferSchemaType<typeof InterestSchema>
>;

export const InterestModel = mongoose.model<InterestDoc>(
    "Interest",
    InterestSchema
);
