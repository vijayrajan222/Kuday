import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const VisitSchema = new mongoose.Schema(
    {
        connectionId: {
            type: String,
            required: true,
            index: true,
        },
        seekerId: {
            type: String,
            required: true,
            index: true,
        },
        hostId: {
            type: String,
            required: true,
            index: true,
        },
        roomId: {
            type: String,
            default: "",
        },
        date: {
            type: String, // format: YYYY-MM-DD
            required: true,
        },
        timeSlot: {
            type: String,
            enum: ["morning", "afternoon", "evening"],
            required: true,
        },
        slotTime: {
            type: String,
            default: "02:00 PM",
        },
        message: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "rescheduled", "cancelled", "rejected", "completed"],
            default: "pending",
            index: true,
        },
        suggestedBy: {
            type: String,
            enum: ["seeker", "host"],
            default: "seeker",
        },
        suggestedDate: {
            type: String,
            default: "",
        },
        suggestedTimeSlot: {
            type: String,
            enum: ["morning", "afternoon", "evening", ""],
            default: "",
        },
        suggestedSlotTime: {
            type: String,
            default: "",
        },
        suggestedMessage: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for querying visits per user/connection
VisitSchema.index({ connectionId: 1, status: 1 });
VisitSchema.index({ seekerId: 1, hostId: 1 });

export type VisitDoc = HydratedDocument<
    InferSchemaType<typeof VisitSchema>
>;

export const VisitModel = mongoose.model<VisitDoc>(
    "Visit",
    VisitSchema
);
