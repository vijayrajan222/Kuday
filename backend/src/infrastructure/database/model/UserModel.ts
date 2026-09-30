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
});

export const userModel = mongoose.model("user", userSchema);