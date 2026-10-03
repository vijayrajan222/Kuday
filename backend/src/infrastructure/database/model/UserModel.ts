import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: false,
        default: "",
    },
    hashedPassword: {
        type: String,
        required: false,
        default: "",
    },
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
    otp: {
        type: Number,
    },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    occupation: { type: String, default: "" },
    bio: { type: String, default: "" },
    role: { type: String, enum: ["host", "seeker", "admin", "none"], default: "none" },
    isAdmin: { type: Boolean, default: false },
    isOnboarded: { type: Boolean, default: false },
    idCardUrl: { type: String, default: "" },
    selfieUrl: { type: String, default: "" },
    identityVerified: { type: Boolean, default: false },
    identityStatus: { type: String, enum: ["pending", "verified", "rejected", "none"], default: "none" },
    rejectionReason: { type: String, default: "" },
}, { timestamps: true });

export const userModel = mongoose.model("user", userSchema);