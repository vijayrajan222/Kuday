import { z } from "zod";

export const UpdateProfileSchema = z.object({
    dob: z.string().optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    bio: z.string().optional(),
});
