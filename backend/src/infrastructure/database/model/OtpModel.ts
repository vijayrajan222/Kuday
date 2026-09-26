import mongoose from "mongoose";


const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 600 // Automatic Mongodb TTL index deltes document after 10 minutes
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})


export const otpModel = mongoose.model("Otp" , otpSchema)
//to create a model it needs a name and a structure/schema 