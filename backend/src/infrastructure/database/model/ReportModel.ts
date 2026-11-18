import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const ReportSchema = new mongoose.Schema(
    {
        // Reporter User Reference
        reporterId: {
            type: String,
            required: true,
            index: true,
        },

        // Target Reported User Reference
        reportedUserId: {
            type: String,
            required: true,
            index: true,
        },

        // Reason Category
        reason: {
            type: String,
            required: true,
        },

        // Detailed Explanation / Message
        message: {
            type: String,
            required: true,
            trim: true,
        },

        // Optional Screenshot Proof Image URL (Cloudinary)
        screenshotUrl: {
            type: String,
            default: "",
        },

        // Review Status
        status: {
            type: String,
            enum: ["pending", "reviewed", "resolved", "dismissed"],
            default: "pending",
            index: true,
        },

        // Admin Review Notes
        adminNotes: {
            type: String,
            default: "",
        },

        // Moderation Warning Tracking
        warningIssued: {
            type: Boolean,
            default: false,
        },
        warningMessage: {
            type: String,
            default: "",
        },
        warningIssuedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export type ReportDoc = HydratedDocument<
    InferSchemaType<typeof ReportSchema>
>;

export const ReportModel = mongoose.model<ReportDoc>(
    "Report",
    ReportSchema
);
