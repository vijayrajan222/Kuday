import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const SeekerPreferenceSchema = new mongoose.Schema(
    {
        // Seeker Reference
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        // Search Preferences
        preferredLocation: {
            type: String,
            required: true,
        },
        maxBudget: {
            type: Number,
            required: true,
        },
        roomTypePreference: {
            type: String,
            required: true,
        },
        requiredAmenities: [
            {
                type: String,
            },
        ],

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export type SeekerPreferenceDoc = HydratedDocument<
    InferSchemaType<typeof SeekerPreferenceSchema>
>;

export const SeekerPreferenceModel = mongoose.model<SeekerPreferenceDoc>(
    "SeekerPreference",
    SeekerPreferenceSchema
);
