import mongoose, { Schema, Document } from "mongoose";

export interface ISeekerPreferenceDocument extends Document {
    userId: string;
    preferredLocation: string;
    maxBudget: number;
    roomTypePreference: string;
    requiredAmenities: string[];
    isActive?: boolean;
}

const SeekerPreferenceSchema = new Schema<ISeekerPreferenceDocument>(
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

export const SeekerPreferenceModel = mongoose.model<ISeekerPreferenceDocument>(
    "SeekerPreference",
    SeekerPreferenceSchema
);
