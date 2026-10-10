import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const SeekerPreferenceSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        preferredLocation: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        roomTypePreference: { type: String, required: true },
        requiredAmenities: [{ type: String }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export type SeekerPreferenceDoc = HydratedDocument<InferSchemaType<typeof SeekerPreferenceSchema>>;

export const SeekerPreferenceModel = mongoose.model<SeekerPreferenceDoc>(
    "SeekerPreference",
    SeekerPreferenceSchema
);
