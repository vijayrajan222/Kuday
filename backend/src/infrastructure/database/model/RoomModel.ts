import mongoose, { Schema, Document } from "mongoose";

export interface IRoomDocument extends Document {
    hostId: string;
    title?: string;
    roomType: string;
    monthlyRent: number;
    location: string;
    capacity: number;
    availabilityNotes: string;
    amenities: string[];
    images: string[];
    description?: string;
}

const RoomSchema = new Schema<IRoomDocument>(
    {
        hostId: { type: String, required: true, index: true },
        title: { type: String },
        roomType: { type: String, required: true },
        monthlyRent: { type: Number, required: true },
        location: { type: String, required: true },
        capacity: { type: Number, required: true, default: 1 },
        availabilityNotes: { type: String, required: true },
        amenities: [{ type: String }],
        images: [{ type: String }],
        description: { type: String },
    },
    { timestamps: true }
);

export const RoomModel = mongoose.model<IRoomDocument>("Room", RoomSchema);
