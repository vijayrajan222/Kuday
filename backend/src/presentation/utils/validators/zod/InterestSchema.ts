import { z } from "zod";

export const SendInterestSchema = z.object({
    senderId: z.string().min(1, "Sender ID is required"),
    receiverId: z.string().min(1, "Receiver ID is required"),
    targetType: z.enum(["room", "seeker"]),
    targetId: z.string().min(1, "Target ID is required"),
    message: z.string().optional(),
});

export const UpdateInterestStatusSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    status: z.enum(["accepted", "declined", "cancelled", "unmatched"]),
});

export type SendInterestInput = z.infer<typeof SendInterestSchema>;
export type UpdateInterestStatusInput = z.infer<typeof UpdateInterestStatusSchema>;
