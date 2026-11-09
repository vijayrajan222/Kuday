import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v > 0,
                message: "Price must be a positive integer (in paise)",
            },
        },
        durationDays: {
            type: Number,
            required: true,
            validate: {
                validator: (v: number) => Number.isInteger(v) && v > 0,
                message: "durationDays must be a positive integer",
            },
        },
        audience: {
            type: String,
            enum: ["host"],
            default: "host",
        },
        description: {
            type: String,
            default: "",
        },
        features: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

export type PlanDoc = HydratedDocument<InferSchemaType<typeof planSchema>>;
export const planModel = mongoose.model<PlanDoc>("plan", planSchema);
