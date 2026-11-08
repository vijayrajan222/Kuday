import { z } from "zod";

export const createVisitSchema = z.object({
    connectionId: z.string().min(1, "Connection ID is required"),
    seekerId: z.string().min(1, "Seeker ID is required"),
    hostId: z.string().min(1, "Host ID is required"),
    roomId: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    timeSlot: z.enum(["morning", "afternoon", "evening"]),
    slotTime: z.string().default("02:00 PM"),
    message: z.string().max(500).optional(),
});

export const updateVisitStatusSchema = z.object({
    status: z.enum(["confirmed", "cancelled", "rejected", "completed"]),
    note: z.string().max(500).optional(),
});

export const suggestVisitSchema = z.object({
    suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    suggestedTimeSlot: z.enum(["morning", "afternoon", "evening"]),
    suggestedSlotTime: z.string().default("02:00 PM"),
    suggestedMessage: z.string().max(500).optional(),
});
