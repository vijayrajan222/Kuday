import z from "zod";

export const GoogleAuthRequestSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  googleId: z.string().optional(),
  picture: z.string().optional(),
});