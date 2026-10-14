import mongoose, {
    type HydratedDocument,
    type InferSchemaType,
} from "mongoose";

export const userSchema = new mongoose.Schema(
    {
        // Authentication
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        hashedPassword: {
            type: String,
            required: false,
            default: "",
        },
        otp: {
            type: Number,
        },

        // Personal Information
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: false,
            default: "",
        },
        dob: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            default: "",
        },
        occupation: {
            type: String,
            default: "",
        },
        bio: {
            type: String,
            default: "",
        },

        // Account Status
        isVerified: {
            type: Boolean,
            required: true,
            default: false,
        },
        isBlocked: {
            type: Boolean,
            required: true,
            default: false,
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        isOnboarded: {
            type: Boolean,
            default: false,
        },

        // Role Management
        role: {
            type: String,
            enum: ["host", "seeker", "admin", "none"],
            default: "none",
        },

        // Identity Verification
        idCardUrl: {
            type: String,
            default: "",
        },
        selfieUrl: {
            type: String,
            default: "",
        },
        identityVerified: {
            type: Boolean,
            default: false,
        },
        identityStatus: {
            type: String,
            enum: ["pending", "verified", "rejected", "none"],
            default: "none",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

export type UserDoc = HydratedDocument<
    InferSchemaType<typeof userSchema>
>;

export const userModel = mongoose.model<UserDoc>(
    "user",
    userSchema
);