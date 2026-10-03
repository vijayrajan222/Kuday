import mongoose, { Schema, Document } from "mongoose";

export interface ISeekerPreferenceDocument extends Document {
    userId: string;
    preferredLocation: string;
    maxBudget: number;
    roomTypePreference: string;
    requiredAmenities: string[];
}

const SeekerPreferenceSchema = new Schema<ISeekerPreferenceDocument>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        preferredLocation: { type: String, required: true },
        maxBudget: { type: Number, required: true },
        roomTypePreference: { type: String, required: true },
        requiredAmenities: [{ type: String }],
    },
    { timestamps: true }
);

export const SeekerPreferenceModel = mongoose.model<ISeekerPreferenceDocument>(
    "SeekerPreference",
    SeekerPreferenceSchema
);
