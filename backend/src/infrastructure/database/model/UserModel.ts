import mongoose from "mongoose";
import { lowercase } from "zod";

const userSchema = new mongoose.Schema({

    email:{
        type : String,
        required : true,
        unique : true,
        trim : true ,
        lowercase : true 
    },
    firstName :{
        type : String,
        required : true,
    },
    lastName :{
        type : String,
        required : true,
    },
    hashedPassword:{
        type : String,
        required : true,
    },
    isVerified:{
        type : Boolean,
        required : true,
        default :false
    },
    isBlocked:{
        type : Boolean,
        required : true,
        default: false 
    },
    otp:{
        type : Number,
    },
})

export const userModel = mongoose.model("user", userSchema);