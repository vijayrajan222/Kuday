import { z } from "zod";

export const UpdateProfileSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    occupation: z.string().optional(),
    bio: z.string().optional(),
    selfieUrl: z.string().optional(),
    selfieBase64: z.string().optional(),
});
