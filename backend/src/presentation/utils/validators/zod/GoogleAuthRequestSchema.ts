import { z } from "zod";

export const GoogleAuthRequestSchema = z.object({
    email: z.email("Invalid email format"),
    firstName: z.string().optional().default(""),
    lastName: z.string().optional().default(""),
    googleId: z.string().optional(),
    picture: z.string().optional(),
});

export type GoogleAuthRequest = z.infer<typeof GoogleAuthRequestSchema>;
