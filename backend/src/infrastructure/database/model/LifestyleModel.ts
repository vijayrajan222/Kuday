import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const lifestyleSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            unique: true,
        },
        smoking: { type: String, required: true },
        drinking: { type: String, required: true },
        sleepSchedule: { type: String, required: true },
        diet: { type: String, required: true },
        cleanliness: { type: String, required: true },
        visitorPolicy: { type: String, required: true },
        roommateGenderPref: { type: String, required: true },
    },
    { timestamps: true }
);

export type LifestyleDoc = HydratedDocument<InferSchemaType<typeof lifestyleSchema>>;

export const LifestyleModel = mongoose.model<LifestyleDoc>("lifestyle", lifestyleSchema);
