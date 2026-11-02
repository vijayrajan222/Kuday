import { z } from "zod";

export const CreateLifestyleSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    smoking: z.string().min(1, "Smoking preference is required"),
    drinking: z.string().min(1, "Drinking preference is required"),
    sleepSchedule: z.string().min(1, "Sleep schedule is required"),
    diet: z.string().min(1, "Diet preference is required"),
    cleanliness: z.string().min(1, "Cleanliness level is required"),
    visitorPolicy: z.string().min(1, "Visitor policy is required"),
    roommateGenderPref: z.string().min(1, "Roommate gender preference is required"),
});

export type CreateLifestyleRequest = z.infer<typeof CreateLifestyleSchema>;
