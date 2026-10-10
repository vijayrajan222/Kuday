import mongoose, { type HydratedDocument, type InferSchemaType } from "mongoose";

export const RoomSchema = new mongoose.Schema(
    {
        hostId: { type: String, required: true, index: true },
        title: { type: String, default: "" },
        roomType: { type: String, required: true },
        monthlyRent: { type: Number, required: true },
        location: { type: String, required: true },
        capacity: { type: Number, required: true, default: 1 },
        availabilityNotes: { type: String, required: true },
        amenities: [{ type: String }],
        images: [{ type: String }],
        description: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export type RoomDoc = HydratedDocument<InferSchemaType<typeof RoomSchema>>;

export const RoomModel = mongoose.model<RoomDoc>("Room", RoomSchema);
